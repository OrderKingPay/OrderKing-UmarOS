"use client";

import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Zap, CheckCircle2, Loader2, Sparkles, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type UmarAiJumpCardData,
  executeUmarAiExecutiveAction,
} from "@/lib/orderking/ai/umar-ai-directory";

interface UmarAiJumpCardProps {
  card: UmarAiJumpCardData;
  onExecuted?: (message: string) => void;
  className?: string;
}

export function UmarAiJumpCard({ card, onExecuted, className = "" }: UmarAiJumpCardProps) {
  const navigate = useNavigate();
  const [executing, setExecuting] = useState(false);
  const [executedSuccess, setExecutedSuccess] = useState<string | null>(null);

  const handleNavigate = () => {
    try {
      if (card.route.startsWith("/")) {
        navigate({ to: card.route as any });
      } else {
        window.location.href = card.route;
      }
      toast.info(`Navigating to ${card.title}`);
    } catch {
      window.location.href = card.route;
    }
  };

  const handleExecuteAction = async () => {
    if (!card.actionId) return;
    setExecuting(true);
    try {
      const res = await executeUmarAiExecutiveAction(card.actionId, card.suggestedPayload);
      if (res.success) {
        setExecutedSuccess(res.message);
        toast.success(`⚡ Action Executed: ${res.message}`);
        onExecuted?.(res.message);
      } else {
        toast.error(`Execution blocked: ${res.message}`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to execute executive action.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className={`relative rounded-xl border border-emerald-500/30 bg-zinc-950/90 p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:border-emerald-500/50 hover:shadow-[0_4px_25px_rgba(16,185,129,0.15)] text-zinc-100 ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-950/40 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider px-2 py-0.5"
          >
            {card.category}
          </Badge>
          {card.badgeText && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-950/40 text-[9px] font-semibold text-amber-300 uppercase tracking-wider px-1.5 py-0.5"
            >
              {card.badgeText}
            </Badge>
          )}
        </div>
        <span className="font-mono text-[10px] text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
          {card.route}
        </span>
      </div>

      <div className="mb-2">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-emerald-400 shrink-0" />
          <span>{card.title}</span>
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed mt-1 line-clamp-2">
          {card.description}
        </p>
      </div>

      {executedSuccess && (
        <div className="mb-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-1.5 text-[11px] text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-400" />
          <span>{executedSuccess}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80">
        <Button
          size="sm"
          variant="outline"
          onClick={handleNavigate}
          className="h-7 text-xs bg-zinc-900 border-zinc-700 hover:border-emerald-500 text-zinc-200 hover:text-white gap-1 px-2.5"
        >
          <Navigation className="size-3 text-emerald-400" />
          <span>{card.actionLabel}</span>
          <ArrowUpRight className="size-3 text-zinc-400" />
        </Button>

        {card.directExecutable && card.actionId && (
          <Button
            size="sm"
            onClick={handleExecuteAction}
            disabled={executing}
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1 px-2.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            {executing ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Zap className="size-3 fill-amber-300 text-amber-300" />
                <span>Execute Direct</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
