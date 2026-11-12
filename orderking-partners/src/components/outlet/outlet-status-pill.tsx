import { useEffect, useState, useRef } from "react";
import { Check, Clock, ChevronDown, Power, ShieldAlert } from "lucide-react";
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const resumed = checkAutoResume();
      if (resumed) {
        toast.success("Kitchen pause expired: Outlet automatically restored to ONLINE.");
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
        toast.success("Outlet Online: Now actively accepting customer orders.");
      } else if (targetStatus === "PAUSED_30") {
        toast.warning(
          "Outlet Paused (30m): Kitchen catch-up mode active. Customer app shows 'Back in 30 mins'."
        );
      } else if (targetStatus === "PAUSED_60") {
        toast.warning(
          "Outlet Paused (60m): Surge recovery active. Customer app shows 'Back in 60 mins'."
        );
      } else if (targetStatus === "OFFLINE") {
        toast.error("Outlet Offline: Closed for the day. No new orders will be accepted.");
      }
    } catch (err) {
      console.error("Failed to update outlet operational status:", err);
      toast.error("Failed to notify server of status change.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="relative inline-block font-sans" ref={containerRef}>
      {/* Prominent Header Status Pill */}
      <button
        type="button"
        disabled={isUpdating}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`h-11 inline-flex items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all shadow-xs select-none border cursor-pointer ${
          status === "ONLINE"
            ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800"
            : status === "PAUSED_30" || status === "PAUSED_60"
            ? "border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 ring-1 ring-amber-300/50"
            : "border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 ring-1 ring-rose-300/50"
        }`}
        title="Outlet Operational Status (Click to change)"
        aria-label="Outlet Operational Status"
      >
        {status === "ONLINE" ? (
          <>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-emerald-600" />
            </span>
            <span className="hidden sm:inline">Online</span>
            <span className="sm:hidden font-mono">Online</span>
          </>
        ) : status === "PAUSED_30" || status === "PAUSED_60" ? (
          <>
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500" />
            </span>
            <span className="hidden sm:inline">
              Paused ({status === "PAUSED_30" ? "30m" : "60m"})
              {remainingText ? ` · ${remainingText}` : ""}
            </span>
            <span className="sm:hidden font-mono text-[11px]">
              {remainingText ?? "Paused"}
            </span>
          </>
        ) : (
          <>
            <span className="relative flex size-2.5">
              <span className="relative inline-flex rounded-full size-2.5 bg-rose-600" />
            </span>
            <span className="hidden sm:inline">Offline</span>
            <span className="sm:hidden font-mono">Offline</span>
          </>
        )}

        <ChevronDown
          className={`size-3.5 opacity-70 transition-transform duration-200 ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Operational Status Popover */}
      {dropdownOpen && (
        <div
          role="menu"
          aria-label="Outlet Operational Status Options"
          className="absolute right-0 top-12 z-50 w-72 sm:w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl text-gray-900 font-sans space-y-2 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 px-1">
            <div className="flex items-center gap-1.5">
              <Power className="size-4 text-emerald-600" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Outlet Operational Status
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Live Control
            </span>
          </div>

          <p className="text-[11px] text-gray-500 px-1">
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
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500"
                        : preset.dotColor === "yellow"
                        ? "border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500"
                        : "border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-500"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                        preset.dotColor === "green"
                          ? "bg-emerald-500"
                          : preset.dotColor === "yellow"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{preset.label}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {preset.sublabel}
                      </div>
                      <div className="mt-1 text-[10px] font-mono text-gray-500">
                        Guest App:{" "}
                        <span
                          className={
                            preset.dotColor === "green"
                              ? "text-emerald-700 font-bold"
                              : preset.dotColor === "yellow"
                              ? "text-amber-700 font-bold"
                              : "text-rose-700 font-bold"
                          }
                        >
                          &ldquo;{preset.customerHeadline}&rdquo;
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    {isSelected ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="size-3.5 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border border-gray-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {(status === "PAUSED_30" || status === "PAUSED_60") && (
            <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 flex items-center justify-between text-xs text-amber-800">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600 animate-spin" />
                <span>Timer: <strong>{remainingText}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectStatus("ONLINE")}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 cursor-pointer"
              >
                Resume Now
              </button>
            </div>
          )}

          {status === "OFFLINE" && (
            <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 flex items-center justify-between text-xs text-rose-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-600" />
                <span>Outlet closed for today</span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectStatus("ONLINE")}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 cursor-pointer"
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
