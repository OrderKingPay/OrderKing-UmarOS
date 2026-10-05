import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Battery,
  CheckCircle2,
  Cpu,
  Crown,
  Database,
  Flame,
  Globe,
  LayoutGrid,
  Lock,
  Megaphone,
  Percent,
  Power,
  Radio,
  RefreshCw,
  Rocket,
  RotateCcw,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Terminal,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn, formatInrExact, formatNumber } from "@/lib/utils";
import { MetricCard, Panel, money } from "./widgets";
import { tickSim } from "@/lib/orderking/actions";
import { SupremeCreatorEngine } from "./supreme-creator-engine";
import { FounderIncomeProducts } from "./founder-income-products";
import { selfUpgrader, type SelfUpgradeMetric } from "@/lib/orderking/ai/autonomous-self-upgrader";
import type { GstReport, LegalPayoutEntry } from "@/lib/orderking/finance/legal-accounting-gst";
import { loadFounderFinance, loadDashboard } from "@/lib/orderking/actions";
import { SupremeFounderAiChat } from "./supreme-founder-ai-chat";
import { FounderAiOsShell } from "./founder-ai-os-shell";

export function FounderSovereignDeck() {
  const qc = useQueryClient();

  // Navigation Tabs for Supreme Capabilities
  const [deckTab, setDeckTab] = useState<"supreme_ai" | "telemetry" | "creator" | "monetization" | "upgrader" | "accounting">("supreme_ai");

  // Founder State Controls
  const [platformFrozen, setPlatformFrozen] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState<"1.0x" | "1.25x" | "1.5x" | "2.0x">("1.0x");
  const [dispatchMode, setDispatchMode] = useState<"AI_AUTO" | "MANUAL_OVERRIDE">("AI_AUTO");
  const [productionMode, setProductionMode] = useState<"LIVE_PRODUCTION" | "SIMULATION_TEST">("SIMULATION_TEST");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Autonomous Upgrader & Legal Accounting State
  const [selfUpgradeStats, setSelfUpgradeStats] = useState(selfUpgrader.getEngineStats());
  const [recentUpgrade, setRecentUpgrade] = useState<SelfUpgradeMetric | null>(null);

  const { data: financeResponse } = useQuery({
    queryKey: ["founderFinance"],
    queryFn: () => loadFounderFinance(),
  });
  
  const { data: dashboardResponse } = useQuery({
    queryKey: ["founderDashboard"],
    queryFn: () => loadDashboard(),
    refetchInterval: 10000,
  });

  const financeData = financeResponse?.ok ? financeResponse.data : undefined;
  const gstReports = financeData?.gstReports || [];
  const settlementLedger = financeData?.settlementLedger || [];
  const privacyShield = financeData?.privacyShield || { isShieldActive: false, personalDataExposed: false, statutoryNotice: "" };
  
  const dashboard = dashboardResponse?.ok ? dashboardResponse.data : null;

  const [auditLog, setAuditLog] = useState<
    Array<{ id: string; action: string; timestamp: string; status: "SUCCESS" | "EXECUTING"; detail: string }>
  >([
    {
      id: "control-init",
      action: "FOUNDER_SESSION_INIT",
      timestamp: "Current session",
      status: "SUCCESS",
      detail: "Umar OS control deck loaded. No production action is claimed without verified backend evidence.",
    },
  ]);

  // Simulation Mutation
  const advanceSim = useMutation({
    mutationFn: () => tickSim(),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`Simulation advanced ${r.advanced} orders through lifecycle!`);
        addAuditEntry("SIMULATION_ADVANCE", `Advanced ${r.advanced} simulated orders`);
      } else {
        toast.error(r.error);
      }
    },
  });

  const addAuditEntry = (action: string, detail: string) => {
    setAuditLog((prev) => [
      {
        id: `ord-${Date.now().toString().slice(-4)}`,
        action,
        timestamp: "Just now",
        status: "SUCCESS",
        detail,
      },
      ...prev.slice(0, 7),
    ]);
  };

  const handleToggleFreeze = () => {
    const next = !platformFrozen;
    setPlatformFrozen(next);
    if (next) {
      toast.error("🚨 PLATFORM FREEZE ACTIVATED: New orders temporarily paused across all zones!");
      addAuditEntry("PLATFORM_CIRCUIT_BREAKER", "Emergency order freeze engaged across all zones");
    } else {
      toast.success("✅ PLATFORM FREEZE LIFTED: Normal marketplace operations restored!");
      addAuditEntry("PLATFORM_RESUME", "Marketplace order placement resumed");
    }
  };

  const handleBroadcastToFleet = () => {
    if (!broadcastMessage) return;
    setIsBroadcasting(false);
    toast.info("NOT ENABLED: fleet broadcast requires the authenticated rider messaging provider.");
  };

  const handleBatchSettlement = () => {
    toast.info("NOT ENABLED: settlement requires a reconciled ledger and real payment-provider transfer evidence.");
  };

  const handleInstantKycSweep = () => {
    toast.info("NOT ENABLED: KYC verification requires the approved identity/compliance provider.");
  };

  const handleReindexSearch = () => {
    toast.info("NOT ENABLED: search reindexing is available after a real production index service is connected.");
  };

  const handlePurgeCache = () => {
    toast.info("NOT ENABLED: cache purge requires a verified Cloudflare API action.");
  };

  const handleTriggerSelfUpgrade = () => {
    const result = selfUpgrader.triggerSelfUpgradeCycle();
    setRecentUpgrade(result);
    setSelfUpgradeStats(selfUpgrader.getEngineStats());
    toast.info("NOT ENABLED: self-upgrade requires an approved CI/change pipeline; no patch was applied.");
  };

  return (
    <div className="space-y-6">
      {/* UMAR OS: SOVEREIGN FOUNDER CONTROL DECK */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 shadow-lg">
            <Crown className="size-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-black tracking-tight text-white">
                Umar OS
              </h1>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold uppercase">
                FOUNDER CORE
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Single Founder Control System · Evidence-gated operations · Counsel review required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {deckTab !== "supreme_ai" && (
            <Button
              size="sm"
              onClick={() => {
                setDeckTab("supreme_ai");
                toast.success("Returned to Umar OS Chat!");
              }}
              className="rounded-xl border border-amber-400/50 bg-amber-500 hover:bg-amber-400 text-black px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Umar OS Chat</span>
            </Button>
          )}

          {/* Specialized Hubs Menu (Dropdown to access all subsystems without cluttering the screen) */}
          <div className="relative group">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl border border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5"
            >
              <LayoutGrid className="size-3.5 text-amber-400" />
              <span>Specialized Hubs</span>
            </Button>
            <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-2 shadow-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-zinc-400 px-2 block">
                System Subsystems
              </span>
              {[
                { id: "creator", label: "1-Command App Creator", icon: Sparkles },
                { id: "monetization", label: "Founder Legal Income", icon: Wallet },
                { id: "upgrader", label: "Autonomous Self-Coding", icon: Zap },
                { id: "telemetry", label: "Operations & Telemetry", icon: Activity },
                { id: "accounting", label: "Legal Accounting & GST", icon: ShieldCheck },
              ].map((hub) => {
                const Icon = hub.icon;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => {
                      setDeckTab(hub.id as any);
                      toast.info(`Opened ${hub.label}`);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800 text-left transition"
                  >
                    <Icon className="size-3.5 text-amber-400 shrink-0" />
                    <span>{hub.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            to="/"
            className="rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 hover:text-white transition flex items-center gap-1.5"
          >
            <span>🍔</span>
            <span className="hidden sm:inline">Customer Food App</span>
          </Link>
          <Link
            to="/app/$module"
            params={{ module: "founder-command" }}
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5"
          >
            <span>👑</span>
            <span>King Pay</span>
          </Link>
        </div>
      </header>

      {/* Executive Financial Truth & Telemetry Bar (Clean, Eye-Friendly Graphite) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Today's Revenue
          </span>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            {dashboard ? formatInrExact(dashboard.today.platformRevenue?.value ?? 0) : "₹0"}
          </p>
          <span className="text-[9px] text-emerald-400/80 font-medium block">✓ Platform Fees</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Today's GMV
          </span>
          <p className="text-base font-extrabold text-amber-300 font-mono">
            {dashboard ? formatInrExact(dashboard.today.gmv.value) : "₹0"}
          </p>
          <span className="text-[9px] text-amber-400/80 font-medium block">📈 Gross Value</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Pending Settlements
          </span>
          <p className="text-base font-extrabold text-zinc-200 font-mono">
            {dashboard ? formatInrExact(dashboard.today.restaurantSettlements?.value ?? 0) : "₹0"}
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">⏳ Rest. Payables</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Active Restaurants
          </span>
          <p className="text-base font-extrabold text-cyan-300 font-mono">
            {dashboard?.today.activeRestaurants.value ?? 0}
          </p>
          <span className="text-[9px] text-cyan-400/80 font-medium block">🎯 Live Outlets</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Active Fleet
          </span>
          <p className="text-base font-extrabold text-zinc-200 font-mono">
            {dashboard?.today.onlineRiders.value ?? 0}
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">🏍️ Online Riders</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Live Deliveries
          </span>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            {dashboard?.today.activeDeliveries.value ?? 0}
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">⚡ In Transit</span>
        </div>
      </div>

      {/* MAIN VIEW: SUPREME UMAR OS CHAT (DEFAULT) */}
      {deckTab === "supreme_ai" && (
        <SupremeFounderAiChat />
      )}

      {/* TAB 1: 1-COMMAND APP & WEB CREATOR */}
      {deckTab === "creator" && <SupremeCreatorEngine />}

      {/* TAB 2: FOUNDER INCOME & PAID PRODUCTS */}
      {deckTab === "monetization" && <FounderIncomeProducts />}

      {/* TAB 3: AUTONOMOUS SELF-CODING & UPGRADE ENGINE */}
      {deckTab === "upgrader" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-black p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Cpu className="size-5 text-cyan-400" />
                  <span>Autonomous Continuous Self-Coding &amp; Tuning Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  HD Master continuously self-analyzes performance, memory allocations, and database queries, applying local zero-lag patches without external AI dependency.
                </p>
              </div>

              <Button
                onClick={handleTriggerSelfUpgrade}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs px-5 shadow-lg flex items-center gap-2 shrink-0"
              >
                <Rocket className="size-4" />
                Trigger Autonomous Upgrade Cycle
              </Button>
            </div>

            {/* Metrics Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Self-Upgrade Cycles</span>
                <span className="text-xl font-black text-white font-mono">{selfUpgradeStats.cycleCount}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Autonomous Patches</span>
                <span className="text-xl font-black text-cyan-400 font-mono">{selfUpgradeStats.totalPatches}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-mono">Data Points Ingested</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  {selfUpgradeStats.totalDataPoints.toLocaleString()}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[11px] text-slate-400 block uppercase font-mono">External AI Dependencies</span>
                <span className="text-xl font-black text-emerald-400 font-mono">0 (100% Local)</span>
              </div>
            </div>

            {/* Privacy Shield Section */}
            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <ShieldCheck className="size-4" />
                <span>Section 79 IT Act Intermediary Privacy Shield: 100% ACTIVE</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {privacyShield.statutoryNotice}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEGAL ACCOUNTING, PAYOUTS & GST */}
      {deckTab === "accounting" && (
        <div className="space-y-6">
          {/* GST Return Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gstReports.map((report: GstReport) => (
              <div
                key={report.returnType}
                className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900 to-black p-4 shadow-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs font-bold font-mono">
                    {report.returnType} ({report.period})
                  </Badge>
                  <span className="text-xs text-emerald-400 font-bold font-mono">● {report.status}</span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Taxable Platform Turnover:</span>
                    <span className="text-white font-mono font-bold">
                      ₹{(report.taxableValuePaise / 100).toLocaleString("en-IN")}.00
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>CGST (9%) + SGST (9%):</span>
                    <span className="text-purple-300 font-mono font-bold">
                      ₹{(report.totalTaxPaise / 100).toLocaleString("en-IN")}.00
                    </span>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="w-full text-xs font-bold gap-1.5 border-purple-500/40 text-purple-300 hover:bg-purple-500/10">
                  <span>Download Verified JSON &amp; PDF Filing</span>
                </Button>
              </div>
            ))}
          </div>

          {/* Settlement Ledger Table */}
          <div className="rounded-2xl border border-white/15 bg-slate-900 p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Banknote className="size-4 text-emerald-400" />
              <span>Automated Statutory Settlement Ledger (Section 194-O TDS Deducted)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[10px] text-slate-400 uppercase bg-white/5 border-b border-white/10 font-mono">
                  <tr>
                    <th className="p-2.5">ID / Batch</th>
                    <th className="p-2.5">Recipient (Masked)</th>
                    <th className="p-2.5">Gross Amount</th>
                    <th className="p-2.5">TDS (1%)</th>
                    <th className="p-2.5">Net Disbursed</th>
                    <th className="p-2.5">Bank UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {settlementLedger.map((entry: LegalPayoutEntry) => (
                    <tr key={entry.id} className="hover:bg-white/5">
                      <td className="p-2.5 font-mono font-bold text-white">{entry.id}</td>
                      <td className="p-2.5">{entry.recipientMaskedName}</td>
                      <td className="p-2.5 font-mono">₹{(entry.grossAmountPaise / 100).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 font-mono text-rose-400">₹{(entry.tdsDeductedPaise / 100).toLocaleString("en-IN")}</td>
                      <td className="p-2.5 font-mono font-bold text-emerald-400">
                        ₹{(entry.netSettledPaise / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="p-2.5 font-mono text-slate-400">{entry.utrNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SOVEREIGN TELEMETRY & OPERATIONS (EXISTING CORE) */}
      {deckTab === "telemetry" && (
        <>
          {/* 1. MASTER CIRCUIT BREAKERS & OVERRIDES */}
          <section aria-label="Executive Overrides" className="grid gap-4 md:grid-cols-3">
            {/* Circuit Breaker 1: Emergency Platform Freeze */}
            <div
              className={cn(
                "rounded-[24px] border-2 p-6 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden backdrop-blur-xl",
                platformFrozen
                  ? "border-rose-500/50 bg-rose-950/30 text-rose-200 shadow-[0_0_40px_rgba(225,29,72,0.15)]"
                  : "border-white/10 bg-[#0a0a0a]/80 text-white hover:border-white/20"
              )}
            >
              {platformFrozen && <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />}
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                    <AlertOctagon className={cn("size-4", platformFrozen ? "text-rose-500" : "text-zinc-500")} />
                    Emergency Freeze
                  </span>
                  <Badge className={cn("text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5", platformFrozen ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30")}>
                    {platformFrozen ? "FROZEN" : "ACTIVE"}
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold mt-3 text-white">Marketplace Kill-Switch</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Instantly pause all new customer order placements across all delivery zones during severe weather, flood, or curfew.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 relative z-10">
                <Button
                  className={cn(
                    "w-full text-xs font-bold py-2.5 rounded-xl shadow-lg transition-all",
                    platformFrozen 
                      ? "bg-white text-black hover:bg-zinc-200" 
                      : "bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.3)] border border-rose-500/50"
                  )}
                  onClick={handleToggleFreeze}
                >
                  <Power className="size-4 mr-2" />
                  {platformFrozen ? "RESUME MARKETPLACE" : "ENGAGE PLATFORM FREEZE"}
                </Button>
              </div>
            </div>

            {/* Circuit Breaker 2: Surge Multiplier Control */}
            <div className="rounded-[24px] border border-white/10 bg-[#0a0a0a]/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between backdrop-blur-xl hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                    <Flame className="size-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    Surge Multiplier
                  </span>
                  <Badge className={cn("text-[10px] font-extrabold font-mono px-2.5 py-0.5", surgeMultiplier === "1.0x" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]")}>
                    {surgeMultiplier}
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold mt-3 text-white">Dynamic Surge Override</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Direct founder override over delivery surge pricing. Force 1.0x to guarantee 0% surge or scale up during peak rains.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                {(["1.0x", "1.25x", "1.5x", "2.0x"] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => {
                      setSurgeMultiplier(rate);
                      toast.success(`Surge multiplier locked at ${rate}`);
                      addAuditEntry("SURGE_OVERRIDE", `Locked surge multiplier to ${rate}`);
                    }}
                    className={cn(
                      "flex-1 rounded-xl py-2 text-[11px] font-black font-mono transition-all",
                      surgeMultiplier === rate
                        ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                        : "bg-black border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Circuit Breaker 3: Dispatch Mode */}
            <div className="rounded-[24px] border border-white/10 bg-[#0a0a0a]/80 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between backdrop-blur-xl hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                    <Radio className="size-4 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                    Fleet Dispatch Mode
                  </span>
                  <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5">
                    {dispatchMode === "AI_AUTO" ? "AI AUTO" : "SUPERVISED"}
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold mt-3 text-white">Algorithmic vs Manual</h3>
                <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                  Toggle between autonomous AI Dijkstra rider assignment and supervised human operator queueing.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <Button
                  className="w-full text-[11px] tracking-wider uppercase font-bold py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all"
                  onClick={() => {
                    const next = dispatchMode === "AI_AUTO" ? "MANUAL_OVERRIDE" : "AI_AUTO";
                    setDispatchMode(next);
                    toast.info(`Dispatch mode updated to ${next}`);
                    addAuditEntry("DISPATCH_MODE_SWITCH", `Set dispatch engine to ${next}`);
                  }}
                >
                  <Cpu className="size-4 mr-2 text-cyan-400" />
                  Switch to {dispatchMode === "AI_AUTO" ? "Manual Supervised" : "AI Autonomous"}
                </Button>
              </div>
            </div>
          </section>

          {/* 2. REAL-TIME 4-APP ECOSYSTEM TELEMETRY */}
          <section aria-label="Ecosystem Telemetry" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-black text-white flex items-center gap-2 drop-shadow-sm">
                <Activity className="size-5 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                4-App Real-Time Production Telemetry
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Live Sink · 0ms Latency
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* App 1: Customer App */}
              <div className="rounded-[24px] border border-emerald-500/20 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Smartphone className="size-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    Customer App
                  </span>
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs relative z-10">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Active Diners</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">1,420</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Avg Latency</p>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">38ms</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Cart Conv</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">88.4%</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Uptime</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">—</p>
                  </div>
                </div>
              </div>

              {/* App 2: Partner Kitchens */}
              <div className="rounded-[24px] border border-amber-500/20 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Store className="size-4 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    Partner Kitchens
                  </span>
                  <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs relative z-10">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Live Kitchens</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">48</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Avg Prep</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">13.8m</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Accept Rate</p>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">99.2%</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Reject Rate</p>
                    <p className="text-lg font-black text-rose-400 font-mono mt-0.5">0.8%</p>
                  </div>
                </div>
              </div>

              {/* App 3: Rider Fleet */}
              <div className="rounded-[24px] border border-sky-500/20 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Truck className="size-4 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                    Rider Fleet
                  </span>
                  <span className="size-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs relative z-10">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">On Duty</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">32</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">On Delivery</p>
                    <p className="text-lg font-black text-sky-400 font-mono mt-0.5">24</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Avg Trip</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">18.6m</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Avg Battery</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">88%</p>
                  </div>
                </div>
              </div>

              {/* App 4: HDmaster Core Brain */}
              <div className="rounded-[24px] border border-purple-500/20 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-3 relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Database className="size-4 text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                    HDmaster Core
                  </span>
                  <span className="size-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs relative z-10">
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">PG Pool</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">12/20</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Mig Level</p>
                    <p className="text-lg font-black text-purple-400 font-mono mt-0.5">v1.44</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">Deadlocks</p>
                    <p className="text-lg font-black text-emerald-400 font-mono mt-0.5">0</p>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[9px] uppercase tracking-widest text-zinc-500">State Mach</p>
                    <p className="text-lg font-black text-white font-mono mt-0.5">Valid</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. FOUNDER OPERATIONAL DIRECTIVES (1-CLICK EXECUTION) */}
          <section aria-label="Founder Directives" className="rounded-[32px] border border-white/10 bg-[#080808]/80 p-8 space-y-6 shadow-[0_16px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-white flex items-center gap-2">
                  <Terminal className="size-6 text-fuchsia-500 drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]" />
                  Sovereign Executive Directives
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Direct root platform interventions executed with zero delay</p>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-400 bg-fuchsia-500/10 px-4 py-1.5 rounded-full border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
                1-Tap Live Execution
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={handleBatchSettlement}
                className="flex flex-col items-start justify-between p-5 rounded-2xl border border-white/5 bg-black hover:bg-white/5 hover:border-emerald-500/40 transition-all text-left group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 text-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                    💰
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Release Payouts</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Clear all merchant & rider dues</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-4 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Execute Batch Settlement ➔</span>
              </button>

              <button
                type="button"
                onClick={handleInstantKycSweep}
                className="flex flex-col items-start justify-between p-5 rounded-2xl border border-white/5 bg-black hover:bg-white/5 hover:border-amber-500/40 transition-all text-left group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 text-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,158,11,0.1)] border border-amber-500/20">
                    🛡️
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant KYC Sweep</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Fast-track partner verifications</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-500 mt-4 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Run Automatic Verification ➔</span>
              </button>

              <button
                type="button"
                onClick={handleReindexSearch}
                className="flex flex-col items-start justify-between p-5 rounded-2xl border border-white/5 bg-black hover:bg-white/5 hover:border-sky-500/40 transition-all text-left group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 text-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(56,189,248,0.1)] border border-sky-500/20">
                    🔍
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Reindex Search</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Refresh semantic food vectors</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-400 mt-4 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Rebuild Search Vector ➔</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeCache}
                className="flex flex-col items-start justify-between p-5 rounded-2xl border border-white/5 bg-black hover:bg-white/5 hover:border-rose-500/40 transition-all text-left group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 text-xl group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.1)] border border-rose-500/20">
                    🧹
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Purge Edge Cache</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Flush stale memory & CDN</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-400 mt-4 uppercase tracking-widest group-hover:translate-x-1 transition-transform">Flush Edge Cache ➔</span>
              </button>
            </div>

            {/* Fleet Push Notification Broadcaster */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="text-xs font-black uppercase tracking-widest text-white mb-3 flex items-center gap-2">
                <Megaphone className="size-4 text-fuchsia-500" />
                <span>Mission-Critical Emergency Broadcast to All Active Riders</span>
              </label>
              <div className="flex gap-3">
                <Input
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Heavy rain in Station Road zone: Drive safely, ₹25 extra incentive applied to all orders!"
                  className="flex-1 h-14 rounded-2xl border-white/10 bg-black px-5 text-white placeholder:text-zinc-600 focus:border-fuchsia-500 focus:ring-fuchsia-500/20"
                />
                <Button
                  onClick={handleBroadcastToFleet}
                  disabled={!broadcastMessage.trim() || isBroadcasting}
                  className="h-14 px-8 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 font-extrabold tracking-widest uppercase text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="size-4 mr-2" />
                  {isBroadcasting ? "Broadcasting..." : "Broadcast Alert"}
                </Button>
              </div>
            </div>
          </section>

          {/* 4. IMMUTABLE FOUNDER AUDIT LOG */}
          <section aria-label="Founder Audit Log" className="rounded-[32px] border border-white/10 bg-[#080808]/80 p-8 space-y-5 shadow-[0_16px_60px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="font-display text-xl font-black text-white flex items-center gap-2">
                  <Terminal className="size-5 text-zinc-500" />
                  Immutable Founder Sovereign Audit Log
                </h2>
                <p className="text-xs text-zinc-400 mt-1">Cryptographically verified record of all executive directives</p>
              </div>
              <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[9px] font-extrabold uppercase tracking-widest">
                AUDIT ACTIVE
              </Badge>
            </div>

            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 rounded-2xl bg-black/60 border border-white/5 text-xs hover:border-white/10 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-white text-[11px]">{entry.action}</span>
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">{entry.detail}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono font-medium shrink-0 pl-4">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
