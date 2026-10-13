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
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5">
      <header className="rounded-3xl border border-amber-400/30 bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-900 p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-300"><Crown className="size-5" /> King Pay</p>
        <h1 className="mt-2 text-2xl font-extrabold text-white">Everything in its place</h1>
        <p className="mt-2 text-sm text-slate-300">Open a category to see available tools and clear provider status. No unverified payments or balance claims.</p>
      </header>
      <div className="grid gap-3">
        {KINGPAY_CATEGORIES.map((category,i) => {
          const Icon=icons[category.id];
          const isOpen=expanded===category.id;
          return (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-amber-400/20 bg-slate-900 shadow-sm">
              <button type="button" aria-expanded={isOpen}
                onClick={()=>{setExpanded(isOpen ? null:category.id);onSelectSection(category.id);}}
                className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-800">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-300/10 text-amber-300"><Icon className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{i+1}. {category.label}</span>
                  <span className="mt-1 block text-xs text-slate-400">{category.intro}</span>
                </span>
                {isOpen ? <ChevronUp className="size-4 text-amber-300" /> : <ChevronDown className="size-4 text-amber-300" />}
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-slate-700/70 p-4">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {category.features.map(feature=>(
                      <div key={feature.label} className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-950/80 p-3">
                        <span className="text-xs font-semibold text-slate-200">{feature.label}</span>
                        <span className={"shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold "+
                          (feature.status===READY ? "bg-emerald-800 text-emerald-100":"bg-slate-800 text-slate-400")}>{feature.status}</span>
                      </div>
                    ))}
                  </div>
                  {category.id==="wealth" && <GST />}
                  {category.id==="loan" && <EMI />}
                  {category.id==="passbook" && (
                    <p className="flex items-start gap-2 text-xs text-slate-300"><ShieldCheck className="size-4 shrink-0 text-amber-300" />
                      Your verified transaction history requires an authorized account ledger. No sample receipts will be shown.
                    </p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <Link to="/king-pay/assist" className="block rounded-2xl border border-amber-400/50 bg-gradient-to-r from-emerald-900 to-slate-900 p-4 text-center text-sm font-bold text-amber-200 no-underline">
        <Crown className="mr-2 inline size-5" /> Ask King Assist about any service
      </Link>
    </div>
  );
}
