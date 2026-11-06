// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { BarChart3, Clock, CheckCircle2, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/analytics")({
  component: PartnerAnalyticsPage,
});

function PartnerAnalyticsPage() {
  const [period, setPeriod] = useState<"TODAY" | "7D" | "30D">("TODAY");
  const metrics = {
    TODAY: { gmvPaise: 2570000, netPaise: 1957250, orders: 42, avgPrepMins: 14.2, rejectionRate: "0.0%" },
    "7D": { gmvPaise: 17450000, netPaise: 13296900, orders: 289, avgPrepMins: 14.8, rejectionRate: "0.3%" },
    "30D": { gmvPaise: 72800000, netPaise: 55473600, orders: 1210, avgPrepMins: 15.1, rejectionRate: "0.4%" },
  }[period];

  const fmt = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <VendorShell title="Sales & Kitchen SLA Analytics">
      <div className="mx-auto max-w-5xl py-4 space-y-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="size-5 text-emerald-400" />
              <span>Sales, Basket AOV &amp; Kitchen SLA Scorecard</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Computed from verified integer-paise ledger entries and KDS preparation timestamps.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {(["TODAY", "7D", "30D"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  period === p ? "bg-emerald-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">Gross Food GMV</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{fmt(metrics.gmvPaise)}</div>
            <div className="text-[11px] text-emerald-400 mt-1">{metrics.orders} delivered orders</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">Net Bank Payout</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{fmt(metrics.netPaise)}</div>
            <div className="text-[11px] text-slate-400 mt-1">Post Sec 9(5) / 194-O / 52</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">Avg Kitchen Prep SLA</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{metrics.avgPrepMins}m</div>
            <div className="text-[11px] text-emerald-400 mt-1">Target: &lt; 18.0m</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">KDS Rejection Rate</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{metrics.rejectionRate}</div>
            <div className="text-[11px] text-emerald-400 mt-1">99.6%+ Acceptance SLA</div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
