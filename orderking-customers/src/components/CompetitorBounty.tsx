import React, { useState } from "react";
import { CheckCircle2, Copy, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart";

export interface BountySubmission {
  id: string;
  competitor: string;
  fileName: string;
  fileSize: string;
  previewUrl: string;
  timestamp: string;
  status: "ANALYZING" | "VERIFIED_PENDING" | "CREDITED";
  promisedAmount: number;
  phoneOrAccount: string;
}

const WELCOME_SWITCH_COUPONS = [
  {
    id: "welcome_first",
    code: "ORDERKING",
    title: "Welcome 50% OFF (Up to ₹100)",
    subtitle: "Valid on first food delivery order above ₹149",
    badge: "First Order Promo",
  },
  {
    id: "zero_delivery",
    code: "FREEDEL",
    title: "Zero Delivery Fee Pass",
    subtitle: "100% delivery fee waiver on orders above ₹199",
    badge: "Free Delivery",
  },
  {
    id: "bogo_feast",
    code: "BOGO2026",
    title: "BOGO Main Course & Biryani Offer",
    subtitle: "Valid on participating partner restaurants above ₹299",
    badge: "Partner Funded",
  },
];

export function CompetitorBounty({ className = "" }: { className?: string }) {
  const setCoupon = useCartStore((s) => s.setCoupon);
  const activeCoupon = useCartStore((s) => s.coupon);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleApplyPromo = (code: string) => {
    setCoupon(code);
    setCopiedCode(code);
    void navigator.clipboard?.writeText(code);
    toast.success(`Coupon ${code} applied to your cart and copied!`);
  };

  return (
    <div
      className={`w-full rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)] text-gray-900 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-rose-50 text-rose-600 font-bold text-lg">
              <Tag className="size-4" />
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900">
                Direct-to-Kitchen Welcome Offers
              </h2>
              <Badge
                tone="neutral"
                className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700"
              >
                Checkout eligibility required
              </Badge>
            </div>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
            Order directly from verified partner kitchens with transparent menu pricing. Apply a welcome coupon below to your cart—discounts are validated server-side at checkout.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
          <div>
            <div className="font-semibold text-emerald-950 text-[11px]">Checkout Verified</div>
            <div className="text-[10px] text-emerald-700 font-mono">Instant Cart Application</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {WELCOME_SWITCH_COUPONS.map((offer) => {
          const isApplied = activeCoupon === offer.code || copiedCode === offer.code;
          return (
            <div
              key={offer.id}
              className="flex flex-col justify-between rounded-xl border border-gray-200 bg-gray-50/60 p-3.5 transition hover:border-rose-300 hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100/80 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    <Sparkles className="size-2.5" />
                    {offer.badge}
                  </span>
                  <span className="rounded border border-dashed border-gray-300 bg-white px-2 py-0.5 font-mono text-xs font-bold text-gray-900">
                    {offer.code}
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-sm text-gray-900">{offer.title}</h3>
                <p className="mt-0.5 text-xs text-gray-600">{offer.subtitle}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                <Button
                  size="sm"
                  variant={isApplied ? "outline" : "primary"}
                  onClick={() => handleApplyPromo(offer.code)}
                  className="w-full text-xs font-bold"
                >
                  {isApplied ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="size-3.5" /> Applied ({offer.code})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Copy className="size-3.5" /> Apply {offer.code} to Cart
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

export default CompetitorBounty;
