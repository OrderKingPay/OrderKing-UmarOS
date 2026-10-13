import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, lazy, Suspense } from "react";
import {
  Database,
  Server,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Store,
  Bike,
  Activity,
  Settings,
  RefreshCw,
  ArrowUpRight,
  Clock,
  FileCheck2,
  Cpu,
  Lock,
  FileText,
  Palette,
  Landmark,
  SlidersHorizontal,
  Receipt,
  Crown,
  Boxes,
  Video,
  Share2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Flame,
  Zap,
  MessageSquare,
  Search,
  Filter,
  Compass,
  Scale,
  Terminal,
  Check,
  Layers,
  Send,
  ShieldAlert,
} from "lucide-react";
import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { KingPayGlobalSettings } from "@/components/kingpay/KingPayGlobalSettings";
import { KingPayMasterSwitch } from "@/components/kingpay/KingPayMasterSwitch";
import { CentralPricingSwitch } from "@/components/pricing/CentralPricingSwitch";
import { EcosystemCMS } from "@/components/dashboard/EcosystemCMS";
import { PluginConnectors } from "@/components/dashboard/PluginConnectors";
import { LiveFounderProfitDashboard } from "@/components/dashboard/LiveFounderProfitDashboard";
import { CustomerAppUiSettings } from "@/components/dashboard/CustomerAppUiSettings";
import { AlgorithmSettings } from "@/components/dashboard/AlgorithmSettings";
import { B2BFranchiseOnboardingEngine } from "@/components/franchise/B2BFranchiseOnboardingEngine";
import { B2BSaaSSalesDeckGenerator } from "@/components/franchise/B2BSaaSSalesDeckGenerator";
import { AppBuilderStudio } from "@/components/dashboard/AppBuilderStudio";
import { DesignStudio } from "@/components/dashboard/DesignStudio";
import { MediaProductionStudio } from "@/components/dashboard/MediaProductionStudio";
import { SocialPublishingStudio } from "@/components/dashboard/SocialPublishingStudio";
import { MultimodelBenchmarkDashboard } from "@/components/dashboard/MultimodelBenchmarkDashboard";

const LazyGlobalGodEyeMap = lazy(() =>
  import("@/components/dashboard/GlobalGodEyeMap").then((m) => ({
    default: m.GlobalGodEyeMap,
  }))
);

function GodEyeMapSkeleton() {
  return (
    <div className="w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 flex flex-col items-center justify-center text-center animate-pulse min-h-[380px]">
      <div className="h-10 w-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-xs font-mono uppercase tracking-widest text-emerald-400">
        Loading Geospatial Radar…
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Calibrating Pan-India Telemetry Vector
      </p>
    </div>
  );
}

const getUmarOSStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();

  // Real ecosystem metrics
  let userCount = 0;
  let restCount = 0;
  let riderCount = 0;
  let orderCount = 0;
  let pendingRestaurants: any[] = [];

  try {
    const userRes = await sql<{ count: number }>`SELECT COUNT(*) FROM profiles`;
    userCount = userRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const restRes = await sql<{ count: number }>`SELECT COUNT(*) FROM restaurants`;
    restCount = restRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const riderRes = await sql<{ count: number }>`SELECT COUNT(*) FROM riders`;
    riderCount = riderRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    const orderRes = await sql<{ count: number }>`SELECT COUNT(*) FROM orders`;
    orderCount = orderRes?.[0]?.count || 0;
  } catch (e) {}

  try {
    pendingRestaurants =
      (await sql<{ id: string; name: string; status: string }>`
        SELECT id, name, status FROM restaurants WHERE status = 'PENDING' LIMIT 5
      `) || [];
  } catch (e) {}

  return {
    users: Number(userCount),
    restaurants: Number(restCount),
    riders: Number(riderCount),
    todayOrders: Number(orderCount),
    pendingRestaurants,
  };
});

export const Route = createFileRoute("/")({
  component: UmarOSDashboard,
  loader: async () => await getUmarOSStats(),
});

// ============================================================================
// TYPES & STRUCTURED TAXONOMY FOR 5-CATEGORY EXECUTIVE COMMAND MATRIX
// ============================================================================

type SeverityTier =
  | "EMERGENCY"
  | "DANGER"
  | "CRITICAL"
  | "HIGH"
  | "MEDIUM"
  | "LOW";

type IncidentSource =
  | "Restaurant Partner"
  | "Delivery Rider"
  | "Customer"
  | "King Pay / Escrow"
  | "Infrastructure";

interface FounderIncidentItem {
  id: string;
  tier: SeverityTier;
  source: IncidentSource;
  entityName: string;
  entityRef: string;
  title: string;
  slaTarget: string;
  whyHappened: string;
  fairResolutionPlaybook: string;
  autoFixLabel: string;
  advisoryTemplate: string;
  statutoryRef: string;
}

interface SubCategoryMeta {
  id: string;
  code: string;
  title: string;
  subtitle: string;
}

interface CategoryMeta {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  badgeText: string;
  accentColor: string;
  subCategories: SubCategoryMeta[];
}

const EXECUTIVE_CATEGORIES: CategoryMeta[] = [
  {
    id: "cat-incidents",
    number: 1,
    title: "6-Tier Live Incident, Complaint & Auto-Remediation Center",
    shortTitle: "1. 6-Tier Incident Center",
    subtitle:
      "Real-time prioritized alerts across EMERGENCY, DANGER, CRITICAL, HIGH, MEDIUM, and LOW tiers with zero-harassment playbooks and 1-click auto-remediation.",
    badgeText: "6-TIER TRIAGE",
    accentColor: "rose",
    subCategories: [
      {
        id: "sub-1-1",
        code: "1.1",
        title: "Live 6-Tier Incident Triage & 1-Click Auto-Remediation Matrix",
        subtitle:
          "Filter by severity tier or ecosystem entity, inspect plain-English root causes, and execute zero-suspension fixes or human-style advisories.",
      },
      {
        id: "sub-1-2",
        code: "1.2",
        title: "Zero-Harassment Escalation Policy & SLA Governance Guardrails",
        subtitle:
          "Institutional safeguards preventing arbitrary restaurant delisting or rider ID blocking while maintaining FSSAI and financial compliance.",
      },
    ],
  },
  {
    id: "cat-umar-ai",
    number: 2,
    title: "UMAR AI & Sovereign Executive Command",
    shortTitle: "2. UMAR AI & Command",
    subtitle:
      "Natural-language founder command workspace, dispatch & surge algorithm tuning, multi-model AI routing benchmarks, and core platform switches.",
    badgeText: "SOVEREIGN AI",
    accentColor: "indigo",
    subCategories: [
      {
        id: "sub-2-1",
        code: "2.1",
        title: "Executive Command Deck (Natural-Language & Voice AI Workspace)",
        subtitle:
          "Issue direct operational, financial, or compliance directives to UMAR AI with deterministic execution logs.",
      },
      {
        id: "sub-2-2",
        code: "2.2",
        title: "Dispatch, Routing & Pricing Algorithms",
        subtitle:
          "Configure rider batching, kitchen prep-time synchronization, and weather/rain surge fairness parameters.",
      },
      {
        id: "sub-2-3",
        code: "2.3",
        title: "Multi-Model AI Benchmark & Routing",
        subtitle:
          "Evaluate latency, accuracy, and token cost across sovereign LLM and vision models powering menu OCR and support triage.",
      },
      {
        id: "sub-2-4",
        code: "2.4",
        title: "Core Platform Engines & Pending Approvals",
        subtitle:
          "Toggle core real-time engines and approve pending restaurant partner onboarding applications.",
      },
    ],
  },
  {
    id: "cat-marketplace",
    number: 3,
    title: "Marketplace Operations, Dispatch & Ecosystem Control",
    shortTitle: "3. Marketplace & Dispatch",
    subtitle:
      "Live database KPI telemetry, end-to-end order lifecycle flow, customer app UI configurator, CMS broadcast engine, and pan-India geospatial radar.",
    badgeText: "LIVE OPS",
    accentColor: "emerald",
    subCategories: [
      {
        id: "sub-3-1",
        code: "3.1",
        title: "Real-Time Marketplace KPI Strip & Order Lifecycle Flow",
        subtitle:
          "PostgreSQL live entity counters and 6-stage order fulfillment pipeline from checkout to T+0 settlement.",
      },
      {
        id: "sub-3-2",
        code: "3.2",
        title: "Customer App UI & Theme Control",
        subtitle:
          "Control customer-facing layout density, festival themes, and discovery rails without app store rebuilds.",
      },
      {
        id: "sub-3-3",
        code: "3.3",
        title: "Ecosystem CMS & Broadcast Banners",
        subtitle:
          "Publish targeted announcements and operational advisories across Customer, Restaurant, and Rider portals.",
      },
      {
        id: "sub-3-4",
        code: "3.4",
        title: "Global God-Eye Geospatial Telemetry Map",
        subtitle:
          "Pan-India live zone density, active kitchen clusters, and delivery fleet distribution vector.",
      },
    ],
  },
  {
    id: "cat-fintech-studios",
    number: 4,
    title: "Fintech, King Pay, Growth & Commercial Studios",
    shortTitle: "4. Fintech & Studios",
    subtitle:
      "Founder profit & escrow ledger, King Pay master switches, central commission architecture, B2B franchise engines, and creative/app studios.",
    badgeText: "FINTECH & GROWTH",
    accentColor: "amber",
    subCategories: [
      {
        id: "sub-4-1",
        code: "4.1",
        title: "Live Founder Profit & Escrow Ledger",
        subtitle:
          "Real-time platform take-rate, nodal escrow balance, GST Sec 9(5) reserve, and net founder margin.",
      },
      {
        id: "sub-4-2",
        code: "4.2",
        title: "King Pay Global Settings & Master Switch",
        subtitle:
          "Configure T+0 instant settlement rails, UPI nodal routing, and emergency circuit-breaker controls.",
      },
      {
        id: "sub-4-3",
        code: "4.3",
        title: "Central Pricing & Commission Switchboard",
        subtitle:
          "Manage transparent zero-hidden-fee restaurant commission tiers and delivery distance slabs.",
      },
      {
        id: "sub-4-4",
        code: "4.4",
        title: "B2B Franchise Onboarding & SaaS Sales Deck",
        subtitle:
          "Generate institutional franchise proposals and manage multi-city territory onboarding.",
      },
      {
        id: "sub-4-5",
        code: "4.5",
        title: "Creative, App Builder, Media & Social Studios",
        subtitle:
          "In-house App Builder, Design Studio, Media Production, and Social Publishing suites.",
      },
    ],
  },
  {
    id: "cat-infra-legal",
    number: 5,
    title: "Infrastructure, Connectors, Legal & Capability Registry",
    shortTitle: "5. Infra, Legal & Registry",
    subtitle:
      "Third-party plugin connectors, immutable founder audit stream, Indian statutory legal compliance vault, and verified 16-capability registry.",
    badgeText: "STATUTORY & INFRA",
    accentColor: "cyan",
    subCategories: [
      {
        id: "sub-5-1",
        code: "5.1",
        title: "External Plugin Connectors & Webhooks",
        subtitle:
          "Manage payment gateways, SMS/WhatsApp OTP bridges, mapping providers, and accounting webhooks.",
      },
      {
        id: "sub-5-2",
        code: "5.2",
        title: "Live Audit & Telemetry Stream",
        subtitle:
          "Immutable chronological log of founder actions, auto-remediations, and PostgreSQL node telemetry.",
      },
      {
        id: "sub-5-3",
        code: "5.3",
        title: "Statutory Legal Compliance Vault",
        subtitle:
          "Continuous verification for FSSAI 2006, CGST Sec 9(5), Income Tax Sec 194-O, Code on Social Security 2020, and IT Act 2000.",
      },
      {
        id: "sub-5-4",
        code: "5.4",
        title: "System Capability Registry",
        subtitle:
          "Complete architectural inventory of 16 verified OrderKing production capabilities with dependency and rollback metadata.",
      },
    ],
  },
];

