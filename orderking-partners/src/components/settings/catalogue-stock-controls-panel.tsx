import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNextDay06AM } from "@/lib/ai/order-king-spark";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface CatalogueStockControlsPanelProps {
  restaurantId?: string;
}

export function CatalogueStockControlsPanel({
  restaurantId,
}: CatalogueStockControlsPanelProps) {
  // 1. Automated 06:00 AM Next-Day Stock Reset Toggle
  const [autoReset6Am, setAutoReset6Am] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ok_stock_auto_reset_6am");
      if (saved !== null) return saved === "true";
    }
    return true; // Enabled by default for breakfast protection
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
        `Catalogue & Autonomous Stock Controls saved: 06:00 AM Reset is ${autoReset6Am ? "ENABLED" : "DISABLED"}, Low-Stock Warning Threshold set to ${lowStockThreshold} units.`,
      );
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Failed to save stock controls");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
              Catalogue &amp; King AI Autonomous Stock Controls
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                AUTONOMOUS INVENTORY
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Restaurateur-grade stockout prevention, automated 06:00 AM breakfast availability reinstatement, and proactive low-stock warning triggers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded border ${
              autoReset6Am
                ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/40"
                : "text-slate-400 bg-slate-950 border-slate-800"
            }`}
          >
            {autoReset6Am ? "06:00 AM RESET ACTIVE" : "MANUAL 86 RESET"}
          </span>
        </div>
      </div>

      {/* Grid: 06:00 AM Reset & Low-Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Feature 1: Automated 06:00 AM Next-Day Stock Reset Toggle */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">
                  Automated 06:00 AM Next-Day Stock Reset
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReset6Am}
                  onChange={(e) => setAutoReset6Am(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When kitchen staff marks a dish as &quot;86 / Out of Stock&quot; during busy dinner shifts, King AI automatically re-enables it at <strong className="text-slate-200">06:00 AM IST</strong> next morning. Eliminates forgotten stockouts and recovers breakfast &amp; early morning tea orders.
            </p>

            {/* Next Scheduled Reset Badge */}
            <div className="p-3 rounded-lg border border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <RefreshCw className={`size-3.5 ${autoReset6Am ? "text-emerald-400 animate-spin-slow" : "text-slate-500"}`} />
                <span className="text-xs text-slate-300 font-medium">Next Scheduled Auto-Reset:</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {autoReset6Am ? formattedNextReset : "Disabled"}
              </span>
            </div>

            {/* Inclusions / Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-emerald-400">✓ Recovers Breakfast Sales</div>
              <div className="text-emerald-400">✓ Auto-clears Temporary 86</div>
              <div className="text-emerald-400">✓ Syncs with KDS &amp; POS</div>
              <div className="text-emerald-400">✓ Zero Staff Overhead</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic border-t border-slate-800/80 pt-2">
            Status: {autoReset6Am ? "King AI Autonomous Engine actively managing morning catalogue reinstatement." : "Manual stock reinstatement required via Menu tab."}
          </div>
        </div>

        {/* Feature 2: Low-Stock Auto-Warning Threshold */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-amber-400" />
                <span className="font-bold text-sm text-white">
                  Low-Stock Auto-Warning Threshold
                </span>
              </div>
              <span className="text-sm font-bold font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded">
                ≤ {lowStockThreshold} units
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Triggers visual amber alerts on KDS Cook Stations and Live Order Dispatch cards when an item&apos;s remaining inventory portion count drops to or below this threshold.
            </p>

            {/* Threshold Preset Selector Pills (3, 5, 10 units) */}
            <div className="space-y-2">
              <span className="text-xs text-slate-300 font-medium">Select Warning Trigger Level:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { qty: 3, label: "3 Units", desc: "Critical / Low Volume" },
                  { qty: 5, label: "5 Units", desc: "Standard / Balanced" },
                  { qty: 10, label: "10 Units", desc: "High-Velocity Kitchen" },
                ].map((tier) => {
                  const isSelected = lowStockThreshold === tier.qty;
                  return (
                    <button
                      key={tier.qty}
                      type="button"
                      onClick={() => setLowStockThreshold(tier.qty)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/15 text-white shadow-[0_0_10px_rgba(245,158,11,0.15)]"
                          : "border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{tier.label}</span>
                        {isSelected ? (
                          <span className="text-[10px] font-mono text-amber-400">ACTIVE</span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-tight">{tier.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Tuning Slider (1 to 20 units) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Fine-tune threshold (1 to 20 units):</span>
                <span className="font-mono font-bold text-amber-400">{lowStockThreshold} units</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                step={1}
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>1 unit</span>
                <span>5 units</span>
                <span>10 units</span>
                <span>20 units</span>
              </div>
            </div>
          </div>

          {/* Live Preview of Alert Badge */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">KDS Cook Ticket Preview:</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300">
              <AlertTriangle className="size-3" /> LOW STOCK (≤{lowStockThreshold} REMAINING)
            </span>
          </div>
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="text-xs text-emerald-400 flex items-center gap-1.5 min-h-[20px]">
          {saveMsg ? (
            <>
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>{saveMsg}</span>
            </>
          ) : null}
        </div>
        <Button
          size="sm"
          disabled={saving}
          onClick={handleSaveStockControls}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4"
        >
          {saving ? "Saving Stock Controls..." : "Save Catalogue & Stock Controls"}
        </Button>
      </div>
    </Card>
  );
}
