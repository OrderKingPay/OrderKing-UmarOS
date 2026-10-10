import { useState } from "react";
import { Crown, Sparkles, Truck, Tag, ShieldCheck, Zap, Check, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface VipGoldPassHubProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMember?: boolean;
  renewalDate?: string;
  totalSavedPaise?: number;
}

export function VipGoldPassHub({
  isOpen = false,
  onClose,
  isMember = true,
  renewalDate = "15 Nov 2026",
  totalSavedPaise = 184500, // ₹1,845
}: VipGoldPassHubProps) {
  const [open, setOpen] = useState(isOpen);
  const [selectedPlan, setSelectedPlan] = useState<"3_MONTH" | "12_MONTH">("12_MONTH");

  const BENEFITS = [
    {
      icon: <Truck className="size-5 text-amber-500" />,
      title: "Free Delivery Always",
      description: "On all food orders above ₹199 within 10 km radius with zero distance markup",
    },
    {
      icon: <Tag className="size-5 text-amber-500" />,
      title: "Up to 30% Extra Discounts",
      description: "Exclusive Gold dining-out bill discounts and extra voucher stackability",
    },
    {
      icon: <Zap className="size-5 text-amber-500" />,
      title: "No Surge Fee Guarantee",
      description: "Zero rain surge and zero peak festival surge charges regardless of weather",
    },
    {
      icon: <Crown className="size-5 text-amber-500" />,
      title: "VIP Priority Support",
      description: "Direct connection to Senior Executive queue with zero wait time & instant refunds",
    },
  ];

  const handleSubscribe = () => {
    toast.success("OrderKing VIP Gold Pass renewed! Active on all restaurants and dining.");
    setOpen(false);
    onClose?.();
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-amber-500/30 bg-surface shadow-2xl overflow-hidden">
        {/* Gold Luxury Header */}
        <div className="relative bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 p-6 text-white overflow-hidden">
          <div className="absolute -right-6 -bottom-6 size-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-md shadow-inner">
                👑
              </span>
              <div>
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-200 border border-amber-300/30">
                  Zomato Gold / VIP Equivalent
                </span>
                <h3 className="font-display text-xl font-black text-white">OrderKing VIP Pass</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Member Status Card */}
          {isMember ? (
            <div className="mt-4 rounded-xl bg-black/20 p-3.5 backdrop-blur-md border border-white/15 flex items-center justify-between text-xs">
              <div>
                <p className="text-[11px] text-amber-200/80">Membership Active</p>
                <p className="font-bold text-white">Valid until {renewalDate}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-amber-200/80">Lifetime Savings</p>
                <p className="font-display text-sm font-extrabold text-amber-300">
                  ₹{(totalSavedPaise / 100).toFixed(0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-amber-100">
              Join millions saving an average of ₹4,200 annually on food deliveries and dine-out meals.
            </p>
          )}
        </div>

        {/* Perks Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs no-scrollbar">
          <h4 className="font-bold text-fg flex items-center gap-1.5 text-xs">
            <Sparkles className="size-3.5 text-amber-500" /> Exclusive VIP Privileges
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-surface-2/60 p-3.5 space-y-1.5 hover:border-amber-500/40 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-surface border border-border">{b.icon}</span>
                  <h5 className="font-bold text-fg">{b.title}</h5>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>

          {/* Membership Pass Plan Selection */}
          <div className="space-y-2 pt-1">
            <label className="font-bold text-fg block text-xs">Choose Your Plan</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedPlan("3_MONTH")}
                className={`rounded-xl p-3 text-left border transition ${
                  selectedPlan === "3_MONTH"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs"
                    : "border-border bg-surface-2 text-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">3 Months</span>
                  {selectedPlan === "3_MONTH" && <Check className="size-4 text-amber-500" />}
                </div>
                <p className="font-display text-base font-extrabold text-fg mt-1">₹149</p>
                <p className="text-[10px] text-muted">₹50 / month</p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan("12_MONTH")}
                className={`relative rounded-xl p-3 text-left border transition ${
                  selectedPlan === "12_MONTH"
                    ? "border-amber-500 bg-amber-500/10 shadow-xs"
                    : "border-border bg-surface-2 text-muted"
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-amber-500 px-2 py-0.2 text-[9px] font-extrabold text-black uppercase">
                  Best Value
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-fg">12 Months (Annual)</span>
                  {selectedPlan === "12_MONTH" && <Check className="size-4 text-amber-500" />}
                </div>
                <p className="font-display text-base font-extrabold text-fg mt-1">₹399</p>
                <p className="text-[10px] text-muted">₹33 / month · Save 60%</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface px-5 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted">Instant Activation</p>
            <p className="font-bold text-xs text-fg">100% Money-Back in 7 Days</p>
          </div>
          <Button onClick={handleSubscribe} className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5">
            <Crown className="size-4" /> {isMember ? "Renew VIP Pass" : "Join VIP Gold"}
          </Button>
        </div>
      </div>
    </div>
  );
}
