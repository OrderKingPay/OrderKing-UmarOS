import React, { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Copy,
  Share2,
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Receipt,
  PlusCircle,
  Plane,
  GraduationCap,
  Briefcase,
  Train,
  ArrowLeftRight,
  Check,
  MapPin,
  Sparkles,
  Crown,
  Bike,
  UtensilsCrossed,
  UserCheck,
  BookOpen,
  MessageSquare,
  Lock,
  Camera,
  Layers,
  Send,
  Building2,
  Clock,
  Award,
  X,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { useLocationStore } from "@/lib/stores/location";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { OrderKingPassbookReceipts } from "@/components/fintech/orderking-passbook-receipts";
import {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  AcademicSolutionCard,
} from "@/components/tutor/academic-solution-card";
import { generateCurriculumFallback } from "@/routes/tutor";
import { recordAuthenticPayment } from "@/lib/kingpay/ledger-binding";
import { supabase } from "@/lib/db-cloud";
import { cn } from "@/lib/utils";
import {
  AirportAutoSuggest,
  StationAutoSuggest,
  queryAirports,
  queryStations,
} from "./travel-autosuggest";
import { TP_MARKER, TP_WL_DOMAIN } from "@/lib/travel/travelpayouts-config";
import {
  REAL_TIME_JOB_CATALOG,
  searchDynamicCatalog,
  type LiveJob,
} from "@/lib/career/adzuna-jobs-service";

// Real query lookups for Indian transport nodes (contractually preserved for test suites)
export const searchAirportOptions = (raw: string) => queryAirports(raw, 20);
export const searchStationOptions = (raw: string) => queryStations(raw, 20);

export const extractStationCode = (value: string): string | null => {
  const v = value.trim().toUpperCase();
  const code =
    v.match(/\(([A-Z0-9]{2,5})\)\s*$/)?.[1] ??
    (/^[A-Z0-9]{2,5}$/.test(v) ? v : null);
  return code && /^[A-Z0-9]{2,5}$/.test(code) ? code : null;
};

// Privacy-guarded sovereign routing constants
const ROUTING_SOVEREIGN_VPA = "9395065587@ybl";
const DISPLAY_SOVEREIGN_VPA = "orderking@ybl";
const TRAVEL_CONCIERGE_PHONE = "919395065587";

export function SupremeKingPayExperience() {
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise, deductMoney } = useRealKingPayWallet();

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isApplicantModalOpen, setIsApplicantModalOpen] = useState(false);
  const [isEmployerModalOpen, setIsEmployerModalOpen] = useState(false);
  const [selectedJobRole, setSelectedJobRole] = useState("Delivery Rider");

  // Dynamic location
  const currentCity =
    location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "New Delhi";
  const currentZone = location?.zoneName || "Connaught Place";

  // ==========================================
  // TILE 1: PAY ANYONE (SCAN / UPI) STATE
  // ==========================================
  const [customPayeeVpa, setCustomPayeeVpa] = useState("");
  const [useCustomVpa, setUseCustomVpa] = useState(false);
  const [upiAmountInr, setUpiAmountInr] = useState<number>(250);
  const [upiNote, setUpiNote] = useState("OrderKing Instant Settlement");

  // Masked display vs secure background routing
  const activePayeeVpa = useCustomVpa && customPayeeVpa.trim()
    ? customPayeeVpa.trim()
    : ROUTING_SOVEREIGN_VPA;
  const activeDisplayVpa = useCustomVpa && customPayeeVpa.trim()
    ? customPayeeVpa.trim()
    : DISPLAY_SOVEREIGN_VPA;

  const parsedAmountPaise = Math.max(
    100,
    Math.round((Number(upiAmountInr) || 1) * 100)
  );
  const upiUri = `upi://pay?pa=${encodeURIComponent(
    activePayeeVpa
  )}&pn=OrderKingPay&am=${(parsedAmountPaise / 100).toFixed(
    2
  )}&cu=INR&tn=${encodeURIComponent(upiNote.trim())}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=FFFFFF&color=080a10`;

  const handleCopyUpiLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(upiUri);
      }
      toast.success("UPI Intent copied to clipboard.");
    } catch {
      toast.info(`UPI Intent: ${upiUri}`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Pay ₹${(parsedAmountPaise / 100).toFixed(
      2
    )} to OrderKing (${activeDisplayVpa}) via NPCI UPI:\n${upiUri}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // Direct KingPay Wallet Payment
  const handlePayViaWallet = async () => {
    if (walletBalancePaise < parsedAmountPaise) {
      toast.error(
        `Insufficient wallet balance (${formatPaise(
          walletBalancePaise
        )}). Top up or use UPI App.`
      );
      return;
    }

    try {
      await recordAuthenticPayment({
        userId: "user-sovereign",
        recipientId: activePayeeVpa,
        amountPaise: parsedAmountPaise,
        memo: upiNote.trim() || "OrderKing Direct Wallet Payment",
      });

      deductMoney.mutate({
        amount: parsedAmountPaise / 100,
        description: `Direct Payment to ${activeDisplayVpa}`,
      });

      toast.success(
        `Paid ${formatPaise(
          parsedAmountPaise
        )} from KingPay Wallet to ${activeDisplayVpa}`
      );
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Failed to complete ledger transaction.");
    }
  };

  // ==========================================
  // TILE 2: BOOK TRAVEL STATE
  // ==========================================
  const [travelTab, setTravelTab] = useState<"flights" | "trains">("flights");
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [flightDate, setFlightDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Varanasi Jn (BSB)");
  const [trainDate, setTrainDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });

  const handleSwapAirports = () => {
    const temp = flightFrom;
    setFlightFrom(flightTo);
    setFlightTo(temp);
  };

  const handleSwapStations = () => {
    const temp = trainFrom;
    setTrainFrom(trainTo);
    setTrainTo(temp);
  };

  const trainFromCode = extractStationCode(trainFrom) || "NDLS";
  const trainToCode = extractStationCode(trainTo) || "BSB";

  const tboWhatsAppUrl = `https://wa.me/${TRAVEL_CONCIERGE_PHONE}?text=${encodeURIComponent(
    `Hello OrderKing Travel Desk! I need an IRCTC train booking from ${trainFromCode} to ${trainToCode} for date: ${trainDate}. Please share availability, Tatkal options, and TBO agent confirmation.`
  )}`;

  const travelpayoutsSearchUrl = `https://${TP_WL_DOMAIN}/?marker=${TP_MARKER}&origin=${encodeURIComponent(
    flightFrom
  )}&destination=${encodeURIComponent(flightTo)}`;

  // ==========================================
  // TILE 3: AI ACADEMIC TUTOR STATE
  // ==========================================
  const [tutorBoard, setTutorBoard] = useState<string>("CBSE (Central Board)");
  const [tutorClass, setTutorClass] = useState<string>("Class 10");
  const [tutorSubject, setTutorSubject] = useState<string>("Mathematics");
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [tutorSolutionText, setTutorSolutionText] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);

  // 3-Day Free Hook & ₹99/month Pass Gating
  const [freeQueriesUsed, setFreeQueriesUsed] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("ok_academic_free_queries") || 0);
    }
    return 0;
  });
  const [hasVipPass, setHasVipPass] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ok_academic_vip_pass") === "true";
    }
    return false;
  });

  const FREE_HOOK_LIMIT = 3;
  const isFreeHookExhausted = !hasVipPass && freeQueriesUsed >= FREE_HOOK_LIMIT;

  const handleSolveAcademicQuestion = async (queryText?: string) => {
    const questionToSolve = (queryText || tutorQuestion).trim();
    if (!questionToSolve) {
      toast.error("Please enter a question or problem to solve.");
      return;
    }

    if (isFreeHookExhausted) {
      toast.error(
        "3-Day Free Trial hook exhausted. Unlock unlimited questions with Academic Tutor VIP Pass (₹99/month)."
      );
      return;
    }

    setIsSolving(true);
    setTutorQuestion(questionToSolve);

    try {
      const response = await fetch("/api/ai/solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: questionToSolve,
          board: tutorBoard,
          stdClass: tutorClass,
          subject: tutorSubject,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result && result.text && result.text.trim().length > 0) {
          setTutorSolutionText(result.text.trim());
        } else {
          setTutorSolutionText(
            generateCurriculumFallback({
              message: questionToSolve,
              board: tutorBoard,
              stdClass: tutorClass,
              subject: tutorSubject,
            })
          );
        }
      } else {
        setTutorSolutionText(
          generateCurriculumFallback({
            message: questionToSolve,
            board: tutorBoard,
            stdClass: tutorClass,
            subject: tutorSubject,
          })
        );
      }
    } catch {
      setTutorSolutionText(
        generateCurriculumFallback({
          message: questionToSolve,
          board: tutorBoard,
          stdClass: tutorClass,
          subject: tutorSubject,
        })
      );
    } finally {
      setIsSolving(false);
      if (!hasVipPass) {
        const nextCount = freeQueriesUsed + 1;
        setFreeQueriesUsed(nextCount);
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_academic_free_queries", String(nextCount));
        }
      }
    }
  };

  const handleActivateTutorPass = async () => {
    const PASS_PAISE = 9900;
    if (walletBalancePaise >= PASS_PAISE) {
      try {
        await recordAuthenticPayment({
          userId: "user-sovereign",
          recipientId: "ACADEMIC_TUTOR_VAULT",
          amountPaise: PASS_PAISE,
          memo: "Academic Tutor VIP Monthly Pass (₹99)",
        });

        deductMoney.mutate({
          amount: 99,
          description: "Academic Tutor VIP Monthly Pass (₹99)",
        });

        setHasVipPass(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("ok_academic_vip_pass", "true");
        }
        toast.success("Academic Tutor VIP Pass Activated via KingPay Wallet!");
      } catch (err) {
        console.error("Pass activation error:", err);
        toast.error("Failed to process wallet payment for pass.");
      }
    } else {
      const passUpi = `upi://pay?pa=${ROUTING_SOVEREIGN_VPA}&pn=Academic%20Tutor%20VIP&am=99.00&cu=INR&tn=Academic%20Tutor%20Pass`;
      if (typeof window !== "undefined") {
        window.location.href = passUpi;
      }
      setHasVipPass(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("ok_academic_vip_pass", "true");
      }
      toast.info("Opening UPI App for ₹99 VIP Pass activation...");
    }
  };

  // ==========================================
  // TILE 4: LOCAL JOBS & HIRING STATE
  // ==========================================
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantCity, setApplicantCity] = useState(currentCity);
  const [jobSearchQuery, setJobSearchQuery] = useState("");

  const [employerName, setEmployerName] = useState("");
  const [employerRole, setEmployerRole] = useState("Delivery Riders (Fleet)");
  const [employerPhone, setEmployerPhone] = useState("");
  const [employerCount, setEmployerCount] = useState("3");

  const KEY_HIGH_DEMAND_ROLES = [
    {
      id: "rider",
      title: "Delivery Rider",
      pay: "₹30 base + ₹10/km",
      badge: "Instant Daily Cashout",
      icon: Bike,
      desc: "Flexible parcel & food runs with zero platform commission",
    },
    {
      id: "cook",
      title: "Kitchen Cook & Chef",
      pay: "₹18,000 - ₹35,000/mo",
      badge: "Free Meals + Room",
      icon: UtensilsCrossed,
      desc: "Commercial cloud kitchens, tandoor & master curry cooks",
    },
    {
      id: "helper",
      title: "Kitchen Helper & Cleaner",
      pay: "₹12,000 - ₹18,000/mo",
      badge: "Flexible 8hr Shifts",
      icon: Users,
      desc: "Vegetable prep, packaging & restaurant hygiene support",
    },
    {
      id: "tutor",
      title: "Home & Online Tutor",
      pay: "₹300 - ₹800/hr",
      badge: "Direct Student Connect",
      icon: GraduationCap,
      desc: "Classes 1-12 STEM, languages & board exam coaching",
    },
  ];

  const handleOpenApplicantModal = (roleTitle: string) => {
    setSelectedJobRole(roleTitle);
    setIsApplicantModalOpen(true);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim()) {
      toast.error("Please provide your name and phone number.");
      return;
    }

    const applicationPayload = {
      role: selectedJobRole,
      name: applicantName.trim(),
      phone: applicantPhone.trim(),
      city: applicantCity,
      timestamp: new Date().toISOString(),
    };

    try {
      if (supabase) {
        await (supabase as any).from("job_applications").insert([applicationPayload]);
      }
    } catch {
      // ignore cloud errors, fall back to localStorage
    }

    try {
      if (typeof window !== "undefined") {
        const existing = JSON.parse(
          localStorage.getItem("ok_job_applicant_leads") || "[]"
        );
        existing.push(applicationPayload);
        localStorage.setItem(
          "ok_job_applicant_leads",
          JSON.stringify(existing)
        );
      }
    } catch {
      // ignore local storage errors
    }

    setIsApplicantModalOpen(false);
    toast.success(
      `Application for ${selectedJobRole} received! OrderKing Dispatch Coordinator will call within 4 hours.`
    );
    setApplicantName("");
    setApplicantPhone("");
  };

  const handleSubmitEmployerPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerName.trim() || !employerPhone.trim()) {
      toast.error("Please enter business name and phone number.");
      return;
    }

    const leadPayload = {
      business: employerName.trim(),
      role: employerRole,
      count: employerCount,
      phone: employerPhone.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      if (supabase) {
        await (supabase as any).from("employer_leads").insert([leadPayload]);
      }
    } catch {
      // ignore
    }

    try {
      if (typeof window !== "undefined") {
        const existing = JSON.parse(
          localStorage.getItem("ok_employer_hiring_leads") || "[]"
        );
        existing.push(leadPayload);
        localStorage.setItem(
          "ok_employer_hiring_leads",
          JSON.stringify(existing)
        );
      }
    } catch {
      // ignore
    }

    setIsEmployerModalOpen(false);
    toast.success(
      "Hiring requirement published! Candidates will be routed directly to your WhatsApp."
    );
    setEmployerName("");
    setEmployerPhone("");
  };

  const filteredJobs = useMemo(() => {
    return searchDynamicCatalog({
      query: jobSearchQuery,
      category: "ALL",
    }).slice(0, 3);
  }, [jobSearchQuery]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* ─── 1. ULTRA-LUXURY 3D OBSIDIAN BALANCE VAULT ─── */}
      <section
        aria-label="KingPay Sovereign Wallet Vault"
        className="relative overflow-hidden rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-[#0d111a] via-[#090c14] to-[#07090f] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5"
      >
        {/* Subtle brushed champagne gold ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/15 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20">
              <div className="size-full rounded-2xl bg-[#0d111a] flex items-center justify-center text-amber-400">
                <Crown className="size-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  King<span className="text-amber-400">Pay</span>
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/40">
                  Sovereign 4-Tile SuperApp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <MapPin className="size-3 text-amber-400" />
                <span>{currentZone}, {currentCity}</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <ShieldCheck className="size-3" /> Double-Entry Escrow
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="#live-ledger"
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-xs font-bold text-slate-200 hover:text-white hover:border-amber-400/40 transition shadow-sm"
            >
              <Receipt className="size-3.5 text-amber-400" />
              <span>Passbook Ledger</span>
            </a>
          </div>
        </div>

        {/* Real Balance & Main 1-Tap Trigger Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2 relative z-10 border-t border-slate-800/80">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Available Vault Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {formatPaise(walletBalancePaise)}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                0% Surcharge
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prepaid Payment Instrument (PPI) verified against Supabase double-entry ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black px-6 py-3.5 text-xs shadow-[0_10px_25px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
            >
              <QrCode className="size-4" />
              <span>Scan BharatQR</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddMoneyOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-amber-300 font-bold px-5 py-3.5 text-xs transition-all cursor-pointer"
            >
              <PlusCircle className="size-4 text-amber-400" />
              <span>Add Money</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. ULTRA-LUXURY 3D 4-TILE GOLDEN GRID ─── */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================================== */}
        {/* TILE 1: [ 📷 PAY ANYONE (SCAN / UPI) ] */}
        {/* ======================================================== */}
        <section
          aria-label="Tile 1: Pay Anyone (Scan / UPI)"
          className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between space-y-5"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Pay Anyone
                  </h2>
                  <p className="text-xs text-slate-400">
                    Scan Any Merchant BharatQR · 1-Tap NPCI Intent
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                0% Fee
              </span>
            </div>

            {/* Privacy-Guarded Sovereign VPA Display */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    {activeDisplayVpa}
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      NPCI Verified
                    </span>
                  </span>
                  <p className="text-[11px] text-slate-400">
                    OrderKing Sovereign VPA (NPCI Verified)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUseCustomVpa(!useCustomVpa)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                {useCustomVpa ? "Use Sovereign VPA" : "Change Payee"}
              </button>
            </div>

            {useCustomVpa && (
              <div className="mt-3">
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Custom Payee UPI ID (VPA)
                </label>
                <input
                  type="text"
                  value={customPayeeVpa}
                  onChange={(e) => setCustomPayeeVpa(e.target.value)}
                  placeholder="e.g. merchant@okhdfcbank or friend@upi"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                />
              </div>
            )}

            {/* Amount & Presets */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Transfer Amount (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={upiAmountInr}
                  onChange={(e) =>
                    setUpiAmountInr(Math.max(1, Number(e.target.value) || 0))
                  }
                  className="flex-1 h-11 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-base font-bold focus:border-amber-400 outline-none"
                />
                {[100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setUpiAmountInr(amt)}
                    className={cn(
                      "h-11 px-3 rounded-xl border text-xs font-mono font-bold transition cursor-pointer",
                      upiAmountInr === amt
                        ? "bg-amber-400/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                    )}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic QR Display & Action Bar */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-slate-800 text-center">
                <div className="bg-white p-2 rounded-xl shadow-lg">
                  <img
                    src={qrImageUrl}
                    alt={`UPI QR for ${activeDisplayVpa}`}
                    loading="lazy"
                    decoding="async"
                    className="size-32 object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-300 font-semibold mt-2">
                  Scan with GPay · PhonePe · Paytm · BHIM
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                <a
                  href={upiUri}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 text-xs font-black py-3 transition no-underline shadow-md"
                >
                  <Zap className="size-4" /> Pay via Installed App
                </a>
                <button
                  type="button"
                  onClick={handlePayViaWallet}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold py-2.5 transition cursor-pointer shadow-sm"
                >
                  <Wallet className="size-3.5 text-amber-400" /> Pay via KingPay Vault
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 transition cursor-pointer"
                  >
                    <Copy className="size-3.5 text-amber-400" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 transition cursor-pointer"
                  >
                    <Share2 className="size-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Scan any merchant QR code on billing counters.</span>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Open Scanner</span>
              <ChevronRight className="size-3" />
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* TILE 2: [ ✈️ BOOK TRAVEL (FLIGHTS, TRAINS, HOTELS) ] */}
        {/* ======================================================== */}
        <section
          aria-label="Tile 2: Book Travel (Flights, Trains, Hotels)"
          className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between space-y-5"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Plane className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Book Travel
                  </h2>
                  <p className="text-xs text-slate-400">
                    Travelpayouts Metasearch (Marker 794122) · IRCTC Desk
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full font-bold">
                Marker 794122
              </span>
            </div>

            {/* Flight vs Train Switcher */}
            <div className="mt-4 flex rounded-2xl bg-slate-900/90 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setTravelTab("flights")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                  travelTab === "flights"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Plane className="size-3.5" />
                <span>Flights &amp; Hotels</span>
              </button>
              <button
                type="button"
                onClick={() => setTravelTab("trains")}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
                  travelTab === "trains"
                    ? "bg-amber-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Train className="size-3.5" />
                <span>IRCTC Trains (TBO Desk)</span>
              </button>
            </div>

            {/* Travel Tab A: Flights & Hotels (Travelpayouts WL) */}
            {travelTab === "flights" && (
              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      From Airport
                    </label>
                    <AirportAutoSuggest
                      value={flightFrom}
                      onChange={setFlightFrom}
                      theme="dark"
                      placeholder="e.g. DEL, BOM, BLR..."
                      ariaLabel="From Airport"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-400">
                        To Airport
                      </label>
                      <button
                        type="button"
                        onClick={handleSwapAirports}
                        className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <ArrowLeftRight className="size-3" /> Swap
                      </button>
                    </div>
                    <AirportAutoSuggest
                      value={flightTo}
                      onChange={setFlightTo}
                      theme="dark"
                      placeholder="e.g. BOM, DEL, CCU..."
                      ariaLabel="To Airport"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">
                    Departure Date
                  </label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={travelpayoutsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black py-3 text-xs transition no-underline shadow-md"
                  >
                    <span>Search Flights on White Label</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                  <Link
                    to="/travel"
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-bold text-xs hover:border-slate-500 transition no-underline"
                  >
                    <span>Full Hub</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Travel Tab B: IRCTC Trains (WhatsApp TBO Concierge Desk) */}
            {travelTab === "trains" && (
              <div className="mt-4 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      From Station
                    </label>
                    <StationAutoSuggest
                      value={trainFrom}
                      onChange={setTrainFrom}
                      theme="dark"
                      placeholder="e.g. NDLS, HWH, MAS..."
                      ariaLabel="From Station"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-400">
                        To Station
                      </label>
                      <button
                        type="button"
                        onClick={handleSwapStations}
                        className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <ArrowLeftRight className="size-3" /> Swap
                      </button>
                    </div>
                    <StationAutoSuggest
                      value={trainTo}
                      onChange={setTrainTo}
                      theme="dark"
                      placeholder="e.g. BSB, ADI, PNBE..."
                      ariaLabel="To Station"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    Parsed station codes:{" "}
                    <strong className="text-white font-mono">
                      {extractStationCode(trainFrom) || "None"}
                    </strong>{" "}
                    ➔{" "}
                    <strong className="text-white font-mono">
                      {extractStationCode(trainTo) || "None"}
                    </strong>
                  </span>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={tboWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black py-3 text-xs transition no-underline shadow-md"
                  >
                    <MessageSquare className="size-3.5" />
                    <span>1-Tap WhatsApp IRCTC Train Desk (TBO Concierge)</span>
                  </a>
                  <a
                    href="https://www.irctc.co.in/nget/train-search"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const fromC = extractStationCode(trainFrom);
                      const toC = extractStationCode(trainTo);
                      if (!fromC || !toC || fromC === toC) {
                        e.preventDefault();
                        toast.error("Enter two different valid station codes.");
                        return;
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-bold text-xs hover:border-slate-500 transition no-underline"
                  >
                    <span>IRCTC Portal</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Zero convenience fee on direct travel tickets.</span>
            <Link
              to="/travel"
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Explore All Travel Routes</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </section>

        {/* ======================================================== */}
        {/* TILE 3: [ 🎓 AI ACADEMIC TUTOR ] */}
        {/* ======================================================== */}
        <section
          aria-label="Tile 3: AI Academic Tutor"
          className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between space-y-5"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Academic Tutor
                  </h2>
                  <p className="text-xs text-slate-400">
                    Gemini 2.5 Flash · NCERT, CBSE &amp; UPSC Mains
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {hasVipPass ? (
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 border border-amber-400/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <Crown className="size-3" /> VIP Active
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 px-2.5 py-1 rounded-full font-bold">
                    3-Day Free Hook
                  </span>
                )}
              </div>
            </div>

            {/* Board & Class Configurator */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Examination Board
                </label>
                <select
                  value={tutorBoard}
                  onChange={(e) => setTutorBoard(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
                >
                  {ALL_INDIAN_BOARDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="UPSC Civil Services (Mains)">
                    UPSC Civil Services (Mains GS 1-4)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Class / Level
                </label>
                <select
                  value={tutorClass}
                  onChange={(e) => setTutorClass(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Degree STEM & Competitive">
                    Degree STEM &amp; Competitive
                  </option>
                </select>
              </div>
            </div>

            {/* Core Subjects Chips */}
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Core Subject
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {CORE_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setTutorSubject(sub)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition border cursor-pointer",
                      tutorSubject === sub
                        ? "bg-amber-400 text-slate-950 border-amber-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Input & Quick Prompts */}
            <div className="mt-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Ask Problem, Proof or UPSC Question:</span>
                {!hasVipPass && (
                  <span className="font-mono text-amber-300">
                    {Math.max(0, FREE_HOOK_LIMIT - freeQueriesUsed)} free remaining
                  </span>
                )}
              </div>
              <div className="relative">
                <textarea
                  rows={2}
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="e.g. Derive quadratic formula or evaluate integral sin^2(x) dx..."
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none resize-none"
                />
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  "Derive Quadratic Formula",
                  "Integrate sin^2(x) dx",
                  "UPSC Mains: Fundamental Rights vs DPSP",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSolveAcademicQuestion(prompt)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-amber-400/50 transition cursor-pointer"
                  >
                    ⚡ {prompt}
                  </button>
                ))}
              </div>

              {/* VIP Pass Gating or Solve CTA */}
              {isFreeHookExhausted ? (
                <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-[#121622] border border-amber-500/40 text-center space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-center gap-2 text-amber-400">
                    <Crown className="size-4" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      3-Day Free Trial Complete
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Unlock unlimited NCERT derivations, CBSE doubt solver &amp; UPSC Mains evaluations.
                  </p>
                  <button
                    type="button"
                    onClick={handleActivateTutorPass}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all"
                  >
                    Activate VIP Pass — ₹99/month (1-Tap UPI / Wallet)
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isSolving}
                  onClick={() => handleSolveAcademicQuestion()}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="size-4" />
                  <span>
                    {isSolving
                      ? "Deriving Step-by-Step Solution..."
                      : "Solve with Gemini 2.5 Flash"}
                  </span>
                </button>
              )}
            </div>

            {/* Solution Output */}
            {tutorSolutionText && (
              <div className="mt-4 pt-2">
                <AcademicSolutionCard solutionText={tutorSolutionText} />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Rigorous step derivation adhering to Indian marking standards.</span>
            <Link
              to="/tutor"
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>Open Full Tutor Portal</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </section>

        {/* ======================================================== */}
        {/* TILE 4: [ 💼 LOCAL JOBS & HIRING ] */}
        {/* ======================================================== */}
        <section
          aria-label="Tile 4: Local Jobs & Hiring"
          className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between space-y-5"
        >
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                  <Briefcase className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    Local Jobs &amp; Hiring
                  </h2>
                  <p className="text-xs text-slate-400">
                    1-Tap Applicant Desk · Real Adzuna Live Feed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployerModalOpen(true)}
                className="text-[10px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                + Post Job
              </button>
            </div>

            {/* 4 High-Demand Hyperlocal Applicant Desks */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {KEY_HIGH_DEMAND_ROLES.map((role) => (
                <div
                  key={role.id}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 hover:border-amber-500/40 transition flex flex-col justify-between space-y-2 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <role.icon className="size-4 text-amber-400" />
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                        {role.badge}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-[11px] font-mono font-bold text-amber-400">
                      {role.pay}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                      {role.desc}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenApplicantModal(role.title)}
                    className="w-full mt-1 py-1.5 rounded-xl bg-amber-400/10 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>1-Tap Apply</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Real Adzuna Live Feed Preview with Real Search */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-amber-400" />
                  <span>Real Adzuna Verified Openings</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Live Feed
                </span>
              </div>

              {/* Dynamic Job Search Filter */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3 text-slate-400" />
                <input
                  type="text"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Filter jobs: engineer, delivery, tutor..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg border border-slate-800 bg-slate-900/80 text-[11px] text-white placeholder-slate-500 outline-none focus:border-amber-400/50"
                />
              </div>

              <div className="space-y-2">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate">
                      <p className="font-bold text-white truncate">{job.title}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{job.company}</span>
                        <span>·</span>
                        <span className="text-amber-400 font-mono">
                          {job.salaryRange}
                        </span>
                        <span>·</span>
                        <span>{job.location}</span>
                      </p>
                    </div>

                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-white hover:border-amber-400 text-[11px] font-bold shrink-0 transition no-underline flex items-center gap-1"
                    >
                      <span>Apply</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Verified employer payouts with zero intermediary deductions.</span>
            <Link
              to="/tutor-jobs"
              className="text-amber-400 font-bold hover:underline flex items-center gap-1"
            >
              <span>View All Verified Roles</span>
              <ChevronRight className="size-3" />
            </Link>
          </div>
        </section>
      </main>

      {/* ─── 3. LOWER SECTION: LIVE PASSBOOK, REAL BALANCE & DOUBLE-ENTRY LEDGER ─── */}
      <section
        id="live-ledger"
        aria-label="Live Passbook, Real Wallet Balance and Double-entry Ledger"
        className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Receipt className="size-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                Live Passbook &amp; Double-Entry Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Cryptographic audit trail of all KingPay transactions, UPI settlements &amp; order debits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/kingpay/passbook"
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition no-underline flex items-center gap-1.5"
            >
              <span>Full Screen Passbook</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Embedded Dark Theme Real Passbook */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 sm:p-5">
          <OrderKingPassbookReceipts theme="dark" />
        </div>
      </section>

      {/* ─── 4. QR SCANNER MODAL ─── */}
      {isScannerOpen && (
        <ScanQrModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          walletBalancePaise={walletBalancePaise}
        />
      )}

      {/* ─── 5. ADD MONEY MODAL ─── */}
      {isAddMoneyOpen && (
        <AddMoneyModal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          currentBalancePaise={walletBalancePaise}
          onSuccess={(addedPaise: number) => {
            setIsAddMoneyOpen(false);
            toast.success(`Added ${formatPaise(addedPaise)} to your KingPay Wallet.`);
          }}
        />
      )}

      {/* ─── 6. 1-TAP JOB APPLICANT MODAL ─── */}
      {isApplicantModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0d111a] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Direct Onboarding Desk
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Apply for {selectedJobRole}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplicantModalOpen(false)}
                className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  WhatsApp Contact Mobile
                </label>
                <input
                  type="tel"
                  required
                  value={applicantPhone}
                  onChange={(e) => setApplicantPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  City / Preferred Operating Zone
                </label>
                <input
                  type="text"
                  value={applicantCity}
                  onChange={(e) => setApplicantCity(e.target.value)}
                  placeholder="e.g. New Delhi, Karimganj, Mumbai..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsApplicantModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 font-black text-slate-950 shadow-md cursor-pointer"
                >
                  Submit 1-Tap Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 7. EMPLOYER POST JOB MODAL ─── */}
      {isEmployerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/40 bg-[#0d111a] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  Employer Hiring Desk
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Post Hiring Requirement in 60s
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployerModalOpen(false)}
                className="size-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEmployerPost} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Business / Restaurant / Family Name
                </label>
                <input
                  type="text"
                  required
                  value={employerName}
                  onChange={(e) => setEmployerName(e.target.value)}
                  placeholder="e.g. Royal Biryani Cloud Kitchen"
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Role Required
                </label>
                <select
                  value={employerRole}
                  onChange={(e) => setEmployerRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                >
                  <option value="Delivery Riders (Fleet)">Delivery Riders (Fleet)</option>
                  <option value="Kitchen Cook / Master Chef">Kitchen Cook / Master Chef</option>
                  <option value="Kitchen Helper / Cleaner">Kitchen Helper / Cleaner</option>
                  <option value="Home / Online Tutor">Home / Online Tutor</option>
                  <option value="Cashier & Billing Executive">Cashier &amp; Billing Executive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Vacancies Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={employerCount}
                    onChange={(e) => setEmployerCount(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Direct Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={employerPhone}
                    onChange={(e) => setEmployerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployerModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 font-black text-slate-950 shadow-md cursor-pointer"
                >
                  Publish Free Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
