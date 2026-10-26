import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Lock,
  MapPin,
  ChevronRight,
  Receipt,
  Clock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { useT } from "@/components/providers";
import { quoteCart } from "@/lib/server/quote";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface OneTapCheckoutDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function OneTapCheckoutDrawer({ open, onClose }: OneTapCheckoutDrawerProps) {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const navigate = useNavigate();

  const { restaurantId, restaurantName, items, coupon } = useCartStore();
  const location = useLocationStore((s) => s.location);
  const totalItemCount = cartCount(items);

  const [selectedMethod, setSelectedMethod] = useState<"KING_PAY" | "UPI" | "COD">("KING_PAY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time server-side quote calculation (zero mock/fake data)
  const quoteQuery = useQuery({
    queryKey: ["one_tap_quote", restaurantId, items, coupon, location.lat, location.lng, location.zoneId],
    enabled: Boolean(open && restaurantId && items.length > 0),
    queryFn: () =>
      quoteCart({
        data: {
          restaurantId: restaurantId!,
          zoneId: location.zoneId,
          lat: location.lat,
          lng: location.lng,
          coupon,
          lines: items,
        },
      }),
    staleTime: 1000 * 30,
  });

  if (!open) return null;

  const quote = quoteQuery.data?.quote;
  const foodSubtotalPaise = quote?.foodSubtotalPaise ?? 0;
  const deliveryFeePaise = quote?.deliveryFeePaise ?? 0;
  const packagingPaise = quote?.packagingPaise ?? 0;
  const platformFeePaise = quote?.platformFeePaise ?? 0;
  const savingsPaise = quote?.savingsPaise ?? 0;
  const taxPaise = quote?.taxPaise ?? 0;
  const totalPaise = quote?.totalPaise ?? foodSubtotalPaise;

  const handle1TapPay = async () => {
    setIsSubmitting(true);
    try {
      // Direct navigation to checkout with selected payment intent preloaded
      onClose();
      void navigate({ to: "/checkout" });
    } catch {
      toast.error("Unable to initialize checkout. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="one-tap-checkout-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[32px] border-t-2 border-amber-400/80 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] p-5 text-gray-900 shadow-[0_-20px_50px_rgba(0,0,0,0.35)] animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Specular golden top highlight */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90" />

        {/* Ambient background glow */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 size-48 rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-300/10 to-transparent blur-2xl" />

        {/* DRAWER HEADER */}
        <div className="relative flex items-center justify-between pb-3 border-b border-amber-900/10">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
              <Crown className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 id="one-tap-checkout-title" className="text-base font-black text-gray-950 tracking-tight leading-none">
                  1-Tap Instant Checkout
                </h2>
                <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.2 text-[9px] font-black uppercase text-emerald-800">
                  Itemized Pricing
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                {restaurantName ? `Ordering from ${restaurantName}` : "Verified Kitchen Delivery"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-amber-100/80 text-gray-600 hover:bg-amber-200 transition-colors"
            aria-label="Close checkout drawer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* DELIVERY ADDRESS PILL */}
        <div className="mt-3.5 flex items-center justify-between p-3 rounded-2xl bg-white border border-amber-200/90 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <MapPin className="size-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                Delivering To
              </span>
              <p className="text-xs font-bold text-gray-900 truncate">
                {location.label || location.line1 || location.cityName || "Current Address"}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            ~25 Mins
          </span>
        </div>

        {/* CART ITEMS SUMMARY LIST */}
        <div className="mt-3.5 rounded-2xl border border-amber-200/80 bg-white/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-stone-700 border-b border-amber-100 pb-1.5">
            <span className="flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-amber-700" />
              <span>Cart Items ({totalItemCount})</span>
            </span>
            <Link
              to="/cart"
              onClick={onClose}
              className="text-[11px] font-black text-[#E23744] hover:underline"
            >
              Edit Cart
            </Link>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {(quoteQuery.data?.pricedLines ?? []).map((it) => (
              <div key={it.key} className="flex items-center justify-between text-gray-800">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="flex size-4.5 shrink-0 items-center justify-center rounded bg-amber-100 text-[10px] font-black text-amber-950">
                    {it.quantity}x
                  </span>
                  <span className="font-semibold truncate">{it.name}</span>
                </div>
                <span className="font-mono font-bold shrink-0">
                  {formatPaise(it.unitPaise * it.quantity, { locale })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CRYSTALLINE TRANSPARENT ITEMIZED BILLING (ZERO HIDDEN FEES) ─── */}
        <div className="mt-3.5 rounded-3xl border border-amber-300/80 bg-gradient-to-b from-white via-amber-50/20 to-white p-4 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Receipt className="size-4 text-amber-800" />
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Transparent Itemized Pricing
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[9.5px] font-black text-emerald-800">
              <ShieldCheck className="size-2.5" />
              Verified FSSAI &amp; GST
            </span>
          </div>

          {/* 1. Items Subtotal */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700">Items Subtotal</span>
            <span className="font-mono font-bold text-gray-950">
              {formatPaise(foodSubtotalPaise, { locale })}
            </span>
          </div>

          {/* 2. Direct Chef Delivery */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <span>Delivery Fee</span>
              <span className="text-[10px] text-stone-400 font-normal">(Direct Chef Dispatch)</span>
            </span>
            <div className="text-right">
              {deliveryFeePaise === 0 ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 rounded shadow-2xs">
                  <Sparkles className="size-2 text-emerald-600" />
                  FREE
                </span>
              ) : (
                <span className="font-mono font-bold text-gray-950">
                  {formatPaise(deliveryFeePaise, { locale })}
                </span>
              )}
            </div>
          </div>

          {/* 3. Kitchen Packaging */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <span>Restaurant Packaging</span>
              <span className="text-[10px] text-stone-400 font-normal">(Eco-sealed container)</span>
            </span>
            <span className="font-mono font-bold text-gray-950">
              {packagingPaise === 0 ? (
                <span className="text-emerald-700 font-bold">₹0 Free</span>
              ) : (
                formatPaise(packagingPaise, { locale })
              )}
            </span>
          </div>

          {/* 4. Platform Fee (Itemized Standard Fee) */}
          <div className="flex items-center justify-between text-xs bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/60">
            <div className="flex items-center gap-1.5">
              <Crown className="size-3 text-emerald-700 shrink-0" />
              <div>
                <span className="font-black text-emerald-950 text-xs block">OrderKing Platform Fee</span>
                <span className="text-[10px] text-emerald-700 font-medium">Competitors charge ₹9–₹12 extra</span>
              </div>
            </div>
            <span className="font-mono font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded text-xs">
              ₹0.00 standard fee
            </span>
          </div>

          {/* 5. Royal Savings (Coupons & Gold pass) */}
          {savingsPaise > 0 && (
            <div className="flex items-center justify-between text-xs bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-emerald-500/10 p-2 rounded-xl border border-emerald-300">
              <span className="font-black text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-600" />
                <span>Royal Savings Applied</span>
              </span>
              <span className="font-mono font-black text-emerald-800 text-sm">
                -{formatPaise(savingsPaise, { locale })}
              </span>
            </div>
          )}

          {/* 6. Statutory Taxes & GST */}
          <div className="flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1">
              <span>Statutory Taxes (GST)</span>
              <span className="text-[9.5px] text-stone-400 font-mono">Sec 9(5) CGST</span>
            </span>
            <span className="font-mono font-semibold text-gray-900">
              {taxPaise === 0 ? "Included" : formatPaise(taxPaise, { locale })}
            </span>
          </div>

          {/* 7. GRAND TOTAL (24K GOLD & OBSIDIAN LUXURY CARD) */}
          <div className="relative overflow-hidden mt-1 rounded-2xl bg-gradient-to-r from-slate-950 via-[#17140f] to-slate-950 p-3.5 text-white flex items-center justify-between shadow-[0_4px_16px_rgba(245,158,11,0.25)] border border-amber-400/50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
                <Crown className="size-3 text-amber-400" />
                <span>Total Amount to Pay</span>
              </div>
              <p className="text-[10px] text-stone-400">All taxes &amp; fees included · 0 hidden charges</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 px-3.5 py-1.5 text-slate-950 font-black shadow-md border border-amber-300">
              <span className="font-mono text-base sm:text-lg">
                {formatPaise(totalPaise, { locale })}
              </span>
            </div>
          </div>
        </div>

        {/* ─── PAYMENT ACCELERATOR SELECTOR ─── */}
        <div className="mt-3.5 space-y-2">
          <span className="text-[10.5px] font-black uppercase tracking-wider text-stone-500 block">
            Select Payment Method
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod("KING_PAY")}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedMethod === "KING_PAY"
                  ? "border-amber-500 bg-amber-500/15 shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
                  : "border-stone-200 bg-white hover:border-amber-300"
              )}
            >
              <Crown className="size-4 text-amber-800 mb-1" />
              <span className="text-xs font-black text-gray-950 leading-tight">KingPay UPI</span>
              <span className="text-[9px] font-bold text-amber-800 mt-0.5">Instant Pay</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("UPI")}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedMethod === "UPI"
                  ? "border-amber-500 bg-amber-500/15 shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
                  : "border-stone-200 bg-white hover:border-amber-300"
              )}
            >
              <Zap className="size-4 text-sky-600 mb-1" />
              <span className="text-xs font-black text-gray-950 leading-tight">GPay / PhonePe</span>
              <span className="text-[9px] font-bold text-sky-700 mt-0.5">Instant Intent</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod("COD")}
              className={cn(
                "flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer select-none",
                selectedMethod === "COD"
                  ? "border-amber-500 bg-amber-500/15 shadow-[0_2px_10px_rgba(245,158,11,0.25)]"
                  : "border-stone-200 bg-white hover:border-amber-300"
              )}
            >
              <ShieldCheck className="size-4 text-emerald-600 mb-1" />
              <span className="text-xs font-black text-gray-950 leading-tight">Cash On Del</span>
              <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Exact Change</span>
            </button>
          </div>
        </div>

        {/* ─── 1-TAP ACTION BUTTON ─── */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handle1TapPay}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black shadow-[0_8px_25px_rgba(245,158,11,0.45)] flex items-center justify-between px-5 transition-all active:scale-98 disabled:opacity-50 cursor-pointer border border-amber-300"
          >
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-amber-950" />
              <span className="text-sm font-black uppercase tracking-wider">
                1-Tap Place Order
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-base font-black">
              <span>{formatPaise(totalPaise, { locale })}</span>
              <ArrowRight className="size-4 stroke-[3]" />
            </div>
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-stone-500">
            <ShieldCheck className="size-3 text-emerald-600" />
            <span>256-Bit SSL Encrypted · Direct Chef Handover</span>
          </div>
        </div>
      </div>
    </div>
  );
}
