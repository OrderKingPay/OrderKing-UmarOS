import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Percent,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLoanHubProps {
  walletBalance: number;
  onDisburseToWallet: (amount: number) => void;
}

export function MicroLoanHub({ walletBalance, onDisburseToWallet }: MicroLoanHubProps) {
  const [creditAmount, setCreditAmount] = useState<number>(10000);
  const [tenureDays, setTenureDays] = useState<30 | 60 | 90>(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeLoan, setActiveLoan] = useState<{
    id: string;
    amount: number;
    disbursedAt: string;
    dueAt: string;
    repaid: boolean;
  } | null>(null);

  const maxCredit = 50000;

  const handleApplyCredit = () => {
    toast.error(
      "Integration Pending: Financial APIs (Razorpay/NBFC) are currently disconnected per audit mandate OK-AUDIT-002. No simulated loans allowed."
    );
  };

  const handleRepayLoan = () => {
    if (!activeLoan) return;
    if (walletBalance < activeLoan.amount) {
      toast.error("Insufficient wallet balance to repay loan. Please add money to wallet first.");
      return;
    }
    setActiveLoan((prev) => (prev ? { ...prev, repaid: true } : null));
    toast.success("✅ Loan repaid in full! Your pre-approved credit limit has increased.");
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      {/* 👑 PRE-APPROVED SOVEREIGN CREDIT HEADER */}
      <div className="rounded-2xl border-2 border-cyan-500/40 bg-gradient-to-br from-[#07241C] via-surface to-cyan-950/40 p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xl shadow-md ring-2 ring-cyan-400/60">
              <CreditCard className="size-6 text-white" />
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-cyan-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-fg">KingPay Sovereign Credit Line</h2>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-extrabold text-cyan-600 dark:text-cyan-300 border border-cyan-500/40">
                  0% Interest
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Instant ₹1,000 – ₹50,000 Pre-Approved Credit · RBI-Regulated NBFC Partner
              </p>
            </div>
          </div>

          <span className="rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-2.5 py-1 text-xs font-mono font-bold">
            Limit: ₹50,000
          </span>
        </div>

        {/* 3 Key Highlights */}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-cyan-500/20 pt-3 text-center">
          <div className="rounded-xl bg-surface-2/60 p-2">
            <span className="text-base block mb-0.5">⚡</span>
            <span className="text-[11px] font-bold text-fg block">0s Disbursement</span>
            <span className="text-[9px] text-emerald-600 font-semibold">Direct to Wallet</span>
          </div>
          <div className="rounded-xl bg-surface-2/60 p-2">
            <span className="text-base block mb-0.5">🛡️</span>
            <span className="text-[11px] font-bold text-fg block">0% Extra Fees</span>
            <span className="text-[9px] text-cyan-600 font-semibold">No Hidden Charges</span>
          </div>
          <div className="rounded-xl bg-surface-2/60 p-2">
            <span className="text-base block mb-0.5">📈</span>
            <span className="text-[11px] font-bold text-fg block">Build Credit</span>
            <span className="text-[9px] text-primary font-semibold">Reports to CIBIL</span>
          </div>
        </div>
      </div>

      {/* ACTIVE LOAN CARD (IF ANY) */}
      {activeLoan && !activeLoan.repaid && (
        <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-surface to-amber-500/5 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              <span className="text-xs font-bold text-fg">Active Micro-Credit: {activeLoan.id}</span>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              Due on {activeLoan.dueAt}
            </span>
          </div>

          <div className="flex items-center justify-between border-y border-amber-500/20 py-2">
            <div>
              <span className="text-xs text-muted block">Disbursed Amount</span>
              <span className="text-xl font-black text-fg font-mono">
                ₹{activeLoan.amount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block">Interest Charged</span>
              <span className="text-sm font-bold text-emerald-600">₹0 (0% Interest Active)</span>
            </div>
          </div>

          <Button
            onClick={handleRepayLoan}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs"
          >
            Repay ₹{activeLoan.amount.toLocaleString("en-IN")} from Wallet (Instant Clearance)
          </Button>
        </div>
      )}

      {/* CREDIT AMOUNT SELECTOR */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-fg">Select Desired Credit Amount</h3>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {[2000, 5000, 10000, 25000, 50000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setCreditAmount(amt)}
              className={`p-2.5 rounded-xl border text-center transition ${
                creditAmount === amt
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/40 font-bold"
                  : "border-border bg-surface-2 text-muted hover:text-fg hover:border-border/80"
              }`}
            >
              <span className="text-xs font-mono font-bold block">₹{amt.toLocaleString("en-IN")}</span>
            </button>
          ))}
        </div>

        {/* Tenure Selector */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <label className="text-xs font-semibold text-muted block">Repayment Period</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { days: 30 as const, label: "30 Days (0% Interest)" },
              { days: 60 as const, label: "60 Days (0% Interest)" },
              { days: 90 as const, label: "90 Days (0% Interest)" },
            ].map((t) => (
              <button
                key={t.days}
                type="button"
                onClick={() => setTenureDays(t.days)}
                className={`p-2 rounded-xl border text-center text-xs font-semibold transition ${
                  tenureDays === t.days
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border bg-surface-2 text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleApplyCredit}
          disabled={true}
          className="w-full bg-slate-200 text-slate-500 font-black text-xs py-3 shadow-none cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <Zap className="size-4" />
            Backend Integration Required
          </span>
        </Button>
      </div>

      {/* STATUTORY PARTNER NOTICE */}
      <div className="rounded-xl border border-border/80 bg-surface-2/40 p-3 text-[11px] text-muted space-y-1">
        <p className="font-semibold text-fg flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          <span>RBI-Regulated Digital Lending Guidelines (DLG) Compliant</span>
        </p>
        <p>
          Credit facility provided in partnership with RBI-licensed NBFCs. Transparent zero-penalty repayment, no pre-closure charges, and zero processing fee.
        </p>
      </div>
    </div>
  );
}
