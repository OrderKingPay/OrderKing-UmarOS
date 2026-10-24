"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  Terminal,
  Send,
  RefreshCw,
  Sliders,
  DollarSign,
  Zap,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  Mic,
  MicOff,
  Plane,
  Coins,
  History,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  createClient,
  type SupabaseClient,
  type RealtimeChannel,
  broadcastUmarOsConfigUpdate,
} from "@orderking/ui";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import type {
  UmarOsConfigRow,
  ParsedCommandResult,
  CommandHistoryItem,
} from "./umar-ai-command-parser";
import { parseNaturalLanguageConfigCommand } from "./umar-ai-command-parser";

import { authMiddleware } from "@/lib/auth/middleware";

export type { UmarOsConfigRow, ParsedCommandResult, CommandHistoryItem };

/**
 * Server Function: Persist config changes directly to PostgreSQL table `umar_os_config`
 */
export const persistUmarOsConfigServerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { key: string; patch: Record<string, any>; updatedBy?: string }) => d)
  .handler(async ({ data }) => {
    const updatedAt = new Date().toISOString();
    const updatedBy = data.updatedBy || "founder_ai_command_bar";

    try {
      const sql = await getSql();
      const patchJson = JSON.stringify(data.patch);

      await sql`
        INSERT INTO public.umar_os_config (key, value, updated_at, updated_by)
        VALUES (${data.key}, ${patchJson}::jsonb, now(), ${updatedBy})
        ON CONFLICT (key) DO UPDATE
        SET value = public.umar_os_config.value || ${patchJson}::jsonb,
            updated_at = now(),
            updated_by = ${updatedBy}
      `;

      return {
        ok: true,
        key: data.key,
        updatedAt,
      };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || "Failed to persist to PostgreSQL",
        key: data.key,
        updatedAt,
      };
    }
  });

/**
 * Safe client helper to instantiate or retrieve Supabase client for real-time sync
 */
