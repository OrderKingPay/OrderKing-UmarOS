import { useEffect, useState, useRef } from "react";
import { Check, Clock, ChevronDown, Power, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  OUTLET_STATUS_PRESETS,
  formatOutletPauseRemaining,
  useOutletStatusStore,
  type OutletOperationalStatus,
} from "@/lib/outlet/operational-status";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export interface OutletStatusPillProps {
  restaurantId?: string;
  restaurantName?: string;
}

export function OutletStatusPill({ restaurantId, restaurantName: _restaurantName }: OutletStatusPillProps) {
  const qc = useQueryClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const status = useOutletStatusStore((s) => s.status);
  const pausedUntil = useOutletStatusStore((s) => s.pausedUntil);
  const setStatus = useOutletStatusStore((s) => s.setStatus);
  const checkAutoResume = useOutletStatusStore((s) => s.checkAutoResume);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Periodic check for pause timer expiry (every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const resumed = checkAutoResume();
      if (resumed) {
        toast.success("🟢 Kitchen pause expired: Outlet automatically restored to ONLINE.");
        if (restaurantId) {
          void quickThrottleKitchen({ data: { restaurantId, mode: "RESUME" } });
          void qc.invalidateQueries({ queryKey: ["hours"] });
          void qc.invalidateQueries({ queryKey: ["dashboard"] });
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [checkAutoResume, restaurantId, qc]);

  const remainingText =
    status === "PAUSED_30" || status === "PAUSED_60"
      ? formatOutletPauseRemaining(pausedUntil)
      : null;

  async function handleSelectStatus(targetStatus: OutletOperationalStatus) {
    if (targetStatus === status || isUpdating) return;
    setIsUpdating(true);
    setDropdownOpen(false);

    try {
      const serverMode = targetStatus === "ONLINE" ? "RESUME" : "PAUSE";
      if (restaurantId) {
        await quickThrottleKitchen({
          data: { restaurantId, mode: serverMode },
        });
        void qc.invalidateQueries({ queryKey: ["hours"] });
        void qc.invalidateQueries({ queryKey: ["dashboard"] });
      }

      setStatus(targetStatus, {
        restaurantId,
        refDate: new Date(),
      });

      if (targetStatus === "ONLINE") {
        toast.success("🟢 Outlet Online: Now actively accepting customer orders.");
      } else if (targetStatus === "PAUSED_30") {
        toast.warning(
          "🟡 Outlet Paused (30m): Kitchen catch-up mode active. Customer app shows 'Back in 30 mins'."
        );
      } else if (targetStatus === "PAUSED_60") {
        toast.warning(
          "🟡 Outlet Paused (60m): Surge recovery active. Customer app shows 'Back in 60 mins'."
        );
      } else if (targetStatus === "OFFLINE") {
        toast.error("🔴 Outlet Offline: Closed for the day. No new orders will be accepted.");
      }
    } catch (err) {
      console.error("Failed to update outlet operational status:", err);
      toast.error("Failed to notify server of status change.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Prominent Header Status Pill */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`h-11 inline-flex items-center gap-2 rounded-[12px] px-3 text-xs font-bold transition-all shadow-sm select-none border cursor-pointer ${
          status === "ONLINE"
            ? "border-emerald-500/50 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 shadow-emerald-950/50"
            : status === "PAUSED_30" || status === "PAUSED_60"
            ? "border-amber-500/60 bg-amber-950/60 hover:bg-amber-900/70 text-amber-200 shadow-amber-950/50 ring-1 ring-amber-500/40"
            : "border-rose-500/60 bg-rose-950/60 hover:bg-rose-900/70 text-rose-200 shadow-rose-950/50 ring-1 ring-rose-500/40"
        }`}
        title="Outlet Operational Status (Click to change)"
        aria-label="Outlet Operational Status"
      >
        {status === "ONLINE" ? (
          <>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">🟢 Online</span>
            <span className="sm:hidden font-mono">Online</span>
          </>
        ) : status === "PAUSED_30" || status === "PAUSED_60" ? (
          <>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500" />
            </span>
            <span className="hidden sm:inline">
              🟡 {status === "PAUSED_30" ? "Paused (30m)" : "Paused (60m)"}
              {remainingText ? ` · ${remainingText}` : ""}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {remainingText ?? "Paused"}
            </span>
          </>
        ) : (
          <>
            <span className="relative flex size-2.5">
              <span className="relative inline-flex rounded-full size-2.5 bg-rose-500" />
            </span>
            <span className="hidden sm:inline">🔴 Offline</span>
            <span className="sm:hidden font-mono">Offline</span>
          </>
        )}

        <ChevronDown
          className={`size-3.5 opacity-70 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Authentic Tier-1 Operational Status Popover */}
      {dropdownOpen && (
        <div
          role="menu"
          aria-label="Outlet Operational Status Options"
          className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-xl text-slate-100 font-sans space-y-2 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Power className="size-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Outlet Operational Status
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Kitchen Shield
            </span>
          </div>

          <p className="text-[11px] text-slate-400 px-1">
            Switching status updates customer apps instantly and pauses incoming tickets.
          </p>

          <div className="space-y-1.5 pt-1">
            {OUTLET_STATUS_PRESETS.map((preset) => {
              const isSelected = status === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectStatus(preset.id)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2.5 select-none cursor-pointer ${
                    isSelected
                      ? preset.dotColor === "green"
                        ? "border-emerald-500/80 bg-emerald-950/40 text-emerald-100 ring-1 ring-emerald-500/50"
                        : preset.dotColor === "yellow"
                        ? "border-amber-500/80 bg-amber-950/40 text-amber-100 ring-1 ring-amber-500/50"
                        : "border-rose-500/80 bg-rose-950/40 text-rose-100 ring-1 ring-rose-500/50"
                      : "border-slate-800/80 bg-slate-950/40 hover:bg-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-base">
                      {preset.dotColor === "green"
                        ? "🟢"
                        : preset.dotColor === "yellow"
                        ? "🟡"
                        : "🔴"}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{preset.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        {preset.sublabel}
                      </div>
                      {/* Customer Notice Preview */}
                      <div className="mt-1 text-[10px] font-mono text-slate-400">
                        Guest App:{" "}
                        <span
                          className={
                            preset.dotColor === "green"
                              ? "text-emerald-400"
                              : preset.dotColor === "yellow"
                              ? "text-amber-300"
                              : "text-rose-400"
                          }
                        >
                          &ldquo;{preset.customerHeadline}&rdquo;
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border border-slate-700" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {(status === "PAUSED_30" || status === "PAUSED_60") && (
            <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-400 animate-spin" />
                <span>Timer active: <strong>{remainingText}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectStatus("ONLINE")}
                className="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 cursor-pointer"
              >
                Resume Now
              </button>
            </div>
          )}

          {status === "OFFLINE" && (
            <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 flex items-center justify-between text-xs text-rose-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-400" />
                <span>Outlet closed for today</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectStatus("ONLINE")}
                className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-500 cursor-pointer"
              >
                Go Online
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
