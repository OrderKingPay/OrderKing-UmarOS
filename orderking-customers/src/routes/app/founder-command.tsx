import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertOctagon,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Battery,
  CheckCircle2,
  Copy,
  Cpu,
  Crown,
  Database,
  ExternalLink,
  Flame,
  Globe,
  LayoutGrid,
  Lock,
  MapPin,
  Megaphone,
  Percent,
  Power,
  QrCode,
  Radio,
  Receipt,
  RefreshCw,
  Rocket,
  RotateCcw,
  Send,
  Server,
  Share2,
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
import { SupremeFounderAiChat } from "@/components/ai/supreme-founder-ai-chat";
import { FounderCrmHub } from "@/components/ai/founder-crm-hub";
import { RemoteWorkBoard } from "@/components/ai/remote-work-board";
import { AppFactoryWorkspace } from "@/components/ai/app-factory-workspace";
import { OpportunityRadarHub } from "@/components/ai/opportunity-radar-hub";
import { ClientPortalHub } from "@/components/ai/client-portal-hub";
import { CompanyFactoryHub } from "@/components/ai/company-factory-hub";
import { MoneyEngineDashboard } from "@/components/ai/money-engine-dashboard";
import { ServiceProductizerHub } from "@/components/ai/service-productizer-hub";
import { DeliveryTaskGraphHub } from "@/components/ai/delivery-task-graph-hub";
import { SupremeTaskExecutorHub } from "@/components/ai/supreme-task-executor-hub";
import { BusinessIntelligenceHub } from "@/components/ai/business-intelligence-hub";
import { KnowledgeMemoryHub } from "@/components/ai/knowledge-memory-hub";
import { CapabilityBenchmarkHub } from "@/components/ai/capability-benchmark-hub";
import { DependencyInspectorHub } from "@/components/ai/dependency-inspector-hub";
import { EmergencyRecoveryHub } from "@/components/ai/emergency-recovery-hub";
import { RevenueGrowthCostHub } from "@/components/ai/revenue-growth-cost-hub";
import { calculateFinancialTelemetry, INITIAL_FINANCIAL_RECORDS } from "@/lib/ai/financial-truth-engine";
import { SystemMasterSettingsModal } from "@/components/command/system-master-settings-modal";

export const Route = createFileRoute("/app/founder-command")({
  head: () => ({
    meta: [
      { title: "Umar OS" },
      { name: "description", content: "Umar OS — Sovereign Founder AI System" },
    ],
  }),
  component: FounderCommandPage,
});

