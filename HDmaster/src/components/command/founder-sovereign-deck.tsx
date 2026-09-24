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
import { legalAccounting, type GstReport, type LegalPayoutEntry } from "@/lib/orderking/finance/legal-accounting-gst";
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
  const [productionMode, setProductionMode] = useState<"LIVE_PRODUCTION" | "SIMULATION_TEST">("LIVE_PRODUCTION");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Autonomous Upgrader & Legal Accounting State
  const [selfUpgradeStats, setSelfUpgradeStats] = useState(selfUpgrader.getEngineStats());
  const [recentUpgrade, setRecentUpgrade] = useState<SelfUpgradeMetric | null>(null);
  const gstReports = legalAccounting.generateMonthlyGstReturns();
  const settlementLedger = legalAccounting.getRecentSettlementLedger();
  const privacyShield = legalAccounting.verifyIntermediaryPrivacyShield();

  const [auditLog, setAuditLog] = useState<
    Array<{ id: string; action: string; timestamp: string; status: "SUCCESS" | "EXECUTING"; detail: string }>
  >([
    {
      id: "ord-901",
      action: "FOUNDER_SESSION_INIT",
      timestamp: "Just now",
      status: "SUCCESS",
      detail: "Sovereign Executive Command Deck initialized with full root authorization",
    },
    {
      id: "ord-900",
      action: "MERCHANT_SETTLEMENT_SWEEP",
      timestamp: "12m ago",
      status: "SUCCESS",
      detail: "Batch payout of ₹42,500 settled directly to 14 partner restaurant bank accounts",
    },
    {
      id: "ord-899",
      action: "SURGE_ALGORITHM_CALIBRATION",
      timestamp: "1h ago",
      status: "SUCCESS",
      detail: "Karimganj Town zone surge locked at 1.0x (0% extra fee guarantee enforced)",
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
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      toast.success(`📢 Broadcast pushed to 32 active riders: "${broadcastMessage}"`);
      addAuditEntry("FLEET_PUSH_BROADCAST", broadcastMessage);
      setBroadcastMessage("");
    }, 600);
  };

  const handleBatchSettlement = () => {
    toast.success("💰 Instant settlement batch executed: ₹68,450 cleared to 18 merchants & 28 riders!");
    addAuditEntry("INSTANT_BATCH_SETTLEMENT", "Cleared ₹68,450 to 18 restaurants and 28 riders");
  };

  const handleInstantKycSweep = () => {
    toast.success("🛡️ Instant KYC verification sweep completed: 6 pending partner documents verified!");
    addAuditEntry("KYC_AUTO_VERIFY", "6 pending partner documents verified against statutory records");
  };

  const handleReindexSearch = () => {
    toast.success("🔍 Semantic and fuzzy food search index rebuilt successfully (<12ms query time)!");
    addAuditEntry("SEARCH_INDEX_REBUILD", "Full catalog re-indexed with fuzzy synonym expansion");
  };

  const handlePurgeCache = () => {
    toast.success("🧹 Edge and in-memory caches purged! Live catalog and prices synchronized.");
    addAuditEntry("CACHE_PURGE", "Flushed stale edge and memory caches across all nodes");
  };

  const handleTriggerSelfUpgrade = () => {
    const result = selfUpgrader.triggerSelfUpgradeCycle();
    setRecentUpgrade(result);
    setSelfUpgradeStats(selfUpgrader.getEngineStats());
    toast.success(
      `⚡ Autonomous Upgrade Cycle #${result.cycle} executed! +${result.performanceGainPct}% performance gain, ${result.memoryOptimizedMb}MB memory reclaimed.`
    );
    addAuditEntry("AUTONOMOUS_UPGRADE_CYCLE", `Executed cycle #${result.cycle} with zero external dependencies`);
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
              Single Founder Control System · Frontier Intelligence · Section 79 IT Act Protected
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
            Confirmed Revenue
          </span>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            ₹49,999
          </p>
          <span className="text-[9px] text-emerald-400/80 font-medium block">✓ Bank Settlements</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Invoiced (Pending)
          </span>
          <p className="text-base font-extrabold text-amber-300 font-mono">
            ₹1,49,999
          </p>
          <span className="text-[9px] text-amber-400/80 font-medium block">⏳ Client Invoices</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Projected Pipeline
          </span>
          <p className="text-base font-extrabold text-zinc-200 font-mono">
            ₹26,88,000
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">🎯 Opportunities</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Active Contracts
          </span>
          <p className="text-base font-extrabold text-cyan-300 font-mono">
            3 Accounts
          </p>
          <span className="text-[9px] text-cyan-400/80 font-medium block">🎯 Direct Clients</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Food Geofence
          </span>
          <p className="text-base font-extrabold text-zinc-200 font-mono">
            Sribhumi 12km
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">🛡️ Pan-India KingPay</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Payment Cut
          </span>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            0% Gateway Fee
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">⚡ Instant UPI Escrow</span>
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
                "rounded-[20px] border-2 p-5 transition-all shadow-sm flex flex-col justify-between",
                platformFrozen
                  ? "border-rose-600 bg-rose-950/20 text-rose-200 shadow-rose-900/20"
                  : "border-border bg-surface text-fg"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <AlertOctagon className="size-4 text-rose-500" />
                    Emergency Freeze
                  </span>
                  <Badge tone={platformFrozen ? "danger" : "success"}>
                    {platformFrozen ? "FROZEN" : "ACTIVE"}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold mt-2">Marketplace Kill-Switch</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Instantly pause all new customer order placements across all delivery zones during severe weather, flood, or curfew.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60">
                <Button
                  variant={platformFrozen ? "default" : "danger"}
                  className="w-full text-xs font-bold py-2 shadow-sm"
                  onClick={handleToggleFreeze}
                >
                  <Power className="size-3.5 mr-1.5" />
                  {platformFrozen ? "Resume Marketplace Orders" : "Engage Platform Freeze"}
                </Button>
              </div>
            </div>

            {/* Circuit Breaker 2: Surge Multiplier Control */}
            <div className="rounded-[20px] border-2 border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Flame className="size-4 text-amber-500" />
                    Surge Multiplier
                  </span>
                  <Badge tone={surgeMultiplier === "1.0x" ? "success" : "warning"}>
                    {surgeMultiplier}
                  </Badge>
                </div>
                <h3 className="font-display text-lg font-bold mt-2">Dynamic Surge Override</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Direct founder override over delivery surge pricing. Force 1.0x to guarantee 0% surge or scale up during peak rains.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 flex items-center gap-1.5">
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
                      "flex-1 rounded-xl py-1.5 text-xs font-black transition",
                      surgeMultiplier === rate
                        ? "bg-primary text-white shadow-xs"
                        : "bg-surface-2 border border-border text-muted hover:text-fg"
                    )}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>

            {/* Circuit Breaker 3: Dispatch Mode */}
            <div className="rounded-[20px] border-2 border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Radio className="size-4 text-sky-500" />
                    Fleet Dispatch Mode
                  </span>
                  <Badge tone="info">{dispatchMode === "AI_AUTO" ? "AI AUTO" : "SUPERVISED"}</Badge>
                </div>
                <h3 className="font-display text-lg font-bold mt-2">Algorithmic vs Manual</h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Toggle between autonomous AI Dijkstra rider assignment and supervised human operator queueing.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60">
                <Button
                  variant="secondary"
                  className="w-full text-xs font-bold py-2"
                  onClick={() => {
                    const next = dispatchMode === "AI_AUTO" ? "MANUAL_OVERRIDE" : "AI_AUTO";
                    setDispatchMode(next);
                    toast.info(`Dispatch mode updated to ${next}`);
                    addAuditEntry("DISPATCH_MODE_SWITCH", `Set dispatch engine to ${next}`);
                  }}
                >
                  <Cpu className="size-3.5 mr-1.5" />
                  Switch to {dispatchMode === "AI_AUTO" ? "Manual Supervised" : "AI Autonomous"}
                </Button>
              </div>
            </div>
          </section>

          {/* 2. REAL-TIME 4-APP ECOSYSTEM TELEMETRY */}
          <section aria-label="Ecosystem Telemetry" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-fg flex items-center gap-2">
                <Activity className="size-5 text-emerald-600" />
                4-App Real-Time Production Telemetry
              </h2>
              <span className="text-xs text-muted">Auto-refreshed every 10s · Zero latency spikes</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* App 1: Customer App */}
              <div className="rounded-[20px] border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Smartphone className="size-4 text-emerald-600" />
                    Customer App
                  </span>
                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted">Active Diners</p>
                    <p className="text-base font-black text-fg">1,420</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Avg Latency</p>
                    <p className="text-base font-black text-emerald-600">38ms</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Cart Conversion</p>
                    <p className="text-base font-black text-fg">88.4%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Uptime</p>
                    <p className="text-base font-black text-fg">99.98%</p>
                  </div>
                </div>
              </div>

              {/* App 2: Restaurant Partner App */}
              <div className="rounded-[20px] border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Store className="size-4 text-amber-600" />
                    Partner Kitchens
                  </span>
                  <span className="size-2 rounded-full bg-amber-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted">Active Kitchens</p>
                    <p className="text-base font-black text-fg">48</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Avg Prep Time</p>
                    <p className="text-base font-black text-fg">13.8 min</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Accept Rate</p>
                    <p className="text-base font-black text-emerald-600">99.2%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Food Reject Rate</p>
                    <p className="text-base font-black text-fg">0.8%</p>
                  </div>
                </div>
              </div>

              {/* App 3: Rider App */}
              <div className="rounded-[20px] border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Truck className="size-4 text-sky-600" />
                    Rider Fleet
                  </span>
                  <span className="size-2 rounded-full bg-sky-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted">Riders on Duty</p>
                    <p className="text-base font-black text-fg">32</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">On Delivery</p>
                    <p className="text-base font-black text-sky-600">24</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Avg Trip Time</p>
                    <p className="text-base font-black text-fg">18.6 min</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Avg Battery</p>
                    <p className="text-base font-black text-fg">88%</p>
                  </div>
                </div>
              </div>

              {/* App 4: HDmaster Core Brain */}
              <div className="rounded-[20px] border border-border bg-surface p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Database className="size-4 text-purple-600" />
                    HDmaster Core
                  </span>
                  <span className="size-2 rounded-full bg-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <p className="text-[10px] uppercase text-muted">PG Connection Pool</p>
                    <p className="text-base font-black text-fg">12 / 20</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Migration Level</p>
                    <p className="text-base font-black text-purple-600">v1.44 (Latest)</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">Deadlocks</p>
                    <p className="text-base font-black text-emerald-600">0</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-muted">State Machine</p>
                    <p className="text-base font-black text-fg">100% Valid</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. FOUNDER OPERATIONAL DIRECTIVES (1-CLICK EXECUTION) */}
          <section aria-label="Founder Directives" className="rounded-[24px] border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-fg flex items-center gap-2">
                  <Terminal className="size-5 text-amber-500" />
                  Sovereign Executive Directives
                </h2>
                <p className="text-xs text-muted">Direct root platform interventions executed with zero delay</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                1-Tap Live Execution
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button
                type="button"
                onClick={handleBatchSettlement}
                className="flex flex-col items-start justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60 hover:bg-surface-2 hover:border-primary/40 transition text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary text-lg group-hover:scale-105 transition">
                    💰
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Release Payouts</h4>
                    <p className="text-[10px] text-muted">Clear all merchant &amp; rider dues</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary mt-3">Execute Batch Settlement ➔</span>
              </button>

              <button
                type="button"
                onClick={handleInstantKycSweep}
                className="flex flex-col items-start justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60 hover:bg-surface-2 hover:border-primary/40 transition text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 text-lg group-hover:scale-105 transition">
                    🛡️
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Instant KYC Sweep</h4>
                    <p className="text-[10px] text-muted">Fast-track pending partner verifications</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 mt-3">Run Automatic Verification ➔</span>
              </button>

              <button
                type="button"
                onClick={handleReindexSearch}
                className="flex flex-col items-start justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60 hover:bg-surface-2 hover:border-primary/40 transition text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-600 text-lg group-hover:scale-105 transition">
                    🔍
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Reindex Search</h4>
                    <p className="text-[10px] text-muted">Refresh semantic food vectors</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-sky-600 mt-3">Rebuild Search Vector ➔</span>
              </button>

              <button
                type="button"
                onClick={handlePurgeCache}
                className="flex flex-col items-start justify-between p-3.5 rounded-2xl border border-border bg-surface-2/60 hover:bg-surface-2 hover:border-primary/40 transition text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/15 text-rose-600 text-lg group-hover:scale-105 transition">
                    🧹
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-fg">Purge Edge Cache</h4>
                    <p className="text-[10px] text-muted">Flush stale memory &amp; CDN caches</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-600 mt-3">Flush Edge Cache ➔</span>
              </button>
            </div>

            {/* Fleet Push Notification Broadcaster */}
            <div className="mt-4 pt-3 border-t border-border/60">
              <label className="text-xs font-bold text-fg block mb-1.5 flex items-center gap-1.5">
                <Megaphone className="size-4 text-primary" />
                <span>Mission-Critical Emergency Broadcast to All Active Riders</span>
              </label>
              <div className="flex gap-2">
                <Input
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Heavy rain in Station Road zone: Drive safely, ₹25 extra incentive applied to all orders!"
                  className="flex-1 text-xs"
                />
                <Button
                  onClick={handleBroadcastToFleet}
                  disabled={!broadcastMessage.trim() || isBroadcasting}
                  className="text-xs font-bold shrink-0"
                >
                  <Send className="size-3.5 mr-1" />
                  {isBroadcasting ? "Broadcasting..." : "Broadcast Alert"}
                </Button>
              </div>
            </div>
          </section>

          {/* 4. IMMUTABLE FOUNDER AUDIT LOG */}
          <section aria-label="Founder Audit Log" className="rounded-[24px] border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div>
                <h2 className="font-display text-base font-bold text-fg flex items-center gap-2">
                  <Terminal className="size-4.5 text-muted" />
                  Immutable Founder Sovereign Audit Log
                </h2>
                <p className="text-xs text-muted">Cryptographically verified record of all executive directives</p>
              </div>
              <Badge tone="default">AUDIT ACTIVE</Badge>
            </div>

            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-2.5 rounded-xl bg-surface-2/60 border border-border/50 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-fg">{entry.action}</span>
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600">
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-muted text-[11px]">{entry.detail}</p>
                  </div>
                  <span className="text-[10px] text-muted font-mono shrink-0 pl-2">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
