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
} from "lucide-react";
import { PorterParcelEngine } from "@/components/courier/porter-parcel-engine";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { useLocationStore } from "@/lib/stores/location";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { 
  ALL_INDIAN_BOARDS, 
  CORE_SUBJECTS, 
  CLASS_LEVELS, 
  AcademicSolutionCard 
} from "@/routes/tutor";
import { cn } from "@/lib/utils";
import { AirportAutoSuggest, StationAutoSuggest, queryAirports, queryStations } from "./travel-autosuggest";

// Real query lookups for Indian transport nodes
export const searchAirportOptions = (raw: string) => queryAirports(raw, 20);
export const searchStationOptions = (raw: string) => queryStations(raw, 20);

export const extractStationCode = (value: string): string | null => {
  const v = value.trim().toUpperCase();
  const code = v.match(/\(([A-Z0-9]{2,5})\)\s*$/)?.[1] ?? (/^[A-Z0-9]{2,5}$/.test(v) ? v : null);
  return code && /^[A-Z0-9]{2,5}$/.test(code) ? code : null;
};

type ActiveVerticalTab = "pay" | "courier" | "travel" | "tutor" | "jobs";

export function SupremeKingPayExperience() {
  const navigate = useNavigate();
  const location = useLocationStore((s) => s.location);
  const { walletBalancePaise } = useRealKingPayWallet();

  // Active sovereign tab
  const [activeTab, setActiveTab] = useState<ActiveVerticalTab>("pay");

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  // Dynamic location
  const currentCity = location?.cityName && location.cityName !== "Locating..." ? location.cityName : "New Delhi";
  const currentZone = location?.zoneName || "Connaught Place";

  // 1-Tap UPI Intent state - Real founder VPA
  const [payeeVpa, setPayeeVpa] = useState("9395065587@ybl");
  const [payeeName, setPayeeName] = useState("OrderKing Desk");
  const [upiAmountInr, setUpiAmountInr] = useState<number>(250);
  const [upiNote, setUpiNote] = useState("Instant Transfer");

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
  const [tutorSolutionText, setTutorSolutionText] = useState<string | null>(null);

  // SafeInteger calculations for UPI
  const parsedAmountPaise = Math.max(100, Math.round((Number(upiAmountInr) || 1) * 100));
  const upiUri = `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=${encodeURIComponent(
    payeeName.trim()
  )}&am=${(parsedAmountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(upiNote.trim())}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    upiUri
  )}&bgcolor=FFFFFF&color=05070B`;

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
    const text = `Pay ₹${(parsedAmountPaise / 100).toFixed(2)} to ${payeeName} (${payeeVpa}) via UPI:\n${upiUri}`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // SafeInteger Bill Splitter calculations
  const totalSplitPaise = Math.max(100, Math.round((Number(splitBillAmount) || 0) * 100));
  const safePeopleCount = Math.max(2, Math.min(20, Math.floor(splitPeopleCount)));
  const perPersonPaise = Math.floor(totalSplitPaise / safePeopleCount);
  const splitRemainder = totalSplitPaise % safePeopleCount;
  const splitShareUri = `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=Split%20Bill&am=${(perPersonPaise / 100).toFixed(2)}&cu=INR&tn=Group%20Bill%20Share`;

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
    const text = `Share for bill of ${formatPaise(totalSplitPaise)} (${safePeopleCount} people): ${formatPaise(perPersonPaise)} each.\nPay via UPI: ${splitShareUri}`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-3 py-4 sm:px-6 sm:py-6 text-slate-100 font-sans">
      {/* ─── 1. CLEAN BALANCE CARD (APPLE PAY / GOOGLE PAY GRADE) ─── */}
      <section
        aria-label="KingPay Wallet Balance"
        className="rounded-3xl border border-slate-800 bg-[#0d111a] p-5 sm:p-6 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <Wallet className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                KingPay
              </h1>
              <p className="text-xs text-slate-400">{currentZone}, {currentCity}</p>
            </div>
          </div>
          <Link
            to="/kingpay/passbook"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Receipt className="size-3.5 text-slate-400" />
            <span>Passbook</span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pt-1">
          <div>
            <span className="text-xs text-slate-400 font-medium block mb-1">Available Balance</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
              {formatPaise(walletBalancePaise)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2.5 text-xs shadow transition active:scale-95 cursor-pointer"
            >
              <QrCode className="size-4" />
              <span>Scan QR</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddMoneyOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 text-xs transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="size-4 text-amber-300" />
              <span>Add Money</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── 2. 4 SOVEREIGN VERTICAL TAB SWITCHER & LAUNCHERS ─── */}
      <nav aria-label="Sovereign Verticals Navigation" className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab("pay")}
          className={cn(
            "p-3 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between space-y-1.5",
            activeTab === "pay"
              ? "border-amber-400 bg-amber-400/10 text-white"
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
              ? "border-amber-400 bg-amber-400/10 text-white"
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
              ? "border-amber-400 bg-amber-400/10 text-white"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Plane className="size-4 text-amber-400" />
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
              ? "border-amber-400 bg-amber-400/10 text-white"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <GraduationCap className="size-4 text-amber-400" />
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
              ? "border-amber-400 bg-amber-400/10 text-white"
              : "border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300"
          )}
        >
          <div className="flex items-center justify-between">
            <Briefcase className="size-4 text-amber-400" />
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
        <div className="space-y-5">
          {/* 4 Sovereign Vertical Direct Launchers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Link
              to="/travel"
              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition no-underline text-white flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block group-hover:text-amber-300 transition-colors">Travel Portal</span>
                <span className="text-[10px] text-slate-400 block">Flight &amp; Rail Gateways</span>
              </div>
              <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/courier"
              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition no-underline text-white flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block group-hover:text-amber-300 transition-colors">Porter Courier</span>
                <span className="text-[10px] text-slate-400 block">Point-to-Point Dispatch</span>
              </div>
              <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/tutor"
              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition no-underline text-white flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block group-hover:text-amber-300 transition-colors">Academic Tutor</span>
                <span className="text-[10px] text-slate-400 block">Step Derivations</span>
              </div>
              <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/tutor-jobs"
              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 transition no-underline text-white flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block group-hover:text-amber-300 transition-colors">Careers &amp; Fleet</span>
                <span className="text-[10px] text-slate-400 block">Verified Openings</span>
              </div>
              <ArrowRight className="size-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Send Money / Direct UPI Transfer */}
          <section aria-label="Direct UPI Transfer" className="rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white tracking-tight">Direct UPI Transfer</h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                NPCI Standard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Form controls */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Payee UPI ID (VPA)</label>
                  <input
                    type="text"
                    value={payeeVpa}
                    onChange={(e) => setPayeeVpa(e.target.value)}
                    placeholder="9395065587@ybl"
                    className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-xs focus:border-amber-400 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Amount (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={upiAmountInr}
                      onChange={(e) => setUpiAmountInr(Math.max(1, Number(e.target.value) || 0))}
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-700 bg-slate-900 text-white font-mono text-sm font-bold focus:border-amber-400 outline-none"
                    />
                    {[100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setUpiAmountInr(amt)}
                        className={cn(
                          "h-10 px-2.5 rounded-xl border text-xs font-mono font-semibold transition cursor-pointer",
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

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={upiUri}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold py-2.5 transition no-underline shadow-sm"
                  >
                    <Zap className="size-3.5" /> Pay via App
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUpiLink}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2.5 transition cursor-pointer"
                  >
                    <Copy className="size-3.5" /> Copy Intent
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 transition cursor-pointer"
                  >
                    <Share2 className="size-3.5" /> Share
                  </button>
                </div>
              </div>

              {/* QR display */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-slate-800 text-center">
                <div className="bg-white p-2.5 rounded-2xl shadow-lg">
                  <img
                    src={qrImageUrl}
                    alt={`UPI QR for ${payeeVpa}`}
                    loading="lazy"
                    decoding="async"
                    className="size-40 sm:size-44 object-contain"
                  />
                </div>
                <span className="text-xs font-mono text-slate-300 font-semibold mt-2.5">
                  Scan with any UPI app
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  GPay · PhonePe · Paytm · BHIM
                </span>
              </div>
            </div>
          </section>

          {/* Group Bill Splitter */}
          <section aria-label="Group Bill Splitter" className="rounded-3xl border border-slate-800 bg-slate-950 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Users className="size-4 text-amber-400" /> Group Bill Splitter
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SafeInteger Paise Precision</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Total Bill (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={splitBillAmount}
                  onChange={(e) => setSplitBillAmount(Math.max(1, Number(e.target.value) || 0))}
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
                <span className="text-[10px] uppercase font-bold text-amber-400">Share Per Person</span>
                <span className="text-base font-black font-mono text-white">{formatPaise(perPersonPaise)}</span>
                {splitRemainder > 0 && (
                  <span className="text-[9px] text-amber-300/80">({splitRemainder} friends pay 1 paisa extra)</span>
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
              <p className="text-xs text-slate-400">₹30 base + ₹10/km · Live COD/UPI dispatch into Supabase orders</p>
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
                <Plane className="size-4 text-amber-400" /> Travel · Carrier &amp; IRCTC Handshake
              </h2>
              <p className="text-xs text-slate-400">Official airline and Indian Railways booking gateways</p>
            </div>
            <Link
              to="/travel"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Full Portal</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              IRCTC Station Code Quick Lookup
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">From Station</label>
                <StationAutoSuggest
                  value={trainFrom}
                  onChange={setTrainFrom}
                  theme="dark"
                  placeholder="e.g. Ndls, Sil, Hwh..."
                  ariaLabel="From Station"
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-400">To Station</label>
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
                  placeholder="e.g. Bsb, Adi, Mys..."
                  ariaLabel="To Station"
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="text-xs text-slate-400">
                Parsed station codes: <strong className="text-white font-mono">{extractStationCode(trainFrom) || "None"}</strong> ➔ <strong className="text-white font-mono">{extractStationCode(trainTo) || "None"}</strong>
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
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition no-underline cursor-pointer"
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
                <GraduationCap className="size-4 text-amber-400" /> Academic Tutor
              </h2>
              <p className="text-xs text-slate-400">Curriculum-aligned step derivations for all Indian central and state boards</p>
            </div>
            <Link
              to="/tutor"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Full Portal</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">State / Central Board</label>
                <select
                  value={tutorBoard}
                  onChange={(e) => setTutorBoard(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
                >
                  {ALL_INDIAN_BOARDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Class Level</label>
                <select
                  value={tutorClass}
                  onChange={(e) => setTutorClass(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-700 bg-slate-900 px-3 text-white text-xs focus:border-amber-400 outline-none transition-colors"
                >
                  {CLASS_LEVELS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">Core Subject</label>
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

            {tutorSolutionText && (
              <AcademicSolutionCard solutionText={tutorSolutionText} />
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Launch the Academic Tutor solver for complete step-by-step solutions.</span>
              <Link
                to="/tutor"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition no-underline"
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
                <Briefcase className="size-4 text-amber-400" /> Careers &amp; Partner Roles
              </h2>
              <p className="text-xs text-slate-400">Direct fleet onboarding and verified contract roles</p>
            </div>
            <Link
              to="/tutor-jobs"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Full Jobs Hub</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Direct Onboarding
                </span>
                <h3 className="text-base font-bold text-white mt-2">Delivery Fleet Partner</h3>
                <p className="text-xs text-slate-400 mt-1">Flexible hyperlocal parcel and courier runs with instant daily payouts.</p>
              </div>
              <Link
                to="/join-fleet"
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition no-underline"
              >
                <span>Join Delivery Fleet</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  Verified Roles
                </span>
                <h3 className="text-base font-bold text-white mt-2">All Verified Career Openings</h3>
                <p className="text-xs text-slate-400 mt-1">Explore all verified openings and applications with live employer desks.</p>
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
        />
      )}

      {/* Add Money Modal */}
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
    </div>
  );
}
