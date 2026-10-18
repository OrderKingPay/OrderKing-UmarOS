import { useState } from "react";
import { Check, X, Clock, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { setAvailability } from "@/lib/server/api-menu";
import { useQueryClient } from "@tanstack/react-query";
import {
  calculateStockoutExpiry,
  formatStockoutRemaining,
  isStockoutExpired,
  type TimedStockoutOption,
} from "@/lib/menu/timed-stockout";
import { TimedStockoutPickerModal } from "./timed-stockout-picker-modal";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(null);
  const [optimisticNextAt, setOptimisticNextAt] = useState<string | null | undefined>(undefined);

  const currentStatus = optimisticStatus ?? availability;
  const currentNextAt = optimisticNextAt !== undefined ? optimisticNextAt : nextAvailableAt;
  const isAvailable = currentStatus === "available";

  // Check if timed stockout has expired
  const isExpired = !isAvailable && isStockoutExpired(currentNextAt);

  // Turn ON immediately (1-tap instant restore)
  const handleRestoreInStock = async () => {
    if (disabled || loading || !restaurantId) return;

    setOptimisticStatus("available");
    setOptimisticNextAt(null);
    setLoading(true);

    try {
      await setAvailability({
        data: {
          restaurantId,
          itemIds: [itemId],
          status: "available",
          nextAvailableAt: null,
        },
      });
      onToggled?.("available");
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setOptimisticStatus(null);
      setOptimisticNextAt(undefined);
    } finally {
      setLoading(false);
    }
  };

  // Turn OFF via Timed Availability Picker Modal
  const handleConfirmStockout = async (
    option: TimedStockoutOption,
    customTime?: Date | string | null
  ) => {
    if (disabled || loading || !restaurantId) return;

    const { status, nextAvailableAt: targetNextAt } = calculateStockoutExpiry(
      option,
      new Date(),
      customTime
    );
    setOptimisticStatus(status);
    setOptimisticNextAt(targetNextAt);
    setLoading(true);
    setModalOpen(false);

    try {
      await setAvailability({
        data: {
          restaurantId,
          itemIds: [itemId],
          status,
          nextAvailableAt: targetNextAt,
        },
      });
      onToggled?.(status as any);
      void qc.invalidateQueries({ queryKey: ["menu"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (e) {
      setOptimisticStatus(null);
      setOptimisticNextAt(undefined);
    } finally {
      setLoading(false);
    }
  };

  const formattedRemaining =
    !isAvailable && currentNextAt ? formatStockoutRemaining(currentNextAt) : null;

  return (
    <>
      <div className="inline-flex items-center gap-1.5 font-mono">
        {/* Master Stock Toggle Button */}
        {isAvailable ? (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => setModalOpen(true)}
            title={`Click to turn off ${itemName} with timed duration`}
            className={`relative inline-flex items-center gap-2 rounded-lg font-bold transition-all duration-150 select-none ${
              size === "lg"
                ? "px-4 py-2.5 text-sm"
                : size === "sm"
                ? "px-2.5 py-1 text-[11px]"
                : "px-3 py-1.5 text-xs"
            } bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/40 hover:scale-102 active:scale-98 ${
              disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin text-current" />
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                <span>IN STOCK</span>
              </span>
            )}

            <span className="text-[9px] uppercase px-1 py-0.2 rounded font-mono bg-emerald-900/60 text-emerald-400">
              1-Tap
            </span>
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={handleRestoreInStock}
            title={`1-Tap to restore ${itemName} back to IN STOCK`}
            className={`relative inline-flex items-center gap-2 rounded-lg font-bold transition-all duration-150 select-none ${
              size === "lg"
                ? "px-4 py-2.5 text-sm"
                : size === "sm"
                ? "px-2.5 py-1 text-[11px]"
                : "px-3 py-1.5 text-xs"
            } bg-rose-950/90 hover:bg-emerald-950/90 border border-rose-500/60 hover:border-emerald-500/60 text-rose-300 hover:text-emerald-300 shadow-sm shadow-rose-950/40 hover:scale-102 active:scale-98 ${
              isExpired ? "animate-bounce" : ""
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {loading ? (
              <Loader2 className="size-3.5 animate-spin text-current" />
            ) : isExpired ? (
              <span className="flex items-center gap-1.5 text-amber-300">
                <RotateCcw className="size-3.5 animate-spin" />
                <span>RESTORE</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <X className="size-3.5 text-rose-400 stroke-[3]" />
                <span>OUT OF STOCK</span>
              </span>
            )}

            <span className="text-[9px] uppercase px-1 py-0.2 rounded font-mono bg-rose-900/60 text-rose-300">
              86
            </span>
          </button>
        )}

        {/* Timed duration badge & edit picker button */}
        {isAvailable ? (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => setModalOpen(true)}
            title="Set timed out-of-stock duration (Tier-1 Partner Parity)"
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
          >
            <Clock className="size-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isExpired
                  ? "bg-amber-950/80 border-amber-500/80 text-amber-300 animate-pulse"
                  : "bg-rose-950/60 border-rose-800/60 text-rose-300"
              }`}
              title={formattedRemaining ?? "Turned off indefinitely"}
            >
              {isExpired ? "Auto-restoring..." : formattedRemaining ?? "Indefinite"}
            </span>
            <button
              type="button"
              disabled={disabled || loading}
              onClick={() => setModalOpen(true)}
              title="Change stockout duration"
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
            >
              <Clock className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Tier-1 Timed Availability Modal */}
      <TimedStockoutPickerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemName={itemName}
        itemId={itemId}
        onConfirm={handleConfirmStockout}
        loading={loading}
      />
    </>
  );
}
