
import { useState } from "react";
import { Banknote, ArrowRight, ShieldCheck, Zap, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLoanHubProps {
  walletBalance: number;
  onDisburseToWallet: (amount: number) => void;
}

export function MicroLoanHub({ walletBalance, onDisburseToWallet }: MicroLoanHubProps) {
  const [showApply, setShowApply] = useState(false);
  const [pan, setPan] = useState("");
  const [income, setIncome] = useState("35000");
  const [amount, setAmount] = useState("50000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      toast.error('Loan integration coming soon - Under Development');
      return;
      const data = await res.json();
      
      if (res.ok && data.approved) {
        setResult(data);
        onDisburseToWallet(data.disbursedAmount);
      } else {
        setError(data.message || data.error || "Application rejected");
      }
    } catch (err) {
      setError("Network error connecting to NBFC partner.");
    } finally {
      setLoading(false);
    }
  };

  const handleNavi = () => window.open("https://navi.com/personal-loan?utm_source=orderking_affiliate", "_blank");
  const handleKreditBee = () => window.open("https://www.kreditbee.in/?utm_source=orderking_affiliate", "_blank");

  return (
    <div className="space-y-6 text-fg p-4 md:p-6">
      
      {/* Native Lending Flow */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-10 shadow-xl">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
              <Zap className="size-3.5" /> Powered by NBFC Partners
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">
              KingPay Insta-Cash
            </h2>
            <p className="text-muted text-sm sm:text-base font-medium max-w-sm">
              Get up to ₹2,00,000 disbursed directly to your KingPay Wallet in 30 seconds. Zero paperwork.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-sm font-semibold pt-2">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <ShieldCheck className="size-4" /> RBI Approved
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Sparkles className="size-4" /> No Hidden Fees
              </span>
            </div>
          </div>

          <div className="w-full md:w-[400px] shrink-0">
            {!showApply && !result ? (
              <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm text-center">
                <h3 className="text-xl font-bold mb-2">Check Eligibility</h3>
                <p className="text-sm text-muted mb-6">Takes only 2 minutes. Does not affect your CIBIL score.</p>
                <Button onClick={() => setShowApply(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 text-lg font-bold">
                  Start Application
                </Button>
              </div>
            ) : result ? (
              <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/30 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-emerald-600 mb-2">₹{result.disbursedAmount.toLocaleString("en-IN")} Approved!</h3>
                <p className="text-sm font-medium mb-4">{result.message}</p>
                
                <div className="bg-surface rounded-xl p-4 text-left space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Interest Rate</span>
                    <span className="font-bold">{result.interestRate}% p.a.</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">EMI ({result.tenureMonths} Months)</span>
                    <span className="font-bold text-fg">₹{result.emi.toLocaleString("en-IN")}/mo</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted">Loan ID</span>
                    <span className="font-mono text-xs">{result.loanId}</span>
                  </div>
                </div>

                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                  Money has been deposited to your KingPay Wallet!
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="bg-surface rounded-2xl p-6 border border-border shadow-sm animate-in slide-in-from-bottom-4">
                <h3 className="text-lg font-bold mb-4">Application Details</h3>
                
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">PAN Number</label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono uppercase"
                      placeholder="ABCDE1234F"
                      value={pan}
                      onChange={e => setPan(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Monthly Income (₹)</label>
                    <input
                      required
                      type="number"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={income}
                      onChange={e => setIncome(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Requested Amount (₹)</label>
                    <input
                      required
                      type="number"
                      className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm font-mono"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold mt-2">
                    {loading ? <Loader2 className="animate-spin mr-2" /> : "Verify & Disburse"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6">
        <h3 className="text-lg font-bold mb-4 px-2">Other Pre-Approved Partners</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-surface p-5 hover:border-emerald-500/50 transition cursor-pointer" onClick={handleNavi}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black text-lg">Navi Loan</h4>
                <p className="text-xs text-muted mt-1">Up to ₹20 Lakhs in 5 mins</p>
              </div>
              <div className="text-emerald-500 bg-emerald-500/10 p-2 rounded-xl">
                <ArrowRight className="size-5" />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 hover:border-emerald-500/50 transition cursor-pointer" onClick={handleKreditBee}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-black text-lg">KreditBee</h4>
                <p className="text-xs text-muted mt-1">Quick loans up to ₹4 Lakhs</p>
              </div>
              <div className="text-emerald-500 bg-emerald-500/10 p-2 rounded-xl">
                <ArrowRight className="size-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