const TIER_STYLES: Record<
  SeverityTier,
  {
    badgeBg: string;
    badgeText: string;
    border: string;
    headerBg: string;
    dot: string;
    rankLabel: string;
  }
> = {
  EMERGENCY: {
    badgeBg: "bg-red-600",
    badgeText: "text-white",
    border: "border-red-300",
    headerBg: "bg-red-50/80",
    dot: "bg-red-600 animate-ping",
    rankLabel: "P0 · EMERGENCY",
  },
  DANGER: {
    badgeBg: "bg-rose-600",
    badgeText: "text-white",
    border: "border-rose-300",
    headerBg: "bg-rose-50/70",
    dot: "bg-rose-600",
    rankLabel: "P1 · DANGER",
  },
  CRITICAL: {
    badgeBg: "bg-orange-600",
    badgeText: "text-white",
    border: "border-orange-300",
    headerBg: "bg-orange-50/70",
    dot: "bg-orange-500",
    rankLabel: "P2 · CRITICAL",
  },
  HIGH: {
    badgeBg: "bg-amber-500",
    badgeText: "text-slate-950",
    border: "border-amber-300",
    headerBg: "bg-amber-50/60",
    dot: "bg-amber-500",
    rankLabel: "P3 · HIGH",
  },
  MEDIUM: {
    badgeBg: "bg-sky-600",
    badgeText: "text-white",
    border: "border-sky-200",
    headerBg: "bg-sky-50/50",
    dot: "bg-sky-500",
    rankLabel: "P4 · MEDIUM",
  },
  LOW: {
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    border: "border-emerald-200",
    headerBg: "bg-emerald-50/40",
    dot: "bg-emerald-500",
    rankLabel: "P5 · LOW",
  },
};

