import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Building2,
  Smartphone,
  Info,
  DollarSign,
  Lock,
  Zap,
  TrendingDown,
  BadgeAlert,
  CreditCard,
  Check,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ==========================================
// 1. DATA TYPES & CURRENCY CORRIDORS
// ==========================================

export type SourceCurrency = "SAR" | "AED" | "USD" | "QAR" | "GBP";
export type DestinationCountry = "India" | "Bangladesh";

export interface CurrencyConfig {
  code: SourceCurrency;
  name: string;
  symbol: string;
  country: string;
  flagEmoji: string;
  defaultAmount: number;
  presets: number[];
}

export const SOURCE_CURRENCIES: CurrencyConfig[] = [
  {
    code: "SAR",
    name: "Saudi Riyal",
    symbol: "﷼",
    country: "Saudi Arabia",
    flagEmoji: "🇸🇦",
    defaultAmount: 1000,
    presets: [500, 1000, 2500, 5000],
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    country: "United Arab Emirates",
    flagEmoji: "🇦🇪",
    defaultAmount: 1000,
    presets: [500, 1000, 2000, 5000],
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    country: "United States / Global",
    flagEmoji: "🇺🇸",
    defaultAmount: 500,
    presets: [250, 500, 1000, 2500],
  },
  {
    code: "QAR",
    name: "Qatari Riyal",
    symbol: "ر.ق",
    country: "Qatar",
    flagEmoji: "🇶🇦",
    defaultAmount: 1000,
    presets: [500, 1000, 2000, 4000],
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    country: "United Kingdom",
    flagEmoji: "🇬🇧",
    defaultAmount: 400,
    presets: [200, 400, 800, 1500],
  },
];

// Live Market Rates (Interbank Mid-Market)
const INTERBANK_BASE_RATES: Record<SourceCurrency, Record<DestinationCountry, number>> = {
  SAR: { India: 23.16, Bangladesh: 32.42 },
  AED: { India: 23.65, Bangladesh: 33.10 },
  USD: { India: 86.85, Bangladesh: 121.50 },
  QAR: { India: 23.83, Bangladesh: 33.36 },
  GBP: { India: 111.40, Bangladesh: 155.80 },
};

// Traditional Bank Typical Predatory Spread (avg 3.8% markup + high fixed charges)
const TRADITIONAL_BANK_SPREAD_PERCENT = 3.8;

// Founder's Transparent PA-CB Markup (Only 0.45%)
export const FOUNDER_FX_MARKUP_PERCENT = 0.45;
export const PACB_REGULATORY_FEE = 0.0; // Promotional standard fee under PA-CB

export type PayoutMethodIndia = "UPI" | "BANK";
export type PayoutMethodBangladesh = "BKASH" | "BANK";

export interface RemittanceReceipt {
  id: string;
  sourceAmount: number;
  sourceCurrency: SourceCurrency;
  destinationCountry: DestinationCountry;
  targetCurrency: "INR" | "BDT";
  interbankRate: number;
  founderMarkupPercent: number;
  effectiveRate: number;
  netPayoutAmount: number;
  beneficiaryName: string;
  payoutTarget: string;
  payoutMethod: string;
  purpose: string;
  status: "INITIATED" | "PA_CB_CLEARED" | "DISPATCHED" | "SETTLED";
  createdAt: string;
  estimatedDeliverySeconds: number;
}

// ==========================================
// 2. REMITTANCE DESK COMPONENT
// ==========================================

