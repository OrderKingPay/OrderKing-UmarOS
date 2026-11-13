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
  TIER1_REJECTION_REASONS,
  processStructuredRejection,
} from "@/lib/orders/structured-rejection";
import {
  TIER1_STOCKOUT_PRESETS,
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

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (isStockoutReason && selectedItemIds.length > 0 && restaurantId) {
        const expiry = calculateStockoutExpiry(stockoutOption);
        await setAvailability({
          data: {
            restaurantId,
            itemIds: selectedItemIds,
            status: "temporarily_unavailable",
            nextAvailableAt: expiry.nextAvailableAt,
          },
        });
        toast.info(
          `Out-of-Stock: ${selectedItemIds.length} dish(es) marked unavailable until ${expiry.label}.`
        );
        void qc.invalidateQueries({ queryKey: ["menu"] });
      }

      await onConfirmReject(selectedReason);
      processStructuredRejection({
        orderId: order.id,
        orderNumber: order.orderNumber,
        reason: selectedReason,
        selectedLineItemIds: isStockoutReason ? selectedItemIds : undefined,
        stockoutDuration: stockoutOption,
      });

      onClose();
    } catch (err) {
      console.error("[StructuredRejectionModal] Error declining order:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to record decline decision.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="structured-reject-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl text-gray-900 font-sans space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 font-mono">
                Order Management
              </span>
            </div>
            <h2 id="structured-reject-title" className="text-lg font-bold text-gray-900 mt-1">
              Decline Order #{order.orderNumber}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select an operational reason to inform the guest and update store state.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            aria-label="Close rejection dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Penalty & Fulfillment Warning Banner */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-900">
          <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold text-rose-950">Fulfillment Advisory:</span>
            <span className="text-rose-900 ml-1">
              Frequent cancellations impact customer trust. Please ensure order declines are minimal.
            </span>
          </div>
        </div>

        {/* Reason Selection Radio Group */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
            1. Select Operational Reason:
          </label>
          <div className="space-y-2">
            {TIER1_REJECTION_REASONS.map((r) => {
              const isSelected = selectedReason === r.id;
              return (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-start justify-between p-3 rounded-2xl border cursor-pointer transition select-none ${
                    isSelected
                      ? "border-rose-400 bg-rose-50/70 ring-1 ring-rose-400 text-gray-900"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-rose-100 text-rose-700"
                          : "bg-gray-200 text-gray-600"
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
                      <div className="text-xs font-bold text-gray-900">{r.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                        {r.sublabel}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 mt-1 ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-gray-300 bg-white"
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
          <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-4 space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-orange-950 uppercase tracking-wider font-mono">
                  2. Select Out-of-Stock Dishes in this Order:
                </label>
                <span className="text-[10px] text-gray-500 font-mono">
                  {selectedItemIds.length} of {order.lines.length} selected
                </span>
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">
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
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition ${
                      isChecked
                        ? "border-orange-300 bg-white text-gray-900 font-semibold shadow-xs"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-4 rounded border flex items-center justify-center ${
                          isChecked
                            ? "border-orange-600 bg-orange-600 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                      <span>
                        <strong className="text-gray-900">{line.quantity}×</strong> {line.itemName}
                        {line.variantName ? ` (${line.variantName})` : ""}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-100 text-orange-950 font-bold">
                      Out of Stock
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Timed Stockout Presets */}
            <div className="space-y-2 pt-2 border-t border-orange-200">
              <label className="text-xs font-bold text-orange-950 uppercase tracking-wider font-mono">
                3. Choose Timed Stockout Duration:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TIER1_STOCKOUT_PRESETS.map((preset) => {
                  const isPresetSelected = stockoutOption === preset.id;
                  const expiry = calculateStockoutExpiry(preset.id);
                  const preview = expiry.label;

                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setStockoutOption(preset.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition cursor-pointer select-none flex items-center justify-between ${
                        isPresetSelected
                          ? "border-orange-400 bg-orange-100/70 text-gray-900 font-bold ring-1 ring-orange-400"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {preset.icon === "Sunrise" ? (
                          <Sunrise className="size-4 text-orange-600 shrink-0" />
                        ) : preset.icon === "Infinity" ? (
                          <InfinityIcon className="size-4 text-orange-600 shrink-0" />
                        ) : (
                          <Clock className="size-4 text-orange-600 shrink-0" />
                        )}
                        <div>
                          <div className="leading-tight">{preset.label}</div>
                          <div className="text-[10px] text-gray-500 font-normal">
                            {preview}
                          </div>
                        </div>
                      </div>
                      {isPresetSelected && (
                        <Check className="size-3.5 text-orange-700 shrink-0 stroke-[3]" />
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
          <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs text-gray-700 hover:bg-gray-50 border-gray-300 rounded-xl h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || (isStockoutReason && selectedItemIds.length === 0)}
            onClick={handleConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-5 h-10 rounded-xl shadow-xs"
          >
            {isSubmitting ? "Processing..." : "Confirm & Decline Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
