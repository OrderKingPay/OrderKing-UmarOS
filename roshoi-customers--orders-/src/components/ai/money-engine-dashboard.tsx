import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Flame,
  Globe,
  Layers,
  Percent,
  QrCode,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateTimeframeRevenue,
  IMMUTABLE_FINANCIAL_LEDGER,
} from "@/lib/ai/financial-ledger";
import {
  Opportunity,
  VERIFIED_OPPORTUNITIES,
} from "@/lib/ai/opportunity-hunter";

export function MoneyEngineDashboard({
  founderUpiVpa = "orderking@okhdfcbank",
}: {
  founderUpiVpa?: string;
}) {
  const [timeframe, setTimeframe] = useState<"TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_YEAR">("THIS_MONTH");
  const [opportunities, setOpportunities] = useState<Opportunity[]>(VERIFIED_OPPORTUNITIES);

  const metrics = calculateTimeframeRevenue(IMMUTABLE_FINANCIAL_LEDGER, timeframe);

  // Sorted by lowest friction score first (§29 Minimum-Friction Revenue Path)
  const rankedOpportunities = [...opportunities].sort(
    (a, b) => a.frictionMetrics.estimatedFrictionScore - b.frictionMetrics.estimatedFrictionScore
  );

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Dashboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-emerald-500" />
            <h2 className="text-lg font-black tracking-tight">Real-Money Operating Engine &amp; Ledger</h2>
            <Badge tone="primary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Directive §2, §11 &amp; §12
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Zero-Fabrication Accounting · Actual vs Pending vs Forecast Revenue · Immutable Event Ledger
          </p>
        </div>

        {/* Timeframe Selector (§12) */}
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 border border-border text-xs font-bold">
          {(["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_YEAR"] as const).map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg transition ${
                timeframe === tf
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted hover:text-fg"
              }`}
            >
              {tf.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Dashboard Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-surface">
        {/* 6-Metric Financial Truth Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
              Actual Revenue (Confirmed)
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono">
              ₹{metrics.actualConfirmedRevenueInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">✓ Verifiable Bank Txns</span>
          </div>

          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
              Pending Invoiced
            </span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">
              ₹{metrics.pendingInvoicedInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">⏳ Awaiting Settlement</span>
          </div>

          <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
              Estimated Pipeline
            </span>
            <p className="text-xl font-black text-blue-600 dark:text-blue-300 font-mono">
              ₹{metrics.estimatedPipelineInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">📊 Stated Client Budgets</span>
          </div>

          <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
              Forecast Velocity
            </span>
            <p className="text-xl font-black text-purple-600 dark:text-purple-300 font-mono">
              ₹{metrics.forecastRevenueInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">⚡ Conservative Projection</span>
          </div>

          <div className="rounded-2xl border border-teal-500/40 bg-teal-500/10 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-teal-600 dark:text-teal-400 tracking-wider">
              Recurring Retainers
            </span>
            <p className="text-xl font-black text-teal-600 dark:text-teal-300 font-mono">
              ₹{metrics.recurringRetainerInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">🔁 Monthly Subscriptions</span>
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/40 p-3.5 space-y-1 shadow-xs">
            <span className="text-[10px] font-black uppercase text-muted tracking-wider">
              Net Contribution
            </span>
            <p className="text-xl font-black text-fg font-mono">
              ₹{metrics.netContributionInr.toLocaleString("en-IN")}
            </p>
            <span className="text-[9px] text-muted block font-semibold">95% Margin (0% UPI Cut)</span>
          </div>
        </div>

        {/* Section 1: Minimum-Friction Revenue Path Finder (§29) */}
        <div className="rounded-2xl border border-border bg-surface-2/20 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-amber-500" />
                <h3 className="text-sm font-black text-fg">Minimum-Friction Revenue Path Finder (§29)</h3>
                <Badge tone="warn" className="text-[10px] font-bold">
                  Ranked by Execution Velocity
                </Badge>
              </div>
              <p className="text-xs text-muted">
                Surfaces opportunities with the lowest friction, fastest time-to-invoice, and highest hourly economics.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {rankedOpportunities.map((opp, idx) => (
              <div
                key={opp.id}
                className="rounded-xl border border-border bg-surface p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs hover:border-amber-500/40 transition"
              >
                <div className="space-y-1 flex-1 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-fg">{opp.title}</span>
                    <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{opp.statedBudget.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span>Client: <strong className="text-fg">{opp.client}</strong></span>
                    <span>•</span>
                    <span>Time to Deliverable: <strong className="text-fg">{opp.frictionMetrics.timeToDeliverableDays} Days</strong></span>
                    <span>•</span>
                    <span>Hourly Rate: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₹{opp.frictionMetrics.expectedHourlyEconomicsInr.toLocaleString("en-IN")}/hr</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted block">Friction Score</span>
                    <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                      {opp.frictionMetrics.estimatedFrictionScore}/100 (Low)
                    </span>
                  </div>

                  <Button
                    size="sm"
                    className="text-xs font-bold bg-primary text-white hover:bg-primary/90"
                    onClick={() => {
                      toast.success(`Action initiated: ${opp.nextAction}`);
                    }}
                  >
                    ⚡ {opp.nextAction}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Immutable Financial Event Ledger (§11) */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" />
              <h3 className="text-sm font-black text-fg">Immutable Financial Event Ledger (§11)</h3>
            </div>
            <span className="text-[11px] font-bold text-muted">Tamper-Evident Provider Receipts</span>
          </div>

          <div className="space-y-2">
            {IMMUTABLE_FINANCIAL_LEDGER.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-border bg-surface-2/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-muted">{ev.id}</span>
                    <span className="font-bold text-fg">{ev.description}</span>
                    <Badge
                      tone={ev.type === "payment_confirmed" ? "primary" : "warn"}
                      className="text-[9px] font-bold uppercase"
                    >
                      {ev.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted">
                    Client: {ev.clientName} · Provider Ref: <span className="font-mono text-fg font-semibold">{ev.providerEventId}</span> ({ev.provider})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹{ev.amount.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] text-muted block">{ev.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