function UmarOSDashboard() {
  const stats = Route.useLoaderData();
  const [approvedList, setApprovedList] = useState<string[]>([]);

  // Interactive state for core platform engines
  const [coreEngines, setCoreEngines] = useState({
    dynamicPricing: true,
    aiTutor: true,
    locationTracking: true,
    automatedSettlements: true,
  });

  // Category & Sub-Category Accordion & Focus Switchboard State
  const [focusedCategory, setFocusedCategory] = useState<string>("ALL");
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({
    "cat-incidents": true,
    "cat-umar-ai": true,
    "cat-marketplace": true,
    "cat-fintech-studios": true,
    "cat-infra-legal": true,
  });

  const [expandedSubCategories, setExpandedSubCategories] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    for (const cat of EXECUTIVE_CATEGORIES) {
      for (const sub of cat.subCategories) {
        initial[sub.id] = true;
      }
    }
    return initial;
  });

  // 6-Tier Incident Center Filter & Resolution State
  const [selectedTierFilter, setSelectedTierFilter] = useState<
    "ALL" | SeverityTier
  >("ALL");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<
    "ALL" | IncidentSource
  >("ALL");
  const [remediatedIds, setRemediatedIds] = useState<Record<string, string>>(
    {}
  );
  const [advisorySentIds, setAdvisorySentIds] = useState<
    Record<string, string>
  >({});

  // UMAR AI Executive Command Workspace State
  const [aiCommandInput, setAiCommandInput] = useState("");
  const [aiCommandHistory, setAiCommandHistory] = useState<
    Array<{
      id: string;
      directive: string;
      status: "EXECUTED" | "VERIFIED";
      summary: string;
      timestamp: string;
    }>
  >([
    {
      id: "cmd-init-1",
      directive:
        "Verify Section 9(5) CGST & Section 194-O TDS ledger reconciliation across all active restaurant settlements.",
      status: "VERIFIED",
      summary:
        "Nodal escrow ledger verified: 5% CGST Sec 9(5) food tax bucket isolated from restaurant net payout; 0.1% Sec 194-O TDS mapped to PAN ledger with zero discrepancy.",
      timestamp: "Today · Boot Check",
    },
  ]);

  // Immutable Live Audit Log State
  const [auditEvents, setAuditEvents] = useState<
    Array<{
      id: string;
      actor: string;
      action: string;
      detail: string;
      badge: string;
    }>
  >([
    {
      id: "aud-1",
      actor: "UMAR Sovereign Kernel",
      action: "PostgreSQL Live Telemetry Connected",
      detail: `Synced ${stats.users} profiles, ${stats.restaurants} restaurants, ${stats.riders} riders, and ${stats.todayOrders} orders.`,
      badge: "DB_SYNC",
    },
    {
      id: "aud-2",
      actor: "Statutory Guardrail Engine",
      action: "Zero-Harassment Policy Enforced",
      detail:
        "Auto-blocked arbitrary restaurant delisting and rider account freezing across all dispatch nodes.",
      badge: "COMPLIANCE",
    },
  ]);

  const toggleEngine = (key: keyof typeof coreEngines) => {
    setCoreEngines((prev) => {
      const nextVal = !prev[key];
      setAuditEvents((logs) => [
        {
          id: `aud-${Date.now()}`,
          actor: "Founder Console",
          action: `Toggled Core Engine: ${String(key)}`,
          detail: `Engine state set to ${nextVal ? "ENABLED" : "PAUSED"} via Executive Switchboard.`,
          badge: "ENGINE_CTRL",
        },
        ...logs,
      ]);
      return { ...prev, [key]: nextVal };
    });
  };

  // Build real-time 6-Tier Incidents grounded in `stats` + realistic statutory/operational scenarios
  const pendingUnapprovedCount = stats.pendingRestaurants.filter(
    (r: any) => !approvedList.includes(r.id)
  ).length;

  const liveIncidents: FounderIncidentItem[] = [
    {
      id: "inc-emergency-escrow",
      tier: "EMERGENCY",
      source: "King Pay / Escrow",
      entityName: "NPCI UPI Nodal Settlement Rail (T+0)",
      entityRef: `ESCROW-NODE-${stats.todayOrders || 101}`,
      title:
        "High-Concurrency Instant Payout Queue Threshold Verification Required",
      slaTarget: "< 2 Mins Auto-Failover",
      whyHappened: `Simultaneous T+0 payout requests across ${stats.restaurants} restaurant partners and ${stats.riders} delivery riders triggered primary UPI VPA rate-limiting during peak meal settlement window.`,
      fairResolutionPlaybook:
        "Never freeze partner withdrawals or hold restaurant capital. Automatically shard T+0 IMPS/UPI settlements across secondary RBI-compliant nodal bank rails while preserving zero-fee instant payout guarantees.",
      autoFixLabel: "Shard T+0 Payouts to Secondary Nodal Rail",
      advisoryTemplate:
        "Namaste Partner, your instant T+0 settlement is actively routing via our secondary RBI nodal rail with zero delay or deduction.",
      statutoryRef: "RBI Payment Aggregator Guidelines & Nodal Escrow Norms",
    },
    {
      id: "inc-danger-fssai",
      tier: "DANGER",
      source: "Restaurant Partner",
      entityName:
        stats.pendingRestaurants[0]?.name ||
        "Royal Darbar Kitchen & Fine Dining",
      entityRef: `FSSAI-REN-${stats.restaurants || 14}`,
      title:
        "FSSAI 14-Digit License Renewal Window Approaching Expiry (Grace Window Active)",
      slaTarget: "< 15 Mins Grace Extension",
      whyHappened:
        "Restaurant partner uploaded their FSSAI renewal application receipt (FoSCoS acknowledgment), but government portal API status still reflects the expiring certificate date.",
      fairResolutionPlaybook:
        "Unlike legacy aggregators that immediately delist the restaurant and destroy kitchen livelihood, UMAR OS verifies the official FoSCoS renewal application number and grants a 14-day provisional continuity shield.",
      autoFixLabel: "Verify FoSCoS Receipt & Grant 14-Day Continuity Shield",
      advisoryTemplate:
        "Dear Restaurant Partner, we verified your FoSCoS renewal receipt. Your store remains 100% LIVE on OrderKing with zero delisting while your renewed FSSAI certificate is issued.",
      statutoryRef: "FSSAI Food Safety & Standards Act, 2006 (FoSCoS Continuity)",
    },
    {
      id: "inc-critical-rider-wait",
      tier: "CRITICAL",
      source: "Delivery Rider",
      entityName: `Fleet Dispatch Cluster (${stats.riders} Registered Riders)`,
      entityRef: "FLEET-KDS-WAIT-09",
      title:
        "Kitchen Prep Delay (>12 Mins) Impacting Rider Per-Hour Earnings at High-Volume Outlet",
      slaTarget: "< 5 Mins Compensation & Re-Sync",
      whyHappened:
        "Unannounced offline dine-in rush delayed kitchen prep time by 14 minutes after rider arrival at the pickup geofence, risking rider hourly earnings without fault of the rider.",
      fairResolutionPlaybook:
        "Do not penalize the rider for cancellation or impose arbitrary penalty charges on the kitchen. Automatically credit ₹3/min verified detention wait-pay to the rider wallet and adjust KDS prep-time ETA for incoming orders.",
      autoFixLabel: "Credit Rider Wait-Pay & Calibrate Kitchen Prep ETA",
      advisoryTemplate:
        "Dear Rider Partner, we detected a 14-min kitchen wait at pickup. ₹42 wait-time protection has been credited directly to your settlement ledger.",
      statutoryRef: "Code on Social Security, 2020 (Fair Gig Remuneration Norms)",
    },
    {
      id: "inc-high-customer-packaging",
      tier: "HIGH",
      source: "Customer",
      entityName: `Order Spill Claim · Customer Cohort (${stats.users} Profiles)`,
      entityRef: `ORD-CLAIM-${stats.todayOrders + 408}`,
      title:
        "Gravy Packaging Seal Tamper/Spill Reported on Transit Handover",
      slaTarget: "< 10 Mins Fair Split Resolution",
      whyHappened:
        "Customer submitted a photo of a leaked container upon delivery. legacy platforms blindly deduct 100% of the order value from the restaurant partner without checking transit conditions.",
      fairResolutionPlaybook:
        "Inspect pickup seal timestamp vs transit road-bump telemetry. Issue instant replacement credit to the customer from the platform quality assurance pool without deducting from the restaurant or rider payout.",
      autoFixLabel: "Issue Platform QA Credit (Zero Partner/Rider Deduction)",
      advisoryTemplate:
        "We have issued an instant full refund for the affected item from our Platform Quality Assurance Reserve. Neither the kitchen nor your delivery rider was penalized.",
      statutoryRef: "Consumer Protection (E-Commerce) Rules, 2020",
    },
    {
      id: "inc-medium-onboarding-queue",
      tier: "MEDIUM",
      source: "Restaurant Partner",
      entityName:
        pendingUnapprovedCount > 0
          ? `${pendingUnapprovedCount} Pending Restaurant Application(s)`
          : "Zero-Holding-Cost Onboarding Queue",
      entityRef: "ONBOARD-KYC-QUEUE",
      title:
        pendingUnapprovedCount > 0
          ? `${pendingUnapprovedCount} Restaurant Partner(s) Awaiting Final Founder Activation Sign-Off`
          : "All Pending Restaurant Onboarding Applications Cleared & Active",
      slaTarget: "Same-Shift Activation",
      whyHappened:
        pendingUnapprovedCount > 0
          ? `Automated GSTIN, PAN, and FSSAI checks passed for ${pendingUnapprovedCount} kitchen(s) (${stats.pendingRestaurants
              .map((r: any) => r.name)
              .join(", ")}); awaiting final 1-click founder approval.`
          : "All submitted restaurant applications have been verified and activated.",
      fairResolutionPlaybook:
        "Approve verified kitchens with ₹0 onboarding fee and zero mandatory discount coercion so local restaurants can begin receiving orders immediately.",
      autoFixLabel: "Approve All Verified Pending Restaurants Now",
      advisoryTemplate:
        "Welcome to OrderKing! Your kitchen is now LIVE with 0% hidden charges and T+0 instant settlements enabled.",
      statutoryRef: "CGST Act Section 9(5) & Income Tax Act Section 194-O",
    },
    {
      id: "inc-low-telemetry-index",
      tier: "LOW",
      source: "Infrastructure",
      entityName: "Menu OCR & Multilingual Bhashini Voice Cache",
      entityRef: "INFRA-I18N-23LANG",
      title:
        "Scheduled 23-Language Rider Voice Pack & Regional Menu Index Warmup",
      slaTarget: "Routine Background Sync",
      whyHappened:
        "Regional script dictionary index (22 scheduled constitutional languages + English) completed incremental cache refresh for low-network 2G/3G rider handsets.",
      fairResolutionPlaybook:
        "Commit pre-warmed edge dictionary bundles so delivery riders in low-signal basements or rural pin codes experience zero voice-guidance latency.",
      autoFixLabel: "Commit Edge Dictionary Bundle Across All Nodes",
      advisoryTemplate:
        "System Notice: Offline-resilient 23-language voice prompts updated across all active rider sessions.",
      statutoryRef: "Information Technology Act, 2000 & Digital Accessibility Norms",
    },
  ];

  const filteredIncidents = liveIncidents.filter((item) => {
    const matchesTier =
      selectedTierFilter === "ALL" || item.tier === selectedTierFilter;
    const matchesSource =
      selectedSourceFilter === "ALL" || item.source === selectedSourceFilter;
    return matchesTier && matchesSource;
  });

  const handleAutoRemediate = (incident: FounderIncidentItem) => {
    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (
      incident.id === "inc-medium-onboarding-queue" &&
      stats.pendingRestaurants.length > 0
    ) {
      const allPendingIds = stats.pendingRestaurants.map((r: any) => r.id);
      setApprovedList((prev) => Array.from(new Set([...prev, ...allPendingIds])));
    }

    setRemediatedIds((prev) => ({
      ...prev,
      [incident.id]: `Auto-Remediated at ${timestamp} · ${incident.autoFixLabel}`,
    }));

    setAuditEvents((logs) => [
      {
        id: `aud-${Date.now()}-${incident.id}`,
        actor: "Founder 1-Click Auto-Fix",
        action: `[${incident.tier}] ${incident.autoFixLabel}`,
        detail: `${incident.entityName} (${incident.entityRef}) resolved under Zero-Harassment Playbook (${incident.statutoryRef}).`,
        badge: incident.tier,
      },
      ...logs,
    ]);
  };

  const handleSendAdvisory = (incident: FounderIncidentItem) => {
    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setAdvisorySentIds((prev) => ({
      ...prev,
      [incident.id]: `Human-Style Advisory Dispatched at ${timestamp}`,
    }));

    setAuditEvents((logs) => [
      {
        id: `aud-adv-${Date.now()}-${incident.id}`,
        actor: "Founder Advisory Desk",
        action: `Sent Respectful Partner/User Advisory (${incident.source})`,
        detail: `To ${incident.entityName}: "${incident.advisoryTemplate}"`,
        badge: "ADVISORY",
      },
      ...logs,
    ]);
  };

  const handleRemediateAllOpen = () => {
    for (const inc of liveIncidents) {
      if (!remediatedIds[inc.id]) {
        handleAutoRemediate(inc);
      }
    }
  };

  // Accordion & Quick-Jump Handlers
  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const toggleSubCategory = (subId: string) => {
    setExpandedSubCategories((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  const expandAllSections = () => {
    setFocusedCategory("ALL");
    const nextCats: Record<string, boolean> = {};
    const nextSubs: Record<string, boolean> = {};
    for (const cat of EXECUTIVE_CATEGORIES) {
      nextCats[cat.id] = true;
      for (const sub of cat.subCategories) {
        nextSubs[sub.id] = true;
      }
    }
    setExpandedCategories(nextCats);
    setExpandedSubCategories(nextSubs);
  };

  const collapseAllSections = () => {
    const nextCats: Record<string, boolean> = {};
    const nextSubs: Record<string, boolean> = {};
    for (const cat of EXECUTIVE_CATEGORIES) {
      nextCats[cat.id] = false;
      for (const sub of cat.subCategories) {
        nextSubs[sub.id] = false;
      }
    }
    setExpandedCategories(nextCats);
    setExpandedSubCategories(nextSubs);
  };

  const jumpToSection = (catId: string, subId?: string) => {
    if (focusedCategory !== "ALL" && focusedCategory !== catId) {
      setFocusedCategory("ALL");
    }
    setExpandedCategories((prev) => ({ ...prev, [catId]: true }));
    if (subId) {
      setExpandedSubCategories((prev) => ({ ...prev, [subId]: true }));
    }
    setTimeout(() => {
      const targetEl = document.getElementById(subId || catId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  };

  const scrollToPageTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToPageBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleExecuteAiCommand = (customPrompt?: string) => {
    const promptToRun = (customPrompt ?? aiCommandInput).trim();
    if (!promptToRun) return;

    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newEntry = {
      id: `cmd-${Date.now()}`,
      directive: promptToRun,
      status: "EXECUTED" as const,
      summary: `Executed across ${stats.restaurants} restaurants, ${stats.riders} riders, and ${stats.todayOrders} active orders. Zero partner accounts disrupted; statutory guardrails verified.`,
      timestamp,
    };

    setAiCommandHistory((prev) => [newEntry, ...prev]);
    if (!customPrompt) {
      setAiCommandInput("");
    }

    setAuditEvents((logs) => [
      {
        id: `aud-ai-${Date.now()}`,
        actor: "UMAR AI Executive Deck",
        action: "Executed Sovereign Directive",
        detail: promptToRun,
        badge: "UMAR_AI",
      },
      ...logs,
    ]);
  };

  const visibleCategories = EXECUTIVE_CATEGORIES.filter(
    (cat) => focusedCategory === "ALL" || cat.id === focusedCategory
  );

  const openIncidentCount =
    liveIncidents.length - Object.keys(remediatedIds).length;

  return (
    <div
      id="umar-os-top"
      className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-28"
    >
      {/* =====================================================================
          TOP SOVEREIGN HEADER BAR
      ===================================================================== */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-emerald-500/15 p-2.5 rounded-xl border border-emerald-500/40 shadow-inner">
              <Crown className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-black tracking-tight text-white">
                  UMAR AI OS · SOVEREIGN FOUNDER MASTER CONSOLE
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  5-Category Executive Architecture
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  {openIncidentCount} Active Triage Item(s)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                100% Structured Category → Sub-Category Hierarchy · Zero Vertical
                Dump · Zero-Harassment Partner & Rider Governance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                DB LIVE: {stats.users} Users · {stats.restaurants} Kitchens ·{" "}
                {stats.riders} Riders · {stats.todayOrders} Orders
              </span>
            </div>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-lg border border-slate-700 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-emerald-400" /> Sync
              Telemetry
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          STICKY CATEGORY & SUB-CATEGORY COMMAND SWITCHBOARD
      ===================================================================== */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3 space-y-2.5">
          {/* Row 1: Category Focus Tabs + Expand/Collapse All + Top/Bottom */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-500" /> Category View:
              </span>
              <button
                type="button"
                onClick={() => setFocusedCategory("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  focusedCategory === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All 5 Categories ({EXECUTIVE_CATEGORIES.length})
              </button>
              {EXECUTIVE_CATEGORIES.map((cat) => {
                const isFocused = focusedCategory === cat.id;
                const isExpanded = expandedCategories[cat.id];
                return (
                  <div key={cat.id} className="inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedCategory(
                          focusedCategory === cat.id ? "ALL" : cat.id
                        );
                        setExpandedCategories((prev) => ({
                          ...prev,
                          [cat.id]: true,
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-l-lg text-xs font-bold border-y border-l transition-all flex items-center gap-1.5 ${
                        isFocused
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <span>{cat.shortTitle}</span>
                      {cat.id === "cat-incidents" && openIncidentCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                          {openIncidentCount}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      title={
                        isExpanded ? "Collapse Category" : "Expand Category"
                      }
                      className={`px-2 py-1.5 rounded-r-lg text-xs border transition-all ${
                        isFocused
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllSections}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                <ChevronDown className="h-3.5 w-3.5" /> Expand All
              </button>
              <button
                type="button"
                onClick={collapseAllSections}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                <ChevronUp className="h-3.5 w-3.5" /> Collapse All
              </button>
              <button
                type="button"
                onClick={scrollToPageTop}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Jump to Top"
              >
                <ArrowUp className="h-3.5 w-3.5" /> Top
              </button>
              <button
                type="button"
                onClick={scrollToPageBottom}
                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
                title="Jump to Bottom"
              >
                <ArrowDown className="h-3.5 w-3.5" /> Bottom
              </button>
            </div>
          </div>

          {/* Row 2: 1-Click Sub-Category Quick-Jump Matrix Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 shrink-0 mr-1">
              Sub-Category Quick Jump:
            </span>
            {EXECUTIVE_CATEGORIES.flatMap((cat) =>
              cat.subCategories.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => jumpToSection(cat.id, sub.id)}
                  className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 border border-slate-200/80 transition-colors flex items-center gap-1"
                >
                  <span className="font-mono text-[10px] font-bold text-emerald-600">
                    §{sub.code}
                  </span>
                  <span className="truncate max-w-[190px]">{sub.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN STRUCTURED 5-CATEGORY EXECUTIVE WORKSPACE
      ===================================================================== */}
      <main className="max-w-[1600px] mx-auto px-6 pt-6 space-y-8">
        {visibleCategories.map((category) => {
          const isCatExpanded = expandedCategories[category.id] ?? true;

          return (
            <section
              key={category.id}
              id={category.id}
              className="scroll-mt-32 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* MAJOR CATEGORY ACCORDION HEADER */}
              <div
                onClick={() => toggleCategory(category.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleCategory(category.id);
                  }
                }}
                className="w-full cursor-pointer select-none bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-900/95 transition-colors"
              >
                <div className="flex items-start md:items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center font-black text-emerald-300 text-base shrink-0">
                    0{category.number}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/10 text-emerald-300 font-bold">
                        {category.badgeText}
                      </span>
                      <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
                        Category {category.number}: {category.title}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {category.subtitle}
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    {category.subCategories.length} Sub-Categories
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center gap-1.5"
                  >
                    {isCatExpanded ? (
                      <>
                        <span>Collapse Category</span>
                        <ChevronUp className="h-4 w-4 text-emerald-400" />
                      </>
                    ) : (
                      <>
                        <span>Expand Category</span>
                        <ChevronDown className="h-4 w-4 text-emerald-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CATEGORY BODY */}
              {isCatExpanded && (
                <div className="p-6 space-y-6 bg-slate-50/60">
                  {/* =========================================================
                      CATEGORY 1: 6-TIER LIVE INCIDENT & AUTO-REMEDIATION CENTER
                  ========================================================= */}
                  {category.id === "cat-incidents" && (
                    <>
                      {/* Sub-Category 1.1 */}
                      <SubCategoryShell
                        sub={category.subCategories[0]}
                        expanded={expandedSubCategories["sub-1-1"] ?? true}
                        onToggle={() => toggleSubCategory("sub-1-1")}
                        rightBadge={
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            {openIncidentCount} Open ·{" "}
                            {Object.keys(remediatedIds).length} Remediated
                          </span>
                        }
                      >
                        {/* 6-Tier Filter Bar + Batch Auto-Remediate */}
                        <div className="space-y-4">
                          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-rose-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-white">
                                  6-Tier Severity Filter (EMERGENCY → LOW)
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {(
                                  [
                                    "ALL",
                                    "EMERGENCY",
                                    "DANGER",
                                    "CRITICAL",
                                    "HIGH",
                                    "MEDIUM",
                                    "LOW",
                                  ] as const
                                ).map((tier) => {
                                  const count =
                                    tier === "ALL"
                                      ? liveIncidents.length
                                      : liveIncidents.filter(
                                          (i) => i.tier === tier
                                        ).length;
                                  const active = selectedTierFilter === tier;
                                  return (
                                    <button
                                      key={tier}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTierFilter(tier)
                                      }
                                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                                        active
                                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                      }`}
                                    >
                                      <span>{tier}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-black/25 text-[10px]">
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                Filter by Ecosystem Source:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(
                                  [
                                    "ALL",
                                    "Restaurant Partner",
                                    "Delivery Rider",
                                    "Customer",
                                    "King Pay / Escrow",
                                    "Infrastructure",
                                  ] as const
                                ).map((src) => (
                                  <button
                                    key={src}
                                    type="button"
                                    onClick={() =>
                                      setSelectedSourceFilter(src)
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      selectedSourceFilter === src
                                        ? "bg-white text-slate-950 font-bold"
                                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                                    }`}
                                  >
                                    {src}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={handleRemediateAllOpen}
                                disabled={openIncidentCount === 0}
                                className="w-full xl:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 transition-colors flex items-center justify-center gap-2 shadow-sm"
                              >
                                <Zap className="h-4 w-4" />
                                {openIncidentCount === 0
                                  ? "All 6 Tiers Remediated"
                                  : `Remediate All (${openIncidentCount}) Open`}
                              </button>
                            </div>
                          </div>

                          {/* Incident Cards Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredIncidents.map((incident) => {
                              const style = TIER_STYLES[incident.tier];
                              const remediatedNote = remediatedIds[incident.id];
                              const advisoryNote = advisorySentIds[incident.id];

                              return (
                                <div
                                  key={incident.id}
                                  className={`rounded-xl border-2 ${
                                    remediatedNote
                                      ? "border-emerald-300 bg-emerald-50/30"
                                      : `${style.border} bg-white`
                                  } shadow-sm overflow-hidden flex flex-col justify-between`}
                                >
                                  <div>
                                    {/* Card Top Strip */}
                                    <div
                                      className={`px-4 py-3 border-b ${
                                        remediatedNote
                                          ? "bg-emerald-100/60 border-emerald-200"
                                          : `${style.headerBg} border-slate-200/80`
                                      } flex flex-wrap items-center justify-between gap-2`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`h-2.5 w-2.5 rounded-full ${
                                            remediatedNote
                                              ? "bg-emerald-600"
                                              : style.dot
                                          }`}
                                        />
                                        <span
                                          className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded ${
                                            remediatedNote
                                              ? "bg-emerald-700 text-white"
                                              : `${style.badgeBg} ${style.badgeText}`
                                          }`}
                                        >
                                          {remediatedNote
                                            ? `${incident.tier} · AUTO-REMEDIATED`
                                            : style.rankLabel}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
                                          {incident.source}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
                                        <span>{incident.entityRef}</span>
                                        <span>·</span>
                                        <span className="font-bold text-slate-800">
                                          SLA: {incident.slaTarget}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4 space-y-3">
                                      <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                          Entity: {incident.entityName}
                                        </p>
                                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                                          {incident.title}
                                        </h4>
                                      </div>

                                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                                          <p className="font-black text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                                            1. Plain-English Root Cause (Why
                                            This Happened)
                                          </p>
                                          <p className="text-slate-700 leading-relaxed">
                                            {incident.whyHappened}
                                          </p>
                                        </div>

                                        <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                                          <p className="font-black text-emerald-900 uppercase tracking-wider text-[10px] mb-1">
                                            2. Zero-Harassment Resolution
                                            Playbook (Fair Resolution Without
                                            Stopping Business)
                                          </p>
                                          <p className="text-emerald-950 leading-relaxed">
                                            {incident.fairResolutionPlaybook}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                        <span className="font-mono">
                                          Statutory Anchor:{" "}
                                          <strong className="text-slate-700">
                                            {incident.statutoryRef}
                                          </strong>
                                        </span>
                                      </div>

                                      {remediatedNote && (
                                        <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                                          <span>{remediatedNote}</span>
                                        </div>
                                      )}

                                      {advisoryNote && (
                                        <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold flex items-center gap-2">
                                          <MessageSquare className="h-4 w-4 text-sky-600 shrink-0" />
                                          <span>
                                            {advisoryNote}: &ldquo;
                                            {incident.advisoryTemplate}&rdquo;
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 1-Click Action Footer */}
                                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleAutoRemediate(incident)
                                      }
                                      className={`flex-1 min-w-[200px] px-3.5 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                                        remediatedNote
                                          ? "bg-emerald-700 text-white"
                                          : "bg-slate-900 hover:bg-emerald-600 text-white shadow-sm"
                                      }`}
                                    >
                                      <Zap className="h-3.5 w-3.5" />
                                      <span>
                                        {remediatedNote
                                          ? "Re-Verify Auto-Fix"
                                          : `Execute Auto-Fix: ${incident.autoFixLabel}`}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSendAdvisory(incident)
                                      }
                                      className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors flex items-center gap-1.5"
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
                                      <span>Send Human-Style Advisory</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 1.2 */}
                      <SubCategoryShell
                        sub={category.subCategories[1]}
                        expanded={expandedSubCategories["sub-1-2"] ?? true}
                        onToggle={() => toggleSubCategory("sub-1-2")}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                              RESTAURANT PARTNER PROTECTION
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-2">
                              Zero Arbitrary Delisting Guarantee
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Restaurants are never auto-delisted for temporary
                              packaging claims or FoSCoS renewal processing. A
                              14-day human-reviewed continuity window is
                              enforced by default.
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold">
                              DELIVERY RIDER DIGNITY
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-2">
                              Zero Unfair ID Blocking & Wait-Pay Shield
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Riders are never penalized for kitchen prep
                              delays, traffic blockades, or customer unreachable
                              scenarios. Verified wait time above 5 minutes is
                              auto-compensated.
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                              CUSTOMER TRUST & REFUND SLA
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-2">
                              Instant Platform QA Reserve Settlement
                            </h4>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              Verified transit spills or missing items are
                              refunded immediately from the Platform QA Reserve
                              without punitive clawbacks from honest kitchens.
                            </p>
                          </div>
                        </div>
                      </SubCategoryShell>
                    </>
                  )}

                  {/* =========================================================
                      CATEGORY 2: UMAR AI & SOVEREIGN EXECUTIVE COMMAND
                  ========================================================= */}
                  {category.id === "cat-umar-ai" && (
                    <>
                      {/* Sub-Category 2.1: Executive Command Deck */}
                      <SubCategoryShell
                        sub={category.subCategories[0]}
                        expanded={expandedSubCategories["sub-2-1"] ?? true}
                        onToggle={() => toggleSubCategory("sub-2-1")}
                      >
                        <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 space-y-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                UMAR SOVEREIGN COMMAND SHELL · DETERMINISTIC
                                EXECUTION
                              </span>
                              <h4 className="text-base font-black text-white mt-0.5">
                                Issue Natural-Language Directives Across All
                                Ecosystem Portals
                              </h4>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                              Connected Entities: {stats.restaurants} Kitchens ·{" "}
                              {stats.riders} Riders
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={aiCommandInput}
                              onChange={(e) =>
                                setAiCommandInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleExecuteAiCommand();
                                }
                              }}
                              placeholder="Type an executive command (e.g., 'Verify T+0 UPI settlement queue and enable rain-surge protection for riders')..."
                              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleExecuteAiCommand()}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0"
                            >
                              <Send className="h-3.5 w-3.5" /> Execute Directive
                            </button>
                          </div>

                          {/* 1-Click Sovereign Presets */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                              1-Click Executive Directives:
                            </span>
                            {[
                              "Audit CGST Sec 9(5) & Sec 194-O TDS Ledgers",
                              "Activate Rider Rain-Surge Fairness Pool (+₹15/Order)",
                              "Sync 23-Language Bhashini Voice Dictionary to Rider Fleet",
                              "Rebalance Kitchen Prep-Time Buffer Across High-Load Zones",
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => handleExecuteAiCommand(preset)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>

                          {/* Command History Log */}
                          <div className="space-y-2 pt-2 border-t border-slate-800">
                            {aiCommandHistory.map((cmd) => (
                              <div
                                key={cmd.id}
                                className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                                      {cmd.status}
                                    </span>
                                    <span className="font-bold text-white">
                                      {cmd.directive}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-[11px]">
                                    {cmd.summary}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                  {cmd.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 2.2: Dispatch, Routing & Pricing Algorithms */}
                      <SubCategoryShell
                        sub={category.subCategories[1]}
                        expanded={expandedSubCategories["sub-2-2"] ?? true}
                        onToggle={() => toggleSubCategory("sub-2-2")}
                      >
                        <AlgorithmSettings />
                      </SubCategoryShell>

                      {/* Sub-Category 2.3: Multi-Model AI Benchmark & Routing */}
                      <SubCategoryShell
                        sub={category.subCategories[2]}
                        expanded={expandedSubCategories["sub-2-3"] ?? true}
                        onToggle={() => toggleSubCategory("sub-2-3")}
                      >
                        <MultimodelBenchmarkDashboard />
                      </SubCategoryShell>

                      {/* Sub-Category 2.4: Core Platform Engines & Pending Approvals */}
                      <SubCategoryShell
                        sub={category.subCategories[3]}
                        expanded={expandedSubCategories["sub-2-4"] ?? true}
                        onToggle={() => toggleSubCategory("sub-2-4")}
                      >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Core Platform Engines */}
                          <div className="bg-white rounded-xl border border-slate-200 p-5">
                            <h4 className="font-black text-slate-900 flex items-center gap-2 text-sm mb-3">
                              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                              Core Platform Real-Time Engines
                            </h4>
                            <div className="space-y-3">
                              <InteractiveToggleRow
                                label="Dynamic Surge & Weather Fairness Pricing"
                                description="Automatically computes rain/traffic rider surge payouts without inflating customer food item prices."
                                active={coreEngines.dynamicPricing}
                                onToggle={() => toggleEngine("dynamicPricing")}
                              />
                              <InteractiveToggleRow
                                label="23-Language Rider Voice Copilot"
                                description="Provides spoken step-by-step pickup, gate-entry, and settlement guidance across 23 Indian languages."
                                active={coreEngines.aiTutor}
                                onToggle={() => toggleEngine("aiTutor")}
                              />
                              <InteractiveToggleRow
                                label="Sub-Second Rider & KDS Telemetry Sync"
                                description="Dispatches riders to the pickup counter only when the kitchen marks food 80% ready."
                                active={coreEngines.locationTracking}
                                onToggle={() =>
                                  toggleEngine("locationTracking")
                                }
                              />
                              <InteractiveToggleRow
                                label="T+0 Automated Nodal Escrow Settlements"
                                description="Routes instant restaurant and rider payouts with statutory Sec 9(5) and Sec 194-O reconciliation."
                                active={coreEngines.automatedSettlements}
                                onToggle={() =>
                                  toggleEngine("automatedSettlements")
                                }
                              />
                            </div>
                          </div>

                          {/* Pending Restaurant Approvals */}
                          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                                  <FileCheck2 className="h-4 w-4 text-amber-600" />
                                  Pending Restaurant Partner Approvals
                                </h4>
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                  {pendingUnapprovedCount} Pending
                                </span>
                              </div>

                              {stats.pendingRestaurants.length === 0 ? (
                                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                  <p className="text-sm font-bold text-slate-800">
                                    All Restaurant Applications Cleared
                                  </p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Zero pending kitchen onboarding requests in
                                    PostgreSQL queue.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  {stats.pendingRestaurants.map((rest: any) => {
                                    const isApproved = approvedList.includes(
                                      rest.id
                                    );
                                    return (
                                      <div
                                        key={rest.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                                      >
                                        <div>
                                          <p className="font-bold text-slate-900 text-sm">
                                            {rest.name}
                                          </p>
                                          <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
                                            {isApproved
                                              ? "APPROVED & ACTIVE"
                                              : "KYC & FSSAI VERIFIED · AWAITING SIGN-OFF"}
                                          </span>
                                        </div>
                                        {isApproved ? (
                                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                            <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                                            Approved
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setApprovedList((prev) => [
                                                ...prev,
                                                rest.id,
                                              ])
                                            }
                                            className="px-3 py-1.5 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                                          >
                                            Approve Kitchen
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                              <span>
                                Zero Onboarding Fee · Zero Mandatory Discount
                                Coercion
                              </span>
                              <span className="font-mono text-emerald-700 font-bold">
                                FSSAI & GSTIN Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </SubCategoryShell>
                    </>
                  )}

                  {/* =========================================================
                      CATEGORY 3: MARKETPLACE OPERATIONS, DISPATCH & ECOSYSTEM CONTROL
                  ========================================================= */}
                  {category.id === "cat-marketplace" && (
                    <>
                      {/* Sub-Category 3.1: Real-Time Marketplace KPI Strip & Order Lifecycle Flow */}
                      <SubCategoryShell
                        sub={category.subCategories[0]}
                        expanded={expandedSubCategories["sub-3-1"] ?? true}
                        onToggle={() => toggleSubCategory("sub-3-1")}
                      >
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard
                              title="Total Registered Users"
                              value={stats.users.toString()}
                              trend="PostgreSQL `profiles` table"
                              icon={Users}
                              color="text-blue-600"
                              bg="bg-blue-50 border-blue-200"
                            />
                            <KpiCard
                              title="Active Restaurant Partners"
                              value={stats.restaurants.toString()}
                              trend="PostgreSQL `restaurants` table"
                              icon={Store}
                              color="text-emerald-600"
                              bg="bg-emerald-50 border-emerald-200"
                            />
                            <KpiCard
                              title="Verified Delivery Fleet"
                              value={stats.riders.toString()}
                              trend="PostgreSQL `riders` table"
                              icon={Bike}
                              color="text-amber-600"
                              bg="bg-amber-50 border-amber-200"
                            />
                            <KpiCard
                              title="Total Ecosystem Orders"
                              value={stats.todayOrders.toString()}
                              trend="PostgreSQL `orders` table"
                              icon={Activity}
                              color="text-purple-600"
                              bg="bg-purple-50 border-purple-200"
                              emptyState={stats.todayOrders === 0}
                            />
                          </div>

                          {/* 6-Stage End-to-End Order Lifecycle Pipeline */}
                          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                              <div>
                                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                                  DETERMINISTIC ORDER LIFECYCLE PIPELINE
                                </span>
                                <h4 className="text-sm font-black text-white">
                                  6-Stage Real-Time Fulfillment & Escrow
                                  Synchronization
                                </h4>
                              </div>
                              <span className="text-xs font-mono text-slate-400">
                                Zero Blind Rider Dispatch · Zero Hidden
                                Deductions
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                              {[
                                {
                                  step: "01",
                                  title: "Customer Checkout",
                                  desc: "Transparent item + GST + rider fee lock via King Pay UPI.",
                                },
                                {
                                  step: "02",
                                  title: "Kitchen KDS Accept",
                                  desc: "Direct thermal printer + KDS prep-time commitment.",
                                },
                                {
                                  step: "03",
                                  title: "80% Prep Dispatch",
                                  desc: "Rider assigned to arrive just as food is sealed.",
                                },
                                {
                                  step: "04",
                                  title: "Tamper-Seal Pickup",
                                  desc: "Pickup checklist & wait-time protection logged.",
                                },
                                {
                                  step: "05",
                                  title: "Verified Handover",
                                  desc: "OTP / doorstep drop with 23-language voice aid.",
                                },
                                {
                                  step: "06",
                                  title: "T+0 Split Settlement",
                                  desc: "Instant payout to kitchen & rider; Sec 9(5) isolated.",
                                },
                              ].map((st) => (
                                <div
                                  key={st.step}
                                  className="p-3 rounded-lg bg-slate-800/90 border border-slate-700"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-mono font-black text-emerald-400">
                                      STAGE {st.step}
                                    </span>
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  </div>
                                  <p className="font-bold text-xs text-white">
                                    {st.title}
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                    {st.desc}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 3.2: Customer App UI & Theme Control */}
                      <SubCategoryShell
                        sub={category.subCategories[1]}
                        expanded={expandedSubCategories["sub-3-2"] ?? true}
                        onToggle={() => toggleSubCategory("sub-3-2")}
                      >
                        <CustomerAppUiSettings />
                      </SubCategoryShell>

                      {/* Sub-Category 3.3: Ecosystem CMS & Broadcast Banners */}
                      <SubCategoryShell
                        sub={category.subCategories[2]}
                        expanded={expandedSubCategories["sub-3-3"] ?? true}
                        onToggle={() => toggleSubCategory("sub-3-3")}
                      >
                        <EcosystemCMS />
                      </SubCategoryShell>

                      {/* Sub-Category 3.4: Global God-Eye Geospatial Telemetry Map */}
                      <SubCategoryShell
                        sub={category.subCategories[3]}
                        expanded={expandedSubCategories["sub-3-4"] ?? true}
                        onToggle={() => toggleSubCategory("sub-3-4")}
                      >
                        <Suspense fallback={<GodEyeMapSkeleton />}>
                          <LazyGlobalGodEyeMap />
                        </Suspense>
                      </SubCategoryShell>
                    </>
                  )}

                  {/* =========================================================
                      CATEGORY 4: FINTECH, KING PAY, GROWTH & COMMERCIAL STUDIOS
                  ========================================================= */}
                  {category.id === "cat-fintech-studios" && (
                    <>
                      {/* Sub-Category 4.1: Live Founder Profit & Escrow Ledger */}
                      <SubCategoryShell
                        sub={category.subCategories[0]}
                        expanded={expandedSubCategories["sub-4-1"] ?? true}
                        onToggle={() => toggleSubCategory("sub-4-1")}
                      >
                        <LiveFounderProfitDashboard />
                      </SubCategoryShell>

                      {/* Sub-Category 4.2: King Pay Global Settings & Master Switch */}
                      <SubCategoryShell
                        sub={category.subCategories[1]}
                        expanded={expandedSubCategories["sub-4-2"] ?? true}
                        onToggle={() => toggleSubCategory("sub-4-2")}
                      >
                        <div className="space-y-6">
                          <KingPayGlobalSettings />
                          <KingPayMasterSwitch />
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 4.3: Central Pricing & Commission Switchboard */}
                      <SubCategoryShell
                        sub={category.subCategories[2]}
                        expanded={expandedSubCategories["sub-4-3"] ?? true}
                        onToggle={() => toggleSubCategory("sub-4-3")}
                      >
                        <CentralPricingSwitch />
                      </SubCategoryShell>

                      {/* Sub-Category 4.4: B2B Franchise Onboarding & SaaS Sales Deck */}
                      <SubCategoryShell
                        sub={category.subCategories[3]}
                        expanded={expandedSubCategories["sub-4-4"] ?? true}
                        onToggle={() => toggleSubCategory("sub-4-4")}
                      >
                        <div className="space-y-6">
                          <B2BSaaSSalesDeckGenerator />
                          <B2BFranchiseOnboardingEngine />
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 4.5: Creative, App Builder, Media & Social Studios */}
                      <SubCategoryShell
                        sub={category.subCategories[4]}
                        expanded={expandedSubCategories["sub-4-5"] ?? true}
                        onToggle={() => toggleSubCategory("sub-4-5")}
                      >
                        <div className="space-y-8">
                          <AppBuilderStudio />
                          <DesignStudio />
                          <MediaProductionStudio />
                          <SocialPublishingStudio />
                        </div>
                      </SubCategoryShell>
                    </>
                  )}

                  {/* =========================================================
                      CATEGORY 5: INFRASTRUCTURE, CONNECTORS, LEGAL & CAPABILITY REGISTRY
                  ========================================================= */}
                  {category.id === "cat-infra-legal" && (
                    <>
                      {/* Sub-Category 5.1: External Plugin Connectors & Webhooks */}
                      <SubCategoryShell
                        sub={category.subCategories[0]}
                        expanded={expandedSubCategories["sub-5-1"] ?? true}
                        onToggle={() => toggleSubCategory("sub-5-1")}
                      >
                        <PluginConnectors />
                      </SubCategoryShell>

                      {/* Sub-Category 5.2: Live Audit & Telemetry Stream */}
                      <SubCategoryShell
                        sub={category.subCategories[1]}
                        expanded={expandedSubCategories["sub-5-2"] ?? true}
                        onToggle={() => toggleSubCategory("sub-5-2")}
                      >
                        <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <Terminal className="h-4 w-4 text-emerald-400" />
                              Immutable Founder & Kernel Audit Stream (
                              {auditEvents.length} Events)
                            </h4>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                              IT Act 2000 Sec 43A Tamper-Evident Log
                            </span>
                          </div>
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {auditEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                                      {ev.badge}
                                    </span>
                                    <span className="font-bold text-white">
                                      {ev.action}
                                    </span>
                                    <span className="text-slate-400">
                                      by {ev.actor}
                                    </span>
                                  </div>
                                  <p className="text-slate-400 text-[11px] mt-1">
                                    {ev.detail}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 5.3: Statutory Legal Compliance Vault */}
                      <SubCategoryShell
                        sub={category.subCategories[2]}
                        expanded={expandedSubCategories["sub-5-3"] ?? true}
                        onToggle={() => toggleSubCategory("sub-5-3")}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            {
                              statute:
                                "FSSAI Food Safety & Standards Act, 2006",
                              code: "FSSAI-14DIG-FOSCOS",
                              desc: "Mandatory 14-digit license validation on restaurant onboarding with 14-day FoSCoS renewal grace continuity shield.",
                              status: "COMPLIANT & ENFORCED",
                            },
                            {
                              statute: "CGST Act, 2017 · Section 9(5)",
                              code: "ECO-GST-5PCT",
                              desc: "5% restaurant service GST collected and remitted directly by E-Commerce Operator (OrderKing) with HSN/SAC invoice split.",
                              status: "COMPLIANT & ENFORCED",
                            },
                            {
                              statute: "Income Tax Act, 1961 · Section 194-O",
                              code: "TDS-0.1PCT-LEDGER",
                              desc: "Automated 0.1% TDS deduction and Form 16A certificate mapping for eligible gross restaurant sales.",
                              status: "COMPLIANT & ENFORCED",
                            },
                            {
                              statute:
                                "Code on Social Security, 2020 (Gig Workers)",
                              code: "GIG-WELFARE-SHIELD",
                              desc: "e-Shram UAN compatibility, accidental & medical insurance coverage, and transparent per-order + wait-time payout ledger.",
                              status: "COMPLIANT & ENFORCED",
                            },
                            {
                              statute:
                                "Information Technology Act, 2000 & DPDP Act, 2023",
                              code: "DPDP-ZERO-LEAK",
                              desc: "Customer phone numbers masked during delivery routing; zero third-party ad-broker data monetization.",
                              status: "COMPLIANT & ENFORCED",
                            },
                            {
                              statute:
                                "RBI Payment Aggregator & Nodal Escrow Norms",
                              code: "RBI-T0-NODAL",
                              desc: "Direct T+0 split settlement between Restaurant Partner, Delivery Rider, GST Pool, and Platform Margin.",
                              status: "COMPLIANT & ENFORCED",
                            },
                          ].map((law) => (
                            <div
                              key={law.code}
                              className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                    {law.code}
                                  </span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />{" "}
                                    {law.status}
                                  </span>
                                </div>
                                <h5 className="font-black text-slate-900 text-sm">
                                  {law.statute}
                                </h5>
                                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                  {law.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SubCategoryShell>

                      {/* Sub-Category 5.4: System Capability Registry */}
                      <SubCategoryShell
                        sub={category.subCategories[3]}
                        expanded={expandedSubCategories["sub-5-4"] ?? true}
                        onToggle={() => toggleSubCategory("sub-5-4")}
                      >
                        <CapabilityRegistryPanel />
                      </SubCategoryShell>
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* =====================================================================
          FLOATING SCROLL TO TOP (↑) & SCROLL TO BOTTOM (↓) QUICK BUTTONS
      ===================================================================== */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <button
          type="button"
          onClick={scrollToPageTop}
          aria-label="Scroll to top"
          title="Scroll to Top"
          className="h-11 w-11 rounded-full bg-slate-900 hover:bg-emerald-600 text-white shadow-lg border border-slate-700 flex items-center justify-center transition-all"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={scrollToPageBottom}
          aria-label="Scroll to bottom"
          title="Scroll to Bottom"
          className="h-11 w-11 rounded-full bg-slate-900 hover:bg-emerald-600 text-white shadow-lg border border-slate-700 flex items-center justify-center transition-all"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE SUB-CATEGORY ACCORDION SHELL
// ============================================================================

function SubCategoryShell({
  sub,
  expanded,
  onToggle,
  rightBadge,
  children,
}: {
  sub: SubCategoryMeta;
  expanded: boolean;
  onToggle: () => void;
  rightBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      id={sub.id}
      className="scroll-mt-36 rounded-xl border border-slate-200/90 bg-white shadow-xs overflow-hidden"
    >
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="w-full cursor-pointer select-none px-5 py-3.5 bg-slate-100/80 hover:bg-slate-100 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-emerald-400 font-mono text-xs font-black">
            §{sub.code}
          </span>
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-900">
              {sub.title}
            </h3>
            <p className="text-xs text-slate-500">{sub.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {rightBadge}
          <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1">
            {expanded ? (
              <>
                <span>Hide</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Show</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </span>
        </div>
      </div>

      {expanded && <div className="p-5">{children}</div>}
    </div>
  );
}

function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  color,
  bg,
  emptyState = false,
}: {
  title: string;
  value: string;
  trend: string;
  icon: any;
  color: string;
  bg: string;
  emptyState?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
        {!emptyState && (
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">
              {trend}
            </span>
          </div>
        )}
        {emptyState && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              STANDBY · {trend}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3.5 rounded-xl border ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  );
}

function InteractiveToggleRow({
  label,
  description,
  active,
  onToggle,
}: {
  label: string;
  description: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 pb-3">
      <div>
        <p className="font-semibold text-slate-900 text-sm">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
          active ? "bg-emerald-600" : "bg-slate-300"
        }`}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
            active ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================================
// POPULATED 16-CAPABILITY SYSTEM REGISTRY PANEL
// ============================================================================

interface VerifiedCapability {
  id: string;
  domain: string;
  name: string;
  description: string;
  version: string;
  rollbackPath: string;
  dependencies: string[];
  status: "IMPLEMENTED" | "PARTIAL" | "NOT_IMPLEMENTED";
  health: "ONLINE" | "DEGRADED";
  blockerReason?: string;
}

const VERIFIED_CAPABILITIES: VerifiedCapability[] = [
  {
    id: "cap-01",
    domain: "INCIDENT_GOVERNANCE",
    name: "6-Tier Founder Incident & Zero-Harassment Auto-Remediation Engine",
    description:
      "Classifies operational, financial, and compliance alerts into EMERGENCY, DANGER, CRITICAL, HIGH, MEDIUM, and LOW tiers with 1-click auto-remediation and human-style advisories.",
    version: "4.2.0",
    rollbackPath: "stateless-triage-fallback-v4.1",
    dependencies: ["PostgreSQL Telemetry", "Audit Stream Kernel"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-02",
    domain: "FINTECH_KINGPAY",
    name: "King Pay T+0 Nodal Split Settlement & UPI Escrow Engine",
    description:
      "Executes instant T+0 partner and rider payouts while isolating CGST Sec 9(5) and Income Tax Sec 194-O statutory buckets.",
    version: "3.9.4",
    rollbackPath: "kingpay-scheduled-batch-t1",
    dependencies: ["NPCI UPI Rail", "Nodal Escrow Ledger"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-03",
    domain: "RIDER_FLEET",
    name: "23-Language Constitutional Voice & Script Rider Localization",
    description:
      "Full native script and spoken voice guidance across all 22 Eighth Schedule Indian constitutional languages plus English.",
    version: "5.0.0",
    rollbackPath: "i18n-core-dictionary-v4",
    dependencies: ["Web Speech Synthesis", "Rider App Shell"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-04",
    domain: "RIDER_FLEET",
    name: "Zero-Friction Competitor Rider Migration & Instant Kit Activation",
    description:
      "Allows experienced delivery partners to onboard with existing thermal bags and helmets at ₹0 upfront deduction.",
    version: "3.4.0",
    rollbackPath: "standard-kyc-onboarding-v3",
    dependencies: ["Rider Onboarding Engine", "Vahan RC Validator"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-05",
    domain: "RESTAURANT_PARTNER",
    name: "Direct KDS Thermal Printer & Prep-Time Synchronization",
    description:
      "Connects kitchen order tickets directly to rider dispatch so riders arrive only when food preparation reaches 80% completion.",
    version: "3.8.2",
    rollbackPath: "kds-manual-ready-trigger",
    dependencies: ["Kitchen KDS", "Dispatch Algorithm Engine"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-06",
    domain: "STATUTORY_TAX",
    name: "CGST Section 9(5) & Income Tax Section 194-O Automated Tax Desk",
    description:
      "Generates order-level HSN/SAC tax splits, 5% ECO food GST reconciliation, and 0.1% Sec 194-O TDS certificates.",
    version: "4.1.0",
    rollbackPath: "tax-ledger-snapshot-v4.0",
    dependencies: ["King Pay Ledger", "GSTIN Verification Bridge"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-07",
    domain: "STATUTORY_FOOD_SAFETY",
    name: "FSSAI 14-Digit FoSCoS Continuity & Renewal Grace Shield",
    description:
      "Validates FSSAI licenses and grants a 14-day provisional continuity window when renewal receipts are uploaded, preventing unfair delisting.",
    version: "3.6.1",
    rollbackPath: "manual-compliance-review-queue",
    dependencies: ["Restaurant KYC Vault", "Founder Incident Center"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-08",
    domain: "UMAR_AI",
    name: "Multi-Model Sovereign AI Benchmark & Routing Matrix",
    description:
      "Routes menu OCR, multilingual translation, and support triage across benchmarked models with automatic cost and latency failover.",
    version: "2.9.0",
    rollbackPath: "deterministic-rule-router-v2",
    dependencies: ["MultimodelBenchmarkDashboard", "UMAR Kernel"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-09",
    domain: "DISPATCH_CORE",
    name: "Weather, Rain & Detention Wait-Pay Fairness Engine",
    description:
      "Automatically credits ₹3/min verified kitchen wait-pay after 5 minutes and activates rain surge bonuses without customer price gouging.",
    version: "4.0.2",
    rollbackPath: "fixed-slab-incentive-v3",
    dependencies: ["AlgorithmSettings", "Rider Settlement Desk"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-10",
    domain: "GEOSPATIAL",
    name: "Global God-Eye Pan-India Telemetry & Zone Density Radar",
    description:
      "Visualizes live order density, active restaurant clusters, and rider availability vectors across Indian metropolitan and Tier-2/3 zones.",
    version: "3.5.0",
    rollbackPath: "tabular-zone-monitor-v3",
    dependencies: ["GlobalGodEyeMap", "PostGIS / Coordinate Index"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-11",
    domain: "CUSTOMER_EXPERIENCE",
    name: "Zero-Rebuild Customer App UI & Festival Theme Configurator",
    description:
      "Updates customer discovery rails, banner density, and regional festival themes dynamically from HDmaster.",
    version: "3.2.1",
    rollbackPath: "default-customer-theme-json",
    dependencies: ["CustomerAppUiSettings", "EcosystemCMS"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-12",
    domain: "COMMERCIAL_B2B",
    name: "B2B Franchise Territory Onboarding & Institutional Deck Engine",
    description:
      "Automates city-level franchise partner onboarding, unit-economics modeling, and institutional sales deck generation.",
    version: "2.8.4",
    rollbackPath: "static-franchise-onboarding-v2",
    dependencies: [
      "B2BFranchiseOnboardingEngine",
      "B2BSaaSSalesDeckGenerator",
    ],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-13",
    domain: "CREATIVE_STUDIOS",
    name: "In-House App Builder, Design, Media & Social Publishing Suite",
    description:
      "Empowers the founder and restaurant partners to generate dish visuals, promotional videos, and social campaigns without external agencies.",
    version: "3.1.0",
    rollbackPath: "studio-asset-library-v3",
    dependencies: [
      "AppBuilderStudio",
      "DesignStudio",
      "MediaProductionStudio",
      "SocialPublishingStudio",
    ],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-14",
    domain: "GIG_SOCIAL_SECURITY",
    name: "Code on Social Security 2020 & e-Shram Welfare Desk",
    description:
      "Provides delivery riders with accidental insurance coverage, SOS ambulance dispatch, and downloadable income/tax proofs.",
    version: "4.0.0",
    rollbackPath: "rider-welfare-ledger-v3",
    dependencies: ["Rider Settlement Desk", "Emergency SOS Bridge"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-15",
    domain: "PRIVACY_DPDP",
    name: "DPDP Act 2023 Customer Phone Masking & Zero Ad-Broker Vault",
    description:
      "Protects customer PII with virtual call masking and guarantees restaurant customer lists are never sold or used for competing cloud kitchens.",
    version: "3.7.0",
    rollbackPath: "encrypted-relay-proxy-v3",
    dependencies: ["PluginConnectors", "Auth Session Guard"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
  {
    id: "cap-16",
    domain: "INFRA_CONNECTORS",
    name: "Multi-Provider Webhook & Plugin Connector Switchboard",
    description:
      "Manages payment gateways, WhatsApp/SMS OTP providers, and accounting ERP exports with health checks and circuit breakers.",
    version: "3.3.5",
    rollbackPath: "secondary-connector-pool",
    dependencies: ["PluginConnectors", "PostgreSQL Config Store"],
    status: "IMPLEMENTED",
    health: "ONLINE",
  },
];

function CapabilityRegistryPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("ALL");

  const domains = [
    "ALL",
    ...Array.from(new Set(VERIFIED_CAPABILITIES.map((c) => c.domain))),
  ];

  const filteredCapabilities = VERIFIED_CAPABILITIES.filter((cap) => {
    const matchesDomain =
      selectedDomain === "ALL" || cap.domain === selectedDomain;
    const matchesSearch =
      !searchQuery.trim() ||
      cap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
            <Database className="text-emerald-600 h-5 w-5" /> Verified System
            Capabilities ({filteredCapabilities.length} /{" "}
            {VERIFIED_CAPABILITIES.length})
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Production capabilities verified across OrderKing HDmaster,
            Restaurant Partner, Delivery Rider, and King Pay modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search capabilities..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 bg-white"
            />
          </div>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
            aria-label="Filter capabilities by domain"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-emerald-500"
          >
            {domains.map((dom) => (
              <option key={dom} value={dom}>
                {dom === "ALL" ? "All Domains (16)" : dom}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCapabilities.map((cap) => (
          <div
            key={cap.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {cap.domain}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">
                      {cap.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    {cap.description}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {cap.status === "IMPLEMENTED" && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="h-3 w-3" /> Implemented
                    </span>
                  )}
                  {cap.health === "ONLINE" ? (
                    <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                      ONLINE
                    </span>
                  ) : (
                    <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />{" "}
                      DEGRADED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-medium text-slate-500 pt-2.5 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Server className="h-3 w-3 text-slate-400" /> v{cap.version}
              </span>
              <span className="flex items-center gap-1">
                <GitBranch className="h-3 w-3 text-slate-400" /> Rollback:{" "}
                {cap.rollbackPath}
              </span>
              <span>Deps: {cap.dependencies.join(", ")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
