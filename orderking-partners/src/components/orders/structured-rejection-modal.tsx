import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  Clock,
  Flame,
  Sunrise,
  Infinity as InfinityIcon,
  X,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ZOMATO_REJECTION_REASONS,
  processStructuredRejection,
} from "@/lib/orders/structured-rejection";
import {
  ZOMATO_STOCKOUT_PRESETS,
  type TimedStockoutOption,
  calculateStockoutExpiry,
} from "@/lib/menu/timed-stockout";
import { setAvailability } from "@/lib/server/api-menu";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RejectReason } from "@/lib/orders/state-machine";

export interface StructuredRejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    lines: Array<{
      id?: string;
      itemId?: string;
      itemName: string;
      variantName?: string | null;
      quantity: number;
    }>;
  };
  restaurantId?: string;
  onConfirmReject: (reason: RejectReason) => Promise<void> | void;
}

export function StructuredRejectionModal({
  isOpen,
  onClose,
  order,
  restaurantId,
  onConfirmReject,
}: StructuredRejectionModalProps) {
  const qc = useQueryClient();
  const [selectedReason, setSelectedReason] = useState<RejectReason>("kitchen_overloaded");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    order.lines.map((l, idx) => l.itemId || l.id || `dish_${idx}`)
  );
  const [stockoutOption, setStockoutOption] = useState<TimedStockoutOption>("TURN_OFF_TOMORROW_8AM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isStockoutReason = selectedReason === "item_unavailable";

  function toggleItemSelection(id: string) {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleConfirm() {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Validate with engine
      const plan = processStructuredRejection({
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: selectedReason,
        selectedLineItemIds: isStockoutReason ? selectedItemIds : [],
        stockoutDuration: stockoutOption,
      });

      // If out of stock was selected, synchronously update menu item availability
      if (plan.requiresStockout && restaurantId && plan.stockoutItemIds.length > 0) {
        try {
          await setAvailability({
            data: {
              restaurantId,
              itemIds: plan.stockoutItemIds,
              status: plan.stockoutStatus!,
              nextAvailableAt: plan.nextAvailableAt,
            },
          });
          void qc.invalidateQueries({ queryKey: ["menu"] });
          toast.success(
            `🛒 ${plan.stockoutItemIds.length} dish(es) marked out of stock so future guests cannot order.`
          );
        } catch (err) {
          console.error("Failed to update dish availability on stockout rejection:", err);
          // Non-blocking: proceed with order decline
        }
      }

      // Execute order rejection
      await onConfirmReject(selectedReason);
      toast.warning(plan.customerNotificationMessage);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to decline order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="structured-reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 font-sans space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 font-mono">
                Zomato Order Rejection Protocol
              </span>
            </div>
            <h2 id="structured-reject-title" className="text-lg font-bold text-white mt-1">
              Decline Order #{order.orderNumber}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an authentic operational reason to inform the guest and dispatch team.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close rejection dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Penalty & Fulfillment Warning Banner */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertTriangle className="size-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <span className="font-bold text-white">Cancellation &amp; Fulfillment Advisory:</span>
            <span className="text-rose-200/90 ml-1">
              Frequent cancellations reduce your outlet ranking on customer feeds. Please ensure reasons are genuine.
            </span>
          </div>
        </div>

        {/* Reason Selection Radio Group */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
            1. Select Operational Reason:
          </label>
          <div className="space-y-2">
            {ZOMATO_REJECTION_REASONS.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                    isSelected
                      ? "border-rose-500/80 bg-rose-950/30 ring-1 ring-rose-500/40 text-white"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {r.icon === "Flame" ? (
                        <Flame className="size-4" />
                      ) : r.icon === "AlertOctagon" ? (
                        <AlertOctagon className="size-4" />
                      ) : r.icon === "Clock" ? (
                        <Clock className="size-4" />
                      ) : (
                        <ZapOff className="size-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{r.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        {r.sublabel}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 mt-1 ${
                      isSelected
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-slate-600 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Sub-Panel: If Item(s) in Order Out of Stock is Selected */}
        {isStockoutReason && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                  2. Select Out-of-Stock Dishes in this Order:
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedItemIds.length} of {order.lines.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Which dish(es) are unavailable? These will be automatically turned off in your live catalog.
              </p>
            </div>

            {/* Checklist of dishes in the order */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {order.lines.map((line, idx) => {
                const lineId = line.itemId || line.id || `dish_${idx}`;
                const isChecked = selectedItemIds.includes(lineId);
                return (
                  <label
                    key={lineId}
                    onClick={() => toggleItemSelection(lineId)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? "border-amber-500/60 bg-amber-950/40 text-amber-100 font-semibold"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-4 rounded border flex items-center justify-center ${
                          isChecked
                            ? "border-amber-500 bg-amber-500 text-slate-950"
                            : "border-slate-600 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span>
                        <strong className="text-white">{line.quantity}×</strong> {line.itemName}
                        {line.variantName ? ` (${line.variantName})` : ""}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      86 Dish
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Timed Stockout Presets */}
            <div className="space-y-2 pt-2 border-t border-amber-500/30">
              <label className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                3. Choose Timed Stockout Duration:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ZOMATO_STOCKOUT_PRESETS.map((preset) => {
                  const isPresetSelected = stockoutOption === preset.id;
                  const expiry = calculateStockoutExpiry(preset.id);
                  const preview =
                    preset.id === "TURN_OFF_TOMORROW_8AM"
                      ? "Tomorrow 8 AM"
                      : preset.id === "TURN_OFF_INDEFINITELY"
                      ? "Until turned on"
                      : `${preset.durationHours} Hours`;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStockoutOption(preset.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer select-none flex items-center justify-between ${
                        isPresetSelected
                          ? "border-amber-500 bg-amber-500/20 text-white font-bold ring-1 ring-amber-500/50"
                          : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {preset.icon === "Sunrise" ? (
                          <Sunrise className="size-4 text-amber-400 shrink-0" />
                        ) : preset.icon === "Infinity" ? (
                          <InfinityIcon className="size-4 text-amber-400 shrink-0" />
                        ) : (
                          <Clock className="size-4 text-amber-400 shrink-0" />
                        )}
                        <div>
                          <div className="leading-tight">{preset.label}</div>
                          <div className="text-[10px] text-amber-400/80 font-normal">
                            {preview}
                          </div>
                        </div>
                      </div>
                      {isPresetSelected && (
                        <Check className="size-3.5 text-amber-400 shrink-0 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div className="p-3 rounded-xl border border-rose-500 bg-rose-950/50 text-xs text-rose-200 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || (isStockoutReason && selectedItemIds.length === 0)}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2"
          >
            {isSubmitting ? "Processing..." : "Confirm & Decline Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
