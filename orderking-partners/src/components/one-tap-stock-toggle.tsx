import { useState } from "react";
import { Check, X, Clock, Flame, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setAvailability } from "@/lib/server/api-menu";
import { useQueryClient } from "@tanstack/react-query";

export interface OneTapStockToggleProps {
  itemId: string;
  itemName: string;
  availability: "available" | "sold_out" | "temporarily_unavailable";
  nextAvailableAt?: string | null;
  restaurantId?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  onToggled?: (newStatus: "available" | "sold_out" | "temporarily_unavailable") => void;
}

export function OneTapStockToggle({
  itemId,
  itemName,
  availability,
  nextAvailableAt,
  restaurantId,
  disabled = false,
  size = "md",
  onToggled,
}: OneTapStockToggleProps) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [showDurations, setShowDurations] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);

  const currentStatus = optimisticStatus ?? availability;
  const isAvailable = currentStatus === "available";

  const handleInstantToggle = async () => {
    if (disabled || loading || !restaurantId) return;

    const nextStatus = isAvailable ? "sold_out" : "available";
    setOptimisticStatus(nextStatus);
    setLoading(true);

    try {
      await setAvailability({
        data: {
          restaurantId,
          itemIds: [itemId],
          status: nextStatus,
          nextAvailableAt: null,
        },
      });
      onToggled?.(nextStatus);
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      // Revert optimistic status on error
      setOptimisticStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTimedOut = async (hours: number) => {
    if (disabled || loading || !restaurantId) return;

    const nextAvailableDate = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setOptimisticStatus("temporarily_unavailable");
    setLoading(true);
    setShowDurations(false);

    try {
      await setAvailability({
        data: {
          restaurantId,
          itemIds: [itemId],
          status: "temporarily_unavailable",
          nextAvailableAt: nextAvailableDate,
        },
      });
      onToggled?.("temporarily_unavailable");
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setOptimisticStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const formattedOffTime =
    currentStatus === "temporarily_unavailable" && nextAvailableAt
      ? new Date(nextAvailableAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  return (
    <div className="inline-flex items-center gap-1.5 font-mono">
      {/* 1-Tap Tactile Master Toggle Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleInstantToggle}
        title={isAvailable ? `1-Tap to mark ${itemName} OUT OF STOCK` : `1-Tap to restore ${itemName} IN STOCK`}
        className={`relative inline-flex items-center gap-2 rounded-lg font-bold transition-all duration-150 select-none ${
          size === "lg" 
            ? "px-4 py-2.5 text-sm" 
            : size === "sm" 
            ? "px-2.5 py-1 text-[11px]" 
            : "px-3 py-1.5 text-xs"
        } ${
          isAvailable
            ? "bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/40 hover:scale-102 active:scale-98"
            : "bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-300 shadow-sm shadow-rose-950/40 hover:scale-102 active:scale-98 animate-pulse"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin text-current" />
        ) : isAvailable ? (
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span>IN STOCK</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <X className="size-3.5 text-rose-400 stroke-[3]" />
            <span>OUT OF STOCK</span>
          </span>
        )}

        {/* 1-Tap indicator pill */}
        <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono ${
          isAvailable ? "bg-emerald-900/60 text-emerald-400" : "bg-rose-900/60 text-rose-400"
        }`}>
          1-Tap
        </span>
      </button>

      {/* Timed Unavailable options toggle */}
      {isAvailable ? (
        <div className="relative">
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => setShowDurations(!showDurations)}
            title="Set temporary out of stock duration"
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
          >
            <Clock className="size-3.5" />
          </button>

          {showDurations && (
            <div className="absolute right-0 top-8 z-30 flex flex-col bg-slate-900 border border-slate-700 p-1.5 rounded-lg shadow-xl text-xs text-white min-w-28 space-y-1 font-mono">
              <span className="text-[10px] text-slate-400 px-2 py-0.5 uppercase tracking-wider">Turn Off For:</span>
              <button
                type="button"
                onClick={() => handleTimedOut(2)}
                className="w-full text-left px-2 py-1 hover:bg-slate-800 rounded text-slate-200 text-xs"
              >
                Off 2 Hours
              </button>
              <button
                type="button"
                onClick={() => handleTimedOut(4)}
                className="w-full text-left px-2 py-1 hover:bg-slate-800 rounded text-slate-200 text-xs"
              >
                Off 4 Hours
              </button>
              <button
                type="button"
                onClick={() => handleTimedOut(24)}
                className="w-full text-left px-2 py-1 hover:bg-slate-800 rounded text-slate-200 text-xs"
              >
                Off For Today
              </button>
            </div>
          )}
        </div>
      ) : formattedOffTime ? (
        <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
          Until {formattedOffTime}
        </span>
      ) : null}
    </div>
  );
}
