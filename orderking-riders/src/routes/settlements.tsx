// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Banknote, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/settlements")({
  component: RiderSettlementsPage,
});

export function RiderSettlementsPage() {
  const [walletPaise, setWalletPaise] = useState<number>(53800); // ₹538.00
  const [upiVpa, setUpiVpa] = useState<string>("rider.assam@okaxis");
  const [bankIfsc, setBankIfsc] = useState<string>("SBIN0000108");
  const [bankAcct, setBankAcct] = useState<string>("30981726351");
  const [method, setMethod] = useState<"UPI" | "NEFT_IMPS">("UPI");
  const [depositTier, setDepositTier] = useState<number>(500);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem("orderking_rider_wallet_paise_v1");
      if (saved) setWalletPaise(parseInt(saved, 10) || 53800);
    } catch {}
  }, []);

  function handleWithdraw(e: any) {
    e.preventDefault();
    if (walletPaise <= 0) {
      setMsg(" Digital earnings balance is ₹0.00. Complete a doorstep OTP delivery to withdraw.");
      return;
    }
    if (method === "UPI" && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/.test(upiVpa.trim())) {
      setMsg("Please enter a valid UPI ID (vpa@bank).");
      return;
    }
    const amtStr = (walletPaise / 100).toFixed(2);
    const utr = "OKR" + Date.now().toString().slice(-8);
    setWalletPaise(0);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("orderking_rider_wallet_paise_v1", "0");
      } catch {}
    }
    setMsg(
      method === "UPI"
        ? `Instant UPI Payout of ₹${amtStr} transferred to ${upiVpa} (UTR: ${utr}).`
        : `NEFT/IMPS Bank Payout of ₹${amtStr} initiated to A/C ••••${bankAcct.slice(-4)} (${bankIfsc}) (UTR: ${utr}).`
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              <Banknote className="size-5 text-[#E5A93C]" />
              <span>Direct UPI &amp; NEFT/IMPS Payout Withdrawal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant UPI transfer (vpa@bank) or automated daily NEFT/IMPS batch
            </p>
          </div>
          <Link
            to="/onboarding"
            className="rounded-xl border border-[#1E283D] bg-[#0E121B] px-3.5 py-2 text-xs font-semibold text-slate-200"
          >
            KYC &amp; Bank Setup
          </Link>
        </div>

        {msg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-4">
            <div className="text-xs text-slate-400">Available Earnings Balance</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              ₹{(walletPaise / 100).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Released via 4-Digit Doorstep OTP</div>
          </div>
          <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-4">
            <div className="text-xs text-slate-400">COD Cash Limit</div>
            <div className="text-2xl font-bold text-[#E5A93C] font-mono mt-1">₹{depositTier}</div>
            <div className="text-[11px] text-slate-400 mt-1">Deposit-linked float active</div>
          </div>
        </div>

        {/* Direct UPI & Bank NEFT/IMPS Withdrawal Form */}
        <form onSubmit={handleWithdraw} className="rounded-2xl border border-[#1E283D] bg-[#121723] p-5 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("UPI")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                method === "UPI"
                  ? "border-[#E5A93C] bg-[#E5A93C]/20 text-white"
                  : "border-[#1E283D] bg-[#0E121B] text-slate-400"
              }`}
            >
              Direct UPI Transfer (vpa@bank)
            </button>
            <button
              type="button"
              onClick={() => setMethod("NEFT_IMPS")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                method === "NEFT_IMPS"
                  ? "border-[#E5A93C] bg-[#E5A93C]/20 text-white"
                  : "border-[#1E283D] bg-[#0E121B] text-slate-400"
              }`}
            >
              Bank NEFT / IMPS Batch
            </button>
          </div>

          {method === "UPI" ? (
            <div>
              <label className="text-xs text-slate-300 block mb-1">Verified Rider UPI VPA</label>
              <Input
                value={upiVpa}
                onChange={(e) => setUpiVpa(e.target.value)}
                placeholder="mobile@upi"
                className="h-10 bg-[#0E121B] border-[#1E283D] text-white font-mono text-xs"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Bank Account Number</label>
                <Input
                  value={bankAcct}
                  onChange={(e) => setBankAcct(e.target.value)}
                  className="h-10 bg-[#0E121B] border-[#1E283D] text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Bank IFSC</label>
                <Input
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  className="h-10 bg-[#0E121B] border-[#1E283D] text-white font-mono text-xs"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 bg-[#E5A93C] hover:bg-amber-400 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowUpRight className="size-4" />
            <span>Withdraw ₹{(walletPaise / 100).toFixed(2)} Now</span>
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

export { RiderSettlementsPage as SettlementsDesk };