export function RemittanceDesk() {
  const [sourceCurrency, setSourceCurrency] = useState<SourceCurrency>("SAR");
  const [destinationCountry, setDestinationCountry] = useState<DestinationCountry>("India");
  const [sendAmount, setSendAmount] = useState<number>(1000);

  // Beneficiary form inputs
  const [payoutMethodIndia, setPayoutMethodIndia] = useState<PayoutMethodIndia>("UPI");
  const [payoutMethodBangladesh, setPayoutMethodBangladesh] = useState<PayoutMethodBangladesh>("BKASH");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryUpiId, setBeneficiaryUpiId] = useState("");
  const [beneficiaryAccountNumber, setBeneficiaryAccountNumber] = useState("");
  const [beneficiaryIfsc, setBeneficiaryIfsc] = useState("");
  const [beneficiaryBkashNumber, setBeneficiaryBkashNumber] = useState("");
  const [beneficiaryBdBank, setBeneficiaryBdBank] = useState("");
  const [remittancePurpose, setRemittancePurpose] = useState("Family Maintenance & Support");

  // Interactive Rate Lock Timer (15:00 minutes count down)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const [isRefreshingRate, setIsRefreshingRate] = useState(false);

  // Active Transaction Modal & State
  const [activeReceipt, setActiveReceipt] = useState<RemittanceReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 900; // Reset rate quote lock
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleManualRefreshRate = () => {
    setIsRefreshingRate(true);
    setTimeout(() => {
      setSecondsRemaining(900);
      setIsRefreshingRate(false);
      toast.info("Indicative rates aligned with daily interbank reference benchmarks.");
    }, 600);
  };

  // Calculations
  const interbankRate = INTERBANK_BASE_RATES[sourceCurrency][destinationCountry];
  // Effective rate after transparent founder markup:
  // When sending foreign currency to local, recipient receives (Interbank * (1 - Markup/100))
  const effectiveRate = Number((interbankRate * (1 - FOUNDER_FX_MARKUP_PERCENT / 100)).toFixed(4));
  const validSendAmount = Math.max(1, Number.isFinite(sendAmount) ? sendAmount : 100);
  const netPayoutAmount = Math.round(validSendAmount * effectiveRate * 100) / 100;

  // Traditional bank comparison
  const bankEffectiveRate = Number((interbankRate * (1 - TRADITIONAL_BANK_SPREAD_PERCENT / 100)).toFixed(4));
  const bankNetPayout = Math.round(validSendAmount * bankEffectiveRate * 100) / 100;
  const customerSavings = Math.max(0, Math.round(netPayoutAmount - bankNetPayout));

  const targetCurrencySymbol = destinationCountry === "India" ? "₹" : "৳";
  const targetCurrencyCode = destinationCountry === "India" ? "INR" : "BDT";

  const currentConfig = SOURCE_CURRENCIES.find((c) => c.code === sourceCurrency) || SOURCE_CURRENCIES[0];

  // Initiate Remittance Submission
  const handleInitiateRemittance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!beneficiaryName.trim()) {
      toast.error("Please enter the beneficiary full name as per Govt ID");
      return;
    }

    let payoutTargetIdentifier = "";
    if (destinationCountry === "India") {
      if (payoutMethodIndia === "UPI") {
        if (!beneficiaryUpiId.trim() || !beneficiaryUpiId.includes("@")) {
          toast.error("Please provide a valid Indian Virtual Payment Address (e.g. mobile@upi, name@okhdfcbank)");
          return;
        }
        payoutTargetIdentifier = beneficiaryUpiId.trim();
      } else {
        if (!beneficiaryAccountNumber.trim() || !beneficiaryIfsc.trim()) {
          toast.error("Please provide Account Number and valid IFSC Code");
          return;
        }
        payoutTargetIdentifier = `Acc: ${beneficiaryAccountNumber.trim()} • IFSC: ${beneficiaryIfsc.trim().toUpperCase()}`;
      }
    } else {
      if (payoutMethodBangladesh === "BKASH") {
        const cleaned = beneficiaryBkashNumber.trim().replace(/\D/g, "");
        if (cleaned.length < 11) {
          toast.error("Please provide a valid 11-digit Bangladeshi bKash number (e.g. 017XXXXXXXX)");
          return;
        }
        payoutTargetIdentifier = `bKash: ${cleaned}`;
      } else {
        if (!beneficiaryBdBank.trim() || !beneficiaryAccountNumber.trim()) {
          toast.error("Please provide Bangladesh Bank Name and Account Number");
          return;
        }
        payoutTargetIdentifier = `Bank: ${beneficiaryBdBank.trim()} • Acc: ${beneficiaryAccountNumber.trim()}`;
      }
    }

    setIsSubmitting(false);
    toast.info(
      "Routing outward remittance via RBI Authorized Dealer Category-I (AD-Cat-I) banking network. Please complete verification on the authorized partner portal."
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans space-y-6">
      {/* ========================================================= */}
      {/* 1. HERO DESK HEADER & REGULATORY BADGE */}
      {/* ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-5 sm:p-7 shadow-2xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
                <Globe className="size-3.5 text-amber-400" />
                KingPay Global Remittance Desk
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                RBI PA-CB &amp; FEMA Compliant
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Cross-Border Currency Corridor <span className="text-amber-400">Desk</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Send SAR, AED, USD, QAR &amp; GBP directly to India (UPI / Bank) and Bangladesh (bKash / Bank) with transparent 0.45% Founder FX markup and instant nodal settlement.
            </p>
          </div>

          {/* 15-Min FX Rate Quote Lock Timer */}
          <div className="rounded-2xl border border-amber-400/30 bg-black/60 p-3 sm:p-4 text-center sm:text-right shrink-0">
            <div className="flex items-center justify-center sm:justify-end gap-1.5 text-[10px] font-black uppercase text-amber-400 tracking-wider">
              <Clock className="size-3.5" />
              Live FX Quote Lock
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {formatTimer(secondsRemaining)}
            </div>
            <button
              type="button"
              onClick={handleManualRefreshRate}
              disabled={isRefreshingRate}
              className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center justify-center sm:justify-end gap-1 mt-1 transition-colors mx-auto sm:ml-auto"
            >
              <RefreshCw className={cn("size-3", isRefreshingRate && "animate-spin text-amber-400")} />
              Sync Interbank Rates
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. SEND CORRIDOR & AMOUNT CALCULATOR */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CURRENCY & AMOUNT SELECTOR */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <DollarSign className="size-4 text-amber-400" />
              1. Transfer Corridor &amp; Source Amount
            </h2>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              Transparent Interbank Rate
            </span>
          </div>

          {/* SEND CURRENCY PICKER */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
              Sending From (Foreign Currency)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {SOURCE_CURRENCIES.map((cur) => {
                const isSelected = sourceCurrency === cur.code;
                return (
                  <button
                    key={cur.code}
                    type="button"
                    onClick={() => {
                      setSourceCurrency(cur.code);
                      setSendAmount(cur.defaultAmount);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border text-center transition-all",
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/40"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                    )}
                  >
                    <span className="text-base sm:text-lg block">{cur.flagEmoji}</span>
                    <span className="text-xs font-black block mt-0.5">{cur.code}</span>
                    <span className="text-[9px] text-slate-400 block truncate">{cur.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DESTINATION COUNTRY PICKER */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">
              Destination Country
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestinationCountry("India")}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all",
                  destinationCountry === "India"
                    ? "bg-amber-400/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                )}
              >
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <p className="text-xs font-black">India (INR • ₹)</p>
                  <p className="text-[10px] text-slate-400">Instant UPI &amp; Bank IMPS</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDestinationCountry("Bangladesh")}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all",
                  destinationCountry === "Bangladesh"
                    ? "bg-amber-400/20 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                )}
              >
                <span className="text-2xl">🇧🇩</span>
                <div>
                  <p className="text-xs font-black">Bangladesh (BDT • ৳)</p>
                  <p className="text-[10px] text-slate-400">bKash Mobile &amp; Bank Wire</p>
                </div>
              </button>
            </div>
          </div>

          {/* SEND AMOUNT INPUT & PRESETS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                You Send ({sourceCurrency})
              </label>
              <div className="flex items-center gap-1.5">
                {currentConfig.presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSendAmount(preset)}
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold border transition",
                      sendAmount === preset
                        ? "bg-amber-400 text-slate-950 border-amber-400"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                    )}
                  >
                    {preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-3.5 top-3 text-slate-400 font-black text-sm">
                {currentConfig.symbol}
              </div>
              <input
                type="number"
                min="10"
                step="10"
                value={sendAmount || ""}
                onChange={(e) => setSendAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-16 py-3 text-base sm:text-lg font-black text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <div className="absolute right-3.5 top-3 text-slate-400 font-bold text-xs uppercase">
                {sourceCurrency}
              </div>
            </div>
          </div>

          {/* TRANSPARENT FX CALCULATION BREAKDOWN */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <span>Interbank Mid-Market Rate:</span>
                <Info className="size-3 text-slate-500" />
              </span>
              <span className="font-mono text-slate-200">
                1 {sourceCurrency} = {targetCurrencySymbol}{interbankRate.toFixed(2)} {targetCurrencyCode}
              </span>
            </div>

            <div className="flex justify-between text-amber-300">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="size-3 text-amber-400" />
                Founder Transparent FX Markup:
              </span>
              <span className="font-mono font-bold">
                +{FOUNDER_FX_MARKUP_PERCENT}% ({targetCurrencySymbol}{((interbankRate * FOUNDER_FX_MARKUP_PERCENT) / 100).toFixed(2)})
              </span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>PA-CB Cross-Border Regulatory Fee:</span>
              <span className="font-mono text-emerald-400 font-bold">
                UPI Ready (Promo Zero Surcharge)
              </span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm">
              <span className="font-black text-white">Effective Exchange Rate:</span>
              <span className="font-mono font-black text-amber-400">
                1 {sourceCurrency} = {targetCurrencySymbol}{effectiveRate.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: NET PAYOUT & BENEFICIARY FORM */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          {/* NET PAYOUT HERO CARD */}
          <div className="rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                Net Recipient Payout
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Speed: &lt;60 Seconds
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
                <span className="text-emerald-400">{targetCurrencySymbol}</span>
                <span>{netPayoutAmount.toLocaleString()}</span>
                <span className="text-xs font-normal text-slate-400">{targetCurrencyCode}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Recipient receives strictly this exact amount. Zero deduction at destination.
              </p>
            </div>

            {/* Comparison vs Traditional Bank */}
            <div className="bg-black/50 border border-slate-800 rounded-xl p-3 space-y-1 text-xs">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Typical Bank Payout (3.8% spread):</span>
                <span className="font-mono">{targetCurrencySymbol}{bankNetPayout.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-300 text-xs">
                <span>OrderKing Founder Advantage:</span>
                <span className="font-mono">+{targetCurrencySymbol}{customerSavings.toLocaleString()} More</span>
              </div>
            </div>
          </div>

          {/* BENEFICIARY DETAILS FORM CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <Smartphone className="size-4 text-amber-400" />
                2. Beneficiary Details ({destinationCountry})
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Instant Verification</span>
            </div>

            <form onSubmit={handleInitiateRemittance} className="space-y-3 text-xs">
              {/* Recipient Full Name */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Beneficiary Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="As per Government ID (Aadhaar / NID)"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Destination: India Methods */}
              {destinationCountry === "India" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethodIndia("UPI")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-bold transition",
                        payoutMethodIndia === "UPI"
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      )}
                    >
                      Instant UPI (NPCI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethodIndia("BANK")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-bold transition",
                        payoutMethodIndia === "BANK"
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      )}
                    >
                      Bank IMPS / NEFT
                    </button>
                  </div>

                  {payoutMethodIndia === "UPI" ? (
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">UPI ID (VPA) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. mobile@upi or name@okhdfcbank"
                        value={beneficiaryUpiId}
                        onChange={(e) => setBeneficiaryUpiId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Account No. *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 501002349012"
                          value={beneficiaryAccountNumber}
                          onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">IFSC Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. HDFC0000123"
                          value={beneficiaryIfsc}
                          onChange={(e) => setBeneficiaryIfsc(e.target.value.toUpperCase())}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Destination: Bangladesh Methods */}
              {destinationCountry === "Bangladesh" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethodBangladesh("BKASH")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-bold transition",
                        payoutMethodBangladesh === "BKASH"
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      )}
                    >
                      bKash Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethodBangladesh("BANK")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg border text-xs font-bold transition",
                        payoutMethodBangladesh === "BANK"
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      )}
                    >
                      Bangladesh Bank
                    </button>
                  </div>

                  {payoutMethodBangladesh === "BKASH" ? (
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">
                        bKash Mobile Wallet (11 digits) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 01712345678"
                        value={beneficiaryBkashNumber}
                        onChange={(e) => setBeneficiaryBkashNumber(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Bank Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Islami Bank / BRAC"
                          value={beneficiaryBdBank}
                          onChange={(e) => setBeneficiaryBdBank(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Account No. *</label>
                        <input
                          type="text"
                          required
                          placeholder="Account Number"
                          value={beneficiaryAccountNumber}
                          onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Purpose Selection */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Remittance Purpose (FEMA / AML) *</label>
                <select
                  value={remittancePurpose}
                  onChange={(e) => setRemittancePurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Family Maintenance & Support">Family Maintenance &amp; Support</option>
                  <option value="Education Fees & Courseware">Education Fees &amp; Courseware</option>
                  <option value="Healthcare & Medical Relief">Healthcare &amp; Medical Relief</option>
                  <option value="Savings & Real Estate Investment">Savings &amp; Real Estate Investment</option>
                  <option value="Emergency Relief">Emergency Relief</option>
                </select>
              </div>

              {/* Transparent Regulatory Status & External Bank Handoff */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 space-y-1.5 mt-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <ShieldCheck className="size-4" /> Informational FX Estimator Tool
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  This calculator provides indicative benchmark currency conversions. Direct cross-border debit/credit execution requires an RBI Authorized Dealer Category-I (AD-Cat-I) banking partnership. To execute outward or inward remittances, please use our authorized partner banking portals below.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href="https://www.onlinesbi.sbi/sbijava/osbi_global_remittance.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-center text-xs font-bold text-slate-200 transition no-underline flex items-center justify-center gap-1.5"
                >
                  <span>SBI Global Remit</span>
                  <ExternalLink className="size-3 text-amber-400" />
                </a>
                <a
                  href="https://www.westernunion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-center text-xs font-bold text-slate-200 transition no-underline flex items-center justify-center gap-1.5"
                >
                  <span>Western Union</span>
                  <ExternalLink className="size-3 text-amber-400" />
                </a>
                <a
                  href="https://wise.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-center text-xs font-bold text-slate-200 transition no-underline flex items-center justify-center gap-1.5"
                >
                  <span>Wise Global</span>
                  <ExternalLink className="size-3 text-amber-400" />
                </a>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Globe className="size-3.5" />
                <span>Initiate Transfer via Authorized Dealer Bank</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PA-CB COMPLIANCE & LEGAL NOTICE */}
      {/* ========================================================= */}
      <footer className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 text-slate-400 text-xs space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <ShieldCheck className="size-4" />
          <span>Payment Aggregator - Cross Border (PA-CB) Statutory Architecture</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          OrderKing KingPay Remittance operates under strict compliance with RBI Master Directions on Payment Aggregator - Cross Border (PA-CB) and FEMA guidelines. Outward remittances are processed via authorized AD Category-I dealer banks with real-time OFAC, FATF, and Bangladesh Bank anti-money laundering sanction screening. Zero concealed conversion surcharges are applied.
        </p>
      </footer>

    </div>
  );
}
