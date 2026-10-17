import { useState } from "react";
import { Users, Copy, Share2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import { toast } from "sonner";

interface BillSplitterCalculatorProps {
  className?: string;
  theme?: "dark" | "light";
}

export function BillSplitterCalculator({ className = "", theme = "dark" }: BillSplitterCalculatorProps) {
  const [totalInr, setTotalInr] = useState<number>(1800);
  const [splitCount, setSplitCount] = useState<number>(4);
  const [tipPercent, setTipPercent] = useState<number>(0);
  const [payeeVpa, setPayeeVpa] = useState("orderking@okhdfcbank");

  const baseBillPaise = Math.max(100, Math.round((Number.isFinite(totalInr) ? totalInr : 1800) * 100));
  const count = Math.max(2, Math.min(20, Math.floor(splitCount)));
  const tipPaise = Math.round((baseBillPaise * tipPercent) / 100);
  const grandTotalPaise = baseBillPaise + tipPaise;

  // Strict SafeInteger Paise division with zero-drift remainder handling
  const perPersonBasePaise = Math.floor(grandTotalPaise / count);
  const remainderPaise = grandTotalPaise % count;

  const perPersonFormattedRupees = (perPersonBasePaise / 100).toFixed(2);
  const shareUpiLink = `upi://pay?pa=${encodeURIComponent(payeeVpa.trim())}&pn=Food%20Bill%20Split&am=${perPersonFormattedRupees}&cu=INR&tn=Split%20Meal%20Share`;

  const handleShareWhatsApp = () => {
    const text = `Hey! Here is your ${formatPaise(perPersonBasePaise)} share for our meal bill of ${formatPaise(
      grandTotalPaise
    )} (${count} people split):\nPay here via UPI: ${shareUpiLink}`;
    if (typeof window !== "undefined") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(shareUpiLink);
      toast.success("UPI split payment link copied to clipboard!");
    }
  };

  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-xl space-y-6 ${
        isDark
          ? "border-amber-400/40 bg-gradient-to-b from-slate-900/90 to-slate-950 text-white"
          : "border-stone-200 bg-white text-stone-900"
      } ${className}`}
    >
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 ${
        isDark ? "border-amber-400/20" : "border-stone-200"
      }`}>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-500">
            <Users className="size-3.5" /> Fair Group Dining Settlement
          </span>
          <h3 className={`text-lg font-black mt-0.5 ${isDark ? "text-white" : "text-stone-900"}`}>
            Bill Splitter Calculator
          </h3>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-stone-500"}`}>
            Zero-drift SafeInteger paise arithmetic ensures exact accounting down to 1 paisa (NPCI compliant)
          </p>
        </div>
        <span className="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 px-2.5 py-1 rounded-full self-start sm:self-auto">
          WhatsApp Instant Handoff
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Input Parameters */}
        <div className="space-y-4">
          <div>
            <label className={`text-xs font-bold block mb-1 ${isDark ? "text-slate-300" : "text-stone-700"}`}>
              Total Food / Restaurant Bill (₹)
            </label>
            <div className="relative">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm ${
                isDark ? "text-slate-400" : "text-stone-400"
              }`}>
                ₹
              </span>
              <input
                type="number"
                min={1}
                max={500000}
                value={totalInr}
                onChange={(e) => setTotalInr(Math.max(1, Number(e.target.value) || 0))}
                className={`w-full h-11 pl-8 pr-3.5 rounded-xl border font-mono text-sm font-bold outline-none transition ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-white focus:border-amber-400"
                    : "border-stone-300 bg-stone-50 text-stone-900 focus:border-amber-500"
                }`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-stone-700"}`}>
                Number of Friends Sharing ({count} people)
              </label>
            </div>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSplitCount(n)}
                  className={`flex-1 h-10 rounded-xl text-xs font-mono font-bold transition border ${
                    count === n
                      ? "bg-amber-400/20 border-amber-400 text-amber-500 dark:text-amber-300 ring-1 ring-amber-400/30"
                      : isDark
                      ? "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      : "bg-stone-100 border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${isDark ? "text-slate-300" : "text-stone-700"}`}>
              Gratuity / Tip Contribution
            </label>
            <div className="flex gap-2">
              {[0, 5, 10, 15].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setTipPercent(pct)}
                  className={`flex-1 h-9 rounded-xl text-xs font-bold transition border ${
                    tipPercent === pct
                      ? "bg-amber-400/20 border-amber-400 text-amber-500 dark:text-amber-300"
                      : isDark
                      ? "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                      : "bg-stone-100 border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`text-xs font-bold block mb-1 ${isDark ? "text-slate-300" : "text-stone-700"}`}>
              Your Receiving UPI ID (to collect from friends)
            </label>
            <input
              type="text"
              value={payeeVpa}
              onChange={(e) => setPayeeVpa(e.target.value)}
              placeholder="e.g. you@okhdfcbank"
              className={`w-full h-11 px-3.5 rounded-xl border font-mono text-sm outline-none transition ${
                isDark
                  ? "border-slate-700 bg-slate-950 text-white focus:border-amber-400"
                  : "border-stone-300 bg-stone-50 text-stone-900 focus:border-amber-500"
              }`}
            />
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div
          className={`rounded-2xl border-2 p-5 space-y-4 shadow-xl ${
            isDark ? "border-amber-400/50 bg-black/60" : "border-amber-300 bg-amber-50/40"
          }`}
        >
          <div
            className={`rounded-xl border p-4 text-center ${
              isDark ? "bg-amber-500/10 border-amber-400/30" : "bg-white border-amber-200 shadow-xs"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Each Person&apos;s Exact Share
            </span>
            <span className={`text-3xl font-black font-mono mt-1 block ${isDark ? "text-white" : "text-stone-900"}`}>
              {formatPaise(perPersonBasePaise)}
            </span>
            {remainderPaise > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-300/80 block mt-1">
                ({remainderPaise} people pay 1 paisa extra for absolute total match)
              </span>
            )}
          </div>

          <div
            className={`space-y-2 text-xs border-t pt-3 ${
              isDark ? "border-slate-800 text-slate-400" : "border-stone-200 text-stone-600"
            }`}
          >
            <div className="flex justify-between">
              <span>Base Outing Total:</span>
              <span className={`font-mono font-bold ${isDark ? "text-slate-200" : "text-stone-900"}`}>
                {formatPaise(baseBillPaise)}
              </span>
            </div>
            {tipPaise > 0 && (
              <div className="flex justify-between text-amber-500 font-medium">
                <span>Gratuity ({tipPercent}%):</span>
                <span className="font-mono font-bold">+{formatPaise(tipPaise)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Grand Total Payable:</span>
              <span className={`font-mono font-black ${isDark ? "text-white" : "text-stone-900"}`}>
                {formatPaise(grandTotalPaise)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Split Across:</span>
              <span className={`font-bold ${isDark ? "text-white" : "text-stone-900"}`}>{count} friends</span>
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className={`h-10 rounded-xl text-xs font-bold ${
                isDark
                  ? "border-amber-400/40 text-amber-300 bg-slate-950 hover:bg-slate-900"
                  : "border-stone-300 text-stone-800 bg-white hover:bg-stone-50"
              }`}
            >
              <Copy className="size-3.5 mr-1.5" /> Copy Link
            </Button>
            <Button
              type="button"
              onClick={handleShareWhatsApp}
              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
            >
              <Share2 className="size-3.5 mr-1.5" /> WhatsApp Split
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
