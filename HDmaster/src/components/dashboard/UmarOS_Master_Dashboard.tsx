import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Coins,
  Command,
  Gauge,
  Globe2,
  LockKeyhole,
  Megaphone,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  TrendingUp,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

export type MarginDashboardSnapshot = {
  baseMarginBps: number;
  distantMarginBps: number;
  loyaltyShareBps: number;
  verifiedBaseSalesPaise: number;
  verifiedDistantSalesPaise: number;
  periodLabel: string;
  updatedAt: string;
};

export type StrategicBusinessProposal = {
  id: string;
  title: string;
  problem: string;
  solution: string;
  scopeLabel: string;
  source: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "EXECUTING" | "EXECUTED" | "REJECTED";
  confidencePct?: number | null;
  estimatedImpactPaise?: number | null;
  createdAt: string;
  evidence: string[];
};

export type BroadcastNetworkStatus = {
  enabled: boolean;
  providerReady: boolean;
  providerName?: string | null;
  complianceStatus: "COMPLIANT" | "BLOCKED" | "UNKNOWN";
  reachableDevices?: number | null;
  subscribedRecipients?: number | null;
  lastBroadcastAt?: string | null;
  state: "IDLE" | "QUEUED" | "SENDING" | "FAILED";
  deliveryCostPaise?: number | null;
  channels: Array<"WEB_PUSH" | "WHATSAPP" | "EMAIL" | "SMS">;
};

export type BroadcastExecutionReceipt = {
  id: string;
  acceptedAt: string;
  queuedRecipients?: number | null;
  provider: string;
  status: "QUEUED" | "SENDING" | "FAILED";
};

export type UmarOSMasterDashboardEngine = {
  getMarginSnapshot: () => Promise<MarginDashboardSnapshot> | MarginDashboardSnapshot;
  updateMargins: (input: {
    baseMarginBps: number;
    distantMarginBps: number;
  }) => Promise<MarginDashboardSnapshot> | MarginDashboardSnapshot;
  listStrategicProposals: () =>
    | Promise<StrategicBusinessProposal[]>
    | StrategicBusinessProposal[];
  executeStrategicProposal: (
    proposalId: string,
  ) => Promise<StrategicBusinessProposal> | StrategicBusinessProposal;
  getBroadcastStatus: () =>
    | Promise<BroadcastNetworkStatus>
    | BroadcastNetworkStatus;
  executeGlobalBroadcast: () =>
    | Promise<BroadcastExecutionReceipt>
    | BroadcastExecutionReceipt;
};

type Props = {
  engine: UmarOSMasterDashboardEngine;
  className?: string;
};

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const fmtInr = (paise: number | null | undefined) =>
  typeof paise === "number" && Number.isFinite(paise)
    ? INR.format(Math.round(paise / 100))
    : "—";

const fmtCount = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN").format(Math.max(0, Math.round(value)))
    : "Not measured";

const fmtDate = (value: string | null | undefined) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Invalid timestamp"
    : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const pctFromBps = (bps: number) => bps / 100;
const bpsFromPct = (pct: number) => Math.round(pct * 100);

const panel =
  "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.035] backdrop-blur-2xl shadow-[0_24px_90px_-40px_rgba(0,0,0,0.9)]";

const riskClass = (risk: StrategicBusinessProposal["risk"]) => {
  if (risk === "CRITICAL") return "border-red-400/30 bg-red-500/10 text-red-200";
  if (risk === "HIGH") return "border-orange-400/30 bg-orange-500/10 text-orange-200";
  if (risk === "MEDIUM") return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
};

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={panel + " p-5"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
          <p className="mt-1 text-xs leading-5 text-white/40">{detail}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-amber-300">
          <Icon className="size-5" />
        </div>
      </div>
    </motion.div>
  );
}

function MarginCard({
  title,
  value,
  onChange,
  salesPaise,
  generatedPaise,
  tone,
}: {
  title: string;
  value: number | null;
  onChange: (next: number) => void;
  salesPaise: number | undefined;
  generatedPaise: number | undefined;
  tone: "amber" | "cyan";
}) {
  const tint =
    tone === "amber"
      ? "border-amber-300/20 bg-amber-300/5 text-amber-200 accent-amber-300"
      : "border-cyan-300/20 bg-cyan-300/5 text-cyan-200 accent-cyan-300";

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white/55">{title}</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-white">
            {value === null ? "—" : value.toFixed(0) + "%"}
          </p>
        </div>
        <span className={"rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] " + tint}>
          {tone === "amber" ? "Core" : "Distance"}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value ?? 0}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={value === null}
        aria-label={title}
        className={"mt-7 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 disabled:cursor-not-allowed " + (tone === "amber" ? "accent-amber-300" : "accent-cyan-300")}
      />

      <div className="mt-2 flex justify-between text-[10px] text-white/30">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Verified sales basis</p>
          <p className="mt-1 text-sm font-semibold text-white">{fmtInr(salesPaise)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Margin generated</p>
          <p className="mt-1 text-sm font-semibold text-white">{fmtInr(generatedPaise)}</p>
        </div>
      </div>
    </div>
  );
}

