import { useState } from "react";
import { Clock, Sunrise, Infinity, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ZOMATO_STOCKOUT_PRESETS,
  type TimedStockoutOption,
  calculateStockoutExpiry,
} from "@/lib/menu/timed-stockout";

interface TimedStockoutPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  itemId: string;
  onConfirm: (option: TimedStockoutOption) => Promise<void> | void;
  loading?: boolean;
}

export function TimedStockoutPickerModal({
  isOpen,
  onClose,
  itemName,
  onConfirm,
  loading = false,
}: TimedStockoutPickerModalProps) {
  const [selectedOption, setSelectedOption] = useState<TimedStockoutOption>("TURN_OFF_TOMORROW_8AM");

  if (!isOpen) return null;

  const now = new Date();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stockout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 font-sans space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 font-mono">
                Zomato Stockout Control
              </span>
            </div>
            <h2 id="stockout-modal-title" className="text-lg font-bold text-white mt-1">
              Turn off {itemName}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select duration. Dish auto-restores to IN STOCK when timer expires.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* 4 Authentic Zomato Presets */}
        <div className="space-y-2.5">
          {ZOMATO_STOCKOUT_PRESETS.map((preset) => {
            const isSelected = selectedOption === preset.id;
            const expiryInfo = calculateStockoutExpiry(preset.id, now);

            let previewText = "";
            if (preset.id === "TURN_OFF_2_HOURS" || preset.id === "TURN_OFF_4_HOURS") {
              const timeStr = expiryInfo.expiryDate?.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              previewText = `Auto-restores at ${timeStr} today`;
            } else if (preset.id === "TURN_OFF_TOMORROW_8AM") {
              previewText = "Auto-restores tomorrow at 08:00 AM";
            } else {
              previewText = "Manual reactivation required";
            }

            return (
              <label
                key={preset.id}
                onClick={() => setSelectedOption(preset.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition select-none ${
                  isSelected
                    ? "border-rose-500/80 bg-rose-950/30 ring-1 ring-rose-500/40 text-white"
                    : "border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? "bg-rose-500/20 text-rose-300"
                        : "bg-slate-800/80 text-slate-400"
                    }`}
                  >
                    {preset.icon === "Sunrise" ? (
                      <Sunrise className="size-4" />
                    ) : preset.icon === "Infinity" ? (
                      <Infinity className="size-4" />
                    ) : (
                      <Clock className="size-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-sm leading-tight text-white">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {preset.sublabel} · <span className="text-amber-400/90">{previewText}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`size-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
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

        {/* Auto-Reset Assurance Note */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center gap-2.5 text-xs text-amber-300/90">
          <AlertCircle className="size-4 shrink-0 text-amber-400" />
          <span>
            Automated local time scheduler will restore this dish immediately once the window ends without manual intervention.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(selectedOption)}
            className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2"
          >
            {loading ? "Updating..." : "Confirm Turn Off"}
          </Button>
        </div>
      </div>
    </div>
  );
}
