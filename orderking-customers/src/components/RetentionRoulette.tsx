import React, { useState } from "react";
import { CheckCircle2, Copy, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart";

export interface RoulettePrize {
  id: string;
  label: string;
  sub: string;
  color: string;
  textColor: string;
  amount: number;
  type: "DISCOUNT" | "VOUCHER";
  code: string;
  description: string;
}

const VERIFIED_COUPON_PERKS: RoulettePrize[] = [
  {
    id: "p0",
    label: "50% OFF",
    sub: "Up to ₹100",
    color: "#E23744",
    textColor: "#FFFFFF",
    amount: 0,
    type: "DISCOUNT",
    code: "ORDERKING",
    description: "50% welcome discount (up to ₹100) on orders above ₹149, validated at checkout.",
  },
  {
    id: "p1",
    label: "FREE DEL",
    sub: "Above ₹199",
    color: "#10B981",
    textColor: "#FFFFFF",
    amount: 0,
    type: "VOUCHER",
    code: "FREEDEL",
    description: "Zero delivery fee on orders above ₹199 at participating restaurants.",
  },
  {
    id: "p2",
    label: "BOGO",
    sub: "Main Course",
    color: "#F59E0B",
    textColor: "#FFFFFF",
    amount: 0,
    type: "DISCOUNT",
    code: "BOGO2026",
    description: "Buy 1 Get 1 offer on eligible biryanis and main courses above ₹299.",
  },
  {
    id: "p3",
    label: "15% OFF",
    sub: "VIP Dining",
    color: "#3B82F6",
    textColor: "#FFFFFF",
    amount: 0,
    type: "DISCOUNT",
    code: "GOLDVIP",
    description: "15% discount on orders above ₹249, subject to restaurant promo availability.",
  },
];

export interface RetentionRouletteProps {
  orderId?: string;
  orderTotalPaise?: number;
  className?: string;
  onRewardClaimed?: (prize: RoulettePrize) => void;
}

export function RetentionRoulette({
  className = "",
  onRewardClaimed,
}: RetentionRouletteProps) {
  const setCoupon = useCartStore((s) => s.setCoupon);
  const activeCoupon = useCartStore((s) => s.coupon);
  const [selectedPrize, setSelectedPrize] = useState<RoulettePrize | null>(null);

  const handleApplyCoupon = (prize: RoulettePrize) => {
    setSelectedPrize(prize);
    setCoupon(prize.code);
    void navigator.clipboard?.writeText(prize.code);
    toast.success(`Coupon ${prize.code} copied and applied to cart!`);
    if (onRewardClaimed) {
      onRewardClaimed(prize);
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-gray-900 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">
              <Gift className="size-4" />
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
              Member Dining Perks &amp; Promo Codes
            </h2>
            <Badge
              tone="warn"
              className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800"
            >
              Checkout Validated
            </Badge>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Select a dining coupon below to apply to your next food order. Final eligibility and discount amounts are calculated by the server at checkout.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {VERIFIED_COUPON_PERKS.map((prize) => {
          const isApplied = activeCoupon === prize.code || selectedPrize?.id === prize.id;
          return (
            <div
              key={prize.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/50 p-3.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-extrabold text-amber-900">
                    <Sparkles className="size-3 text-amber-600" />
                    {prize.label} · {prize.sub}
                  </span>
                  <span className="font-mono text-xs font-bold text-gray-800 bg-white border border-dashed border-gray-300 px-2 py-0.5 rounded">
                    {prize.code}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                  {prize.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                <Button
                  size="sm"
                  variant={isApplied ? "outline" : "primary"}
                  onClick={() => handleApplyCoupon(prize)}
                  className="w-full text-xs font-bold"
                >
                  {isApplied ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> Coupon {prize.code} Applied
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Copy className="size-3.5" /> Apply {prize.code}
                    </span>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RetentionRoulette;
