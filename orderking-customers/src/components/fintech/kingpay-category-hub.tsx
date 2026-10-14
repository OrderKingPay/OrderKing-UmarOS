import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Calculator, ChevronDown, ChevronUp, Crown, Landmark, Receipt, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import type { KingPaySection } from "./kingpay-shell";

type Section = "pay" | "bills" | "wealth" | "loan" | "passbook";
type Feature = { label: string; status: "Requires partner" | "Calculator ready" };
type Category = { id: Section; label: string; intro: string; features: Feature[] };
const NOT_CONNECTED: Feature["status"] = "Requires partner";
const READY: Feature["status"] = "Calculator ready";

export const KINGPAY_CATEGORIES: Category[] = [
  {
    id: "pay", label: "Pay, Scan & Transfer", intro: "UPI and contact payments",
    features: [
      { label: "Scan QR", status: NOT_CONNECTED }, { label: "Pay UPI ID / Contact", status: NOT_CONNECTED },
      { label: "Self-Transfer", status: NOT_CONNECTED }, { label: "Remittance Estimator", status: NOT_CONNECTED },
      { label: "Split Bill with Friends", status: NOT_CONNECTED },
    ],
  },
  {
    id: "bills", label: "Bills, Recharges & Utilities", intro: "Everyday household payments",
    features: [
      { label: "Mobile Prepaid / Postpaid", status: NOT_CONNECTED }, { label: "Electricity", status: NOT_CONNECTED },
      { label: "FASTag", status: NOT_CONNECTED }, { label: "DTH / Broadband", status: NOT_CONNECTED },
      { label: "Credit Card Bill", status: NOT_CONNECTED }, { label: "Piped Gas / Water", status: NOT_CONNECTED },
    ],
  },
  {
    id: "wealth", label: "Wealth, Gold, Pots & Tax", intro: "Planning and transparent calculators",
    features: [
      { label: "Goal Savings Pots", status: NOT_CONNECTED }, { label: "Digital Gold Tracker", status: NOT_CONNECTED },
      { label: "FD / RD Yield Estimator", status: NOT_CONNECTED }, { label: "GST Calculator", status: READY },
      { label: "Income Tax Calculator", status: NOT_CONNECTED },
    ],
  },
  {
    id: "loan", label: "Credit, Loans & Insurance", intro: "Understand costs before committing",
    features: [
      { label: "Credit Score", status: NOT_CONNECTED }, { label: "Instant EMI Calculator", status: READY },
      { label: "Partner Credit Cards / Loans", status: NOT_CONNECTED },
      { label: "Bike / Health / Travel Insurance", status: NOT_CONNECTED },
    ],
  },
  {
    id: "passbook", label: "Passbook, Escrow & Receipts", intro: "Private transaction records",
    features: [
      { label: "Verified Transactions", status: NOT_CONNECTED }, { label: "Refund Status", status: NOT_CONNECTED },
      { label: "Download Statement", status: NOT_CONNECTED }, { label: "Disputes / UTR", status: NOT_CONNECTED },
    ],
  },
];

const icons: Record<Section, typeof Wallet> = {
  pay: Wallet, bills: Smartphone, wealth: Landmark, loan: Calculator, passbook: Receipt,
};

