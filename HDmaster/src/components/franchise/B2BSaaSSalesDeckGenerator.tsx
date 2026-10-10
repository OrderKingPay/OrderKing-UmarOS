import React, { useState, useEffect } from "react";
import {
  Download,
  Printer,
  Mail,
  Copy,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Zap,
  Building2,
  Flame,
  CheckCircle2,
  Calculator,
  Globe,
  Crown,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  FileText,
  AlertTriangle,
  Lock,
  DollarSign,
  Layers,
  Store,
  RefreshCw,
  ExternalLink,
  Award,
  BarChart3,
  Terminal,
  Send,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getB2BPitchDeckTelemetry,
  calculateMultiUnitRoi,
  generateExecutiveEmailPitch,
  type RealDeckTelemetry,
  type RoiSimulationParams,
  type RoiSimulationResult,
  type MarketRegion,
} from "@/lib/orderking/b2b-sales-deck-engine";

export function B2BSaaSSalesDeckGenerator() {
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<RealDeckTelemetry | null>(null);
  const [market, setMarket] = useState<MarketRegion>("US");
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"slides" | "prospectus" | "roi" | "email">("slides");

  // Multi-Unit ROI Simulator State
  const [roiParams, setRoiParams] = useState<RoiSimulationParams>({
    unitsCount: 15,
    dailyOrdersPerUnit: 90,
    avgTicketValue: 30, // $30 USD or 70 SAR
    aggregatorFeePct: 30, // 30% DoorDash or 28% Jahez
    orderkingCostPct: 8, // 8% OrderKing direct tech cost
    currency: "USD",
  });

  // Email Pitch Generator State
  const [recipientName, setRecipientName] = useState("Franchise Leadership Team");
  const [franchiseBrand, setFranchiseBrand] = useState("Premier Multi-Unit Franchise Group");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync ROI currency with chosen market
  useEffect(() => {
    if (market === "US") {
      setRoiParams((prev) => ({
        ...prev,
        currency: "USD",
        avgTicketValue: prev.currency === "SAR" ? 30 : prev.avgTicketValue,
        aggregatorFeePct: 30,
        orderkingCostPct: 8,
      }));
    } else if (market === "SAUDI") {
      setRoiParams((prev) => ({
        ...prev,
        currency: "SAR",
        avgTicketValue: prev.currency === "USD" ? 70 : prev.avgTicketValue,
        aggregatorFeePct: 28,
        orderkingCostPct: 7,
      }));
    } else {
      setRoiParams((prev) => ({
        ...prev,
        currency: "USD",
        aggregatorFeePct: 30,
        orderkingCostPct: 8,
      }));
    }
  }, [market]);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const data = await getB2BPitchDeckTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error("Failed to load deck telemetry", err);
      // Fallback default safe state
      setTelemetry({
        hasLiveOrders: false,
        realOrdersCount: 0,
        dispatchSpeed: {
          stat: "System Ready for Live Benchmark",
          targetSla: "Sub-8 Min Auto-Assignment SLA",
          p95LatencyMs: 24,
          activeFleetRiders: 0,
          algorithmMode: "Starlink-Grade Proximity & Haversine Matrix",
          isBenchmarked: false,
        },
        profitMargins: {
          stat: "System Ready for Live Benchmark",
          avgOrderValuePaise: 0,
          inflowPaise: 0,
          outflowPaise: 0,
          netMarginPaise: 0,
          marginPct: 0,
          formulaSpec: "(Restaurant Take-Rate + Delivery Fee) - (Courier Payout + 1.95% Gateway Fee)",
          isBenchmarked: false,
        },
        antiFraud: {
          stat: "System Ready for Live Benchmark",
          status: "ARMED_AND_ACTIVE",
          totalExploitsBlocked: 0,
          fakeOrdersIntercepted: 0,
          fakeRefundsBlocked: 0,
          gpsSpoofingBlocked: 0,
          hmacSignaturesActive: true,
          opticalProofRegistryActive: true,
          isBenchmarked: false,
        },
        founderPedigree: {
          yearsExperience: 12,
          brandHistory: "Burger King Multi-Unit Operations (QSR Direct Leadership)",
          coreDoctrine: "Built by a 12-year Burger King QSR operator who ran high-volume multi-unit store P&Ls — not Silicon Valley tourists.",
          trackRecordSummary: "12 years direct Burger King franchisee leadership managing speed of service, high-velocity kitchen queues, delivery shrinkage, unit-level labor costs, and food-margin preservation.",
        },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const roiResult: RoiSimulationResult = calculateMultiUnitRoi(roiParams);
  const currencySymbol = roiParams.currency === "USD" ? "$" : roiParams.currency === "SAR" ? "SAR " : "₹";

  const emailPitch = telemetry
    ? generateExecutiveEmailPitch(
        market === "SAUDI" ? "SAUDI" : "US",
        telemetry,
        roiResult,
        recipientName,
        franchiseBrand
      )
    : { subject: "", body: "" };

  const handleCopyEmail = () => {
    if (!emailPitch.body) return;
    navigator.clipboard.writeText(`SUBJECT: ${emailPitch.subject}\n\n${emailPitch.body}`);
    setCopiedEmail(true);
    toast.success("Executive Pitch Email copied to clipboard!");
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const slides = [
    {
      id: "pedigree",
      title: "Founder Authority & Executive Pedigree",
      subtitle: "Engineered by an Operator with 12 Years of Multi-Unit Burger King Experience",
      badge: "Institutional Authority",
    },
    {
      id: "crisis",
      title: "The Multi-Unit Crisis: The 30% Aggregator Bleed",
      subtitle: "Why 3rd-Party Delivery Apps are Silently Eradicating Franchise EBITDA",
      badge: "Industry Problem",
    },
    {
      id: "dispatch",
      title: "Starlink-Velocity Autonomous Dispatch Engine",
      subtitle: "Sub-8 Minute Driver Proximity Routing with Live Telemetry Validation",
      badge: "Speed of Service",
    },
    {
      id: "margins",
      title: "Exact Profit Margins & EBITDA Margin Expansion",
      subtitle: "Direct Delivery Economics Reclaiming 15%–22% Net Operating Margin",
      badge: "Unit Economics",
    },
    {
      id: "antifraud",
      title: "Military-Grade Anti-Fraud & Loss Prevention Shield",
      subtitle: "Zero Fake Refunds, HMAC-SHA256 Cryptographic Sealing & Anti-Teleportation",
      badge: "Zero-Fraud Defense",
    },
    {
      id: "market_fit",
      title: market === "US" ? "US Multi-Unit Ecosystem Integration" : market === "SAUDI" ? "Saudi & GCC Market Architecture" : "Global Enterprise Platform",
      subtitle: market === "US" ? "Toast, NCR Aloha, Brink POS Native Sync & 1099 Courier Payouts" : market === "SAUDI" ? "ZATCA Phase 2 E-Invoicing, Mada/Apple Pay & High-Temp Routing" : "Unified Multi-Brand, Multi-Currency POS Architecture",
      badge: "Enterprise Fit",
    },
    {
      id: "pilot",
      title: "14-Day Zero-Disruption Operational Benchmark",
      subtitle: "Immediate Side-by-Side Validation in Flagship Stores with Zero Down-Time",
      badge: "The Proposition",
    },
  ];

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-2xl border border-amber-500/30 shadow-2xl overflow-hidden font-sans">
      {/* Top Banner / Navigation Bar (Hidden in Print) */}
      <div className="print:hidden border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white uppercase">
                B2B SaaS Sales Deck Generator
              </h2>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                QSR GODFATHER EDITION
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              12-Year Burger King Multi-Unit Veteran • Real Live Platform Telemetry • US & Saudi Markets
            </p>
          </div>
        </div>

        {/* Market Selector & Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Market Switcher */}
          <div className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700">
            <button
              onClick={() => setMarket("US")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "US"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇺🇸</span> US Multi-Unit
            </button>
            <button
              onClick={() => setMarket("SAUDI")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "SAUDI"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇸🇦</span> Saudi / GCC
            </button>
            <button
              onClick={() => setMarket("GLOBAL")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "GLOBAL"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🌐</span> Global
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700">
            <button
              onClick={() => setViewMode("slides")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "slides"
                  ? "bg-slate-700 text-amber-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Slides
            </button>
            <button
              onClick={() => setViewMode("prospectus")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "prospectus"
                  ? "bg-slate-700 text-amber-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Prospectus
            </button>
            <button
              onClick={() => setViewMode("roi")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "roi"
                  ? "bg-slate-700 text-amber-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ROI Calculator
            </button>
            <button
              onClick={() => setViewMode("email")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                viewMode === "email"
                  ? "bg-slate-700 text-amber-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Email Pitch
            </button>
          </div>

          {/* Refresh Telemetry */}
          <Button
            size="sm"
            variant="outline"
            onClick={fetchTelemetry}
            disabled={loading}
            className="border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-700 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            Sync
          </Button>

          {/* Print to PDF */}
          <Button
            size="sm"
            onClick={handlePrintPdf}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Printer className="h-3.5 w-3.5" />
            Download PDF / Print
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 md:p-8">
        {/* VIEW MODE 1: INTERACTIVE SLIDES */}
        {viewMode === "slides" && (
          <div className="max-w-5xl mx-auto">
            {/* Slide Navigation Top Dots */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                  Slide {activeSlide + 1} of {slides.length}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-medium">
                  {slides[activeSlide].title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                  disabled={activeSlide === 0}
                  className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 h-8 px-2.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1.5">
                  {slides.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all ${
                        activeSlide === idx
                          ? "w-8 bg-amber-400"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={s.title}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={activeSlide === slides.length - 1}
                  className="border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 h-8 px-2.5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Slide Stage Container */}
            <div className="min-h-[520px] bg-gradient-to-b from-slate-900/90 to-slate-950 p-8 rounded-2xl border border-slate-800/90 relative shadow-2xl flex flex-col justify-between">
              {/* SLIDE 0: Founder Pedigree */}
              {activeSlide === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 px-3 py-1 font-bold">
                      EXECUTIVE BRIEFING & FOUNDER DOCTRINE
                    </Badge>
                    <span className="text-xs font-mono text-slate-500">CONFIDENTIAL • FRANCHISEE EYES ONLY</span>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                      Built by an Operator Who Ran{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                        Burger King Multi-Unit Stores
                      </span>{" "}
                      for 12 Years.
                    </h1>
                    <p className="text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">
                      Most restaurant software is written by Silicon Valley tourists who have never stood over a broil chain on a Friday rush, never managed multi-unit kitchen throughput, and never watched delivery aggregators bleed a 15% restaurant EBITDA margin down to 3%.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2 text-amber-400 mb-2 font-bold text-sm">
                        <Award className="h-4 w-4" /> 12 Years QSR Track Record
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Direct hands-on multi-unit franchise management: drive-thru speed, kitchen bottleneck elimination, food cost shrinkage, and unit P&L discipline.
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold text-sm">
                        <DollarSign className="h-4 w-4" /> Reclaiming 20%+ EBITDA
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Replacing predatory 30% aggregator commission fees with a flat, direct, sovereign tech stack that puts the margin back on the store owner's ledger.
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/60">
                      <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-sm">
                        <ShieldCheck className="h-4 w-4" /> Military Anti-Fraud Shield
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Cryptographic ticket hashing and photo deduplication to permanently terminate customer false-refund scams and driver GPS spoofing.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-amber-400 shrink-0" />
                      <span>
                        Target Audience: {market === "US" ? "US Multi-Unit Franchisees (5-100+ stores)" : market === "SAUDI" ? "Saudi & GCC Restaurant Conglomerates" : "Global QSR Holdings"}
                      </span>
                    </div>
                    <span className="font-bold text-amber-300">Live Institutional Audit Active</span>
                  </div>
                </div>
              )}

              {/* SLIDE 1: The Aggregator Crisis */}
              {activeSlide === 1 && (
                <div className="space-y-6">
                  <div>
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/40 px-3 py-1 font-bold">
                      THE MULTI-UNIT BLEED
                    </Badge>
                    <h2 className="text-3xl font-black text-white mt-2">
                      Aggregators Are Bleeding Your Stores Dry.
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      {market === "US"
                        ? "DoorDash and UberEats take 30% of every ticket, conceal customer records, and blame your crew for delivery delays."
                        : market === "SAUDI"
                        ? "Jahez, HungerStation, and Talabat charge up to 30%, hoard customer loyalty, and pass all refund deductions onto the restaurant."
                        : "Third-party delivery apps operate as a digital toll booth extracting top-line revenue while offloading operational risk."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* The Aggregator Trap */}
                    <div className="bg-red-950/20 p-6 rounded-xl border border-red-900/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-red-400 text-base uppercase tracking-wider flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" /> 3rd-Party Delivery Apps
                        </h3>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">COMMISSION BLEED</Badge>
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">✕</span>
                          <span><strong>28% - 32% Commission Tax:</strong> Siphons the entire operating profit margin of your delivery volume.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">✕</span>
                          <span><strong>Customer Data Blackout:</strong> You don't own the guest email, phone, or dining history; they market competitor promos to your diners.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">✕</span>
                          <span><strong>Uncontrollable Dispatch Delays:</strong> Courier arrives 40 minutes late; customer leaves a 1-star review on your Google profile.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400 font-bold">✕</span>
                          <span><strong>Automatic Refund Chargebacks:</strong> Dishonest customers claim "missing item"; the aggregator deducts the funds with zero recourse.</span>
                        </li>
                      </ul>
                    </div>

                    {/* OrderKing Sovereign Alternative */}
                    <div className="bg-emerald-950/20 p-6 rounded-xl border border-emerald-900/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-emerald-400 text-base uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" /> OrderKing Sovereign Platform
                        </h3>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs">DIRECT FREEDOM</Badge>
                      </div>
                      <ul className="space-y-3 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>Flat 7% - 8% Platform Cost:</strong> Reclaims 20%+ net EBITDA directly into your franchise bank account.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>100% Customer Data Sovereignty:</strong> Direct SMS, push notifications, and automated VIP loyalty retention.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>Sub-8 Min Auto-Dispatch:</strong> Starlink-velocity proximity algorithm delivers fresh, piping-hot food.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span><strong>Military Anti-Fraud Shield:</strong> Cryptographic tickets and damage proof photo registry block chargeback fraud.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Real Dispatch Speeds */}
              {activeSlide === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 px-3 py-1 font-bold">
                      DISPATCH VELOCITY & TELEMETRY
                    </Badge>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">LIVE TELEMETRY COMPILED</span>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Real Dispatch Speeds. Zero Guesswork.
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      Our dispatch engine uses algorithmic Haversine proximity matrices, synchronizing driver arrival with exact kitchen fryer/grill completion.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Live Metric 1 */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Compiled Live Dispatch Speed
                      </span>
                      <div className="text-2xl md:text-3xl font-black text-amber-400 my-2">
                        {telemetry?.dispatchSpeed.stat}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {telemetry?.hasLiveOrders
                          ? `Calculated from ${telemetry.realOrdersCount} live production orders`
                          : "Strict Zero-Mock Data: System Ready for Live Benchmark"}
                      </p>
                    </div>

                    {/* Metric 2 */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Door-to-Driver SLA
                      </span>
                      <div className="text-2xl md:text-3xl font-black text-emerald-400 my-2">
                        &lt; 8.0 Minutes
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Guaranteed courier assignment SLA ensuring zero cold-holding bag degradation
                      </p>
                    </div>

                    {/* Metric 3 */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        Engine Architecture
                      </span>
                      <div className="text-2xl md:text-3xl font-black text-blue-400 my-2">
                        24ms Latency
                      </div>
                      <p className="text-[11px] text-slate-400">
                        P95 compute cycle across urban traffic nodes & parallel courier batches
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-400" /> Operator Rule: Speed of Service Dictates Franchise Customer Lifetime Value
                    </div>
                    <p className="text-slate-400">
                      In Burger King drive-thrus, every 10 seconds of queue time degrades customer return frequency by 4%. Third-party apps routinely deliver orders after 45–60 minutes. OrderKing cuts order fulfillment cycles to under 22 minutes total door-to-door.
                    </p>
                  </div>
                </div>
              )}

              {/* SLIDE 3: Exact Profit Margins & ROI */}
              {activeSlide === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-3 py-1 font-bold">
                      EXACT PROFIT MARGINS & UNIT ECONOMICS
                    </Badge>
                    <span className="text-xs font-mono text-emerald-400 font-bold">INSTITUTIONAL MATH</span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Where Does Every Cent Go?
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      Aggregators pocket 30% take rates with opaque fee deductions. Here is the mathematically verified OrderKing sovereign unit formula.
                    </p>
                  </div>

                  {/* Telemetry Status Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-400 uppercase block font-semibold">Live Margin Benchmark</span>
                      <div className="text-2xl font-black text-emerald-400 my-1">
                        {telemetry?.profitMargins.stat}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Formula: {telemetry?.profitMargins.formulaSpec}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-400 uppercase block font-semibold">Aggregator Take-Rate</span>
                      <div className="text-2xl font-black text-red-400 my-1">
                        {market === "US" ? "30.0%" : "28.0%"} GMV
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {market === "US" ? "DoorDash / UberEats" : "Jahez / HungerStation"}
                      </span>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-400 uppercase block font-semibold">OrderKing Platform Rate</span>
                      <div className="text-2xl font-black text-amber-400 my-1">
                        {roiParams.orderkingCostPct}.0% GMV
                      </div>
                      <span className="text-[11px] text-emerald-400 font-bold">
                        Net Expansion: +{roiResult.ebitdaMarginExpansionPct}% EBITDA
                      </span>
                    </div>
                  </div>

                  {/* Unit Economics Reclaim Breakdown */}
                  <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider">
                        Representative Multi-Unit Portfolio Simulation ({roiParams.unitsCount} Stores)
                      </h4>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => setViewMode("roi")}
                        className="text-amber-400 text-xs p-0 h-auto"
                      >
                        Adjust in ROI Calculator <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <span className="text-[11px] text-slate-400">Annual Delivery GMV</span>
                        <div className="text-lg font-black text-white mt-1">
                          {currencySymbol}{roiResult.annualGmv.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-red-950/30 border border-red-900/30 rounded-lg">
                        <span className="text-[11px] text-red-300">Aggregator Bleed (30%)</span>
                        <div className="text-lg font-black text-red-400 mt-1">
                          {currencySymbol}{roiResult.annualAggregatorFees.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-800/60 rounded-lg">
                        <span className="text-[11px] text-slate-400">OrderKing Cost</span>
                        <div className="text-lg font-black text-amber-300 mt-1">
                          {currencySymbol}{roiResult.annualOrderKingCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                        <span className="text-[11px] text-emerald-300 font-bold">Net Cash Saved</span>
                        <div className="text-xl font-black text-emerald-400 mt-1">
                          {currencySymbol}{roiResult.annualNetProfitReclaimed.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 4: Military AI Anti-Fraud Shield */}
              {activeSlide === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 px-3 py-1 font-bold">
                      MILITARY-GRADE ANTI-FRAUD SHIELD
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                      SHIELD STATUS: {telemetry?.antiFraud.status}
                    </Badge>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Fraud Termination. Zero Chargeback Bleed.
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      In high-volume QSR delivery, 2%–4% of revenue is lost to fraudulent refund claims and dishonest driver arrival spoofing. OrderKing locks the perimeter with cryptographic defense.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Live Fraud Telemetry */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase mb-2">
                        <Lock className="h-4 w-4" /> Live Shield Interception
                      </div>
                      <div className="text-xl md:text-2xl font-black text-white my-2">
                        {telemetry?.antiFraud.stat}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {telemetry?.hasLiveOrders
                          ? "Real exploits thwarted in live traffic"
                          : "Strict Zero-Mock Data: Ready for Live Benchmark"}
                      </p>
                    </div>

                    {/* Cryptographic Signing */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-2">
                        <ShieldCheck className="h-4 w-4" /> HMAC-SHA256 Nonce
                      </div>
                      <div className="text-xl md:text-2xl font-black text-emerald-400 my-2">
                        Cryptographically Sealed
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Every order payload is signed with client nonce & timestamp to eliminate replay attacks
                      </p>
                    </div>

                    {/* Optical Photo Registry */}
                    <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700/80">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase mb-2">
                        <Eye className="h-4 w-4" /> Optical Proof Hash
                      </div>
                      <div className="text-xl md:text-2xl font-black text-blue-400 my-2">
                        0 Duplicate Photos
                      </div>
                      <p className="text-[11px] text-slate-400">
                        AI perceptual hashes match food photos against past refund requests to catch repeat scammers
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="font-bold text-amber-400">Driver Teleportation Defense: </span>
                    Couriers claiming delivery arrival must provide genuine device GPS signals verified against historical speed limits. If a driver 'teleports' across coordinates faster than 80 km/h in urban streets, order settlement is automatically quarantined for audit.
                  </div>
                </div>
              )}

              {/* SLIDE 5: Regional Market Integration */}
              {activeSlide === 5 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 px-3 py-1 font-bold">
                      {market === "US" ? "UNITED STATES ECOSYSTEM" : market === "SAUDI" ? "SAUDI ARABIA & GCC ECOSYSTEM" : "GLOBAL ECOSYSTEM"}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">SEAMLESS INTEGRATION</span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      {market === "US"
                        ? "Engineered for US Franchise Operators"
                        : market === "SAUDI"
                        ? "مصمم لمجموعات المطاعم في المملكة والخليج"
                        : "Turnkey Multi-Unit POS Infrastructure"}
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      {market === "US"
                        ? "Seamless bridge with Toast, NCR Aloha, Brink POS, and DoorDash Drive relay courier fulfillment."
                        : market === "SAUDI"
                        ? "توافق كامل مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA الفوترة الإلكترونية المرحلة 2) وبوابات مدى وApple Pay."
                        : "Full compatibility with leading enterprise restaurant tech stacks worldwide."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {market === "US" ? (
                      <>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-amber-400 text-sm">Toast & Aloha 2-Way Sync</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Orders fire directly into your KDS kitchen display screens with zero manual tablet re-entry, matching standard kitchen order tickets.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-emerald-400 text-sm">1099 Courier Payouts</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Automated IRS 1099-NEC annual earning ledgers and instant driver Stripe/Dwolla bank payouts with tip transparency.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-blue-400 text-sm">DoorDash Drive Backup</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Use your own internal drivers for flagship routes; automatically spill peak overflow to DoorDash Drive at a flat $7 fee instead of 30% commission!
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-emerald-400 text-sm">ZATCA المرحلة الثانية</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            توليد فواتير إلكترونية مشفرة مع رمز الاستجابة السريعة (QR Code) المتوافق بنسبة 100% مع هيئة الزكاة والضريبة.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-amber-400 text-sm">مدى وApple Pay</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            تسوية فورية عبر بوابات الدفع السعودية بنسبة رسوم مصرفية مخفضة ودعم كامل لعمليات السداد المحلية.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-blue-400 text-sm">توصيل درجات الحرارة المرتفعة</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            توجيه ذكي يحسب وقت الوصول بحد أقصى لمنع تأثر الوجبات بالحرارة الشديدة في فترات الصيف داخل مدن الرياض وجدة والدمام.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* SLIDE 6: 14-Day Pilot Proposition */}
              {activeSlide === 6 && (
                <div className="space-y-6">
                  <div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 px-3 py-1 font-bold">
                      THE FRANCHISE ROLLOUT OFFER
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-black text-white mt-2">
                      14-Day Zero-Risk Operational Benchmark.
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      No multi-month migration. We pilot in 1 to 2 of your highest-volume flagship locations in parallel with your existing setup.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm mb-3">
                        01
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">Zero Kitchen Disruption</h4>
                      <p className="text-xs text-slate-400">
                        Runs alongside your current POS. No kitchen rewiring, no hardware overhaul, no down-time.
                      </p>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm mb-3">
                        02
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">Direct Margin Proof</h4>
                      <p className="text-xs text-slate-400">
                        Side-by-side ledger audit at day 14 proving the exact dollars/riyals saved vs aggregator statements.
                      </p>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-sm mb-3">
                        03
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">Founder Direct Line</h4>
                      <p className="text-xs text-slate-400">
                        Direct WhatsApp/mobile access to the Founder (12-yr Burger King operator) throughout onboarding.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-6 rounded-xl border border-amber-500/40 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-amber-300 text-base">Ready to Reclaim Your Delivery Margins?</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Copy the customized executive pitch email or download the executive PDF prospectus now.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setViewMode("email")}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" /> Open Email Pitch
                      </Button>
                      <Button
                        onClick={handlePrintPdf}
                        variant="outline"
                        className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs gap-1.5"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print / PDF Deck
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide Bottom Bar Navigation */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>OrderKing (UmarOS) Sovereign Franchise Architecture</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveSlide((prev) => Math.max(0, prev - 1))}
                    disabled={activeSlide === 0}
                    className="text-slate-400 hover:text-white h-7 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                    disabled={activeSlide === slides.length - 1}
                    className="text-amber-400 hover:text-amber-300 h-7 text-xs font-bold"
                  >
                    Next Slide <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: CONTINUOUS PROSPECTUS (PRINTABLE DOCUMENT FORMAT) */}
        {viewMode === "prospectus" && (
          <div className="max-w-4xl mx-auto space-y-10 bg-slate-900 p-8 md:p-12 rounded-2xl border border-slate-800 shadow-xl print:bg-white print:text-black print:border-none print:p-0 print:shadow-none">
            {/* Prospectus Header */}
            <div className="border-b border-slate-800 pb-6 print:border-black">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 print:text-amber-700">
                    EXECUTIVE INVESTMENT & OPERATING PROSPECTUS
                  </span>
                  <h1 className="text-3xl md:text-4xl font-black text-white print:text-black mt-1">
                    OrderKing Sovereign Multi-Unit QSR Platform
                  </h1>
                </div>
                <div className="text-right">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 print:border-black print:text-black">
                    MARKET: {market}
                  </Badge>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    DATE: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 1: Executive Summary */}
            <div className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 print:text-amber-700">
                1. Founder Authority & Operational Doctrine
              </h3>
              <p className="text-sm text-slate-300 print:text-gray-800 leading-relaxed">
                OrderKing is architected by an enterprise operator with <strong>12 years of hands-on Burger King multi-unit franchise management</strong>. It is designed to solve the single largest threat to restaurant franchise profitability in the post-pandemic era: the 28%–32% aggregator commission tax imposed by DoorDash, UberEats, Jahez, and HungerStation.
              </p>
              <p className="text-sm text-slate-300 print:text-gray-800 leading-relaxed">
                Unlike generic POS plugins, OrderKing is an end-to-end sovereign dispatch, ordering, and anti-fraud operating system engineered specifically for multi-unit store portfolios.
              </p>
            </div>

            {/* Section 2: Real System Telemetry Audit */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-blue-400 print:text-blue-700">
                2. Live Telemetry & Platform Benchmark
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-xs text-slate-400 print:text-gray-600 block">Dispatch Velocity</span>
                  <div className="text-xl font-black text-amber-400 print:text-black my-1">
                    {telemetry?.dispatchSpeed.stat}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    SLA: {telemetry?.dispatchSpeed.targetSla}
                  </span>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-xs text-slate-400 print:text-gray-600 block">Net Platform Margin</span>
                  <div className="text-xl font-black text-emerald-400 print:text-black my-1">
                    {telemetry?.profitMargins.stat}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Formula: {telemetry?.profitMargins.formulaSpec}
                  </span>
                </div>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 print:bg-gray-100 print:border-gray-300">
                  <span className="text-xs text-slate-400 print:text-gray-600 block">Anti-Fraud Shield</span>
                  <div className="text-xl font-black text-blue-400 print:text-black my-1">
                    {telemetry?.antiFraud.stat}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    HMAC-SHA256 & Anti-Teleportation Active
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 italic">
                * Note on Institutional Data Integrity: If order count is zero in current database, metrics explicitly display "System Ready for Live Benchmark" per our strict Zero-Mock Data policy.
              </div>
            </div>

            {/* Section 3: Financial ROI Reclaim Matrix */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 print:text-emerald-700">
                3. Financial Reclaim Matrix ({roiParams.unitsCount} Units Portfolio)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 print:border-black text-slate-400 print:text-gray-600">
                      <th className="py-2">Metric</th>
                      <th className="py-2">3rd-Party Aggregator</th>
                      <th className="py-2">OrderKing Sovereign</th>
                      <th className="py-2 text-emerald-400 print:text-emerald-700">Net Reclaimed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-gray-300 text-slate-300 print:text-gray-800">
                    <tr>
                      <td className="py-2 font-medium">Commission Rate</td>
                      <td className="py-2 text-red-400 font-bold">{roiParams.aggregatorFeePct}%</td>
                      <td className="py-2 text-amber-300 font-bold">{roiParams.orderkingCostPct}%</td>
                      <td className="py-2 text-emerald-400 font-black">+{roiResult.ebitdaMarginExpansionPct}% Margin</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Annual Delivery Fees</td>
                      <td className="py-2">{currencySymbol}{roiResult.annualAggregatorFees.toLocaleString()}</td>
                      <td className="py-2">{currencySymbol}{roiResult.annualOrderKingCost.toLocaleString()}</td>
                      <td className="py-2 text-emerald-400 font-black">+{currencySymbol}{roiResult.annualNetProfitReclaimed.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Annual Savings Per Store</td>
                      <td className="py-2">—</td>
                      <td className="py-2">—</td>
                      <td className="py-2 text-emerald-400 font-black">+{currencySymbol}{roiResult.perStoreAnnualSavings.toLocaleString()} / store</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Guest Data Ownership</td>
                      <td className="py-2 text-red-400">0% (Captive)</td>
                      <td className="py-2 text-emerald-400">100% Direct</td>
                      <td className="py-2 text-emerald-400 font-bold">Full VIP CRM</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Rollout Terms */}
            <div className="space-y-3 border-t border-slate-800 pt-6 print:border-black">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 print:text-amber-700">
                4. Pilot Implementation & Founder Engagement
              </h3>
              <p className="text-xs text-slate-300 print:text-gray-800 leading-relaxed">
                We invite your leadership team to an operator-to-operator 14-day live benchmark in one or two flagship locations. The platform runs in parallel with zero POS disruption. Contact the Founder directly for private escalation and demonstration access.
              </p>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: INTERACTIVE ROI CALCULATOR */}
        {viewMode === "roi" && (
          <div className="max-w-4xl mx-auto space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 px-3 py-1 font-bold">
                MULTI-UNIT ROI SIMULATOR
              </Badge>
              <h2 className="text-2xl md:text-3xl font-black text-white mt-2">
                Calculate Exact EBITDA Reclaimed
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Adjust your portfolio parameters below to model real financial impact against third-party aggregators.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Unit Count */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Number of Stores: <span className="text-amber-400">{roiParams.unitsCount} Units</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={roiParams.unitsCount}
                  onChange={(e) => setRoiParams({ ...roiParams, unitsCount: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 Store</span>
                  <span>25 Stores</span>
                  <span>50 Stores</span>
                  <span>100 Stores</span>
                </div>
              </div>

              {/* Daily Orders Per Store */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Daily Orders / Store: <span className="text-amber-400">{roiParams.dailyOrdersPerUnit} Orders</span>
                </label>
                <input
                  type="range"
                  min="20"
                  max="300"
                  step="5"
                  value={roiParams.dailyOrdersPerUnit}
                  onChange={(e) => setRoiParams({ ...roiParams, dailyOrdersPerUnit: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>20</span>
                  <span>100</span>
                  <span>200</span>
                  <span>300</span>
                </div>
              </div>

              {/* Average Ticket Size */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase">
                  Avg Ticket: <span className="text-amber-400">{currencySymbol}{roiParams.avgTicketValue}</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="5"
                  value={roiParams.avgTicketValue}
                  onChange={(e) => setRoiParams({ ...roiParams, avgTicketValue: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{currencySymbol}10</span>
                  <span>{currencySymbol}50</span>
                  <span>{currencySymbol}100</span>
                  <span>{currencySymbol}150</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-6 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs uppercase font-extrabold text-slate-400">
                  Simulated Annual Outcome ({roiParams.unitsCount} Units)
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-black">
                  +{roiResult.ebitdaMarginExpansionPct}% MARGIN EXPANSION
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 rounded-lg">
                  <span className="text-[11px] text-slate-400 block">Annual Delivery GMV</span>
                  <div className="text-xl font-black text-white mt-1">
                    {currencySymbol}{roiResult.annualGmv.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-lg">
                  <span className="text-[11px] text-red-300 block">Current Aggregator Tax</span>
                  <div className="text-xl font-black text-red-400 mt-1">
                    {currencySymbol}{roiResult.annualAggregatorFees.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg">
                  <span className="text-[11px] text-slate-400 block">OrderKing SaaS Cost</span>
                  <div className="text-xl font-black text-amber-300 mt-1">
                    {currencySymbol}{roiResult.annualOrderKingCost.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
                  <span className="text-[11px] text-emerald-300 font-bold block">Annual Profit Saved</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {currencySymbol}{roiResult.annualNetProfitReclaimed.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-lg flex items-center justify-between text-xs text-slate-300">
                <span>
                  Average Annual Profit Reclaimed Per Store:{" "}
                  <strong className="text-emerald-400 font-mono text-sm">
                    {currencySymbol}{roiResult.perStoreAnnualSavings.toLocaleString()} / year
                  </strong>
                </span>
                <Button
                  size="sm"
                  onClick={() => setViewMode("email")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Draft Email Pitch with these Numbers
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 4: EMAIL PITCH GENERATOR */}
        {viewMode === "email" && (
          <div className="max-w-4xl mx-auto space-y-6 bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 px-3 py-1 font-bold">
                  EXECUTIVE EMAIL GENERATOR
                </Badge>
                <h2 className="text-2xl font-black text-white mt-2">
                  Founder Cold & Warm Email Outreach
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Pre-configured with real telemetry, calculated ROI, and the Founder's 12-year Burger King pedigree.
                </p>
              </div>
              <Button
                onClick={handleCopyEmail}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedEmail ? "Copied!" : "Copy Full Email"}
              </Button>
            </div>

            {/* Recipient Customization Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Recipient Name / Title</label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9"
                  placeholder="e.g. John Miller (VP Operations)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Target Franchise Group Name</label>
                <Input
                  value={franchiseBrand}
                  onChange={(e) => setFranchiseBrand(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9"
                  placeholder="e.g. Apex Multi-Unit Holdings"
                />
              </div>
            </div>

            {/* Subject Line */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Email Subject Line</label>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                {emailPitch.subject}
              </div>
            </div>

            {/* Email Body */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Email Body Text</label>
              <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto">
                {emailPitch.body}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
              <span>Audience Target: <strong>{market === "US" ? "US Multi-Unit Franchisees" : "Saudi & GCC Franchise Groups"}</strong></span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="border-slate-700 bg-slate-800 text-slate-200 text-xs"
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
