import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNextDay06AM } from "@/lib/ai/order-king-spark";
import {
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Boxes,
} from "lucide-react";

export interface CatalogueStockControlsPanelProps {
  restaurantId?: string;
}

export function CatalogueStockControlsPanel({
  restaurantId: _restaurantId,
}: CatalogueStockControlsPanelProps) {
  // 1. Automated 06:00 AM Next-Day Stock Reset Toggle
  const [autoReset6Am, setAutoReset6Am] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_stock_auto_reset_6am");
      if (saved !== null) return saved === "true";
    }
    return true; // Enabled by default
  });

  // 2. Low-Stock Auto-Warning Threshold (3, 5, 10 units, or custom 1-20)
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_low_stock_warning_threshold");
      if (saved) return Math.min(20, Math.max(1, Number(saved)));
    }
    return 5;
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const nextResetDate = getNextDay06AM();
  const formattedNextReset = nextResetDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const handleSaveStockControls = () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_stock_auto_reset_6am", String(autoReset6Am));
        localStorage.setItem("ok_low_stock_warning_threshold", String(lowStockThreshold));
      }
      setSaveMsg(
        `Stock controls saved: 06:00 AM Reset is ${autoReset6Am ? "Active" : "Disabled"}, Low-Stock threshold set to ${lowStockThreshold} units.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save stock controls");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-gray-200 bg-white p-6 space-y-6 text-gray-900 rounded-2xl shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-[#E23744]">
            <Boxes className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
              Menu Inventory &amp; Stock Availability
            </h2>
            <p className="text-xs text-gray-500">
              Manage automatic stock resets and low-inventory warning thresholds for kitchen staff.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
              autoReset6Am
                ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                : "text-gray-600 bg-gray-50 border-gray-200"
            }`}
          >
            {autoReset6Am ? "Daily 06:00 AM Reset Active" : "Manual Reset Only"}
          </span>
        </div>
      </div>

      {/* Grid: 06:00 AM Reset & Low-Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Feature 1: Automated 06:00 AM Next-Day Stock Reset Toggle */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#E23744]" />
                <span className="font-bold text-xs text-gray-900">
                  Daily 06:00 AM Next-Day Stock Reset
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReset6Am}
                  onChange={(e) => setAutoReset6Am(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E23744]"></div>
              </label>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              When kitchen staff marks a dish as &quot;Out of Stock&quot; during dinner service, automatically re-enable it at <strong>06:00 AM IST</strong> the following morning so breakfast items are available.
            </p>

            {/* Next Scheduled Reset Badge */}
            <div className="p-3 rounded-xl border border-gray-200 bg-white flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <RefreshCw className={`size-3.5 ${autoReset6Am ? "text-emerald-600 animate-spin-slow" : "text-gray-400"}`} />
                <span className="text-xs text-gray-700 font-medium">Next Scheduled Reset:</span>
              </div>
              <span className="text-xs font-semibold text-gray-900">
                {autoReset6Am ? formattedNextReset : "Disabled"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 border-t border-gray-200 pt-2.5">
            {autoReset6Am ? "Stock status will reset automatically every morning at 06:00 AM." : "Manual stock update required via Menu."}
          </div>
        </div>

        {/* Feature 2: Low-Stock Auto-Warning Threshold */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-600" />
                <span className="font-bold text-xs text-gray-900">
                  Low-Stock Warning Level
                </span>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md shadow-xs">
                ≤ {lowStockThreshold} portions
              </span>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Displays a low-stock alert on kitchen order tickets and dish listings when remaining portions drop below this threshold.
            </p>

            {/* Threshold Preset Selector Pills (3, 5, 10 units) */}
            <div className="space-y-2">
              <span className="text-xs text-gray-600 font-medium">Quick Selection:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { qty: 3, label: "3 Portions", desc: "Small Kitchen" },
                  { qty: 5, label: "5 Portions", desc: "Standard" },
                  { qty: 10, label: "10 Portions", desc: "High Volume" },
                ].map((tier) => {
                  const isSelected = lowStockThreshold === tier.qty;
                  return (
                    <button
                      key={tier.qty}
                      type="button"
                      onClick={() => setLowStockThreshold(tier.qty)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? "border-[#E23744] bg-red-50 text-red-900 shadow-xs"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{tier.label}</span>
                        {isSelected ? (
                          <CheckCircle2 className="size-3 text-[#E23744]" />
                        ) : null}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{tier.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Tuning Slider (1 to 20 units) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Threshold:</span>
                <span className="font-bold text-gray-900">{lowStockThreshold} portions</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E23744]"
              />
            </div>
          </div>

          {/* Live Preview of Alert Badge */}
          <div className="rounded-xl border border-gray-200 bg-white p-3 flex items-center justify-between text-xs shadow-xs">
            <span className="text-gray-600 font-medium">Alert Preview:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <AlertTriangle className="size-3 text-amber-600" /> Low Stock ({lowStockThreshold} left)
            </span>
          </div>
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSaveStockControls}
          className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs font-bold px-6 h-10 rounded-xl shadow-xs"
        >
          {saving ? "Saving..." : "Save Stock Settings"}
        </Button>
      </div>
    </Card>
  );
}
