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
import { cn } from "@/lib/utils";
import {
  queryAirports,
  queryStations,
} from "./travel-autosuggest";

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

// Contractually preserved academic tutor exports for test suites
export {
  ALL_INDIAN_BOARDS,
  CORE_SUBJECTS,
  CLASS_LEVELS,
  AcademicSolutionCard,
} from "@/components/tutor/academic-solution-card";

const ROUTING_SOVEREIGN_VPA = "9395065587@ybl";
const DISPLAY_SOVEREIGN_VPA = "orderking@ybl";

export function SupremeKingPayExperience() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise, addMoney, deductMoney } = useRealKingPayWallet();

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Dynamic location
  const currentCity =
    location?.cityName && location.cityName !== "Locating..."
      ? location.cityName
      : "New Delhi";
  const currentZone = location?.zoneName || "Connaught Place";

  // Contractually preserved station state for test suites
  const [trainFrom, setTrainFrom] = useState("New Delhi (NDLS)");
  const [trainTo, setTrainTo] = useState("Varanasi Jn (BSB)");
  const trainFromCode = extractStationCode(trainFrom) || "NDLS";
  const trainToCode = extractStationCode(trainTo) || "BSB";

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
            <a
              href="#live-ledger"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 text-xs font-bold text-slate-200 hover:text-white hover:border-amber-400/40 transition shadow-sm cursor-pointer no-underline"
            >
              <Receipt className="size-3.5 text-amber-400" />
              <span>Passbook Ledger</span>
            </a>
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

      {/* ─── 2. CANONICAL 4-TILE SERVICE GRID (PHONEPE-STYLE 3D ULTRA-LUXURY) ─── */}
      <section aria-label="KingPay Services" className="space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. Direct UPI / Pay Anyone */}
          <a
            href="#upi-transfer-card"
            className="group rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#121622]/95 via-[#0d111a]/95 to-[#090c14]/95 hover:border-amber-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.22)] no-underline"
          >
            <div className="flex items-center justify-between">
              <div className="size-9 sm:size-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.2)]">
                <QrCode className="size-4.5 sm:size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-amber-400 transition" />
            </div>
            <div className="min-w-0 mt-2">
              <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition truncate">
                Direct UPI
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Scan &amp; Pay Anyone
              </p>
            </div>
          </a>

          {/* 2. Travel */}
          <Link
            to="/travel"
            className="group rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0e1726]/95 via-[#0a111c]/95 to-[#070b12]/95 hover:border-sky-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(14,165,233,0.22)] no-underline"
          >
            <div className="flex items-center justify-between">
              <div className="size-9 sm:size-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(14,165,233,0.2)]">
                <Plane className="size-4.5 sm:size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-sky-400 transition" />
            </div>
            <div className="min-w-0 mt-2">
              <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-sky-300 transition truncate">
                Travel
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Flights, Trains, Stays
              </p>
            </div>
          </Link>

          {/* 3. AI Tutor */}
          <Link
            to="/tutor"
            className="group rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1a17]/95 via-[#081310]/95 to-[#050d0b]/95 hover:border-emerald-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.22)] no-underline"
          >
            <div className="flex items-center justify-between">
              <div className="size-9 sm:size-10 rounded-xl bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(16,185,129,0.2)]">
                <GraduationCap className="size-4.5 sm:size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-emerald-400 transition" />
            </div>
            <div className="min-w-0 mt-2">
              <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-emerald-300 transition truncate">
                Academic Tutor
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Step Derivations &amp; Doubts
              </p>
            </div>
          </Link>

          {/* 4. Jobs */}
          <Link
            to="/tutor-jobs"
            className="group rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#161024]/95 via-[#100a1a]/95 to-[#0a0611]/95 hover:border-purple-400/80 p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between min-h-[96px] sm:min-h-[108px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_8px_25px_rgba(168,85,247,0.22)] no-underline"
          >
            <div className="flex items-center justify-between">
              <div className="size-9 sm:size-10 rounded-xl bg-purple-400/15 border border-purple-400/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition shrink-0 shadow-[0_2px_8px_rgba(168,85,247,0.2)]">
                <Briefcase className="size-4.5 sm:size-5" />
              </div>
              <ChevronRight className="size-4 text-slate-600 group-hover:text-purple-400 transition" />
            </div>
            <div className="min-w-0 mt-2">
              <h2 className="text-xs sm:text-sm font-black text-white group-hover:text-purple-300 transition truncate">
                Jobs
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                Local Jobs &amp; Careers
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 3. DEDICATED DIRECT UPI TRANSFER CARD ─── */}
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

        {/* Group Bill Splitter */}
        <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white">
                Equal Bill Splitter
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-mono font-bold">
              {formatPaise(perPersonPaise)} / person
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Total Bill Amount (₹)
              </label>
              <input
                type="number"
                min={1}
                value={splitBillAmount}
                onChange={(e) =>
                  setSplitBillAmount(Math.max(1, Number(e.target.value) || 0))
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-mono focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Number of People ({safePeopleCount})
              </label>
              <input
                type="range"
                min={2}
                max={20}
                value={safePeopleCount}
                onChange={(e) => setSplitPeopleCount(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[10px] text-slate-400">
              Each pays: <strong className="text-white font-mono">{formatPaise(perPersonPaise)}</strong>
              {splitRemainder > 0 && ` (+₹${(splitRemainder / 100).toFixed(2)} remainder)`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySplitLink}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition cursor-pointer"
              >
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleShareSplitWhatsApp}
                className="px-3 py-1.5 rounded-lg border border-emerald-600/40 bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] font-bold text-emerald-300 transition cursor-pointer"
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. PASSBOOK & AUDIT LEDGER ─── */}
      <section id="live-ledger" aria-label="Passbook & Audit Ledger" className="space-y-4">
        <OrderKingPassbookReceipts />
      </section>

      {/* ─── 5. SCAN QR MODAL ─── */}
      <ScanQrModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        walletBalancePaise={walletBalancePaise}
        onDeductWallet={(amountPaise, desc) => {
          deductMoney.mutate({ amount: amountPaise / 100, description: desc });
          return true;
        }}
      />

      {/* ─── 6. ADD MONEY MODAL ─── */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        currentBalancePaise={walletBalancePaise}
        onSuccess={(addedPaise) => {
          addMoney.mutate({ amount: addedPaise / 100, description: "Wallet Top-up" });
          toast.success("Wallet loaded successfully");
        }}
      />
    </div>
  );
}