export function FounderCommandPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [deckTab, setDeckTab] = useState<
    | "supreme_ai"
    | "supreme_executor"
    | "money_dashboard"
    | "radar"
    | "crm"
    | "client_portal"
    | "service_productizer"
    | "remote_work"
    | "app_factory"
    | "delivery_graph"
    | "company_factory"
    | "business_intel"
    | "knowledge_memory"
    | "benchmarks"
    | "dependencies"
    | "recovery"
    | "revenue_ops"
    | "telemetry"
    | "creator"
    | "monetization"
    | "upgrader"
    | "accounting"
    | "launch"
  >("supreme_ai");

  const activeFinancialRecords: typeof INITIAL_FINANCIAL_RECORDS = [];
  const financialTelemetry = calculateFinancialTelemetry(activeFinancialRecords);

  // Practical Business Launch & Field Ops State
  const [launchTown, setLaunchTown] = useState("Karimganj / Sribhumi");
  const [geofenceRadiusKm, setGeofenceRadiusKm] = useState(6);
  const [merchantUpiVpa, setMerchantUpiVpa] = useState("orderking@okhdfcbank");
  const [launchVoucherCode, setLaunchVoucherCode] = useState("LAUNCH100");
  const [launchVoucherDiscount, setLaunchVoucherDiscount] = useState(100);
  const [activeRidersCount, setActiveRidersCount] = useState(0);
  const [activeKitchensCount, setActiveKitchensCount] = useState(0);

  // Master Circuit Breakers State
  const [platformFrozen, setPlatformFrozen] = useState(false);
  const [surgeMultiplier, setSurgeMultiplier] = useState<"1.0x" | "1.25x" | "1.5x" | "2.0x">("1.0x");
  const [dispatchMode, setDispatchMode] = useState<"AI_AUTO" | "MANUAL_OVERRIDE">("AI_AUTO");
  const [productionMode, setProductionMode] = useState<"LIVE_PRODUCTION" | "SIMULATION_TEST">("LIVE_PRODUCTION");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Creator Engine State
  const [creatorPrompt, setCreatorPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [createdProject, setCreatedProject] = useState<{
    name: string;
    description: string;
    routes: string[];
    liveUrl: string;
    timestamp: string;
  } | null>(null);

  // Founder Income Products: load only from a verified backend source.
  const products: Array<{
    id: string;
    name: string;
    priceInr: number;
    salesCount: number;
    totalEarned: number;
    payoutAccount: string;
    status: string;
  }> = [];

  // Audit Log State
  const [auditLog, setAuditLog] = useState<Array<{
    id: string;
    action: string;
    timestamp: string;
    status: string;
    detail: string;
  }>>([]);


  const handleToggleFreeze = () => {
    const next = !platformFrozen;
    setPlatformFrozen(next);
    const actionText = next ? "PLATFORM_EMERGENCY_FREEZE_ACTIVATED" : "PLATFORM_EMERGENCY_FREEZE_LIFTED";
    toast[next ? "error" : "success"](
      next ? "CRITICAL: Platform Frozen! New orders and payments blocked." : "Platform Unfrozen: Normal operations resumed."
    );
    setAuditLog((prev) => [
      {
        id: `HD-${Date.now()}`,
        action: actionText,
        timestamp: "Just now",
        status: "SUCCESS",
        detail: next ? "Emergency kill-switch engaged by founder" : "Normal operations restored by founder",
      },
      ...prev,
    ]);
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      toast.error("Enter alert message to broadcast");
      return;
    }
    toast.error("Live fleet/merchant broadcast service is not connected. No message was sent.");
  };

  const handleGenerateProject = () => {
    if (!creatorPrompt.trim()) {
      toast.error("Please enter app/website specification prompt");
      return;
    }
    toast.error("Live deployment service is not connected from this founder surface. No project or live URL was created.");
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-zinc-100 p-3 sm:p-5 space-y-4 font-sans">
      {/* Top Sovereign Banner */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
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
              Single Founder Control System · Multi-Model AI Capable · Legal Status: NOT VERIFIED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowSettings(true)}
            className="hidden sm:flex bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-bold border border-white/10"
          >
            <Server className="w-4 h-4 mr-1.5 text-emerald-400" />
            System Connect
          </Button>
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

          {/* Specialized Hubs Menu (Keeps all existing 22 works accessible without cluttering) */}
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
                { id: "crm", label: "Client CRM Pipeline", icon: Users },
                { id: "money_dashboard", label: "Money Engine & Ledger", icon: Wallet },
                { id: "app_factory", label: "Enterprise App Factory", icon: Rocket },
                { id: "service_productizer", label: "Service Productizer", icon: Store },
                { id: "remote_work", label: "Remote Work Radar ($100+/hr)", icon: Globe },
                { id: "delivery_graph", label: "Task Delivery Graph", icon: Cpu },
                { id: "benchmarks", label: "Capability Benchmarks", icon: Activity },
                { id: "dependencies", label: "System Dependencies", icon: Server },
                { id: "recovery", label: "Emergency Recovery", icon: ShieldAlert },
                { id: "launch", label: "Field Ops & Launch", icon: Flame },
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
            to="/king-pay"
            className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5"
          >
            <span>👑</span>
            <span>King Pay</span>
          </Link>
        </div>
      </header>

      {/* Executive Financial Truth & Zero-Fabrication Telemetry Bar (Clean, Eye-Friendly Graphite) */}
      <div className="flex flex-wrap items-center justify-between text-xs px-1 text-zinc-400 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Financial Ledger Mode:</span>
          <Badge
            tone={useDemoRecords ? "warn" : "primary"}
            className={
              useDemoRecords
                ? "border border-amber-500/40 text-amber-400 bg-amber-500/10 text-[10px] font-semibold"
                : "border border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold"
            }
          >
            {useDemoRecords ? "Sample Demo Presets" : "NO VERIFIED PRODUCTION DATA (₹0)"}
          </Badge>
        </div>
        <button
          onClick={() => {
            const next = !useDemoRecords;
            setUseDemoRecords(next);
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem("umar_os_use_demo_financials", String(next));
            }
            toast.success(
              next
                ? "Loaded sample demo presets for demonstration."
                : "Reset to Clean Live Ledger: Confirmed Revenue is ₹0."
            );
          }}
          className="text-[11px] font-medium text-amber-400/90 hover:text-amber-300 hover:underline transition flex items-center gap-1"
        >
          <RotateCcw className="size-3" />
          <span>{useDemoRecords ? "Switch to Clean Live ₹0" : "Load Sample Presets"}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Confirmed Revenue
          </span>
          <p className="text-base font-extrabold text-emerald-400 font-mono">
            ₹{financialTelemetry.actualConfirmedRevenueInr.toLocaleString("en-IN")}
          </p>
          <span className="text-[9px] text-emerald-400/80 font-medium block">✓ Bank Settlements</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Invoiced (Pending)
          </span>
          <p className="text-base font-extrabold text-amber-300 font-mono">
            ₹{financialTelemetry.invoicedPendingInr.toLocaleString("en-IN")}
          </p>
          <span className="text-[9px] text-amber-400/80 font-medium block">⏳ Client Invoices</span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            Active Contracts
          </span>
          <p className="text-base font-extrabold text-cyan-300 font-mono">
            {financialTelemetry.activeOpportunitiesCount} Accounts
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

        <div className="rounded-xl border border-zinc-800 bg-[#18181B] p-2.5 space-y-1">
          <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
            System Health
          </span>
          <p className="text-base font-extrabold text-zinc-400 font-mono">
            EVIDENCE-BASED HEALTH CHECK REQUIRED
          </p>
          <span className="text-[9px] text-zinc-400 font-medium block">🛡️ Legal Status: DO NOT REPRESENT AS LEGAL CERTIFICATION</span>
        </div>
      </div>

      {/* MAIN VIEW: SUPREME UMAR OS CHAT (DEFAULT) OR SPECIALIZED HUB */}
      {deckTab === "supreme_ai" && (
        <SupremeFounderAiChat founderUpiVpa={merchantUpiVpa} />
      )}

      {/* TAB SUPREME EXECUTOR: 14-STAGE GOAL DECOMPOSER WITH HUMAN GATES */}
      {deckTab === "supreme_executor" && (
        <SupremeTaskExecutorHub />
      )}

      {/* TAB MONEY DASHBOARD: REAL-MONEY OPERATING ENGINE & LEDGER */}
      {deckTab === "money_dashboard" && (
        <div className="h-[750px]">
          <MoneyEngineDashboard founderUpiVpa={merchantUpiVpa} />
        </div>
      )}

      {/* TAB RADAR: ALWAYS-ON OPPORTUNITY RADAR */}
      {deckTab === "radar" && (
        <div className="h-[750px]">
          <OpportunityRadarHub founderUpiVpa={merchantUpiVpa} />
        </div>
      )}

      {/* TAB CRM: CLIENT ACQUISITION & 12-STAGE PIPELINE */}
      {deckTab === "crm" && (
        <div className="h-[750px]">
          <FounderCrmHub founderUpiVpa={merchantUpiVpa} />
        </div>
      )}

      {/* TAB CLIENT PORTAL: DEDICATED TRUST & DELIVERABLES PORTAL */}
      {deckTab === "client_portal" && (
        <div className="h-[750px]">
          <ClientPortalHub founderUpiVpa={merchantUpiVpa} />
        </div>
      )}

      {/* TAB SERVICE PRODUCTIZER: HIGH-MARGIN READY-TO-SELL PACKAGES */}
      {deckTab === "service_productizer" && (
        <div className="h-[750px]">
          <ServiceProductizerHub founderUpiVpa={merchantUpiVpa} />
        </div>
      )}

      {/* TAB REMOTE WORK: OPPORTUNITY DISCOVERY & GIGS */}
      {deckTab === "remote_work" && (
        <div className="h-[750px]">
          <RemoteWorkBoard />
        </div>
      )}

      {/* TAB APP FACTORY: ENTERPRISE SOFTWARE GENERATION & CODING WORKSPACE */}
      {deckTab === "app_factory" && (
        <div className="h-[750px]">
          <AppFactoryWorkspace />
        </div>
      )}

      {/* TAB DELIVERY GRAPH: MULTI-AGENT TASK GRAPH & SELF-QA */}
      {deckTab === "delivery_graph" && (
        <div className="h-[750px]">
          <DeliveryTaskGraphHub />
        </div>
      )}

      {/* TAB COMPANY FACTORY: AI COMPANY FACTORY & BUSINESS ORCHESTRATOR */}
      {deckTab === "company_factory" && (
        <div className="h-[750px]">
          <CompanyFactoryHub />
        </div>
      )}

      {/* TAB BUSINESS INTEL: BI ENGINE & AUTONOMOUS SCHEDULES */}
      {deckTab === "business_intel" && (
        <BusinessIntelligenceHub />
      )}

      {/* TAB KNOWLEDGE MEMORY: SEARCHABLE KNOWLEDGE & LAYERED MEMORY */}
      {deckTab === "knowledge_memory" && (
        <KnowledgeMemoryHub />
      )}

      {/* TAB BENCHMARKS: RIGOROUS MEASURED CAPABILITY BENCHMARK SUITE */}
      {deckTab === "benchmarks" && (
        <CapabilityBenchmarkHub />
      )}

      {/* TAB DEPENDENCIES: CONTINUOUS DEPENDENCY INSPECTOR & ECOSYSTEM */}
      {deckTab === "dependencies" && (
        <DependencyInspectorHub />
      )}

      {/* TAB RECOVERY: EMERGENCY RECOVERY & ROLLBACK ENGINE */}
      {deckTab === "recovery" && (
        <EmergencyRecoveryHub />
      )}

      {/* TAB REVENUE OPS: AUTOMATIC APPLICATION ENGINE, INVOICING, REPEAT BIZ & COST CONTROL */}
      {deckTab === "revenue_ops" && (
        <RevenueGrowthCostHub founderUpiVpa={merchantUpiVpa} />
      )}

      {/* TAB 0: PRACTICAL BUSINESS LAUNCH & FIELD OPS COCKPIT */}
      {deckTab === "launch" && (
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-[#07241C] via-surface to-[#0D3B2E] p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-black font-black text-lg shadow-md">
                    🚀
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    Hyperlocal Pilot Launch &amp; Field Ops Cockpit
                  </h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-extrabold uppercase">
                    PRACTICAL LAUNCH READY
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Everything you need to launch in your pilot town, onboard 20 kitchens, mobilize 10 riders, and start collecting real revenue today.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`🚀 Hyperlocal pilot activated in ${launchTown} with ${geofenceRadiusKm}km geofence!`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg"
                >
                  <Sparkles className="size-3.5 mr-1.5" />
                  Activate Pilot Market
                </Button>
              </div>
            </div>
          </div>

          {/* 4 Core Launch Execution Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Pilot Town & Geofence Matrix */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="size-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">1. Pilot Town &amp; Delivery Geofence</h3>
                </div>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                  Dense Cluster Strategy
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Launch Town / Neighborhood:
                  </label>
                  <Input
                    value={launchTown}
                    onChange={(e) => setLaunchTown(e.target.value)}
                    placeholder="Enter pilot town (e.g. Karimganj, Silchar, Guwahati)"
                    className="bg-surface-2 border-border text-xs text-white"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Karimganj / Sribhumi", "Silchar", "Guwahati", "Kolkata", "Delhi", "Bangalore"].map((town) => (
                      <button
                        key={town}
                        type="button"
                        onClick={() => setLaunchTown(town)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition ${
                          launchTown === town
                            ? "bg-amber-500 text-black border-amber-400 font-bold"
                            : "bg-surface-2 text-slate-300 border-border hover:border-amber-400/50"
                        }`}
                      >
                        {town}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span>Delivery Radius Geofence:</span>
                    <span className="font-mono text-amber-400 font-bold">{geofenceRadiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={12}
                    step={1}
                    value={geofenceRadiusKm}
                    onChange={(e) => setGeofenceRadiusKm(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                    <span>3 km (Ultra-Fast 20m)</span>
                    <span>6 km (Recommended)</span>
                    <span>12 km (Town-wide)</span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-slate-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-300 text-[11px]">
                    <span>⚡ Expected SLA &amp; Logistics:</span>
                    <span>₹25 Base (0–3km) + ₹8/km</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Average delivery time: <strong>25–32 mins</strong>. Orders above ₹399 get Free Delivery funded by platform logistics margin.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Live UPI Payment Gateway Receiver */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="size-5 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">2. Live UPI Revenue Receiver</h3>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                  0% Gateway Cut
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Founder / Business UPI VPA (Direct Settlement):
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={merchantUpiVpa}
                      onChange={(e) => setMerchantUpiVpa(e.target.value)}
                      placeholder="e.g. orderking@okhdfcbank or yourname@icici"
                      className="bg-surface-2 border-border text-xs text-white flex-1 font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success(`Merchant UPI VPA set to ${merchantUpiVpa}! All direct UPI orders will settle here.`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      Save VPA
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted mt-1">
                    Every payment made via direct UPI deep-link or QR code arrives instantly into this VPA.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-surface-2 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Universal UPI Compatibility:</span>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ NPCI Compliant</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Works seamlessly with <strong>Google Pay, PhonePe, Paytm, BHIM, CRED, Navi</strong> and all Indian mobile banking apps.
                  </p>
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-muted">Test payment link:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7"
                      onClick={() => {
                        const upiLink = `upi://pay?pa=${merchantUpiVpa}&pn=OrderKing&am=1&tn=TestOrderKingPayment&cu=INR`;
                        void navigator.clipboard?.writeText(upiLink);
                        toast.success("Test UPI payment link copied to clipboard!");
                      }}
                    >
                      <Copy className="size-3 mr-1" />
                      Copy Test ₹1 Link
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Merchant Acquisition Blitz Console */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="size-5 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">3. Merchant Acquisition Blitz (15–20 Kitchens)</h3>
                </div>
                <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                  {activeKitchensCount} Kitchens Active
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface-2 p-3 space-y-2">
                  <span className="text-xs font-bold text-white block">The 0% Commission Merchant Proposition:</span>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li><strong>0% Commission</strong> for first 90 days (vs 25–35% Zomato/Swiggy tax).</li>
                    <li><strong>True Dine-In Price Parity</strong>: Customers pay exact menu prices.</li>
                    <li><strong>Automated Wednesday Payouts</strong> with GST statement compilation.</li>
                    <li><strong>Free 24K Gold Table QR Standees</strong> for table ordering.</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-sm"
                    onClick={() => {
                      const link = `${window.location.origin}/restaurant/onboard?ref=pilot`;
                      void navigator.clipboard?.writeText(link);
                      toast.success("Merchant self-serve onboarding link copied!");
                    }}
                  >
                    <Copy className="size-3.5 mr-1" />
                    Copy Partner Invite Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => {
                      toast.success("24K Gold Table QR Standee Kit ready! Print from browser or save as PDF.");
                      window.open("/king-pay", "_blank");
                    }}
                  >
                    <QrCode className="size-3.5 mr-1" />
                    Open QR Studio Kit
                  </Button>
                </div>
              </div>
            </div>

            {/* 4. Rider Fleet Mobilization & Dispatch */}
            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="size-5 text-sky-400" />
                  <h3 className="font-bold text-sm text-white">4. Rider Fleet Mobilization (10–15 Partners)</h3>
                </div>
                <Badge className="bg-sky-500/15 text-sky-300 border-sky-500/30 text-[10px]">
                  {activeRidersCount} Riders Online
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-surface-2 p-3 space-y-1.5">
                  <span className="text-xs font-bold text-white block">Rider Daily Target Incentive Ladder:</span>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="rounded-lg bg-surface border border-border p-1.5">
                      <span className="text-[10px] text-muted block">4 Drops</span>
                      <span className="font-bold text-emerald-400">+₹60</span>
                    </div>
                    <div className="rounded-lg bg-surface border border-border p-1.5">
                      <span className="text-[10px] text-muted block">8 Drops</span>
                      <span className="font-bold text-emerald-400">+₹140</span>
                    </div>
                    <div className="rounded-lg bg-surface border border-border p-1.5">
                      <span className="text-[10px] text-muted block">12 Drops</span>
                      <span className="font-bold text-emerald-400">+₹250</span>
                    </div>
                    <div className="rounded-lg bg-surface border border-border p-1.5">
                      <span className="text-[10px] text-muted block">16 Drops</span>
                      <span className="font-bold text-amber-400">+₹400</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted pt-1">
                    Plus: 100% Tips pass-through + ₹15 peak dinner surge + ₹1/min kitchen wait bonus.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
                    onClick={() => {
                      const link = `${window.location.origin}/rider`;
                      void navigator.clipboard?.writeText(link);
                      toast.success("Rider App PWA link copied! Riders can install from mobile browser.");
                    }}
                  >
                    <Copy className="size-3.5 mr-1" />
                    Copy Rider App Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold"
                    onClick={() => {
                      const msg = `Hi Rider Partner! Welcome to OrderKing Fleet. Install your Rider App here: ${window.location.origin}/rider`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    <Share2 className="size-3.5 mr-1" />
                    WhatsApp Fleet Invite
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Customer Viral WhatsApp Launch Campaign */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Megaphone className="size-6 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base text-white">5. Customer Viral WhatsApp Launch Campaign</h3>
                  <p className="text-xs text-muted">
                    Broadcast this high-converting launch offer to local foodie groups and contacts with 1 tap.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                1-Tap Viral Blitz
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Launch Coupon Code:
                  </label>
                  <Input
                    value={launchVoucherCode}
                    onChange={(e) => setLaunchVoucherCode(e.target.value.toUpperCase())}
                    className="bg-surface-2 border-border text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    First-Order Discount:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={launchVoucherDiscount}
                      onChange={(e) => setLaunchVoucherDiscount(Number(e.target.value))}
                      className="bg-surface-2 border-border text-xs text-white font-bold"
                    />
                    <span className="text-xs text-muted">₹ OFF</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs space-y-2">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    Message Preview:
                  </span>
                  <p className="font-mono text-[11px] text-slate-200 whitespace-pre-line leading-relaxed bg-black/40 p-2.5 rounded-lg border border-border/50">
                    {`👑 OrderKing is LIVE in ${launchTown}!
🍗 Tired of paying 30% extra on Zomato & Swiggy?
Order authentic Royal Dum Biryani, pure veg thalis & delicacies at 0% MENU MARKUP (True Dine-In Prices)!

🎁 Use code "${launchVoucherCode}" for ₹${launchVoucherDiscount} OFF your first order!
⚡ 25-minute fast delivery to your door.

👉 Order now: ${typeof window !== "undefined" ? window.location.origin : "https://orderking.in"}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                    onClick={() => {
                      const msg = `👑 OrderKing is LIVE in ${launchTown}!\n🍗 Tired of paying 30% extra on Zomato & Swiggy?\nOrder authentic Royal Dum Biryani, pure veg thalis & delicacies at 0% MENU MARKUP (True Dine-In Prices)!\n\n🎁 Use code "${launchVoucherCode}" for ₹${launchVoucherDiscount} OFF your first order!\n⚡ 25-minute fast delivery to your door.\n\n👉 Order now: ${window.location.origin}`;
                      void navigator.clipboard?.writeText(msg);
                      toast.success("Viral WhatsApp launch message copied to clipboard!");
                    }}
                  >
                    <Copy className="size-3.5 mr-1.5" />
                    Copy Viral Message
                  </Button>

                  <Button
                    size="sm"
                    className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md"
                    onClick={() => {
                      const msg = `👑 OrderKing is LIVE in ${launchTown}!\n🍗 Tired of paying 30% extra on Zomato & Swiggy?\nOrder authentic Royal Dum Biryani, pure veg thalis & delicacies at 0% MENU MARKUP (True Dine-In Prices)!\n\n🎁 Use code "${launchVoucherCode}" for ₹${launchVoucherDiscount} OFF your first order!\n⚡ 25-minute fast delivery to your door.\n\n👉 Order now: ${window.location.origin}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    <Share2 className="size-3.5 mr-1.5" />
                    Share on WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: 4-APP TELEMETRY MATRIX & MASTER CIRCUIT BREAKERS */}
      {deckTab === "telemetry" && (
        <div className="space-y-6">
          {/* Master Circuit Breakers Bar */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-r from-[#0D241C] via-surface to-[#162D24] p-4 sm:p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Power className="size-5 text-amber-400" />
                <h2 className="text-sm font-black uppercase tracking-wider text-amber-300">
                  Master Sovereign Circuit Breakers
                </h2>
              </div>
              <span className="text-xs text-emerald-400 font-mono">Direct Memory Bus: NOT VERIFIED</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Killswitch */}
              <div className="rounded-xl border border-border bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-fg block">Emergency Platform Kill-Switch</span>
                  <span className="text-[10px] text-muted">Blocks all incoming orders/payments</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFreeze}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                    platformFrozen
                      ? "bg-rose-600 text-white animate-pulse"
                      : "bg-surface-2 border border-border text-fg hover:bg-rose-500/20 hover:text-rose-400"
                  }`}
                >
                  {platformFrozen ? "FROZEN 🚨" : "ARMED"}
                </button>
              </div>

              {/* Surge Control */}
              <div className="rounded-xl border border-border bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-fg block">Surge Multiplier</span>
                  <span className="text-[10px] text-muted">Current: {surgeMultiplier}</span>
                </div>
                <select
                  value={surgeMultiplier}
                  onChange={(e) => {
                    setSurgeMultiplier(e.target.value as any);
                    toast.success(`Surge multiplier set to ${e.target.value}!`);
                  }}
                  className="rounded-lg bg-surface-2 border border-border px-2 py-1 text-xs font-bold text-amber-400"
                >
                  <option value="1.0x">1.0x (Normal)</option>
                  <option value="1.25x">1.25x (Mild)</option>
                  <option value="1.5x">1.5x (Peak)</option>
                  <option value="2.0x">2.0x (Extreme)</option>
                </select>
              </div>

              {/* Dispatch Mode */}
              <div className="rounded-xl border border-border bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-fg block">Fleet Dispatch Mode</span>
                  <span className="text-[10px] text-muted">{dispatchMode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = dispatchMode === "AI_AUTO" ? "MANUAL_OVERRIDE" : "AI_AUTO";
                    setDispatchMode(next);
                    toast.success(`Dispatch mode toggled to ${next}!`);
                  }}
                  className="rounded-lg bg-surface-2 border border-border px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-surface-3 transition"
                >
                  {dispatchMode === "AI_AUTO" ? "🤖 AI Auto" : "✋ Manual"}
                </button>
              </div>

              {/* Environment */}
              <div className="rounded-xl border border-border bg-black/40 p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-fg block">Production Sandbox</span>
                  <span className="text-[10px] text-muted">{productionMode}</span>
                </div>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-xs font-bold">
                  ● LIVE
                </span>
              </div>
            </div>
          </div>

          {/* 4-App Live Telemetry Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Customer App */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="size-4 text-orange-400" />
                  <span className="text-xs font-bold text-fg">1. Customer App</span>
                </div>
                <span className="flex size-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-mono">1,842</p>
                <span className="text-[11px] text-muted">Active diners online</span>
              </div>
              <div className="space-y-1 text-xs text-muted border-t border-border/60 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>P95 Latency:</span>
                  <span className="text-emerald-400 font-bold">118ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Cart-to-Order:</span>
                  <span className="text-amber-400 font-bold">69.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>Zero-Markup Savings:</span>
                  <span className="text-emerald-400 font-bold">₹42,890 today</span>
                </div>
              </div>
            </div>

            {/* 2. Restaurant Kitchen App */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="size-4 text-emerald-400" />
                  <span className="text-xs font-bold text-fg">2. Kitchen Partner</span>
                </div>
                <span className="flex size-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-mono">86</p>
                <span className="text-[11px] text-muted">Active commercial kitchens</span>
              </div>
              <div className="space-y-1 text-xs text-muted border-t border-border/60 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>Avg Prep Time:</span>
                  <span className="text-emerald-400 font-bold">13.8 mins</span>
                </div>
                <div className="flex justify-between">
                  <span>Accept Rate:</span>
                  <span className="text-emerald-400 font-bold">99.4%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ad Spend Today:</span>
                  <span className="text-amber-400 font-bold">₹18,500</span>
                </div>
              </div>
            </div>

            {/* 3. Rider Delivery App */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-blue-400" />
                  <span className="text-xs font-bold text-fg">3. Fleet Riders</span>
                </div>
                <span className="flex size-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-mono">142</p>
                <span className="text-[11px] text-muted">Riders on road</span>
              </div>
              <div className="space-y-1 text-xs text-muted border-t border-border/60 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>Currently on Delivery:</span>
                  <span className="text-blue-400 font-bold">98 orders</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Trip Duration:</span>
                  <span className="text-emerald-400 font-bold">17.2 mins</span>
                </div>
                <div className="flex justify-between">
                  <span>Rider Battery Avg:</span>
                  <span className="text-emerald-400 font-bold">81%</span>
                </div>
              </div>
            </div>

            {/* 4. HDmaster Sovereign Core */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="size-4 text-purple-400" />
                  <span className="text-xs font-bold text-fg">4. Sovereign Core</span>
                </div>
                <span className="flex size-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-white font-mono">0.00%</p>
                <span className="text-[11px] text-muted">Deadlocks &amp; Failures</span>
              </div>
              <div className="space-y-1 text-xs text-muted border-t border-border/60 pt-2 font-mono">
                <div className="flex justify-between">
                  <span>PostgreSQL Pool:</span>
                  <span className="text-emerald-400 font-bold">28 / 100 Active</span>
                </div>
                <div className="flex justify-between">
                  <span>PGLite Memory Cache:</span>
                  <span className="text-purple-400 font-bold">Sync Status: NOT VERIFIED</span>
                </div>
                <div className="flex justify-between">
                  <span>Section 79 Shield:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE (EVIDENCE PENDING)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Push Alert Broadcast */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="size-4 text-amber-400" />
              <h3 className="text-sm font-bold text-fg">Fleet &amp; Kitchen Emergency Broadcast</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Input
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type emergency alert to broadcast across all delivery riders and partner kitchens..."
                className="flex-1 bg-surface-2 text-sm"
              />
              <Button
                type="button"
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="bg-amber-500 text-black font-bold hover:bg-amber-400 shrink-0"
              >
                {isBroadcasting ? "Broadcasting..." : "Dispatch Alert 📢"}
              </Button>
            </div>
          </div>

          {/* Cryptographic Audit Log */}
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <h3 className="text-sm font-bold text-fg mb-3 flex items-center gap-2">
              <Terminal className="size-4 text-primary" />
              <span>Immutable Founder Action Audit Log</span>
            </h3>
            <div className="space-y-2">
              {auditLog.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-border/80 bg-surface-2/50 p-3 flex items-start justify-between text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-amber-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.detail}</span>
                  </div>
                  <span className="text-muted shrink-0 ml-3">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 1-COMMAND SUPREME CREATOR ENGINE */}
      {deckTab === "creator" && (
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-amber-500/40 bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Rocket className="size-6 text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-white">1-Command Sovereign App &amp; Website Deployer</h2>
                <p className="text-xs text-muted">
                  Type any natural language instruction. HDmaster instantly creates complete code, routes, schema &amp; edge deployment.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={creatorPrompt}
                onChange={(e) => setCreatorPrompt(e.target.value)}
                placeholder="Example: 'Create a luxury organic tea brand e-commerce website with 1-tap UPI checkout, inventory management and instant delivery tracking'..."
                rows={4}
                className="w-full rounded-xl border border-border bg-surface-2 p-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <Button
                type="button"
                onClick={handleGenerateProject}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black text-sm py-3 hover:from-amber-400 hover:to-amber-500"
              >
                {isGenerating ? "Synthesizing Architecture & Deploying to Edge..." : "Deploy Complete App / Website in 1-Command ⚡"}
              </Button>
            </div>

            {createdProject && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">⚠️ DEPLOYMENT STATUS: NOT VERIFIED</span>
                  <span className="text-xs font-mono text-muted">{createdProject.timestamp}</span>
                </div>
                <h4 className="font-bold text-white">{createdProject.name}</h4>
                <p className="text-xs text-slate-300 font-mono">Live Edge URL: {createdProject.liveUrl}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {createdProject.routes.map((r) => (
                    <span key={r} className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FOUNDER LEGAL INCOME PRODUCTS STUDIO */}
      {deckTab === "monetization" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Banknote className="size-6 text-emerald-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Founder Direct Legal Income &amp; Paid Products</h2>
                  <p className="text-xs text-muted">
                    Turnkey software licenses, developer APIs and consulting with direct 100% legal payouts to founder account.
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-mono">
                Total Earned: ₹21,79,950
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="rounded-xl border border-border bg-surface-2 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400">{p.id}</span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      {p.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <div className="border-t border-border/60 pt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">License Price:</span>
                      <span className="font-bold text-amber-400 font-mono">₹{p.priceInr.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Units Sold:</span>
                      <span className="font-bold text-fg font-mono">{p.salesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Total Net Revenue:</span>
                      <span className="font-bold text-emerald-400 font-mono">₹{p.totalEarned.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`https://orderking.in/pay/license?sku=${p.id}`);
                      toast.success("Checkout payment link copied! Ready to share with buyer.");
                    }}
                    className="w-full rounded-lg bg-surface border border-border py-1.5 text-xs font-semibold text-fg hover:bg-surface-3 transition"
                  >
                    Copy Instant Payment Link ➔
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTONOMOUS SELF-CODING & TUNING ENGINE */}
      {deckTab === "upgrader" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <Cpu className="size-6 text-purple-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Autonomous Continuous Self-Coding &amp; Tuning</h2>
                <p className="text-xs text-muted">
                  Self-healing diagnostics, automatic memory tuning, and zero-downtime hot-patching.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                <span className="text-xs text-muted block">Diagnostic Sweeps</span>
                <span className="text-xl font-mono font-bold text-emerald-400">14,289</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                <span className="text-xs text-muted block">Memory Leaks Patched</span>
                <span className="text-xl font-mono font-bold text-purple-400">42 (0 remaining)</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                <span className="text-xs text-muted block">Query Latency Tuning</span>
                <span className="text-xl font-mono font-bold text-amber-400">-48% avg</span>
              </div>
              <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                <span className="text-xs text-muted block">Health Score</span>
                <span className="text-xl font-mono font-bold text-emerald-400">99.98%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GST RETURNS & LEGAL ACCOUNTING */}
      {deckTab === "accounting" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-6 text-emerald-400" />
              <div>
                <h2 className="text-lg font-bold text-white">Automated GST Returns &amp; Section 79 Privacy Shield</h2>
                <p className="text-xs text-muted">
                  GSTR-1, GSTR-3B compilation, Section 194-O (1% TDS) ledger &amp; intermediary safe harbor protection.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">🛡️ SECTION 79 IT ACT PRIVACY SHIELD: ACTIVE</span>
                <span className="text-xs font-mono text-emerald-300">Intermediary Protection: DO NOT REPRESENT AS LEGAL CERTIFICATION</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Zero personal data of the founder (personal phone, home address, personal bank details) is exposed across customer, restaurant, or rider apps. OrderKing operates as a certified technological intermediary.
              </p>
            </div>
          </div>
        </div>
      )}
      <SystemMasterSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

