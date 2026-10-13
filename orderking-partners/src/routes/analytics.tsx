import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getAnalytics } from "@/lib/server/api-finance";
import { formatINR } from "@/lib/money";
import { can } from "@/lib/rbac";
import { FileSpreadsheet, LineChart, TrendingUp, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const t = useT();
  const vendor = useVendor();
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const allowed = vendor.role ? can(vendor.role, "analytics.view") : false;
  const q = useQuery({
    queryKey: ["analytics", vendor.restaurantId, range],
    queryFn: () => getAnalytics({ data: { restaurantId: vendor.restaurantId, range } }),
    enabled: Boolean(vendor.restaurantId) && allowed,
  });

  if (vendor.role && !allowed) {
    return (
      <VendorShell title={t("nav.analytics")}>
        <Card>{t("settings.financialLocked")}</Card>
      </VendorShell>
    );
  }

  const s = q.data?.summary;
  const items = q.data?.items ?? [];
  const totalOrders = s?.orders ?? 0;
  const completedOrders = s?.completed ?? 0;
  const cancelledOrders = s?.cancelled ?? 0;
  const rejectedOrders = s?.rejected ?? 0;
  const fulfillmentPct = totalOrders > 0 ? Math.round((completedOrders * 100) / totalOrders) : 100;

  function downloadPerformanceCsv() {
    const summaryLines = [
      "section,metric,value",
      `summary,range,${range}`,
      `summary,total_orders,${totalOrders}`,
      `summary,completed_orders,${completedOrders}`,
      `summary,cancelled_orders,${cancelledOrders}`,
      `summary,rejected_orders,${rejectedOrders}`,
      `summary,gross_sales_paise,${s?.salesPaise ?? 0}`,
      `summary,aov_paise,${s?.aovPaise ?? 0}`,
      `summary,avg_prep_minutes,${q.data?.avgPrepMinutes ?? ""}`,
      `summary,restaurant_funded_promo_paise,${q.data?.promotions.restaurantFundedPaise ?? 0}`,
      `summary,platform_funded_promo_paise,${q.data?.promotions.platformFundedPaise ?? 0}`,
      "",
      "item_name,quantity_sold,revenue_paise",
      ...items.map(
        (i) => `"${String(i.name).replace(/"/g, '""')}",${i.qty},${i.revenuePaise}`,
      ),
    ];

    const blob = new Blob([summaryLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orderking-analytics-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <VendorShell
      title={t("nav.analytics")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Time Horizon & Self-Service CSV Export Bar */}
        <Card className="border-slate-800 bg-slate-900/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(["day", "week", "month"] as const).map((r) => (
              <Button
                key={r}
                size="sm"
                variant={range === r ? "primary" : "secondary"}
                onClick={() => setRange(r)}
              >
                {t(r === "day" ? "common.today" : r === "week" ? "common.week" : "common.month")}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => downloadPerformanceCsv()}
            disabled={!q.data}
            className="text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100"
          >
            <FileSpreadsheet className="mr-1.5 size-3.5 text-emerald-400" />
            Download Performance &amp; Tax Report (CSV)
          </Button>
        </Card>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs font-mono uppercase text-slate-400">{t("analytics.orders")}</div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular">
              {s?.orders ?? "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 tabular">
              {completedOrders} delivered · {cancelledOrders + rejectedOrders} cancelled/rejected
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs font-mono uppercase text-slate-400">{t("dashboard.sales")}</div>
            <div className="font-display text-2xl font-bold text-emerald-400 mt-1 tabular">
              {s ? <MoneyText paise={s.salesPaise} /> : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Delivered gross sales</div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs font-mono uppercase text-slate-400">{t("dashboard.aov")}</div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular">
              {s ? <MoneyText paise={s.aovPaise} /> : "—"}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Average basket size</div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="text-xs font-mono uppercase text-slate-400">{t("analytics.avgPrep")}</div>
            <div className="font-display text-2xl font-bold text-white mt-1 tabular">
              {q.data?.avgPrepMinutes != null ? `${q.data.avgPrepMinutes}m` : "—"}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              Fulfillment rate: {fulfillmentPct}%
            </div>
          </Card>
        </div>

        {/* Kitchen Efficiency & Promotional Co-Investment Summary */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  Kitchen Efficiency &amp; SLA Reliability
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400">{fulfillmentPct}% SLA</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">DELIVERED</span>
                <span className="font-bold text-emerald-400 text-sm tabular">{completedOrders}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">CANCELLED</span>
                <span className="font-bold text-amber-400 text-sm tabular">{cancelledOrders}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">REJECTED</span>
                <span className="font-bold text-rose-400 text-sm tabular">{rejectedOrders}</span>
              </div>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChart className="size-4 text-emerald-400" />
                <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                  {t("analytics.promos")} ({q.data?.promotions.orders ?? 0} Orders)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">INTEGER-PAISE</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <span className="text-[10px] font-mono text-slate-400 block">
                  {t("promotions.restaurantFunded")}
                </span>
                <span className="font-bold text-rose-400 text-sm tabular">
                  {q.data ? formatINR(q.data.promotions.restaurantFundedPaise) : "—"}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <span className="text-[10px] font-mono text-emerald-400 block">
                  {t("promotions.platformFunded")} (Reimbursed)
                </span>
                <span className="font-bold text-emerald-400 text-sm tabular">
                  {q.data ? formatINR(q.data.promotions.platformFundedPaise) : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Hourly Order Volume Chart */}
        <Card className="h-64 border-slate-800 bg-slate-900/70 p-4">
          <h2 className="mb-2 font-display text-base font-bold text-white">{t("analytics.peak")}</h2>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={q.data?.hours ?? []}>
              <XAxis dataKey="hour" stroke="var(--color-muted)" />
              <YAxis allowDecimals={false} stroke="var(--color-muted)" />
              <Tooltip />
              <Bar dataKey="orders" fill="var(--color-chili)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Menu Velocity & Dish Revenue Breakdown */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="size-4 text-emerald-400" />
              <h2 className="font-display text-base font-bold text-white">{t("analytics.best")}</h2>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400">No delivered item records in this time range.</p>
            ) : (
              <ul className="divide-y divide-slate-800/80 text-xs">
                {items.slice(0, 6).map((i) => (
                  <li key={i.name} className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-200">{i.name}</span>
                    <span className="tabular font-mono text-slate-300">
                      {i.qty} sold · <strong className="text-emerald-400">{formatINR(i.revenuePaise)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 mb-3">
              <UtensilsCrossed className="size-4 text-amber-400" />
              <h2 className="font-display text-base font-bold text-white">{t("analytics.low")}</h2>
            </div>
            {items.length === 0 ? (
              <p className="text-xs text-slate-400">No delivered item records in this time range.</p>
            ) : (
              <ul className="divide-y divide-slate-800/80 text-xs">
                {items
                  .slice()
                  .reverse()
                  .slice(0, 6)
                  .map((i) => (
                    <li key={i.name} className="flex items-center justify-between py-2">
                      <span className="font-medium text-slate-200">{i.name}</span>
                      <span className="tabular font-mono text-slate-400">
                        {i.qty} sold · {formatINR(i.revenuePaise)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </VendorShell>
  );
}
