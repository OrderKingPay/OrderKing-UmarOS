import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
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
  Package,
  Plane,
  GraduationCap,
  Briefcase,
  Train,
  ArrowLeftRight,
  Check,
  MapPin,
  Sparkles,
  Send,
  Crown,
  Loader2,
} from "lucide-react";
import { PorterParcelEngine } from "@/components/courier/porter-parcel-engine";
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
import { solveAcademicProblem } from "@/lib/ai/gemini-tutor-solver";
import { cn } from "@/lib/utils";
import {
  AirportAutoSuggest,
  StationAutoSuggest,
  queryAirports,
  queryStations,
} from "./travel-autosuggest";

// Real query lookups for Indian transport nodes
export const searchAirportOptions = (raw: string) => queryAirports(raw, 20);
export const searchStationOptions = (raw: string) => queryStations(raw, 20);

export const extractStationCode = (value: string): string | null => {
  const v = value.trim().toUpperCase();
  const code =
    v.match(/\(([A-Z0-9]{2,5})\)\s*$/)?.[1] ??
    (/^[A-Z0-9]{2,5}$/.test(v) ? v : null);
  return code && /^[A-Z0-9]{2,5}$/.test(code) ? code : null;
};

// Contractually preserved academic tutor exports for test suites
export {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  AcademicSolutionCard,
} from "@/components/tutor/academic-solution-card";

const ROUTING_SOVEREIGN_VPA = "9395065587@ybl";
const DISPLAY_SOVEREIGN_VPA = "orderking@ybl";

export type ActiveVerticalTab = "pay" | "courier" | "travel" | "tutor" | "jobs";