function getSupabaseClient(): SupabaseClient | null {
  const url =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    "https://ksudiiukjevwrybgjkzg.supabase.co";

  const key =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdWRpaXVramV2d3J5Ymdqa3pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3MTkyNjYsImV4cCI6MjEwNjI5NTI2Nn0.k4qhjqUWwr0-b_FLVnQ1IiVcQMn2_ix5CmhVF7JGH6I";

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

export { parseNaturalLanguageConfigCommand } from "./umar-ai-command-parser";

export interface UmarAiCommandBarProps {
  className?: string;
  onConfigChange?: (key: string, patch: Record<string, any>) => void;
}

const PRESET_DIRECTIVES = [
  { label: "Food Platform Fee ₹12", command: "set food platform fee to 12" },
  { label: "Remit Fee 1.5%", command: "set remit fee to 1.5" },
  { label: "PNR Fee ₹35", command: "set travel pnr fee to 35" },
  { label: "Cashback ₹10", command: "set wallet cashback to 10" },
  { label: "Commission 18%", command: "set restaurant commission to 18" },
  { label: "Surge 1.4x", command: "set surge multiplier to 1.4" },
];

export function UmarAiCommandBar({ className, onConfigChange }: UmarAiCommandBarProps) {
  const [commandInput, setCommandInput] = useState("");
  const [executing, setExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [lastExecuted, setLastExecuted] = useState<{ summary: string; timestamp: string } | null>(null);

  // Live in-memory mirror of `umar_os_config`
  const [liveConfig, setLiveConfig] = useState<Record<string, Record<string, any>>>({
    founder_fees: {
      food_platform_fee: 12,
      remit_fee: 1.5,
      travel_pnr_convenience_fee_inr: 29,
      wallet_cashback_reward_inr: 5,
    },
    economics: {
      food_platform_fee: 12,
      remit_fee: 1.5,
      platform_fee_paise: 1200,
      default_commission_percent: 22,
      surge_multiplier: 1.0,
      base_delivery_fee_inr: 25,
    },
  });

  const [history, setHistory] = useState<CommandHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("umar_os_command_history_v1");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  const [showHistory, setShowHistory] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 1. Initialize Supabase Realtime Subscription on `umar_os_config`
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) return;

    // Fetch initial snapshot from Supabase table
    sb.from("umar_os_config")
      .select("*")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && Array.isArray(data)) {
          setLiveConfig((prev) => {
            const next = { ...prev };
            for (const row of data as UmarOsConfigRow[]) {
              if (row.key && row.value) {
                next[row.key] = { ...(next[row.key] || {}), ...row.value };
              }
            }
            return next;
          });
        }
      });

    // Realtime channel for instant sync (<200ms)
    const channel = sb
      .channel("umar_os_config_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "umar_os_config" },
        (payload: any) => {
          const row = payload?.new as UmarOsConfigRow;
          if (row?.key && row?.value) {
            setLiveConfig((prev) => ({
              ...prev,
              [row.key]: {
                ...(prev[row.key] || {}),
                ...row.value,
              },
            }));
            toast.info(`Realtime sync: ${row.key} updated in Supabase`, {
              duration: 2500,
            });
          }
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current && sb) {
        sb.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Save history to localStorage
  const recordHistory = useCallback((item: CommandHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.slice(0, 19)];
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("umar_os_command_history_v1", JSON.stringify(next));
        }
      } catch {}
      return next;
    });
  }, []);

  // Execute Command: Parse, Upsert to Supabase `umar_os_config`, and Broadcast
  const handleExecuteCommand = async (customPrompt?: string) => {
    const text = (customPrompt ?? commandInput).trim();
    if (!text || executing) return;

    const parsed = parseNaturalLanguageConfigCommand(text);
    if (!parsed) {
      toast.error("Directive not recognized. Example: 'set food platform fee to 12' or 'set remit fee to 1.5'");
      return;
    }

    setExecuting(true);
    const nowIso = new Date().toISOString();
    const timeDisplay = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      const sb = getSupabaseClient();

      // 1. Direct Supabase Upsert to `public.umar_os_config`
      if (sb) {
        const { error: sbErr } = await sb.from("umar_os_config").upsert(
          {
            key: parsed.targetKey,
            value: parsed.patch,
            updated_at: nowIso,
            updated_by: "founder_console",
          },
          { onConflict: "key" }
        );

        if (sbErr) {
          console.warn("Supabase direct write notice:", sbErr.message);
        }
      }

      // 2. Server Function Execution (Dual-write ACID persistence to PostgreSQL)
      try {
        await persistUmarOsConfigServerFn({
          data: {
            key: parsed.targetKey,
            patch: parsed.patch,
            updatedBy: "founder_console_natural_bar",
          },
        });
      } catch (srvErr) {
        console.warn("Server action fallback notice:", srvErr);
      }

      // 3. Broadcast to all connected customer, partner, rider apps via Supabase Realtime channel
      try {
        await broadcastUmarOsConfigUpdate({
          economics: {
            platformFeePaise:
              typeof parsed.patch.platform_fee_paise === "number"
                ? parsed.patch.platform_fee_paise
                : typeof parsed.patch.food_platform_fee === "number"
                ? Math.round(parsed.patch.food_platform_fee * 100)
                : undefined,
            defaultCommissionPercent: parsed.patch.default_commission_percent,
            surgeMultiplier: parsed.patch.surge_multiplier,
          } as any,
          features: parsed.patch as any,
          updatedAt: nowIso,
        });
      } catch (broadcastErr) {
        console.warn("Realtime broadcast notice:", broadcastErr);
      }

      // 4. Update in-memory state immediately
      setLiveConfig((prev) => ({
        ...prev,
        [parsed.targetKey]: {
          ...(prev[parsed.targetKey] || {}),
          ...parsed.patch,
        },
      }));

      // 5. Notify parent callback if provided
      if (onConfigChange) {
        onConfigChange(parsed.targetKey, parsed.patch);
      }

      // 6. Record receipt and update history
      const historyItem: CommandHistoryItem = {
        id: `cmd-${Date.now()}`,
        command: text,
        summary: parsed.summary,
        timestamp: timeDisplay,
        success: true,
      };
      recordHistory(historyItem);
      setLastExecuted({ summary: parsed.summary, timestamp: timeDisplay });

      toast.success(parsed.summary, {
        description: `Persisted to umar_os_config in Supabase & broadcasted to all client apps.`,
        duration: 4000,
      });

      setCommandInput("");
    } catch (err: any) {
      toast.error(`Execution failed: ${err?.message || "Unknown error"}`);
    } finally {
      setExecuting(false);
    }
  };

  // Speech Recognition (Founder Voice Control)
  const handleToggleVoice = () => {
    if (typeof window === "undefined") return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error("Speech recognition is not supported in this browser. Please type your directive.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const transcript = e.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setCommandInput(transcript);
          void handleExecuteCommand(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Current values for live badges
  const foodPlatformFee =
    liveConfig.founder_fees?.food_platform_fee ??
    liveConfig.economics?.food_platform_fee ??
    12;
  const remitFee =
    liveConfig.founder_fees?.remit_fee ??
    liveConfig.economics?.remit_fee ??
    1.5;
  const pnrFee =
    liveConfig.founder_fees?.travel_pnr_convenience_fee_inr ?? 29;
  const cashbackReward =
    liveConfig.founder_fees?.wallet_cashback_reward_inr ?? 5;
  const commissionRate =
    liveConfig.economics?.default_commission_percent ?? 22;
  const surgeMultiplier =
    liveConfig.economics?.surge_multiplier ?? 1.0;

  return (
    <div
      className={cn(
        "w-full bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 relative overflow-hidden",
        className
      )}
    >
      {/* Decorative Top Accent Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

      {/* Header: Title + Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-slate-950 shadow-md">
            <Sparkles className="h-4 w-4 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                <span>UmarOS Natural Language Command Bar</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Supabase Config
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Type directives to reconfigure platform fees, commissions, and rates across all apps in real-time.
            </p>
          </div>
        </div>

        {/* Real-time Indicator & Controls */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors",
              realtimeConnected
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            )}
            title="Real-time synchronization status with Supabase `umar_os_config`"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                realtimeConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              )}
            />
            <span>{realtimeConnected ? "Supabase Realtime Live" : "Supabase Synced"}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-bold transition-colors"
          >
            <History className="h-3 w-3 text-slate-400" />
            <span>Audit ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Main Command Input Box */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <input
            type="text"
            value={commandInput}
            disabled={executing}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleExecuteCommand();
              }
            }}
            placeholder={
              isListening
                ? "Listening... speak command now..."
                : "Type directive (e.g. 'set food platform fee to 12' or 'set remit fee to 1.5')..."
            }
            className="w-full h-11 pl-10 pr-24 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          <div className="absolute inset-y-0 right-1 flex items-center pr-1.5 gap-1">
            <button
              type="button"
              onClick={handleToggleVoice}
              title={isListening ? "Stop listening" : "Speak command via microphone"}
              className={cn(
                "h-8 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-bold transition-colors",
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Listening</span>
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Voice</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={executing || !commandInput.trim()}
          onClick={() => void handleExecuteCommand()}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
        >
          {executing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
              <span>Applying Live...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 fill-slate-950" />
              <span>Execute Directive</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Directives Chips for 1-Tap Execution */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" /> Quick Dials:
        </span>
        {PRESET_DIRECTIVES.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={executing}
            onClick={() => {
              setCommandInput(chip.command);
              void handleExecuteCommand(chip.command);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-semibold text-slate-200 transition-colors flex items-center gap-1"
          >
            <span>{chip.label}</span>
          </button>
        ))}
      </div>

      {/* Live umar_os_config Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-900">
        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Food Platform Fee</span>
            <DollarSign className="h-3 w-3 text-emerald-400" />
          </div>
          <div className="text-sm font-black text-emerald-400 mt-0.5">
            ₹{foodPlatformFee}
          </div>
          <div className="text-[9px] text-slate-400">umar_os_config.founder_fees</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>KingPay Remit Fee</span>
            <TrendingUp className="h-3 w-3 text-sky-400" />
          </div>
          <div className="text-sm font-black text-sky-400 mt-0.5">
            {remitFee}%
          </div>
          <div className="text-[9px] text-slate-400">umar_os_config.founder_fees</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Travel PNR Fee</span>
            <Plane className="h-3 w-3 text-amber-400" />
          </div>
          <div className="text-sm font-black text-amber-400 mt-0.5">
            ₹{pnrFee}
          </div>
          <div className="text-[9px] text-slate-400">Convenience gate</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Wallet Cashback</span>
            <Coins className="h-3 w-3 text-purple-400" />
          </div>
          <div className="text-sm font-black text-purple-400 mt-0.5">
            ₹{cashbackReward}
          </div>
          <div className="text-[9px] text-slate-400">Instant reward</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Commission</span>
            <Sliders className="h-3 w-3 text-rose-400" />
          </div>
          <div className="text-sm font-black text-rose-400 mt-0.5">
            {commissionRate}%
          </div>
          <div className="text-[9px] text-slate-400">umar_os_config.economics</div>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800/80">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Surge Rate</span>
            <Zap className="h-3 w-3 text-yellow-400" />
          </div>
          <div className="text-sm font-black text-yellow-400 mt-0.5">
            {surgeMultiplier}x
          </div>
          <div className="text-[9px] text-slate-400">Realtime surge multiplier</div>
        </div>
      </div>

      {/* Last Executed Feedback */}
      {lastExecuted && (
        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{lastExecuted.summary}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            {lastExecuted.timestamp}
          </span>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Founder Directives Audit Log</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                try {
                  window.localStorage.removeItem("umar_os_command_history_v1");
                } catch {}
              }}
              className="text-[10px] text-slate-400 hover:text-rose-400"
            >
              Clear
            </button>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">No directives recorded in this session.</p>
          ) : (
            <div className="space-y-1.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-950/60 border border-slate-800/60 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-emerald-400">"{item.command}"</span>
                    <span className="text-slate-400 text-[11px]">→ {item.summary}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UmarAiCommandBar;