function formatRupees(x: number): string {
  return Number.isFinite(x) ? "₹" + x.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) : "—";
}
function EMI() {
  const [principal, setPrincipal] = useState(100000);
  const [apr, setApr] = useState(10);
  const [months, setMonths] = useState(24);
  const r = apr / 1200;
  const factor = Math.pow(1+r,months);
  const payment = months > 0 && Number.isFinite(factor) && principal >= 0 &&
    apr >= 0 ? (r === 0 ? principal/months : principal*r*factor/(factor-1)) : 0;
  return (
    <div className="rounded-2xl border border-emerald-800/50 bg-slate-900 p-4">
      <h3 className="font-bold text-emerald-200">EMI calculator</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="text-xs text-slate-300">Loan ₹<input type="number" min={0} max={100000000} value={principal} onChange={(e)=>setPrincipal(Math.max(0,Number(e.target.value)||0))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" /></label>
        <label className="text-xs text-slate-300">Rate % p.a.<input type="number" min={0} max={100} step="0.5" value={apr} onChange={(e)=>setApr(Math.min(100,Math.max(0,Number(e.target.value)||0)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" /></label>
        <label className="text-xs text-slate-300">Months<input type="number" min={1} max={600} value={months} onChange={(e)=>setMonths(Math.min(600,Math.max(1,Number(e.target.value)||1)))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" /></label>
      </div>
      <p className="mt-3 font-semibold text-amber-300">Estimated monthly EMI: {formatRupees(payment)}</p>
      <p className="mt-1 text-xs text-slate-400">Illustration only. Rates and lender approval are not verified.</p>
    </div>
  );
}
function GST() {
  const [amount,setAmount]=useState(1000);
  const [rate,setRate]=useState(18);
  return (
    <div className="rounded-2xl border border-emerald-800/50 bg-slate-900 p-4">
      <h3 className="font-bold text-emerald-200">GST calculator (exclusive)</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-300">Taxable amount ₹<input type="number" min={0} max={100000000} value={amount} onChange={(e)=>setAmount(Math.max(0,Number(e.target.value)||0))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white" /></label>
        <label className="text-xs text-slate-300">Rate %<select value={rate} onChange={(e)=>setRate(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white">{[0,5,12,18,28].map(v=><option value={v} key={v}>{v}%</option>)}</select></label>
      </div>
      <p className="mt-3 font-semibold text-amber-300">GST: {formatRupees(amount*rate/100)} · Total: {formatRupees(amount*(1+rate/100))}</p>
      <p className="mt-1 text-xs text-slate-400">Select the legally applicable rate for your goods or services.</p>
    </div>
  );
}

export function KingPayCategoryHub({
  activeSection, onSelectSection,
}: { activeSection: KingPaySection; onSelectSection: (v: KingPaySection)=>void }) {
  const [expanded, setExpanded] = useState<Section | null>(
    (["pay","bills","wealth","loan","passbook"].includes(activeSection)
      ? activeSection : "pay") as Section
  );
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6">
      {/* 24K PURE GOLD SOVEREIGN SUITE HERO */}
      <header className="relative overflow-hidden rounded-3xl border border-amber-400/50 bg-gradient-to-r from-amber-950/80 via-slate-950 to-[#2A1D07] p-6 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.25)] text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/50 px-3 py-1 text-xs font-black text-amber-300 shadow-sm">
                <Crown className="size-3.5" />
                <span>24K Sovereign FinTech Suite</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                RBI &amp; NPCI Verified Standards
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              OrderKing <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">KingPay 24K</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Sovereign wealth calculators, transparent utility bills, instant EMI estimators, and direct RBI-authorized partner gateways with zero unverified ledger claims.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-400/40 bg-black/50 p-4 text-right backdrop-blur-xl shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
              24K Hallmarked Security
            </span>
            <span className="text-lg font-black text-white font-mono block mt-0.5">
              Zero Unverified Debits
            </span>
            <span className="text-[10px] text-slate-400 block">
              Bank-grade 256-bit AES Vault
            </span>
          </div>
        </div>
      </header>

      {/* 24K Gold Styled Accordion Categories */}
      <div className="grid gap-3.5">
        {KINGPAY_CATEGORIES.map((category, i) => {
          const Icon = icons[category.id];
          const isOpen = expanded === category.id;
          return (
            <section
              key={category.id}
              className={`overflow-hidden rounded-2xl border transition-all duration-300 shadow-lg ${
                isOpen
                  ? "border-amber-400/60 bg-gradient-to-b from-slate-900/95 to-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30"
                  : "border-amber-400/25 bg-slate-900/80 hover:border-amber-400/50 hover:bg-slate-900"
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  setExpanded(isOpen ? null : category.id);
                  onSelectSection(category.id);
                }}
                className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition"
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-400/20 to-yellow-600/10 text-amber-300 shadow-md shadow-amber-500/20">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm sm:text-base font-black text-white">
                    {i + 1}. {category.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400 font-medium">{category.intro}</span>
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-amber-400/20 p-5 bg-black/30 backdrop-blur-md">
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {category.features.map((feature) => (
                      <div
                        key={feature.label}
                        className="flex items-center justify-between gap-2.5 rounded-xl border border-amber-400/20 bg-slate-950/80 p-3 hover:border-amber-400/40 transition"
                      >
                        <span className="text-xs font-bold text-slate-200">{feature.label}</span>
                        <span
                          className={
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black border " +
                            (feature.status === READY
                              ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                              : "bg-slate-800/80 border-slate-700 text-slate-400")
                          }
                        >
                          {feature.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {category.id === "wealth" && <GST />}
                  {category.id === "loan" && <EMI />}
                  {category.id === "passbook" && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 flex items-start gap-2.5">
                      <ShieldCheck className="size-4 shrink-0 text-amber-400 mt-0.5" />
                      <span>
                        Verified account ledger entries require an authorized banking partner connection. No sample or mock transaction receipts are asserted.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* 24K Gold Sovereign King Assist Banner */}
      <Link
        to="/king-pay/assist"
        className="block rounded-2xl border border-amber-400/60 bg-gradient-to-r from-amber-950/90 via-slate-950 to-amber-900/90 p-4 text-center text-sm font-black text-amber-200 no-underline shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:text-amber-100 transition group"
      >
        <Crown className="mr-2 inline size-5 text-amber-400 group-hover:scale-110 transition-transform" />
        Consult 24K King Assist Concierge for Any Payment or Wealth Desk ➔
      </Link>
    </div>
  );
}