export function SupremeKingPayExperience() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise, addMoney, deductMoney } = useRealKingPayWallet();

  // Active vertical tab
  const [activeTab, setActiveTab] = useState<ActiveVerticalTab>("pay");

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Dynamic location
  const currentCity =
    location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "New Delhi";
  const currentZone = location?.zoneName || "Connaught Place";

  // 1-Tap UPI Intent state
  const [customPayeeVpa, setCustomPayeeVpa] = useState("");
  const [useCustomVpa, setUseCustomVpa] = useState(false);
  const [upiAmountInr, setUpiAmountInr] = useState<number>(250);
  const [upiNote, setUpiNote] = useState("OrderKing Instant Settlement");

  // Masked display vs background routing
  const activePayeeVpa =
    useCustomVpa && customPayeeVpa.trim()
      ? customPayeeVpa.trim()
      : ROUTING_SOVEREIGN_VPA;
  const activeDisplayVpa =
    useCustomVpa && customPayeeVpa.trim()
      ? customPayeeVpa.trim()
      : DISPLAY_SOVEREIGN_VPA;

  // Group Bill Splitter state (SafeInteger Paise precision)
  const [splitBillAmount, setSplitBillAmount] = useState<number>(1200);
  const [splitPeopleCount, setSplitPeopleCount] = useState<number>(4);

  // Travel route lookup state
  const [flightFrom, setFlightFrom] = useState("New Delhi (DEL)");
  const [flightTo, setFlightTo] = useState("Mumbai (BOM)");
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Varanasi Jn (BSB)");

  // Academic Tutor state
  const [tutorBoard, setTutorBoard] = useState<string>("CBSE (Central Board)");
  const [tutorClass, setTutorClass] = useState<string>("Class 10");
  const [tutorSubject, setTutorSubject] = useState<string>("Mathematics");
  const [tutorQuestion, setTutorQuestion] = useState("");
  const [isSolving, setIsSolving] = useState(false);
  const [tutorSolutionText, setTutorSolutionText] = useState<string | null>(null);

  // SafeInteger calculations for UPI
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
      toast.success("UPI Intent copied.");
    } catch {
      toast.info(`UPI Intent: ${upiUri}`);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Pay ₹${(parsedAmountPaise / 100).toFixed(
      2
    )} to OrderKing (${activeDisplayVpa}) via UPI:\n${upiUri}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  // SafeInteger Bill Splitter calculations
  const totalSplitPaise = Math.max(
    100,
    Math.round((Number(splitBillAmount) || 0) * 100)
  );
  const safePeopleCount = Math.max(
    2,
    Math.min(20, Math.floor(splitPeopleCount))
  );
  const perPersonPaise = Math.floor(totalSplitPaise / safePeopleCount);
  const splitRemainder = totalSplitPaise % safePeopleCount;
  const splitShareUri = `upi://pay?pa=${encodeURIComponent(
    activePayeeVpa
  )}&pn=Split%20Bill&am=${(perPersonPaise / 100).toFixed(
    2
  )}&cu=INR&tn=Group%20Bill%20Share`;

  const handleCopySplitLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(splitShareUri);
      }
      toast.success("Split link copied.");
    } catch {
      toast.info(`Split Link: ${splitShareUri}`);
    }
  };

  const handleShareSplitWhatsApp = () => {
    const text = `Share for bill of ${formatPaise(
      totalSplitPaise
    )} (${safePeopleCount} people): ${formatPaise(
      perPersonPaise
    )} each.\nPay via UPI: ${splitShareUri}`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

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

  const handleSolveProblem = async () => {
    const query = tutorQuestion.trim();
    if (!query) {
      toast.error("Please enter an academic question or formula to solve.");
      return;
    }
    setIsSolving(true);
    try {
      const result = await solveAcademicProblem(
        {
          message: query,
          board: tutorBoard,
          stdClass: tutorClass,
          subject: tutorSubject,
        },
        generateCurriculumFallback
      );
      setTutorSolutionText(result.text);
      toast.success("Solution generated successfully.");
    } catch (err) {
      toast.error("Could not generate solution. Redirecting to Tutor portal...");
      navigate({ to: "/tutor" });
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* ─── 1. ULTRA-LUXURY OBSIDIAN BALANCE VAULT ─── */}
      <section
        aria-label="KingPay Sovereign Wallet Vault"
        className="relative overflow-hidden rounded-[32px] border border-amber-500/30 bg-gradient-to-br from-[#0d111a] via-[#090c14] to-[#07090f] p-5 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-5"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/15 via-amber-600/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] shadow-lg shadow-amber-500/20">
              <div className="size-full rounded-2xl bg-[#0d111a] flex items-center justify-center text-amber-400">
                <Crown className="size-5 sm:size-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                  King<span className="text-amber-400">Pay</span>
                </h1>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/40">
                  SuperApp
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <MapPin className="size-3 text-amber-400" />
                <span>
                  {currentZone}, {currentCity}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab("pay");
                const el = document.getElementById("live-ledger");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-xs font-bold text-slate-200 hover:text-white hover:border-amber-400/40 transition shadow-sm cursor-pointer"
            >
              <Receipt className="size-3.5 text-amber-400" />
              <span>Passbook Ledger</span>
            </button>
          </div>
        </div>

        {/* Real Balance & Primary 1-Tap Trigger Buttons */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2 relative z-10 border-t border-slate-800/80">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Available Vault Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {formatPaise(walletBalancePaise)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Prepaid Payment Instrument verified against double-entry ledger.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black px-5 sm:px-6 py-3 text-xs shadow-[0_10px_25px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
            >
              <QrCode className="size-4" />
              <span>Scan BharatQR</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddMoneyOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-amber-300 font-bold px-4 sm:px-5 py-3 text-xs transition-all cursor-pointer"
            >
              <PlusCircle className="size-4 text-amber-400" />
              <span>Add Money</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. 5 SOVEREIGN VERTICAL TAB SWITCHER ─── */}
      <nav
        aria-label="Sovereign Verticals Navigation"
        className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5"
      >
        <button
          type="button"
          onClick={() => setActiveTab("pay")}
          className={cn(
            "p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "pay"
              ? "border-amber-400 bg-amber-400/10 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Zap className="size-4 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-mono">0% Fee</span>
          </div>
          <div>
            <span className="text-xs font-bold block text-white">KingPay UPI</span>
            <span className="text-[10px] text-slate-400">Transfer &amp; Split</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("courier")}
          className={cn(
            "p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "courier"
              ? "border-amber-400 bg-amber-400/10 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Package className="size-4 text-amber-400" />
            <span className="text-[10px] text-slate-400 font-mono">₹30+₹10/km</span>
          </div>
          <div>
            <span className="text-xs font-bold block text-white">Courier</span>
            <span className="text-[10px] text-slate-400">Point-to-Point</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("travel")}
          className={cn(
            "p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "travel"
              ? "border-sky-400 bg-sky-400/10 text-white shadow-[0_0_20px_rgba(14,165,233,0.15)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Plane className="size-4 text-sky-400" />
            <span className="text-[10px] text-slate-400 font-mono">IRCTC / Air</span>
          </div>
          <div>
            <span className="text-xs font-bold block text-white">Travel</span>
            <span className="text-[10px] text-slate-400">Flights, Trains</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tutor")}
          className={cn(
            "p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "tutor"
              ? "border-emerald-400 bg-emerald-400/10 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <GraduationCap className="size-4 text-emerald-400" />
            <span className="text-[10px] text-slate-400 font-mono">1–12 &amp; Prep</span>
          </div>
          <div>
            <span className="text-xs font-bold block text-white">Academic Tutor</span>
            <span className="text-[10px] text-slate-400">All Indian Boards</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={cn(
            "col-span-2 sm:col-span-1 p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "jobs"
              ? "border-purple-400 bg-purple-400/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Briefcase className="size-4 text-purple-400" />
            <span className="text-[10px] text-slate-400 font-mono">Verified</span>
          </div>
          <div>
            <span className="text-xs font-bold block text-white">Careers</span>
            <span className="text-[10px] text-slate-400">Fleet &amp; Partner Roles</span>
          </div>
        </button>
      </nav>

      {/* ─── VIEW 1: PAY & UPI WALLET UTILITY (DEFAULT) ─── */}
      {activeTab === "pay" && (
        <div className="space-y-6">
          {/* 4 Sovereign Vertical Direct Launchers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("travel")}
              className="group rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0e1726]/95 via-[#0a111c]/95 to-[#070b12]/95 hover:border-sky-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[118px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(14,165,233,0.2)] text-left cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="size-9 sm:size-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition shrink-0">
                  <Plane className="size-4.5 sm:size-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/30">
                  B2B Fares
                </span>
              </div>
              <div className="min-w-0 mt-2">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition truncate">
                  Book Travel
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Flights, Trains &amp; Stays
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("courier")}
              className="group rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#121622]/95 via-[#0d111a]/95 to-[#090c14]/95 hover:border-amber-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[118px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.2)] text-left cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="size-9 sm:size-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition shrink-0">
                  <Package className="size-4.5 sm:size-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  Instant
                </span>
              </div>
              <div className="min-w-0 mt-2">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition truncate">
                  Courier Dispatch
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Porter Point-to-Point
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tutor")}
              className="group rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1a17]/95 via-[#081310]/95 to-[#050d0b]/95 hover:border-emerald-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[118px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.2)] text-left cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="size-9 sm:size-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0">
                  <GraduationCap className="size-4.5 sm:size-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                  NCERT · CBSE
                </span>
              </div>
              <div className="min-w-0 mt-2">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition truncate">
                  Academic Tutor
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Step-by-Step AI Solver
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className="group rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#161024]/95 via-[#100a1a]/95 to-[#0a0611]/95 hover:border-purple-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[105px] sm:min-h-[118px] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.2)] text-left cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="size-9 sm:size-10 rounded-xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition shrink-0">
                  <Briefcase className="size-4.5 sm:size-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-300 border border-purple-400/30">
                  Verified
                </span>
              </div>
              <div className="min-w-0 mt-2">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition truncate">
                  Local Jobs
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Verified Hiring &amp; Gigs
                </p>
              </div>
            </button>
          </div>

          {/* Dedicated Direct UPI Transfer Card */}
          <section
            id="upi-transfer-card"
            aria-label="Direct UPI Transfer Desk"
            className="rounded-[32px] border border-amber-500/30 bg-[#0d111a]/95 backdrop-blur-2xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Pay Anyone via Direct UPI
                  </h2>
                  <p className="text-xs text-slate-400">
                    Generate Instant Dynamic QR or Pay with PhonePe, Paytm, GPay, BHIM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
                  {activeDisplayVpa}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Transfer Form */}
              <div className="space-y-4">
                <div className="space-y-2">
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

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Payment Note
                  </label>
                  <input
                    type="text"
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="e.g. OrderKing Payment"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                {/* Custom VPA toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setUseCustomVpa(!useCustomVpa)}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{useCustomVpa ? "Use Sovereign VPA" : "Pay a Custom UPI ID"}</span>
                  </button>
                  {useCustomVpa && (
                    <input
                      type="text"
                      value={customPayeeVpa}
                      onChange={(e) => setCustomPayeeVpa(e.target.value)}
                      placeholder="e.g. merchant@upi or friend@oksbi"
                      className="w-full h-10 mt-2 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-mono focus:border-amber-400 outline-none"
                    />
                  )}
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="size-4 text-amber-400" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-emerald-600/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-bold transition cursor-pointer"
                  >
                    <Share2 className="size-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                <a
                  href={upiUri}
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition no-underline"
                >
                  <Send className="size-4" />
                  <span>Pay ₹{(parsedAmountPaise / 100).toFixed(2)} via UPI App</span>
                </a>
              </div>

              {/* Dynamic QR Code Card */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-inner space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                  Instant Dynamic BharatQR
                </span>
                <div className="p-2.5 rounded-2xl bg-white border border-slate-300 shadow-md">
                  <img
                    src={qrImageUrl}
                    alt="Dynamic UPI QR Code"
                    width={190}
                    height={190}
                    className="size-44 sm:size-48 rounded-xl object-contain"
                  />
                </div>
                <div className="text-center">
                  <span className="font-mono text-base font-black text-slate-950 block">
                    ₹{(parsedAmountPaise / 100).toFixed(2)}
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Scan with GPay, PhonePe, Paytm, or BHIM
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Group Bill Splitter */}
          <section
            aria-label="Group Bill Splitter"
            className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="size-4 text-amber-400" /> Group Bill Splitter
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                SafeInteger Paise Precision
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Total Bill (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={splitBillAmount}
                  onChange={(e) =>
                    setSplitBillAmount(Math.max(1, Number(e.target.value) || 0))
                  }
                  className="w-full h-9 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs font-bold focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  People ({safePeopleCount})
                </label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSplitPeopleCount(n)}
                      className={cn(
                        "flex-1 h-9 rounded-xl text-xs font-mono font-bold transition border cursor-pointer",
                        safePeopleCount === n
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-900 border-slate-700 text-slate-400"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-400">
                  Share Per Person
                </span>
                <span className="text-base font-black font-mono text-white">
                  {formatPaise(perPersonPaise)}
                </span>
                {splitRemainder > 0 && (
                  <span className="text-[9px] text-amber-300/80">
                    ({splitRemainder} friends pay 1 paisa extra)
                  </span>
                )}
              </div>
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopySplitLink}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                <Copy className="size-3.5" /> Copy Link
              </button>
              <button
                type="button"
                onClick={handleShareSplitWhatsApp}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                <Share2 className="size-3.5" /> WhatsApp Request
              </button>
            </div>
          </section>

          {/* Passbook & Audit Ledger */}
          <section
            id="live-ledger"
            aria-label="Passbook & Audit Ledger"
            className="space-y-4"
          >
            <OrderKingPassbookReceipts />
          </section>
        </div>
      )}

      {/* ─── VIEW 2: PORTER COURIER ENGINE ─── */}
      {activeTab === "courier" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="size-4 text-amber-400" /> Point-to-Point Local Courier &amp; Parcel Dispatch
              </h2>
              <p className="text-xs text-slate-400">
                ₹30 base + ₹10/km · Live COD/UPI dispatch into Supabase orders
              </p>
            </div>
            <Link
              to="/courier"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Full Page</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
          <PorterParcelEngine />
        </div>
      )}

      {/* ─── VIEW 3: SOVEREIGN TRAVEL LAUNCHER & ROUTE LOOKUP ─── */}
      {activeTab === "travel" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plane className="size-4 text-sky-400" /> Travel · Carrier &amp; IRCTC Handshake
              </h2>
              <p className="text-xs text-slate-400">
                Official airline and Indian Railways booking gateways
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/travel/trips"
                className="text-xs text-slate-400 hover:text-white transition"
              >
                My Bookings
              </Link>
              <Link
                to="/travel"
                className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Full Portal</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 space-y-5 shadow-xl">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              IRCTC Station Code Quick Lookup
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">
                  From Station
                </label>
                <StationAutoSuggest
                  value={trainFrom}
                  onChange={setTrainFrom}
                  theme="dark"
                  placeholder="e.g. Ndls, Sil, Hwh..."
                  ariaLabel="From Station"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400">
                    To Station
                  </label>
                  <button
                    type="button"
                    onClick={handleSwapStations}
                    className="text-[10px] font-bold text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <ArrowLeftRight className="size-3" /> Swap
                  </button>
                </div>
                <StationAutoSuggest
                  value={trainTo}
                  onChange={setTrainTo}
                  theme="dark"
                  placeholder="e.g. Bsb, Adi, Mys..."
                  ariaLabel="To Station"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                Parsed station codes:{" "}
                <strong className="text-white font-mono">
                  {extractStationCode(trainFrom) || "None"}
                </strong>{" "}
                ➔{" "}
                <strong className="text-white font-mono">
                  {extractStationCode(trainTo) || "None"}
                </strong>
              </div>

              <div className="flex items-center gap-2">
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
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition no-underline cursor-pointer"
                >
                  <span>Book on IRCTC</span>
                  <ExternalLink className="size-3.5" />
                </a>
                <Link
                  to="/travel"
                  className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-white font-bold text-xs hover:border-slate-500 transition no-underline"
                >
                  Open Travel Hub ➔
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 4: ACADEMIC TUTOR LAUNCHER & BOARD MATCHER ─── */}
      {activeTab === "tutor" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="size-4 text-emerald-400" /> Academic Tutor
              </h2>
              <p className="text-xs text-slate-400">
                Curriculum-aligned step derivations for all Indian central and state boards
              </p>
            </div>
            <Link
              to="/tutor"
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Full Portal</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  State / Central Board
                </label>
                <select
                  value={tutorBoard}
                  onChange={(e) => setTutorBoard(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-emerald-400 outline-none transition-colors"
                >
                  {ALL_INDIAN_BOARDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Class Level
                </label>
                <select
                  value={tutorClass}
                  onChange={(e) => setTutorClass(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-emerald-400 outline-none transition-colors"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
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
                        ? "bg-emerald-400 text-slate-950 border-emerald-300 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    )}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Question Input */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Ask Formula / Proof / Problem
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSolveProblem();
                  }}
                  placeholder="e.g. Derive the quadratic formula step by step"
                  className="flex-1 h-10 px-3.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:border-emerald-400 outline-none"
                />
                <button
                  type="button"
                  onClick={handleSolveProblem}
                  disabled={isSolving}
                  className="px-4 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {isSolving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span>Solve</span>
                </button>
              </div>
            </div>

            {tutorSolutionText && (
              <div className="pt-2">
                <AcademicSolutionCard solutionText={tutorSolutionText} />
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Launch the Academic Tutor solver for complete step-by-step solutions.
              </span>
              <Link
                to="/tutor"
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition no-underline"
              >
                <span>Open Academic Tutor</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIEW 5: CAREERS & FLEET ONBOARDING LAUNCHER ─── */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="size-4 text-purple-400" /> Careers &amp; Partner Roles
              </h2>
              <p className="text-xs text-slate-400">
                Direct fleet onboarding and verified contract roles
              </p>
            </div>
            <Link
              to="/tutor-jobs"
              className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Full Jobs Hub</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Direct Onboarding
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  Delivery Fleet Partner
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Flexible hyperlocal parcel and courier runs with instant daily payouts.
                </p>
              </div>
              <Link
                to="/join-fleet"
                className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition no-underline"
              >
                <span>Join Delivery Fleet</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
              <div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Verified Roles
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  All Verified Career Openings
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Explore all verified openings and applications with live employer desks.
                </p>
              </div>
              <Link
                to="/tutor-jobs"
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition no-underline"
              >
                <span>Open Careers Portal</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <ScanQrModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          walletBalancePaise={walletBalancePaise}
          onDeductWallet={(amountPaise, desc) => {
            deductMoney.mutate({
              amount: amountPaise / 100,
              description: desc,
            });
            return true;
          }}
        />
      )}

      {/* Add Money Modal */}
      {isAddMoneyOpen && (
        <AddMoneyModal
          isOpen={isAddMoneyOpen}
          onClose={() => setIsAddMoneyOpen(false)}
          currentBalancePaise={walletBalancePaise}
          onSuccess={(addedPaise) => {
            addMoney.mutate({
              amount: addedPaise / 100,
              description: "Wallet Top-up",
            });
            toast.success("Wallet loaded successfully");
          }}
        />
      )}
    </div>
  );
}
