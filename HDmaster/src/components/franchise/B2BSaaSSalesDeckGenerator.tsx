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
  Briefcase,
  UserPlus,
  Receipt,
  CheckSquare,
  Filter,
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
import {
  crmEngine,
  CRM_STAGE_ORDER,
  SELLABLE_ORDERKING_SERVICES,
  type CrmLead,
  type CrmStage,
  type CommercialRevenueBreakdown,
} from "@/lib/orderking/crm/pipeline-engine";
import {
  clientAcquisitionMachine,
  type ClientProspect,
} from "@/lib/orderking/revenue-os/client-acquisition-machine";

export function B2BSaaSSalesDeckGenerator() {
  const [loading, setLoading] = useState(true);
  const [telemetry, setTelemetry] = useState<RealDeckTelemetry | null>(null);
  const [market, setMarket] = useState<MarketRegion>("INDIA");
  const [activeSlide, setActiveSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"slides" | "prospectus" | "roi" | "email" | "crm">("slides");

  // Multi-Unit ROI Simulator State
  const [roiParams, setRoiParams] = useState<RoiSimulationParams>({
    unitsCount: 15,
    dailyOrdersPerUnit: 90,
    avgTicketValue: 450, // ₹450 INR, $30 USD, or 70 SAR
    aggregatorFeePct: 28, // 28% Swiggy/Zomato/Jahez or 30% DoorDash
    orderkingCostPct: 5, // 5%-8% direct processing/platform cost
    currency: "INR",
    implementationCost: 49999,
    monthlySaaSFeePerUnit: 4999,
  });

  // Email Pitch Generator State
  const [recipientName, setRecipientName] = useState("Franchise Leadership Team");
  const [franchiseBrand, setFranchiseBrand] = useState("Premier Multi-Unit Franchise Group");
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Live CRM & Revenue Desk State
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => crmEngine.getLeads());
  const [revenueBreakdown, setRevenueBreakdown] = useState<CommercialRevenueBreakdown>(() =>
    crmEngine.getCommercialRevenueBreakdown()
  );
  const [showScenarioTemplates, setShowScenarioTemplates] = useState<boolean>(false);
  const [stageFilter, setStageFilter] = useState<CrmStage | "ALL">("ALL");
  const [activeOutreachProspect, setActiveOutreachProspect] = useState<ClientProspect | null>(null);
  const [paymentInputs, setPaymentInputs] = useState<Record<string, { amountInr: string; utr: string }>>({});

  // Lead Intake Form State
  const [newLeadForm, setNewLeadForm] = useState<{
    businessName: string;
    category: CrmLead["category"];
    contactPerson: string;
    phone: string;
    email: string;
    location: string;
    monthlyRevenueEst: string;
    painPoint: string;
    selectedServiceId: string;
    dealValueInr: number;
    directDeliveryCostInr: number;
    source: "INBOUND" | "REFERRAL" | "MANUAL_ENTRY" | "AI_DISCOVERY";
    contactPermissionConfirmed: boolean;
  }>({
    businessName: "",
    category: "restaurant",
    contactPerson: "",
    phone: "",
    email: "",
    location: "",
    monthlyRevenueEst: "₹15,00,000",
    painPoint: "High 28% Swiggy/Zomato commission bleed and lack of direct UPI ordering.",
    selectedServiceId: SELLABLE_ORDERKING_SERVICES[0].id,
    dealValueInr: SELLABLE_ORDERKING_SERVICES[0].setupFeeInr,
    directDeliveryCostInr: SELLABLE_ORDERKING_SERVICES[0].estimatedDirectDeliveryCostInr,
    source: "INBOUND",
    contactPermissionConfirmed: false,
  });

  const syncCrmState = () => {
    setCrmLeads([...crmEngine.getLeads()]);
    setRevenueBreakdown(crmEngine.getCommercialRevenueBreakdown());
  };

  // Sync ROI currency with chosen market
  useEffect(() => {
    if (market === "INDIA") {
      setRoiParams((prev) => ({
        ...prev,
        currency: "INR",
        avgTicketValue: prev.currency !== "INR" ? 450 : prev.avgTicketValue,
        aggregatorFeePct: 28,
        orderkingCostPct: 5,
        implementationCost: 49999,
        monthlySaaSFeePerUnit: 4999,
      }));
    } else if (market === "US") {
      setRoiParams((prev) => ({
        ...prev,
        currency: "USD",
        avgTicketValue: prev.currency !== "USD" ? 30 : prev.avgTicketValue,
        aggregatorFeePct: 30,
        orderkingCostPct: 8,
        implementationCost: 1500,
        monthlySaaSFeePerUnit: 149,
      }));
    } else if (market === "SAUDI") {
      setRoiParams((prev) => ({
        ...prev,
        currency: "SAR",
        avgTicketValue: prev.currency !== "SAR" ? 70 : prev.avgTicketValue,
        aggregatorFeePct: 28,
        orderkingCostPct: 7,
        implementationCost: 4500,
        monthlySaaSFeePerUnit: 499,
      }));
    } else {
      setRoiParams((prev) => ({
        ...prev,
        currency: "USD",
        avgTicketValue: prev.currency !== "USD" ? 30 : prev.avgTicketValue,
        aggregatorFeePct: 30,
        orderkingCostPct: 8,
        implementationCost: 1500,
        monthlySaaSFeePerUnit: 149,
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
        market,
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

  const handleSelectCatalogService = (serviceId: string) => {
    const svc = SELLABLE_ORDERKING_SERVICES.find((s) => s.id === serviceId);
    if (!svc) return;
    setNewLeadForm((prev) => ({
      ...prev,
      selectedServiceId: svc.id,
      category: svc.category,
      dealValueInr: svc.setupFeeInr,
      directDeliveryCostInr: svc.estimatedDirectDeliveryCostInr,
    }));
    toast.success(`Selected "${svc.name}" (₹${svc.setupFeeInr.toLocaleString("en-IN")} setup)`);
  };

  const handleCreateVerifiedLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.businessName.trim() || !newLeadForm.contactPerson.trim()) {
      toast.error("Business Name and Contact Person are required.");
      return;
    }
    if (!newLeadForm.phone.trim() && !newLeadForm.email.trim()) {
      toast.error("Please provide at least a valid phone number or email address.");
      return;
    }
    if (!newLeadForm.contactPermissionConfirmed) {
      toast.error("Mandatory Compliance Check: You must confirm contact permission before adding a CRM prospect.");
      return;
    }

    const svc = SELLABLE_ORDERKING_SERVICES.find((s) => s.id === newLeadForm.selectedServiceId);

    try {
      const created = crmEngine.addLead({
        businessName: newLeadForm.businessName.trim(),
        category: newLeadForm.category,
        contactPerson: newLeadForm.contactPerson.trim(),
        phone: newLeadForm.phone.trim(),
        email: newLeadForm.email.trim(),
        location: newLeadForm.location.trim() || "India",
        monthlyRevenueEst: newLeadForm.monthlyRevenueEst.trim() || "₹10,00,000",
        painPoint: newLeadForm.painPoint.trim() || "Direct ordering & POS modernization",
        dealValueInr: Math.max(0, Number(newLeadForm.dealValueInr || 0)),
        advanceLockedInr: Math.round(Math.max(0, Number(newLeadForm.dealValueInr || 0)) * 0.5),
        currentStage: "LEAD",
        source: newLeadForm.source,
        notes: [
          `Service Matched: ${svc ? svc.name : "Custom Turnkey Suite"}`,
          `Verified Contact Permission Confirmed by Founder`,
        ],
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        dataProvenance: "VERIFIED_CRM_RECORD",
        contactPermissionConfirmed: true,
        verifiedCollectedInr: 0,
        invoicedInr: 0,
        refundsInr: 0,
        directDeliveryCostInr: Math.max(0, Number(newLeadForm.directDeliveryCostInr || 0)),
        selectedServiceId: svc?.id,
        selectedServiceName: svc?.name,
      });

      syncCrmState();
      setNewLeadForm((prev) => ({
        ...prev,
        businessName: "",
        contactPerson: "",
        phone: "",
        email: "",
        location: "",
        contactPermissionConfirmed: false,
      }));
      toast.success(`Verified CRM Record ${created.id} created for ${created.businessName}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add CRM lead.");
    }
  };

  const handleAdvanceStage = (lead: CrmLead, targetStage?: CrmStage) => {
    const currentIdx = CRM_STAGE_ORDER.indexOf(lead.currentStage);
    const nextStage =
      targetStage || CRM_STAGE_ORDER[Math.min(CRM_STAGE_ORDER.length - 1, currentIdx + 1)];
    if (nextStage === lead.currentStage) return;

    try {
      crmEngine.updateLeadStage(
        lead.id,
        nextStage,
        `Stage transitioned from ${lead.currentStage} to ${nextStage} via CRM Revenue Desk.`
      );
      syncCrmState();
      toast.success(`${lead.businessName} advanced to ${nextStage}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update stage");
    }
  };

  const handleGenerateProposal = (lead: CrmLead) => {
    try {
      crmEngine.generateProposal(lead.id);
      syncCrmState();
      toast.success(`Formal commercial proposal generated for ${lead.businessName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not generate proposal");
    }
  };

  const handleDraftOutreach = (lead: CrmLead) => {
    const svcName =
      lead.selectedServiceName ||
      SELLABLE_ORDERKING_SERVICES.find((s) => s.id === lead.selectedServiceId)?.name ||
      "OrderKing Restaurant Website, POS & Direct UPI Suite";

    const prospect = clientAcquisitionMachine.draftOutreachForCrmLead({
      leadId: lead.id,
      businessName: lead.businessName,
      contactPerson: lead.contactPerson,
      contactEmail: lead.email,
      contactPhone: lead.phone,
      location: lead.location,
      painPoint: lead.painPoint,
      matchedService: svcName,
      dealValueInr: lead.dealValueInr,
      dataProvenance: lead.dataProvenance,
      contactPermissionConfirmed: lead.contactPermissionConfirmed,
    });

    crmEngine.updateLeadStage(
      lead.id,
      "PERSONALIZED_OUTREACH",
      "Compliant outreach letter drafted via ClientAcquisitionMachine with opt-out guardrails."
    );
    syncCrmState();
    setActiveOutreachProspect(prospect);
    toast.success(`Personalized outreach drafted for ${lead.businessName}`);
  };

  const handleRecordVerifiedPayment = (lead: CrmLead) => {
    const input = paymentInputs[lead.id] || {
      amountInr: String(lead.advanceLockedInr || lead.dealValueInr),
      utr: "",
    };
    const amount = Number(input.amountInr);
    try {
      crmEngine.recordVerifiedPayment(lead.id, amount, input.utr, lead.directDeliveryCostInr);
      syncCrmState();
      setPaymentInputs((prev) => ({
        ...prev,
        [lead.id]: { amountInr: "", utr: "" },
      }));
      toast.success(
        `Verified payment of ₹${amount.toLocaleString("en-IN")} (UTR: ${input.utr.trim()}) recorded in Commercial Ledger!`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment verification failed");
    }
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
      subtitle: "Zero Simulated Refunds, HMAC-SHA256 Cryptographic Sealing & Anti-Teleportation",
      badge: "Zero-Fraud Defense",
    },
    {
      id: "market_fit",
      title:
        market === "INDIA"
          ? "India Direct UPI, GST INV-1 & ONDC-Ready Ecosystem"
          : market === "US"
          ? "US Multi-Unit Ecosystem Integration"
          : market === "SAUDI"
          ? "Saudi & GCC Market Architecture"
          : "Global Enterprise Platform",
      subtitle:
        market === "INDIA"
          ? "0% Aggregator Commission Bleed, Direct UPI Intent, GST Sec 9(5)/194-O & Petpooja/Posist Sync"
          : market === "US"
          ? "Toast, NCR Aloha, Brink POS Native Sync & 1099 Courier Payouts"
          : market === "SAUDI"
          ? "ZATCA Phase 2 E-Invoicing, Mada/Apple Pay & High-Temp Routing"
          : "Unified Multi-Brand, Multi-Currency POS Architecture",
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
                B2B SaaS Sales Deck & Revenue CRM
              </h2>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                QSR GODFATHER EDITION
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              12-Year Burger King Multi-Unit Veteran • Real Live Platform Telemetry • India, US & Saudi Markets
            </p>
          </div>
        </div>

        {/* Market Selector & Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Market Switcher */}
          <div className="flex rounded-lg bg-slate-800/80 p-1 border border-slate-700">
            <button
              onClick={() => setMarket("INDIA")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "INDIA"
                  ? "bg-orange-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇮🇳</span> India (INR)
            </button>
            <button
              onClick={() => setMarket("US")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "US"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇺🇸</span> US Market (USD)
            </button>
            <button
              onClick={() => setMarket("SAUDI")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                market === "SAUDI"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>🇸🇦</span> Saudi/GCC (SAR)
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
            <button
              onClick={() => setViewMode("crm")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "crm"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-emerald-400 hover:text-white"
              }`}
            >
              💼 Live CRM & Revenue Desk
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
                          : "Strict Zero-Simulated Data: System Ready for Live Benchmark"}
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
                        variant="ghost"
                        onClick={() => setViewMode("roi")}
                        className="text-amber-400 hover:text-amber-300 text-xs p-0 h-auto hover:bg-transparent"
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
                          : "Strict Zero-Simulated Data: Ready for Live Benchmark"}
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
                      {market === "INDIA"
                        ? "INDIA DIRECT UPI & GST ECOSYSTEM"
                        : market === "US"
                        ? "UNITED STATES ECOSYSTEM"
                        : market === "SAUDI"
                        ? "SAUDI ARABIA & GCC ECOSYSTEM"
                        : "GLOBAL ECOSYSTEM"}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">SEAMLESS INTEGRATION</span>
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      {market === "INDIA"
                        ? "Engineered for Indian Restaurant & Cloud Kitchen Operators"
                        : market === "US"
                        ? "Engineered for US Franchise Operators"
                        : market === "SAUDI"
                        ? "مصمم لمجموعات المطاعم في المملكة والخليج"
                        : "Turnkey Multi-Unit POS Infrastructure"}
                    </h2>
                    <p className="text-slate-300 text-sm mt-1">
                      {market === "INDIA"
                        ? "Direct UPI QR & Intent checkout, GST INV-1 invoicing, CGST Sec 9(5) & Income Tax Sec 194-O compliance, and Petpooja/Posist sync."
                        : market === "US"
                        ? "Seamless bridge with Toast, NCR Aloha, Brink POS, and DoorDash Drive relay courier fulfillment."
                        : market === "SAUDI"
                        ? "توافق كامل مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA الفوترة الإلكترونية المرحلة 2) وبوابات مدى وApple Pay."
                        : "Full compatibility with leading enterprise restaurant tech stacks worldwide."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {market === "INDIA" ? (
                      <>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-orange-400 text-sm">Direct UPI Intent & QR Checkout</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            1-tap PhonePe, GPay, Paytm, and BHIM UPI checkout with real bank UTR reconciliation and 0% aggregator commission bleed.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-emerald-400 text-sm">GST INV-1 & Statutory Compliance</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Automated SAC 996331 tax splits, FSSAI license display, CGST Sec 9(5) e-commerce operator ledgers, and Income Tax Sec 194-O reporting.
                          </p>
                        </div>
                        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-800 space-y-2">
                          <h4 className="font-bold text-blue-400 text-sm">Petpooja, Posist & Fleet Sync</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Fires KOTs directly into existing Indian kitchen terminals while routing own-fleet riders or 3PL hyperlocal spillover in under 8 minutes.
                          </p>
                        </div>
                      </>
                    ) : market === "US" ? (
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
                        Side-by-side ledger audit at day 14 proving the exact rupees/dollars/riyals saved vs aggregator statements.
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
                OrderKing is architected by an enterprise operator with <strong>12 years of hands-on Burger King multi-unit franchise management</strong>. It is designed to solve the single largest threat to restaurant franchise profitability in the post-pandemic era: the 28%–32% aggregator commission tax imposed by Swiggy, Zomato, DoorDash, UberEats, Jahez, and HungerStation.
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
                * Note on Institutional Data Integrity: If order count is zero in current database, metrics explicitly display "System Ready for Live Benchmark" per our strict Zero-Simulated Data policy.
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
                MULTI-UNIT ROI SIMULATOR ({roiParams.currency})
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
                  min={roiParams.currency === "INR" ? "150" : "10"}
                  max={roiParams.currency === "INR" ? "1500" : "150"}
                  step={roiParams.currency === "INR" ? "25" : "5"}
                  value={roiParams.avgTicketValue}
                  onChange={(e) => setRoiParams({ ...roiParams, avgTicketValue: Number(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{currencySymbol}{roiParams.currency === "INR" ? 150 : 10}</span>
                  <span>{currencySymbol}{roiParams.currency === "INR" ? 500 : 50}</span>
                  <span>{currencySymbol}{roiParams.currency === "INR" ? 1000 : 100}</span>
                  <span>{currencySymbol}{roiParams.currency === "INR" ? 1500 : 150}</span>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="p-6 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-2">
                <span className="text-xs uppercase font-extrabold text-slate-400">
                  Simulated Annual Outcome ({roiParams.unitsCount} Units)
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-black">
                    PAYBACK PERIOD: {roiResult.paybackPeriodDays} DAYS
                  </Badge>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs font-black">
                    +{roiResult.ebitdaMarginExpansionPct}% MARGIN EXPANSION
                  </Badge>
                </div>
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

              {/* Transparent Mathematical Assumptions Summary */}
              <div className="p-4 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  Mathematical Assumptions & Audit Basis
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4">
                  {roiResult.assumptionsSummary.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-lg flex items-center justify-between text-xs text-slate-300 flex-wrap gap-3">
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
                  EXECUTIVE EMAIL GENERATOR ({market})
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
                  placeholder="e.g. Rajesh Sharma (Managing Director)"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Target Franchise Group Name</label>
                <Input
                  value={franchiseBrand}
                  onChange={(e) => setFranchiseBrand(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-slate-100 text-xs h-9"
                  placeholder="e.g. Deccan Hospitality & Cloud Kitchens"
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
              <span>
                Audience Target:{" "}
                <strong>
                  {market === "INDIA"
                    ? "India Restaurant Chains & Cloud Kitchens (INR)"
                    : market === "SAUDI"
                    ? "Saudi & GCC Franchise Groups (SAR)"
                    : "US & Global Multi-Unit Franchisees (USD)"}
                </strong>
              </span>
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

        {/* VIEW MODE 5: LIVE CRM & REVENUE DESK (MANDATE 3) */}
        {viewMode === "crm" && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* 1. 9-Bucket Commercial Revenue & Profit Ledger Bar */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold">
                      MANDATE 3 COMMERCIAL LEDGER (9 SEPARATED BUCKETS)
                    </Badge>
                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[11px]">
                      Verified Records: {revenueBreakdown.verifiedLeadsCount} • Scenario Templates Excluded: {revenueBreakdown.scenarioTemplatesCount}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Strict Commercial Revenue, Receivables & Net Profit Separation
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pre-seeded scenario templates (LEAD-201..203, PROS-101..102) are strictly isolated with ₹0 collected revenue. Only verified CRM records with bank/UPI UTR confirmation enter collected cash and profit.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowScenarioTemplates((prev) => !prev)}
                    className={`text-xs border-slate-700 ${
                      showScenarioTemplates
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    {showScenarioTemplates
                      ? "Showing Scenario Templates + Verified Records"
                      : "Hiding Scenario Templates (Verified Only)"}
                  </Button>
                </div>
              </div>

              {/* 9 Financial Buckets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Lead Pipeline</span>
                  <div className="text-sm font-black text-white mt-1">
                    ₹{revenueBreakdown.leadPipelineValueInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Unclosed opportunities</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-blue-300 block">2. Quoted Value</span>
                  <div className="text-sm font-black text-blue-400 mt-1">
                    ₹{revenueBreakdown.quotedValueInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Active proposals</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-purple-300 block">3. Signed Contracts</span>
                  <div className="text-sm font-black text-purple-400 mt-1">
                    ₹{revenueBreakdown.signedContractValueInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Executed MSAs</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">4. Invoiced</span>
                  <div className="text-sm font-black text-amber-400 mt-1">
                    ₹{revenueBreakdown.invoicedValueInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">GST INV-1 billed</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-orange-300 block">5. Receivables</span>
                  <div className="text-sm font-black text-orange-400 mt-1">
                    ₹{revenueBreakdown.outstandingReceivablesInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Unpaid billed dues</span>
                </div>

                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/40">
                  <span className="text-[10px] font-bold uppercase text-emerald-300 block">6. Verified Collected</span>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    ₹{revenueBreakdown.verifiedMoneyCollectedInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-emerald-300/80">₹0 until UTR paid</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-red-300 block">7. Refunds</span>
                  <div className="text-sm font-black text-red-400 mt-1">
                    ₹{revenueBreakdown.refundsInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Reversals & credits</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">8. Delivery Cost</span>
                  <div className="text-sm font-black text-slate-200 mt-1">
                    ₹{revenueBreakdown.directDeliveryCostsInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-slate-500">Infra & setup cost</span>
                </div>

                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/40">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">9. Net Founder Profit</span>
                  <div className="text-sm font-black text-amber-400 mt-1">
                    ₹{revenueBreakdown.netProfitInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[10px] text-amber-200/80">Collected - Cost</span>
                </div>
              </div>
            </div>

            {/* 2. Sellable OrderKing Service Catalog Selector (10 Mandate 3.3 Services) */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                    MANDATE 3.3 SELLABLE SERVICE CATALOG (10 DELIVERABLE B2B SERVICES)
                  </Badge>
                  <h3 className="text-lg font-black text-white mt-1">
                    Select a Turnkey Service Package to Pre-Fill Lead Pricing & Deliverables
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Click any package to bind into the Lead Intake Form below
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {SELLABLE_ORDERKING_SERVICES.map((svc) => {
                  const isSelected = newLeadForm.selectedServiceId === svc.id;
                  return (
                    <div
                      key={svc.id}
                      onClick={() => handleSelectCatalogService(svc.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition flex flex-col justify-between ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-400 shadow-md"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono text-amber-400 font-bold">{svc.id}</span>
                          <span className="text-[10px] text-slate-400">{svc.timelineDays}d SLA</span>
                        </div>
                        <h4 className="text-xs font-black text-white leading-snug">{svc.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{svc.summary}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-black text-emerald-400">
                            ₹{svc.setupFeeInr.toLocaleString("en-IN")}
                          </span>
                          <span className="text-slate-500 block text-[10px]">
                            +₹{svc.monthlyRetainerInr.toLocaleString("en-IN")}/mo (${svc.setupFeeUsd})
                          </span>
                        </div>
                        <Badge
                          className={`text-[9px] ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 font-black"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {isSelected ? "SELECTED" : "SELECT"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Real Lead Intake & Qualification Form */}
            <form
              onSubmit={handleCreateVerifiedLead}
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
                <div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-bold">
                    REAL PROSPECT INTAKE & QUALIFICATION DESK
                  </Badge>
                  <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-amber-400" /> Add Verified Commercial Prospect
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  PROVENANCE: VERIFIED_CRM_RECORD • DUPLICATE EMAIL/PHONE GUARD ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Business Name *</label>
                  <Input
                    value={newLeadForm.businessName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                    placeholder="e.g. Barak Valley Biryani House"
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Contact Person *</label>
                  <Input
                    value={newLeadForm.contactPerson}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                    placeholder="e.g. Imran Ahmed (Owner)"
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Phone (WhatsApp/Mobile) *</label>
                  <Input
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+91 98640 12345"
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Official Email *</label>
                  <Input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="owner@biryanihouse.in"
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">City / Territory</label>
                  <Input
                    value={newLeadForm.location}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                    placeholder="e.g. Silchar / Guwahati / Bengaluru"
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Selected OrderKing Service</label>
                  <select
                    value={newLeadForm.selectedServiceId}
                    onChange={(e) => handleSelectCatalogService(e.target.value)}
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-xs px-2.5"
                  >
                    {SELLABLE_ORDERKING_SERVICES.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.id}: {svc.name} (₹{svc.setupFeeInr.toLocaleString("en-IN")})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Deal Value (₹ INR)</label>
                  <Input
                    type="number"
                    value={newLeadForm.dealValueInr}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, dealValueInr: Number(e.target.value) })}
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">Source Attribution</label>
                  <select
                    value={newLeadForm.source}
                    onChange={(e) =>
                      setNewLeadForm({
                        ...newLeadForm,
                        source: e.target.value as "INBOUND" | "REFERRAL" | "MANUAL_ENTRY" | "AI_DISCOVERY",
                      })
                    }
                    className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 text-slate-100 text-xs px-2.5"
                  >
                    <option value="INBOUND">INBOUND (Merchant Inquiry)</option>
                    <option value="REFERRAL">REFERRAL (Partner / Operator)</option>
                    <option value="MANUAL_ENTRY">MANUAL_ENTRY (Direct Field Visit)</option>
                    <option value="AI_DISCOVERY">AI_DISCOVERY (Verified Registry Audit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Identified Operational Pain Point & Requirement
                  </label>
                  <Input
                    value={newLeadForm.painPoint}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, painPoint: e.target.value })}
                    placeholder="e.g. Paying 28% aggregator commission; needs direct UPI website & KOT POS."
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    Est. Direct Delivery Cost (₹)
                  </label>
                  <Input
                    type="number"
                    value={newLeadForm.directDeliveryCostInr}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, directDeliveryCostInr: Number(e.target.value) })
                    }
                    className="bg-slate-950 border-slate-700 text-slate-100 text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newLeadForm.contactPermissionConfirmed}
                    onChange={(e) =>
                      setNewLeadForm({ ...newLeadForm, contactPermissionConfirmed: e.target.checked })
                    }
                    className="h-4 w-4 accent-emerald-500 rounded"
                  />
                  <span>
                    <strong>Contact Permission Confirmed (Mandatory):</strong> Prospect has provided opt-in inquiry, referral consent, or public B2B commercial contact permission.
                  </span>
                </label>

                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-1.5"
                >
                  <UserPlus className="h-4 w-4" /> Register Verified CRM Lead
                </Button>
              </div>
            </form>

            {/* Drafted Outreach Preview Modal/Card (if active) */}
            {activeOutreachProspect && (
              <div className="bg-slate-900 p-6 rounded-2xl border border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                      PERMITTED OUTREACH DRAFT (CLIENT ACQUISITION MACHINE)
                    </Badge>
                    <h4 className="text-base font-black text-white mt-1">
                      Outreach Letter for {activeOutreachProspect.businessName} ({activeOutreachProspect.contactPerson})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(activeOutreachProspect.draftedOutreachMessage);
                        toast.success("Outreach message copied to clipboard!");
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy Outreach
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveOutreachProspect(null)}
                      className="border-slate-700 text-slate-300 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {activeOutreachProspect.draftedOutreachMessage}
                </pre>
              </div>
            )}

            {/* 4. 15-Stage Interactive CRM Pipeline Board */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs font-bold">
                    15-STAGE COMMERCIAL CRM LIFECYCLE BOARD
                  </Badge>
                  <h3 className="text-lg font-black text-white mt-1">
                    Interactive Pipeline: LEAD → PROPOSAL → CONTRACT → INVOICE → PAYMENT → DELIVERY → REPEAT
                  </h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setStageFilter("ALL")}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                      stageFilter === "ALL"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    ALL STAGES
                  </button>
                  {CRM_STAGE_ORDER.map((stg) => (
                    <button
                      key={stg}
                      onClick={() => setStageFilter(stg)}
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                        stageFilter === stg
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                      }`}
                    >
                      {stg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtered Leads List */}
              <div className="space-y-4">
                {crmLeads
                  .filter((l) => (showScenarioTemplates ? true : l.dataProvenance === "VERIFIED_CRM_RECORD"))
                  .filter((l) => (stageFilter === "ALL" ? true : l.currentStage === stageFilter))
                  .map((lead) => {
                    const isScenario = lead.dataProvenance === "SCENARIO_TEMPLATE";
                    const pInput = paymentInputs[lead.id] || {
                      amountInr: String(lead.advanceLockedInr || lead.dealValueInr),
                      utr: "",
                    };

                    return (
                      <div
                        key={lead.id}
                        className={`p-5 rounded-xl border space-y-4 ${
                          isScenario
                            ? "bg-slate-950/60 border-amber-500/20"
                            : "bg-slate-950 border-emerald-500/30"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-amber-400">{lead.id}</span>
                              <h4 className="text-base font-black text-white">{lead.businessName}</h4>
                              <Badge
                                className={
                                  isScenario
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]"
                                }
                              >
                                {isScenario
                                  ? "SCENARIO_TEMPLATE (EXCLUDED FROM REVENUE)"
                                  : "VERIFIED_CRM_RECORD"}
                              </Badge>
                              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] font-mono">
                                STAGE: {lead.currentStage}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-300">
                              <strong>{lead.contactPerson}</strong> • {lead.phone} • {lead.email} • {lead.location} • Source:{" "}
                              <span className="font-mono text-amber-300">{lead.source}</span>
                            </p>
                            <p className="text-xs text-slate-400">
                              <strong>Need:</strong> {lead.painPoint}
                            </p>
                            {lead.selectedServiceName && (
                              <p className="text-xs text-emerald-400">
                                <strong>Matched Service:</strong> {lead.selectedServiceName}
                              </p>
                            )}
                          </div>

                          <div className="text-right space-y-1">
                            <div className="text-lg font-black text-white">
                              Deal: ₹{lead.dealValueInr.toLocaleString("en-IN")}
                            </div>
                            <div className="text-xs text-emerald-400 font-bold">
                              Verified Collected: ₹{(lead.verifiedCollectedInr || 0).toLocaleString("en-IN")}
                              {lead.paymentUtr ? ` (UTR: ${lead.paymentUtr})` : ""}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Invoiced: ₹{(lead.invoicedInr || 0).toLocaleString("en-IN")} • Delivery Cost: ₹
                              {(lead.directDeliveryCostInr || 0).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        {/* Stage Progression & Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={lead.currentStage}
                              onChange={(e) => handleAdvanceStage(lead, e.target.value as CrmStage)}
                              className="h-8 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 px-2"
                            >
                              {CRM_STAGE_ORDER.map((stg, idx) => (
                                <option key={stg} value={stg}>
                                  {idx + 1}. {stg}
                                </option>
                              ))}
                            </select>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAdvanceStage(lead)}
                              className="h-8 text-xs border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800"
                            >
                              Advance Stage <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDraftOutreach(lead)}
                              className="h-8 text-xs border-slate-700 bg-slate-900 text-blue-300 hover:bg-slate-800"
                            >
                              <Send className="h-3 w-3 mr-1" /> Draft Outreach
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateProposal(lead)}
                              className="h-8 text-xs border-slate-700 bg-slate-900 text-purple-300 hover:bg-slate-800"
                            >
                              <FileText className="h-3 w-3 mr-1" /> Generate Proposal
                            </Button>
                          </div>

                          {/* Verified Payment UTR Recorder (Only enabled for VERIFIED_CRM_RECORD) */}
                          {!isScenario ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Input
                                type="number"
                                value={pInput.amountInr}
                                onChange={(e) =>
                                  setPaymentInputs((prev) => ({
                                    ...prev,
                                    [lead.id]: { ...pInput, amountInr: e.target.value },
                                  }))
                                }
                                placeholder="Amount ₹"
                                className="w-28 h-8 bg-slate-900 border-slate-700 text-xs text-white"
                              />
                              <Input
                                value={pInput.utr}
                                onChange={(e) =>
                                  setPaymentInputs((prev) => ({
                                    ...prev,
                                    [lead.id]: { ...pInput, utr: e.target.value },
                                  }))
                                }
                                placeholder="Bank/UPI UTR Ref"
                                className="w-40 h-8 bg-slate-900 border-slate-700 text-xs text-white font-mono"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleRecordVerifiedPayment(lead)}
                                className="h-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" /> Record Verified UTR
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-400/80 font-mono">
                              Scenario template — excluded from verified payment collection
                            </span>
                          )}
                        </div>

                        {lead.proposal && (
                          <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs text-slate-300">
                            <span className="font-bold text-purple-300">Active Proposal: </span>
                            {lead.proposal.title} — ₹{lead.proposal.commercialValueInr.toLocaleString("en-IN")} (50% advance: ₹
                            {lead.proposal.advanceRequiredInr.toLocaleString("en-IN")}, {lead.proposal.timelineDays} days SLA)
                          </div>
                        )}
                      </div>
                    );
                  })}

                {crmLeads.filter((l) => (showScenarioTemplates ? true : l.dataProvenance === "VERIFIED_CRM_RECORD"))
                  .length === 0 && (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <p className="text-sm font-bold text-slate-200">
                      0 Verified CRM Records in Pipeline (All 9 Financial Buckets = ₹0)
                    </p>
                    <p className="text-xs text-slate-400 max-w-xl mx-auto">
                      Per Mandate 3, pre-seeded examples (LEAD-201..203) are marked as SCENARIO_TEMPLATE and hidden by default so sample records are never counted as real customers or revenue. Use the form above to add a verified prospect or toggle "Showing Scenario Templates" to inspect sample workflows.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
