import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Info,
  Building2,
  ExternalLink,
  Smartphone,
  Landmark,
  Scale,
} from "lucide-react";
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
    flagEmoji: "SA",
    defaultAmount: 1000,
    presets: [500, 1000, 2500, 5000],
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
    country: "United Arab Emirates",
    flagEmoji: "AE",
    defaultAmount: 1000,
    presets: [500, 1000, 2000, 5000],
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    country: "United States / Global",
    flagEmoji: "US",
    defaultAmount: 500,
    presets: [250, 500, 1000, 2500],
  },
  {
    code: "QAR",
    name: "Qatari Riyal",
    symbol: "ر.ق",
    country: "Qatar",
    flagEmoji: "QA",
    defaultAmount: 1000,
    presets: [500, 1000, 2000, 4000],
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    country: "United Kingdom",
    flagEmoji: "GB",
    defaultAmount: 400,
    presets: [200, 400, 800, 1500],
  },
];

// Indicative Mid-Market Rates (Daily Reference)
const INTERBANK_BASE_RATES: Record<SourceCurrency, Record<DestinationCountry, number>> = {
  SAR: { India: 23.16, Bangladesh: 32.42 },
  AED: { India: 23.65, Bangladesh: 33.10 },
  USD: { India: 86.85, Bangladesh: 121.50 },
  QAR: { India: 23.85, Bangladesh: 33.35 },
  GBP: { India: 109.80, Bangladesh: 153.60 },
};

export const AUTHORIZED_REMITTANCE_PROVIDERS = [
  {
    name: "State Bank of India (SBI Global Remit)",
    type: "RBI Authorized Dealer Category-I",
    corridor: "India (Inward / Outward)",
    description: "Official public sector banking channel for direct INR credit via NEFT/RTGS.",
    url: "https://www.onlinesbi.sbi/sbijava/osbi_global_remittance.html",
  },
  {
    name: "HDFC Bank RemitNow",
    type: "RBI Authorized Dealer Category-I",
    corridor: "India (Inward / Outward)",
    description: "Seamless outward remittance under Liberalised Remittance Scheme (LRS).",
    url: "https://www.hdfcbank.com/personal/pay/money-transfer/remitnow",
  },
  {
    name: "ICICI Money2India",
    type: "RBI Authorized Dealer Category-I",
    corridor: "India (Inward)",
    description: "Fixed exchange rate transfers directly into any Indian bank account.",
    url: "https://www.money2india.com",
  },
  {
    name: "Western Union India",
    type: "RBI MTSS Operator",
    corridor: "Global to India & Bangladesh",
    description: "Licensed Money Transfer Service Scheme for verified cross-border cash pickup and bank deposit.",
    url: "https://www.westernunion.com",
  },
  {
    name: "Wise (TransferWise)",
    type: "FCA & RBI Partner Network",
    corridor: "Global to India & Bangladesh",
    description: "Mid-market rate international money transfers directly to bank accounts and UPI IDs.",
    url: "https://wise.com",
  },
  {
    name: "bKash Remittance Service",
    type: "Bangladesh Bank Authorized MFS",
    corridor: "Global to Bangladesh",
    description: "Official Bangladesh Bank incentive-compliant inward remittance to mobile wallets.",
    url: "https://www.bkash.com/en/products-services/remittance",
  },
];

