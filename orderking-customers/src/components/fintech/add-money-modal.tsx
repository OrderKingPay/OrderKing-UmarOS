import { useState } from "react";
import {
  X,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import { createRazorpayOrder } from "@/lib/server/razorpay.server";

export interface RazorpayTopupVerification {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBalancePaise: number;
  onSuccess: (addedPaise: number, verification?: RazorpayTopupVerification) => void;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export function AddMoneyModal({
  isOpen,
  onClose,
  currentBalancePaise,
  onSuccess,
}: Props) {
  const [amountRupees, setAmountRupees] = useState<number>(1000);
  const [customInput, setCustomInput] = useState<string>("1000");
  const [selectedSource, setSelectedSource] = useState<"upi" | "netbanking" | "card">("upi");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePresetClick = (amount: number) => {
    setAmountRupees(amount);
    setCustomInput(amount.toString());
  };

  const handleInputChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, "");
    setCustomInput(clean);
    const num = parseInt(clean, 10);
    setAmountRupees(isNaN(num) ? 0 : num);
  };

  const handleAddMoney = async () => {
    if (amountRupees < 10) {
      toast.error("Minimum top-up amount is ₹10");
      return;
    }
    if (amountRupees > 100000) {
      toast.error("Maximum single top-up limit is ₹1,00,000");
      return;
    }

    setIsProcessing(true);
    try {
      const rzpOrder = await createRazorpayOrder({
        data: {
          amountPaise: amountRupees * 100,
          currency: "INR",
          receipt: ("topup_" + Date.now()).slice(0, 40),
          notes: { type: "WALLET_TOPUP" },
        },
      });

      const RazorpayCtor = (window as unknown as { Razorpay?: new (opts: unknown) => any }).Razorpay;
      if (RazorpayCtor && rzpOrder?.keyId && rzpOrder?.orderId) {
        const rzp = new RazorpayCtor({
          key: rzpOrder.keyId,
          amount: rzpOrder.amountPaise,
          currency: rzpOrder.currency,
          name: "KingPay Wallet Top-up",
          description: "Add ₹" + amountRupees + " to KingPay Balance",
          order_id: rzpOrder.orderId,
          handler: function (resp: {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
          }) {
            if (!resp?.razorpay_payment_id || !resp?.razorpay_order_id || !resp?.razorpay_signature) {
              toast.error("Incomplete payment response from gateway.");
              setIsProcessing(false);
              return;
            }
            onSuccess(amountRupees * 100, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            toast.success("Wallet loaded! Payment ID: " + resp.razorpay_payment_id);
            setIsProcessing(false);
            onClose();
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
          prefill: {
            contact: "9395065587",
          },
          theme: {
            color: "#F59E0B",
          },
        });
        rzp.open();
        return;
      }
    } catch (err) {
      console.warn("Razorpay wallet order creation fallback:", err);
    }

    const upiUri = "upi://pay?pa=9395065587@ybl&pn=OrderKing%20Wallet&am=" + amountRupees + "&cu=INR&tn=Wallet%20Topup";
    if (typeof window !== "undefined" && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = upiUri;
      toast.info("Opening UPI application to authorize wallet top-up...");
      setIsProcessing(false);
      onClose();
      return;
    }

    toast.info("Please complete top-up to UPI ID 9395065587@ybl in your banking app.");
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-3xl shadow-2xl border border-amber-400/50 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-[#2A1D07] p-5 sm:p-6 border-b border-amber-400/30 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Wallet className="size-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                KingPay Wallet
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Add Money to Wallet
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400 inline" />
              <span>Transparent Convenience Processing</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Current Balance Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
            <span className="text-xs text-amber-200 font-medium">Available Balance:</span>
            <span className="text-base font-black text-amber-300 font-mono">
              {formatPaise(currentBalancePaise)}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Enter Amount to Add (₹)
            </label>
            <div className="relative flex items-center rounded-2xl border border-amber-400/60 bg-slate-950 p-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
              <span className="pl-3 text-2xl font-black text-amber-400">₹</span>
              <input
                type="text"
                inputMode="numeric"
                value={customInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="1000"
                className="w-full bg-transparent px-2 text-2xl font-black text-white focus:outline-none"
              />
              <span className="pr-3 text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                Direct UPI
              </span>
            </div>

            {/* Quick preset chips */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = amountRupees === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handlePresetClick(amt)}
                    className={`py-2 rounded-xl text-xs font-black transition border ${
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-amber-400/50"
                    }`}
                  >
                    +₹{amt.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select Payment Source
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedSource("upi")}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                  selectedSource === "upi"
                    ? "bg-amber-400/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Smartphone className="size-5 text-amber-400" />
                <span className="text-xs font-bold leading-tight">UPI Apps</span>
                <span className="text-[9px] text-emerald-400 font-extrabold">Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource("netbanking")}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                  selectedSource === "netbanking"
                    ? "bg-amber-400/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <Building2 className="size-5 text-amber-400" />
                <span className="text-xs font-bold leading-tight">Net Banking</span>
                <span className="text-[9px] text-slate-400">All Banks</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSource("card")}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition ${
                  selectedSource === "card"
                    ? "bg-amber-400/15 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <CreditCard className="size-5 text-amber-400" />
                <span className="text-xs font-bold leading-tight">RuPay / Cards</span>
                <span className="text-[9px] text-emerald-400 font-extrabold">₹0 Surcharge</span>
              </button>
            </div>
          </div>

          {/* Surcharge Guarantee Pill */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="size-4 text-emerald-400" />
              <span>Platform Surcharge: UPI Ready</span>
            </span>
            <span className="font-mono text-emerald-400 font-black">Zero Surcharge</span>
          </div>

          {/* Action Button */}
          <Button
            type="button"
            disabled={isProcessing || amountRupees < 10}
            onClick={handleAddMoney}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Adding to Wallet...</span>
              </span>
            ) : (
              <>
                <Sparkles className="size-4.5" />
                <span>
                  Add ₹{amountRupees.toLocaleString("en-IN")} Instantly
                </span>
                <ArrowRight className="size-4.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