export function UmarOSMasterDashboard({ engine, className }: Props) {
  const [margin, setMargin] = useState<MarginDashboardSnapshot | null>(null);
  const [proposals, setProposals] = useState<StrategicBusinessProposal[]>([]);
  const [broadcast, setBroadcast] = useState<BroadcastNetworkStatus | null>(null);
  const [basePct, setBasePct] = useState<number | null>(null);
  const [distantPct, setDistantPct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingMargin, setSavingMargin] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committed = useRef<{ baseMarginBps: number; distantMarginBps: number } | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextMargin, nextProposals, nextBroadcast] = await Promise.all([
        Promise.resolve(engine.getMarginSnapshot()),
        Promise.resolve(engine.listStrategicProposals()),
        Promise.resolve(engine.getBroadcastStatus()),
      ]);

      setMargin(nextMargin);
      setBasePct(pctFromBps(nextMargin.baseMarginBps));
      setDistantPct(pctFromBps(nextMargin.distantMarginBps));
      committed.current = {
        baseMarginBps: nextMargin.baseMarginBps,
        distantMarginBps: nextMargin.distantMarginBps,
      };
      setProposals(nextProposals);
      setBroadcast(nextBroadcast);
      setError(null);
      setBroadcastError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [engine]);

  useEffect(() => {
    void refresh();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh]);

  const loyaltySharePct = margin ? pctFromBps(margin.loyaltyShareBps) : null;

  const loyaltyPreview = useMemo(() => {
    if (!margin || basePct === null || distantPct === null || loyaltySharePct === null) return null;
    const baseMarginPaise = Math.round(margin.verifiedBaseSalesPaise * (basePct / 100));
    const distantMarginPaise = Math.round(margin.verifiedDistantSalesPaise * (distantPct / 100));
    const baseCoins = Math.round(baseMarginPaise * (loyaltySharePct / 100));
    const distantCoins = Math.round(distantMarginPaise * (loyaltySharePct / 100));
    return {
      baseMarginPaise,
      distantMarginPaise,
      baseCoins,
      distantCoins,
      totalCoins: baseCoins + distantCoins,
    };
  }, [basePct, distantPct, loyaltySharePct, margin]);

  const persistMargins = useCallback(
    (nextBasePct: number, nextDistantPct: number) => {
      if (timer.current) clearTimeout(timer.current);

      timer.current = setTimeout(async () => {
        setSavingMargin(true);
        setError(null);

        try {
          const next = await engine.updateMargins({
            baseMarginBps: bpsFromPct(nextBasePct),
            distantMarginBps: bpsFromPct(nextDistantPct),
          });

          setMargin(next);
          setBasePct(pctFromBps(next.baseMarginBps));
          setDistantPct(pctFromBps(next.distantMarginBps));
          committed.current = {
            baseMarginBps: next.baseMarginBps,
            distantMarginBps: next.distantMarginBps,
          };
          setNotice("Margin policy saved to the live financial engine.");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause));
          if (committed.current) {
            setBasePct(pctFromBps(committed.current.baseMarginBps));
            setDistantPct(pctFromBps(committed.current.distantMarginBps));
          }
        } finally {
          setSavingMargin(false);
        }
      }, 350);
    },
    [engine],
  );

  const updateBase = (value: number) => {
    setBasePct(value);
    if (distantPct !== null) persistMargins(value, distantPct);
  };

  const updateDistant = (value: number) => {
    setDistantPct(value);
    if (basePct !== null) persistMargins(basePct, value);
  };

  const executeProposal = async (proposal: StrategicBusinessProposal) => {
    setActionId(proposal.id);
    setNotice(null);

    try {
      const updated = await engine.executeStrategicProposal(proposal.id);
      setProposals((items) => items.map((item) => (item.id === proposal.id ? updated : item)));
      setNotice("Proposal status returned by the live strategy engine: " + updated.status + ".");
    } catch (cause) {
      setNotice("Execution blocked: " + (cause instanceof Error ? cause.message : String(cause)));
    } finally {
      setActionId(null);
    }
  };

  const executeBroadcast = async () => {
    if (!broadcast?.providerReady || broadcast.complianceStatus !== "COMPLIANT") {
      setBroadcastError("Broadcast is locked until provider readiness and compliance are confirmed.");
      return;
    }

    setBroadcasting(true);
    setBroadcastError(null);

    try {
      const receipt = await engine.executeGlobalBroadcast();
      setBroadcast(await engine.getBroadcastStatus());
      setNotice(
        "Broadcast " +
          receipt.status.toLowerCase() +
          " with provider " +
          receipt.provider +
          " (" +
          receipt.id +
          ").",
      );
    } catch (cause) {
      setBroadcastError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className={"min-h-full rounded-[32px] bg-[#07080b] p-6 " + (className ?? "")}>
        <div className="mx-auto max-w-[1600px] animate-pulse space-y-6">
          <div className="h-10 w-2/5 rounded-2xl bg-white/5" />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-40 rounded-[28px] bg-white/5" />
            <div className="h-40 rounded-[28px] bg-white/5" />
            <div className="h-40 rounded-[28px] bg-white/5" />
          </div>
          <div className="h-96 rounded-[28px] bg-white/5" />
        </div>
      </div>
    );
  }

  const canBroadcast =
    Boolean(broadcast?.providerReady) &&
    broadcast?.complianceStatus === "COMPLIANT" &&
    !broadcasting;

  return (
    <div className={"min-h-full overflow-y-auto bg-[#07080b] text-white " + (className ?? "")}>
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-12%] size-[32rem] rounded-full bg-amber-400/8 blur-3xl" />
        <div className="absolute right-[-8%] top-[18%] size-[28rem] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[28%] size-[24rem] rounded-full bg-violet-500/7 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                <Command className="size-3" />
                Umar OS Founder Command
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                <ShieldCheck className="size-3" />
                Live engine data only
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
              Master Dashboard
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
              Financial policy, AI strategy approvals, and provider-backed outbound growth controls in one founder surface.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Margin period</p>
              <p className="mt-1 text-xs text-white/75">{margin?.periodLabel ?? "Live"}</p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={"size-4 " + (refreshing ? "animate-spin" : "")} />
              Refresh
            </button>
          </div>
        </header>

        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 px-4 py-3 text-sm text-emerald-100"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CircleDollarSign}
            label="Base margin"
            value={basePct === null ? "—" : basePct.toFixed(0) + "%"}
            detail="Live founder-controlled restaurant margin."
          />
          <StatCard
            icon={TrendingUp}
            label="Distant margin"
            value={distantPct === null ? "—" : distantPct.toFixed(0) + "%"}
            detail="Live long-distance order margin policy."
          />
          <StatCard
            icon={Coins}
            label="Loyalty routing"
            value={loyaltySharePct === null ? "—" : loyaltySharePct.toFixed(2) + "%"}
            detail="Share of restaurant margin routed to customer loyalty."
          />
          <StatCard
            icon={Users}
            label="Broadcast reach"
            value={fmtCount(broadcast?.reachableDevices)}
            detail="Provider-reported reachable devices only."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className={panel + " p-6"}>
            <div className="flex flex-col gap-5 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-200">
                  <Gauge className="size-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.16em]">Dynamic Margin Controller</p>
                </div>
                <h2 className="mt-2 text-2xl font-semibold">Control the margin policy in real time.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                  Slider changes are debounced, committed to the financial engine, and rolled back to the last accepted values if the backend rejects the policy.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 px-3 py-2 text-xs text-emerald-100">
                <div className="flex items-center gap-2">
                  {savingMargin ? <Activity className="size-3.5 animate-pulse" /> : <Check className="size-3.5" />}
                  {savingMargin ? "Saving…" : "Policy synchronized"}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <MarginCard
                title="Base restaurant margin"
                value={basePct}
                onChange={updateBase}
                salesPaise={margin?.verifiedBaseSalesPaise}
                generatedPaise={loyaltyPreview?.baseMarginPaise}
                tone="amber"
              />
              <MarginCard
                title="Distant-order margin"
                value={distantPct}
                onChange={updateDistant}
                salesPaise={margin?.verifiedDistantSalesPaise}
                generatedPaise={loyaltyPreview?.distantMarginPaise}
                tone="cyan"
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Coins className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Base → Loyalty Coins</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{fmtInr(loyaltyPreview?.baseCoins)}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">Verified base sales × selected margin × live loyalty share.</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Coins className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Distant → Loyalty Coins</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{fmtInr(loyaltyPreview?.distantCoins)}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">Verified distant sales × selected margin × live loyalty share.</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/5 p-4">
                <div className="flex items-center gap-2 text-white/70">
                  <Target className="size-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em]">Total Loyalty Flow</span>
                </div>
                <p className="mt-2 text-xl font-semibold text-white">{fmtInr(loyaltyPreview?.totalCoins)}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/40">Current-period verified-volume calculation at selected settings.</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-300/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-100">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-white/30">
              <span>Last engine update: {fmtDate(margin?.updatedAt)}</span>
              <span className="hidden sm:inline">•</span>
              <span>Loyalty allocation is supplied by the backend engine, not hard-coded by this UI.</span>
            </div>
          </section>

          <section className={panel + " p-6"}>
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-violet-200">
                  <Sparkles className="size-5" />
                  <p className="text-sm font-semibold uppercase tracking-[0.16em]">Elite Strategist AI Inbox</p>
                </div>
                <h2 className="mt-2 text-2xl font-semibold">Strategic Business Proposals</h2>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Only proposals returned by the strategy engine appear here. Approval calls the execution backend directly.
                </p>
              </div>
              <span className="inline-flex h-fit items-center gap-2 rounded-full border border-violet-300/15 bg-violet-300/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-100">
                <Radio className="size-3.5" />
                {proposals.length} live proposals
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {proposals.length === 0 ? (
                <div className="grid min-h-52 place-items-center rounded-3xl border border-dashed border-white/10 bg-black/10 p-8 text-center">
                  <div className="max-w-sm">
                    <ShieldCheck className="mx-auto size-7 text-emerald-300/70" />
                    <p className="mt-3 text-sm font-medium text-white/75">No pending strategic proposals</p>
                    <p className="mt-1 text-xs leading-5 text-white/35">
                      The inbox is empty because the strategy engine did not return an actionable proposal.
                    </p>
                  </div>
                </div>
              ) : (
                proposals.map((proposal, index) => {
                  const busy = actionId === proposal.id || proposal.status === "EXECUTING";
                  const done = proposal.status === "EXECUTED";

                  return (
                    <motion.article
                      key={proposal.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="rounded-3xl border border-white/10 bg-black/20 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={"rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] " + riskClass(proposal.risk)}>
                          {proposal.risk} risk
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                          {proposal.scopeLabel}
                        </span>
                        {typeof proposal.confidencePct === "number" && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                            {proposal.confidencePct.toFixed(0)}% confidence
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                          <p className="mt-1 text-xs text-white/35">
                            Source: {proposal.source} · {fmtDate(proposal.createdAt)}
                          </p>
                        </div>
                        {proposal.estimatedImpactPaise != null && (
                          <div className="shrink-0 text-right">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Estimated impact</p>
                            <p className="mt-1 text-sm font-semibold text-emerald-200">
                              {fmtInr(proposal.estimatedImpactPaise)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Problem detected</p>
                          <p className="mt-2 text-sm leading-6 text-white/65">{proposal.problem}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Proposed action</p>
                          <p className="mt-2 text-sm leading-6 text-white/65">{proposal.solution}</p>
                        </div>
                      </div>

                      {proposal.evidence.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {proposal.evidence.slice(0, 4).map((evidence) => (
                            <span
                              key={evidence}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-2.5 py-1 text-[10px] text-white/40"
                            >
                              <ArrowUpRight className="size-3" />
                              {evidence}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="flex items-center gap-2 text-xs text-white/35">
                          {done ? (
                            <CheckCircle2 className="size-4 text-emerald-300" />
                          ) : proposal.status === "REJECTED" ? (
                            <XCircle className="size-4 text-red-300" />
                          ) : (
                            <Clock3 className="size-4 text-amber-200" />
                          )}
                          Status: {proposal.status}
                        </div>

                        <button
                          type="button"
                          onClick={() => void executeProposal(proposal)}
                          disabled={busy || done || proposal.status === "REJECTED"}
                          className={
                            "group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 " +
                            (done
                              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                              : "border-violet-300/30 bg-violet-300/10 text-white hover:bg-violet-300/15")
                          }
                        >
                          {!done && (
                            <motion.span
                              aria-hidden
                              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent"
                              animate={{ x: ["-120%", "120%"] }}
                              transition={{ repeat: Infinity, duration: 2.6, ease: "linear" }}
                            />
                          )}
                          <span className="relative inline-flex items-center gap-2">
                            {done ? <Check className="size-4" /> : <Zap className="size-4 text-violet-200" />}
                            {busy ? "Executing…" : done ? "Executed" : "Approve & Execute Globally"}
                            {!done && <ChevronRight className="size-4" />}
                          </span>
                        </button>
                      </div>
                    </motion.article>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <section className={panel + " p-6"}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-200">
                <Megaphone className="size-5" />
                <p className="text-sm font-semibold uppercase tracking-[0.16em]">Starlink-Tier Broadcast Switch</p>
              </div>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Global growth execution with verified provider reach.
              </h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">
                This control never invents audience size or consent. It executes only when the connected marketing engine reports a ready provider and compliant recipients.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] " +
                  (broadcast?.providerReady
                    ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100"
                    : "border-red-300/20 bg-red-300/5 text-red-100")
                }
              >
                <span className={"size-1.5 rounded-full " + (broadcast?.providerReady ? "bg-emerald-300" : "bg-red-300")} />
                {broadcast?.providerReady ? "Provider ready" : "Provider unavailable"}
              </span>

              <span
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] " +
                  (broadcast?.complianceStatus === "COMPLIANT"
                    ? "border-emerald-300/20 bg-emerald-300/5 text-emerald-100"
                    : "border-amber-300/20 bg-amber-300/5 text-amber-100")
                }
              >
                <LockKeyhole className="size-3.5" />
                {broadcast?.complianceStatus ?? "UNKNOWN"} delivery basis
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/10 via-white/[0.03] to-violet-300/5 p-6">
              <div className="relative">
                <div className="flex items-center gap-2 text-cyan-100">
                  <Radio className="size-5" />
                  <span className="text-sm font-semibold uppercase tracking-[0.16em]">One-click execution</span>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Reachable devices</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{fmtCount(broadcast?.reachableDevices)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Subscribed recipients</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{fmtCount(broadcast?.subscribedRecipients)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Delivery cost</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      {broadcast?.deliveryCostPaise == null ? "Not measured" : fmtInr(broadcast.deliveryCostPaise)}
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap gap-2">
                  {(broadcast?.channels ?? []).map((channel) => (
                    <span
                      key={channel}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55"
                    >
                      <Globe2 className="size-3.5" />
                      {channel.replace("_", " ")}
                    </span>
                  ))}
                </div>

                <motion.button
                  type="button"
                  onClick={() => void executeBroadcast()}
                  disabled={!canBroadcast}
                  whileHover={canBroadcast ? { scale: 1.01 } : undefined}
                  whileTap={canBroadcast ? { scale: 0.99 } : undefined}
                  className="group relative mt-8 flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl border border-cyan-200/30 bg-cyan-200/10 px-6 py-4 text-base font-semibold text-white shadow-[0_0_60px_-18px_rgba(34,211,238,0.9)] transition hover:bg-cyan-200/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35 disabled:shadow-none"
                >
                  {canBroadcast && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-y-0 left-[-30%] w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md"
                      animate={{ left: ["-30%", "130%"] }}
                      transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
                    />
                  )}
                  <span className="relative inline-flex items-center gap-3">
                    <Megaphone className="size-5" />
                    {broadcasting
                      ? "Submitting to marketing engine…"
                      : canBroadcast
                        ? "EXECUTE GLOBAL BROADCAST"
                        : "BROADCAST LOCKED"}
                    <ChevronRight className="size-4" />
                  </span>
                </motion.button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
              <div className="flex items-center gap-2 text-white/70">
                <ShieldCheck className="size-5 text-emerald-300" />
                <span className="text-sm font-semibold uppercase tracking-[0.16em]">Execution telemetry</span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Provider", broadcast?.providerName ?? "Not connected"],
                  ["Network state", broadcast?.state ?? "UNKNOWN"],
                  ["Channels", String(broadcast?.channels?.length ?? 0) + " configured"],
                  ["Last broadcast", fmtDate(broadcast?.lastBroadcastAt)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3"
                  >
                    <span className="text-xs text-white/40">{label}</span>
                    <span className="text-right text-xs font-medium text-white/80">{value}</span>
                  </div>
                ))}
              </div>

              {broadcastError && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-300/20 bg-red-500/5 px-3 py-2.5 text-xs leading-5 text-red-100">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4">
                <div className="flex items-center gap-2 text-amber-100">
                  <Zap className="size-4" />
                  <span className="text-xs font-semibold">Founder safety gate</span>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/45">
                  The UI does not pretend to have satellite reach, free delivery, or consent that the backend has not verified. Reach, channels, cost, and execution status come from the connected marketing engine.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-white/10 py-4 text-[11px] text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <span>Umar OS Master Dashboard · frontend control plane · backend remains authoritative.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            No mock metrics, synthetic proposals, or invented reach.
          </span>
        </footer>
      </main>
    </div>
  );
}