export function RemittanceDesk() {
  const [sourceCurrency, setSourceCurrency] = useState<SourceCurrency>("SAR");
  const [destinationCountry, setDestinationCountry] = useState<DestinationCountry>("India");
  const [sendAmount, setSendAmount] = useState<number>(1000);

  // Calculations
  const interbankRate = INTERBANK_BASE_RATES[sourceCurrency][destinationCountry];
  const validSendAmount = Math.max(1, Number.isFinite(sendAmount) ? sendAmount : 100);
  const estimatedPayout = Math.round(validSendAmount * interbankRate * 100) / 100;

  const targetCurrencySymbol = destinationCountry === "India" ? "₹" : "৳";
  const targetCurrencyCode = destinationCountry === "India" ? "INR" : "BDT";
  const currentConfig = SOURCE_CURRENCIES.find((c) => c.code === sourceCurrency) || SOURCE_CURRENCIES[0];

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans space-y-6">
      {/* ========================================================= */}
      {/* 1. HERO DESK HEADER & STATUTORY ADVISORY */}
      {/* ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950/40 p-5 sm:p-7 shadow-2xl text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-400/20 border border-orange-400/40 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-orange-300">
                <Globe className="size-3.5 text-orange-400" />
                KingPay Foreign Exchange Reference Desk
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                <Scale className="size-3.5 text-orange-400" />
                FEMA Reference Tool
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Foreign Exchange Reference &amp; <span className="text-orange-400">Transfer Guide</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Calculate indicative mid-market conversions for SAR, AED, USD, QAR, and GBP to INR/BDT. Connect with authorized AD-Cat-I banks for FEMA-compliant international transfers.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-black/60 p-3 sm:p-4 text-center sm:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Reference Rate</span>
            <span className="text-lg sm:text-xl font-black text-orange-300 font-mono">
              1 {sourceCurrency} = {targetCurrencySymbol}{interbankRate.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Indicative Mid-Market</span>
          </div>
        </div>

        {/* Regulatory Banner */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2.5 text-xs text-slate-300 bg-orange-950/30 -mx-5 -mb-5 p-4 sm:-mx-7 sm:-mb-7">
          <Info className="size-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-300">
            <strong>Statutory Notice:</strong> OrderKing operates as a hyperlocal food delivery and payments platform under GSTIN 18AFXPH9838M1Z9 (Assam - 788710). OrderKing is not an Authorized Dealer (AD-I/II) and does not directly execute or hold cross-border foreign currency remittances. All international money transfers must be executed through RBI-licensed banking institutions or authorized MTSS partners.
          </p>
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
              <DollarSign className="size-4 text-orange-400" />
              1. Transfer Corridor &amp; Source Amount
            </h2>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
              Mid-Market Benchmark
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
                      "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-orange-400/20 border-orange-400 text-orange-200 shadow-sm ring-1 ring-orange-400/40"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                    )}
                  >
                    <span className="inline-flex items-center justify-center rounded-md bg-slate-900/80 border border-slate-700 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-orange-300">
                      {cur.flagEmoji}
                    </span>
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
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                  destinationCountry === "India"
                    ? "bg-orange-400/20 border-orange-400 text-white shadow-sm ring-1 ring-orange-400/40"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-400/30 text-xs font-black text-orange-300">IN</span>
                <div>
                  <p className="text-xs font-black">India (INR • ₹)</p>
                  <p className="text-[10px] text-slate-400">UPI &amp; Bank IMPS</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDestinationCountry("Bangladesh")}
                className={cn(
                  "p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                  destinationCountry === "Bangladesh"
                    ? "bg-orange-400/20 border-orange-400 text-white shadow-sm ring-1 ring-orange-400/40"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-xs font-black text-emerald-300">BD</span>
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
                      "px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer",
                      sendAmount === preset
                        ? "bg-orange-400 text-slate-950 border-orange-400"
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
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-16 py-3 text-base sm:text-lg font-black text-white font-mono focus:outline-none focus:border-orange-400"
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

            <div className="flex justify-between text-slate-400">
              <span>OrderKing Platform Fee:</span>
              <span className="font-mono text-emerald-400 font-bold">
                ₹0 (Waived)
              </span>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-sm">
              <span className="font-black text-white">Estimated Conversion Total:</span>
              <span className="font-mono font-black text-orange-400">
                {targetCurrencySymbol}{estimatedPayout.toLocaleString()} {targetCurrencyCode}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ESTIMATED PAYOUT & REGULATED BANK DIRECTORY */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          {/* NET PAYOUT HERO CARD */}
          <div className="rounded-3xl border border-emerald-400/40 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 p-5 sm:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="size-3.5 text-emerald-400" />
                Estimated Recipient Payout
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Direct Bank IMPS / NEFT
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono flex items-baseline gap-1">
                <span className="text-emerald-400">{targetCurrencySymbol}</span>
                <span>{estimatedPayout.toLocaleString()}</span>
                <span className="text-xs font-normal text-slate-400">{targetCurrencyCode}</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Benchmark estimate based on interbank spot rates. Final received amount depends on sending bank fees and intermediary charges.
              </p>
            </div>
          </div>

          {/* AUTHORIZED BANK DIRECTORY */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <Building2 className="size-4 text-orange-400" />
                  2. Regulated Transfer Channels
                </h3>
                <span className="text-[10px] font-bold text-emerald-400">Licensed AD-Cat-I</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Use verified banking portals to send money safely to {destinationCountry}:
              </p>
            </div>

            <div className="space-y-2 mt-2">
              {AUTHORIZED_REMITTANCE_PROVIDERS.filter((p) =>
                destinationCountry === "India"
                  ? p.corridor.includes("India")
                  : p.corridor.includes("Bangladesh")
              ).map((provider) => (
                <a
                  key={provider.name}
                  href={provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl border border-slate-800 bg-slate-950/80 hover:border-orange-400/50 hover:bg-slate-950 transition flex items-center justify-between group no-underline text-left"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-white group-hover:text-orange-300 transition block truncate">
                      {provider.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {provider.type}
                    </span>
                  </div>
                  <ExternalLink className="size-3.5 text-slate-500 group-hover:text-orange-400 shrink-0 transition" />
                </a>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 text-center">
              Official banking portals open in a secure external window.
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. STATUTORY COMPLIANCE & LEGAL NOTICE */}
      {/* ========================================================= */}
      <footer className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 text-slate-400 text-xs space-y-2">
        <div className="flex items-center gap-2 text-orange-400 font-bold">
          <ShieldCheck className="size-4" />
          <span>Foreign Exchange Management Act (FEMA), 1999 Statutory Guidelines</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Cross-border outward and inward currency transactions in India are governed strictly by the Reserve Bank of India (RBI) under the Foreign Exchange Management Act, 1999 (FEMA) and Liberalised Remittance Scheme (LRS). OrderKing does not process, intermediate, or escrow cross-border funds. All outward and inward remittances must be routed via Authorized Dealer Category-I licensed banks or authorized Money Transfer Service Scheme (MTSS) operators.
        </p>
      </footer>
    </div>
  );
}
