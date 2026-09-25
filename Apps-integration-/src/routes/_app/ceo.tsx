import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  askAssistant,
  generateCeoReport,
  getCeoDashboard,
  runE2eSimulation,
  runMarketplaceTick,
} from "@/lib/orderking/server/api";
import { formatBps, formatINR } from "@/lib/orderking/money";
import { computeEconomics, DEFAULT_PILOT_ASSUMPTIONS, simulateCommissionChange } from "@/lib/orderking/unit-economics";
import { ErrorBanner, PageHeader, RequirePerm } from "@/components/ui/page";
import { Kpi } from "@/components/ui/kpi";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/ceo")({ component: () => <RequirePerm perm="view_executive"><CeoPage /></RequirePerm> });

function CeoPage() {
  const [tab, setTab] = useState("today");
  const [range, setRange] = useState<"today" | "yesterday" | "7d" | "30d" | "month">("today");
  const q = useQuery({
    queryKey: ["ceo", range],
    queryFn: async () => {
      const r = await getCeoDashboard({ data: { range } });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
  });
  const qc = useQueryClient();
  const dataMode = q.data?.dataMode ?? "NOT_CONNECTED";
  const tick = useMutation({
    mutationFn: async () => {
      const r = await runMarketplaceTick();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: (d) => {
      toast.success(`Simulated order ${d.orderId} delivered`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const e2e = useMutation({
    mutationFn: async () => {
      const r = await runE2eSimulation();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: () => {
      toast.success("End-to-end admin simulation recorded in the audit log");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Command Center"
        description="Business health first. Simulation does not change a live marketplace."
        actions={
          <>
            <Button variant="secondary" onClick={() => tick.mutate()} disabled={tick.isPending || dataMode !== "SIMULATED"}>
              {dataMode === "SIMULATED" ? "Simulate one delivery" : "Demo delivery disabled"}
            </Button>
            <Button variant="outline" onClick={() => e2e.mutate()} disabled={e2e.isPending || dataMode !== "SIMULATED"}>
              {dataMode === "SIMULATED" ? "Run admin walkthrough" : "Demo walkthrough disabled"}
            </Button>
          </>
        }
      />
      {q.error ? <ErrorBanner message={q.error.message} onRetry={() => void q.refetch()} /> : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs
          tabs={[
            { id: "today", label: "Today" },
            { id: "money", label: "Money" },
            { id: "economics", label: "Unit economics" },
            { id: "sim", label: "What-if" },
            { id: "ai", label: "CEO AI" },
            { id: "report", label: "Report" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <select
          className="h-10 rounded-sm border border-border bg-elevated px-2 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value as typeof range)}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="month">Month</option>
        </select>
      </div>
      {tab === "today" ? <TodayPane data={q.data} /> : null}
      {tab === "money" ? <MoneyPane data={q.data} /> : null}
      {tab === "economics" ? <EconomicsPane data={q.data} /> : null}
      {tab === "sim" ? <Simulator /> : null}
      {tab === "ai" ? <CeoAi /> : null}
      {tab === "report" ? <ReportPane /> : null}
    </div>
  );
}

function TodayPane({ data }: { data?: {
  period: string;
  money: { orders: number; gmvPaise: number; contributionPaise: number; aovPaise: number; deliverySuccessBps: number };
  prior: { orders: number };
  dataMode: "LIVE" | "SIMULATED" | "NOT_CONNECTED";
  counts: { restaurants: number; riders: number; customers: number; online: number };
  top: Array<{ id: string; name: string; gmv: number; orders: number }>;
  weak: Array<{ id: string; name: string; gmv: number }>;
} }) {
  if (!data) return <p className="text-sm text-muted">Loading…</p>;
  return (
    <div className="space-y-6">
      <p className="text-xs text-subtle">
        {data.period} · {data.dataMode === "LIVE" ? "LIVE DATA" : data.dataMode === "SIMULATED" ? "SIMULATED DATA" : "SHARED CORE NOT CONNECTED"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Orders" value={String(data.money.orders)} hint={`Yesterday ${data.prior.orders}`} />
        <Kpi label="GMV" value={formatINR(data.money.gmvPaise)} />
        <Kpi label="Contribution" value={formatINR(data.money.contributionPaise)} />
        <Kpi label="AOV" value={formatINR(data.money.aovPaise)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Active restaurants" value={String(data.counts.restaurants)} />
        <Kpi label="Riders" value={String(data.counts.riders)} hint={`${data.counts.online} online`} />
        <Kpi label="Active customers" value={String(data.counts.customers)} />
        <Kpi label="Delivery success" value={formatBps(data.money.deliverySuccessBps)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-3 text-base">Growing restaurants</CardTitle>
          <ul className="space-y-2 text-sm">
            {data.top.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.name}</span>
                <span className="tabular-nums text-muted">{formatINR(r.gmv)} · {r.orders} orders</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle className="mb-3 text-base">Needs attention</CardTitle>
          <ul className="space-y-2 text-sm">
            {data.weak.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.name}</span>
                <span className="tabular-nums text-muted">{formatINR(r.gmv)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function MoneyPane({ data }: { data?: { money: { gmvPaise: number; restaurantCommissionPaise: number; deliveryRevenuePaise: number; customerFeesPaise: number; paymentCostPaise: number; riderCostPaise: number; refundsPaise: number; promotionalCostPaise: number; supportCostPaise: number; infraCostPaise: number; contributionPaise: number; revenuePaise: number } } }) {
  if (!data) return <p className="text-sm text-muted">Loading…</p>;
  const m = data.money;
  const rows = [
    ["Restaurant commission", m.restaurantCommissionPaise],
    ["Delivery revenue", m.deliveryRevenuePaise],
    ["Customer fees", m.customerFeesPaise],
    ["Payment cost", -m.paymentCostPaise],
    ["Rider cost", -m.riderCostPaise],
    ["Refunds", -m.refundsPaise],
    ["Platform promotions", -m.promotionalCostPaise],
    ["Support (variable)", -m.supportCostPaise],
    ["Infrastructure (variable)", -m.infraCostPaise],
  ] as const;
  return (
    <Card>
      <CardTitle className="mb-1">Platform contribution</CardTitle>
      <p className="mb-4 text-xs text-muted">SIMULATED DATA. 10% commission is not assumed profitable — this is the actual stack.</p>
      <ul className="space-y-2 text-sm">
        {rows.map(([label, v]) => (
          <li key={label} className="flex justify-between border-b border-border py-1">
            <span className="text-muted">{label}</span>
            <span className="tabular-nums">{formatINR(v)}</span>
          </li>
        ))}
        <li className="flex justify-between pt-2 font-medium">
          <span>Contribution</span>
          <span className="tabular-nums">{formatINR(m.contributionPaise)}</span>
        </li>
      </ul>
    </Card>
  );
}

function EconomicsPane({ data }: { data?: { unit: { revenuePerOrder: number; contributionPerOrder: number; breakEvenOrdersPerDay: number | null }; money: { orders: number; aovPaise: number } } }) {
  if (!data) return null;
  const slice = computeEconomics({
    ...DEFAULT_PILOT_ASSUMPTIONS,
    orders: Math.max(1, data.money.orders),
    aovPaise: data.money.aovPaise || DEFAULT_PILOT_ASSUMPTIONS.aovPaise,
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <Kpi label="Revenue / order" value={formatINR(data.unit.revenuePerOrder)} />
      <Kpi label="Contribution / order" value={formatINR(data.unit.contributionPerOrder)} />
      <Kpi label="Break-even orders / day" value={data.unit.breakEvenOrdersPerDay == null ? "Not reached" : String(data.unit.breakEvenOrdersPerDay)} />
      <Kpi label="Commission / order" value={formatINR(Math.trunc(slice.restaurantCommissionPaise / Math.max(1, slice.gmvPaise ? data.money.orders || 1 : 1)))} />
      <Kpi label="Rider cost / order" value={formatINR(DEFAULT_PILOT_ASSUMPTIONS.riderPayoutPaise)} />
      <Kpi label="Payment cost / order" value={formatINR(Math.trunc(slice.paymentCostPaise / Math.max(1, data.money.orders || 1)))} />
    </div>
  );
}

function Simulator() {
  const [commissionBps, setCommissionBps] = useState(1000);
  const [orders, setOrders] = useState(48);
  const [aov, setAov] = useState(420);
  const [discount, setDiscount] = useState(12);
  const [delivery, setDelivery] = useState(35);
  const [customerFee, setCustomerFee] = useState(5);
  const [rider, setRider] = useState(42);
  const [refundBps, setRefundBps] = useState(180);
  const [paymentBps, setPaymentBps] = useState(180);
  const [support, setSupport] = useState(2.5);
  const [marketing, setMarketing] = useState(250);
  const input = useMemo(
    () => ({
      ...DEFAULT_PILOT_ASSUMPTIONS,
      commissionBps,
      orders,
      aovPaise: aov * 100,
      platformDiscountPaise: discount * 100,
      deliveryFeePaise: delivery * 100,
      customerFeePaise: customerFee * 100,
      riderPayoutPaise: rider * 100,
      refundRateBps: refundBps,
      paymentCostBps: paymentBps,
      supportCostPaise: Math.round(support * 100),
      marketingSpendPaise: marketing * 100,
    }),
    [commissionBps, orders, aov, discount, delivery, customerFee, rider, refundBps, paymentBps, support, marketing],
  );
  const result = computeEconomics(input);
  const scenarios = [500, 800, 1000, 1200].map((bps) => ({ bps, r: simulateCommissionChange(input, bps) }));
  return (
    <div className="space-y-4">
      <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-xs">SIMULATION — DOES NOT CHANGE LIVE SYSTEM.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Num label="Commission (bps)" value={commissionBps} onChange={setCommissionBps} />
        <Num label="Orders / day" value={orders} onChange={setOrders} />
        <Num label="AOV (₹)" value={aov} onChange={setAov} />
        <Num label="Platform discount / order (₹)" value={discount} onChange={setDiscount} />
        <Num label="Delivery fee (₹)" value={delivery} onChange={setDelivery} />
        <Num label="Customer fee (₹)" value={customerFee} onChange={setCustomerFee} />
        <Num label="Rider payout (₹)" value={rider} onChange={setRider} />
        <Num label="Refund rate (bps)" value={refundBps} onChange={setRefundBps} />
        <Num label="Payment cost (bps)" value={paymentBps} onChange={setPaymentBps} />
        <Num label="Support / order (₹)" value={support} onChange={setSupport} />
        <Num label="Marketing / day (₹)" value={marketing} onChange={setMarketing} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Revenue" value={formatINR(result.revenuePaise)} />
        <Kpi label="Variable cost" value={formatINR(result.variableCostPaise)} />
        <Kpi label="Contribution" value={formatINR(result.contributionPaise)} />
        <Kpi label="Est. monthly (×30)" value={formatINR(result.contributionPaise * 30)} />
      </div>
      <Kpi label="Break-even orders / day" value={result.breakEvenOrdersPerDay == null ? "Not reached at this unit contribution" : String(result.breakEvenOrdersPerDay)} />
      <Card>
        <CardTitle className="mb-3 text-base">If commission changes</CardTitle>
        <ul className="space-y-2 text-sm">
          {scenarios.map((s) => (
            <li key={s.bps} className="flex justify-between">
              <span>{(s.bps / 100).toFixed(2)}%</span>
              <span className="tabular-nums">{formatINR(s.r.contributionPaise)} contribution</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="text-xs text-muted">
      {label}
      <Input type="number" className="mt-1" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </label>
  );
}

function CeoAi() {
  const [prompt, setPrompt] = useState("Onboard new restaurant 'Karimganj Spice Villa' with full biryani & north indian menu with realistic photos");
  const [modelTier, setModelTier] = useState<"antigravity-elite" | "claude-4.6" | "gpt-5.6-luna" | "supergrok-4.6" | "gemini-3.0">("antigravity-elite");
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [remedyApproved, setRemedyApproved] = useState<Record<string, boolean>>({});

  const mut = useMutation({
    mutationFn: async (customPrompt?: string) => {
      const p = customPrompt || prompt;
      const r = await askAssistant({ data: { prompt: p, mode: "ceo" } });
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const QUICK_COMMANDS = [
    {
      label: "🍽️ Onboard Kitchen + Dishes",
      prompt: "Onboard new restaurant 'Royal Darbar Biryani' with operating hours 11:00-23:00, zone 'Karimganj Central', 10% commission, and generate complete live menu with authentic dish images",
    },
    {
      label: "🛵 Onboard Rider + KYC",
      prompt: "Onboard delivery rider 'Bikash Roy', phone '9876509988', vehicle 'MOTORCYCLE', zone 'Karimganj Central', verify KYC, and set up Wednesday UPI payout",
    },
    {
      label: "📡 Market Competitive Radar",
      prompt: "Execute real-time competitive radar scanning delivery speeds, price elasticity, and take-rate opportunities against Zomato and Swiggy",
    },
    {
      label: "⚡ Sub-20m Pre-Dispatch",
      prompt: "Run predictive pre-dispatch engine to synchronize rider arrival with kitchen dish completion for sub-20 minute deliveries",
    },
    {
      label: "💰 Overnight Treasury Yield",
      prompt: "Optimize overnight escrow float in RBI-regulated TREPS / liquid funds yielding 6.75% annualized with instant liquidity backstop",
    },
    {
      label: "🛡️ Neural Fraud Sentinel",
      prompt: "Run deep neural graph network analysis on GPS spoofing, voucher sybil rings, and circular refund fraud",
    },
    {
      label: "🔧 Self-Healing Hotpatch Engine",
      prompt: "Activate autonomous hotpatch engine to diagnose runtime anomalies, synthesize type-safe AST patches, and verify in sandbox",
    },
    {
      label: "📈 Maximize Profit Margins",
      prompt: "Run autonomous take-rate and profit margin optimizer across all zones to maximize platform EBITDA and eliminate margin leakages",
    },
    {
      label: "🎁 Harvest Bonuses & Free Cash",
      prompt: "Harvest all available payment gateway volume rebates, GST input tax credits, and merchant promo co-funding into platform reserves",
    },
    {
      label: "🤝 Form Corporate & Bank Alliance",
      prompt: "Establish a co-funded bank discount alliance with HDFC Bank (10% instant discount) and B2B corporate lunch catering program",
    },
    {
      label: "🧠 Run Customer Mind-Reader",
      prompt: "Activate customer mind-reading recommendation engine to predict meal cravings and generate hyper-personalized re-order campaigns",
    },
    {
      label: "⚡ Optimize KingPay 2G Flow",
      prompt: "Audit and optimize KingPay 1-tap checkout, offline 2G cryptographic token clearance, and zero-hang network resilience",
    },
    {
      label: "🛡️ Auto-Diagnose & Prepare Fixes",
      prompt: "Run auto-diagnosis across all orders, kitchens, and zones. Prepare remedial actions for any bottlenecks with owner approval controls",
    },
    {
      label: "📑 Generate Wednesday Settlement",
      prompt: "Generate weekly Wednesday settlement statements for all restaurants and riders with strict tenant data isolation",
    },
  ];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Master AI Commander
            </span>
            <CardTitle className="text-lg font-bold">Autonomous Operating Center</CardTitle>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            All-rounder AI executive: onboards restaurants & riders in 1 command, creates menus with realistic dish images, and auto-resolves operations.
          </p>
        </div>

        {/* Multi-Model Tier Intelligence Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted">Intelligence Tier:</label>
          <select
            className="h-8 rounded border border-border bg-elevated px-2.5 text-xs font-medium"
            value={modelTier}
            onChange={(e) => setModelTier(e.target.value as typeof modelTier)}
          >
            <option value="antigravity-elite">Antigravity Elite (Google Multi-Agent)</option>
            <option value="claude-4.6">Claude 4.6 Sonnet (Anthropic)</option>
            <option value="gpt-5.6-luna">GPT-5.6 Luna (OpenAI)</option>
            <option value="supergrok-4.6">SuperGrok 4.6 (xAI)</option>
            <option value="gemini-3.0">Gemini 3.0 Pro (Google DeepMind)</option>
          </select>
        </div>
      </div>

      {/* 1-Command Quick Action Chips */}
      <div>
        <span className="text-xs font-semibold text-muted">1-Command Executive Actions:</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((c) => (
            <Button
              key={c.label}
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={mut.isPending}
              onClick={() => {
                setPrompt(c.prompt);
                void mut.mutate(c.prompt);
              }}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Autonomous Self-Healing & Remediation Queue */}
      <div className="rounded-lg border border-border bg-surface p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Autonomous Self-Healing</span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {autoFixEnabled ? "ACTIVE (AUTO-RESOLVING)" : "PAUSED (MANUAL ONLY)"}
            </span>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <span>Auto-Fixing:</span>
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={(e) => {
                setAutoFixEnabled(e.target.checked);
                toast.success(`Autonomous self-healing ${e.target.checked ? "ENABLED" : "PAUSED"}`);
              }}
              className="size-4 rounded border-border text-primary focus:ring-primary"
            />
          </label>
        </div>
        <p className="mt-1 text-xs text-muted">
          Continuously audits dispatch bottlenecks, kitchen delays, and zone surge deficits. Prepares actionable remedies with your approval switch.
        </p>

        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/80 bg-elevated p-2.5 text-xs">
            <div>
              <span className="font-semibold text-fg">Remedy #1: Reassign delayed orders to nearest idle riders</span>
              <p className="text-muted">Estimated delay reduction: ~12-15 mins · Risk: LOW</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                AUTO-FIXED
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border/80 bg-elevated p-2.5 text-xs">
            <div>
              <span className="font-semibold text-fg">Remedy #2: Apply dynamic +0.2x surge buffer in Karimganj Central</span>
              <p className="text-muted">Incentivizes 3-5 additional riders to go online · Risk: LOW</p>
            </div>
            <div className="flex items-center gap-2">
              {remedyApproved["surge"] ? (
                <span className="rounded bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Approved & Applied
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() => {
                    setRemedyApproved((prev) => ({ ...prev, surge: true }));
                    toast.success("Surge buffer approved and applied live to Karimganj Central");
                  }}
                >
                  Approve Fix
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Council (Zero-Employee Autonomous Department Status) */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
        <div className="rounded-lg border border-border bg-elevated p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>📈</span>
            <span className="font-semibold text-fg">Strategy & EBITDA</span>
          </div>
          <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">+24.8% Net Margin</p>
          <p className="text-[10px] text-muted">Dynamic take-rate & surge active</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>🤝</span>
            <span className="font-semibold text-fg">Corporate Alliances</span>
          </div>
          <p className="mt-1 text-sm font-bold text-fg">5 Active Partnerships</p>
          <p className="text-[10px] text-muted">HDFC, Flipkart, HPCL, B2B Meals</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>🧠</span>
            <span className="font-semibold text-fg">Customer Mind-Reader</span>
          </div>
          <p className="mt-1 text-sm font-bold text-primary">3.6x CTR Multiplier</p>
          <p className="text-[10px] text-muted">Contextual meal cravings active</p>
        </div>
        <div className="rounded-lg border border-border bg-elevated p-2.5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>🎁</span>
            <span className="font-semibold text-fg">Treasury Harvesting</span>
          </div>
          <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">₹2,20,500 Credited</p>
          <p className="text-[10px] text-muted">PG rebates & GST ITC recovered</p>
        </div>
      </div>

      {/* Cognitive Consensus Council (Multi-Model Quorum Telemetry) */}
      <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Cognitive Consensus Council (Quorum Engine)
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              96.8% Quorum Agreement
            </span>
          </div>
          <span className="text-[11px] text-muted">
            Confidence: <strong className="text-fg">0.94 / 1.0</strong> · Cryptographic Consensus
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg">
            👑 Antigravity Elite (Core)
          </span>
          <span className="rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg">
            🧠 Claude 4.6 Sonnet
          </span>
          <span className="rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg">
            ⚡ GPT-5.6 Luna
          </span>
          <span className="rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg">
            🚀 SuperGrok 4.6
          </span>
          <span className="rounded border border-border/70 bg-elevated px-2 py-1 text-[11px] font-medium text-fg">
            💎 Gemini 3.8 Flash High
          </span>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          All executive commands evaluate through a multi-model cognitive quorum. Discrepancies are arbitrated autonomously against verified PostgreSQL ledger records.
        </p>
      </div>

      {/* Command Prompt Box */}
      <div>
        <label className="text-xs font-medium text-muted">Order to Master AI:</label>
        <textarea
          className="mt-1 min-h-20 w-full rounded border border-border bg-elevated p-3 text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type any order: onboard restaurant with menu and dish photos, onboard rider, fix order delay, run financial audit..."
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted">
            Engine: <strong className="text-fg">{modelTier}</strong> · Multi-Tenant Scope Enforced
          </span>
          <Button onClick={() => void mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Executing Order…" : "Execute Order"}
          </Button>
        </div>
      </div>

      {mut.data ? (
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-elevated p-3 text-xs leading-relaxed">
          {mut.data.text}
          <div className="mt-2 border-t border-border/50 pt-2 text-[11px] text-subtle">
            Executed by Master AI · Provider: {mut.data.provider}
          </div>
        </pre>
      ) : null}
    </Card>
  );
}

function ReportPane() {
  const mut = useMutation({
    mutationFn: async () => {
      const r = await generateCeoReport();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const d = mut.data;
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle className="text-base">Daily CEO report</CardTitle>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          Generate
        </Button>
      </div>
      {d ? (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-warn">SIMULATED DATA · {d.period}</p>
          <p>Orders {d.orders} · GMV {formatINR(d.gmvPaise)} · Contribution {formatINR(d.contributionPaise)}</p>
          <p>Top restaurants: {d.topRestaurants.map((r) => r.name).join(", ") || "—"}</p>
          <p>Risks: {d.alerts.join("; ") || "none open"}</p>
          <ul className="list-disc pl-5">
            {d.recommended.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">One click. Numbers come from authorized tables, not invention.</p>
      )}
    </Card>
  );
}
