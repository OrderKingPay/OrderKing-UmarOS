import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  Tag,
  ShieldCheck,
  Crown,
  ChevronRight,
  Clock,
  ArrowLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { QuoteLines } from "@/components/market/quote-lines";
import { CheckoutUpsellEngine } from "@/components/market/checkout-upsell-engine";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import { quoteCart, trackAnalytics } from "@/lib/server/quote";
import { useCartStore } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { restaurantId, restaurantName, items, coupon, updateQty, remove, setCoupon, clear } = useCartStore();
  const location = useLocationStore((s) => s.location);
  const [code, setCode] = useState(coupon);
  const navigate = useNavigate();
  const isDeliveryActive = isDeliveryActiveInLocation(location.lat, location.lng, location.cityId);

  const quote = useQuery({
    queryKey: ["quote", restaurantId, items, coupon, location.lat, location.lng, location.zoneId],
    enabled: Boolean(isDeliveryActive && restaurantId && items.length),
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
  });

  const applyPromoCode = (promo: string) => {
    const next = promo.trim().toUpperCase();
    setCode(next);
    setCoupon(next);
    if (next) {
      void trackAnalytics({ data: { name: "coupon_applied", payload: { code: next } } });
      toast.success(`Coupon "${next}" applied!`);
    } else {
      toast.info("Coupon removed");
    }
  };

  if (!isDeliveryActive) {
    return (
      <CustomerShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 text-center space-y-5 bg-gradient-to-b from-amber-500/10 via-surface to-surface-2/60">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 text-4xl shadow-lg">
            👑
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50">
            OrderKing Foods is not yet active in {location.cityName || "your region"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
            Food delivery is currently restricted to active operational hubs. Enjoy 0% fee UPI and nationwide bill payments on KingPay!
          </p>
          <Button asChild className="bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black px-8 py-3 rounded-2xl shadow-md hover:scale-105 transition">
            <Link to="/king-pay">Open KingPay 👑</Link>
          </Button>
        </div>
      </CustomerShell>
    );
  }

  const totalPayablePaise = quote.data?.quote.totalPaise ?? 0;
  const isMinOrderBlocked = quote.data?.quote.blockers.includes("MIN_ORDER");

  return (
    <CustomerShell>
      <div className="min-h-[85vh] bg-gradient-to-b from-amber-500/10 via-white to-amber-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pb-28 px-3 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Top Royal Banner */}
          <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/15 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-md text-xl">
                  👑
                </div>
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-black text-zinc-950 dark:text-amber-100 tracking-tight">
                    {t("cart.title") || "Your Royal Cart"}
                  </h1>
                  {restaurantName && (
                    <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Delivering fresh from <span className="text-amber-800 dark:text-amber-300 font-extrabold">{restaurantName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-400/30 border border-amber-500/40 px-3 py-1 text-xs font-black text-amber-900 dark:text-amber-200">
                <Clock className="size-3.5" />
                <span>30-Min Guarantee</span>
              </div>
            </div>
          </div>

          {!items.length ? (
            /* EMPTY CART STATE */
            <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-white via-zinc-50/60 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-850 p-8 sm:p-12 text-center shadow-md space-y-5">
              <div className="size-20 rounded-3xl bg-gradient-to-br from-amber-400/20 via-yellow-400/15 to-amber-500/10 border border-amber-400/40 flex items-center justify-center text-4xl shadow-sm mx-auto">
                🍽️
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {t("cart.empty") || "Your feast plate is empty"}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  {t("cart.emptyHint") || "Explore top verified restaurants and add mouthwatering dishes to get started."}
                </p>
              </div>
              <Button asChild className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black px-8 py-3 rounded-2xl shadow-md hover:scale-105 transition-transform">
                <Link to="/">
                  <span>{t("cart.browse") || "Browse Restaurants"}</span>
                  <ArrowRight className="ml-2 size-4 stroke-[3]" />
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* ITEM CARDS LIST WITH QUANTITY STEPPERS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-base font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <ShoppingBag className="size-4 text-amber-500" />
                    <span>Selected Dishes ({items.reduce((acc, it) => acc + it.quantity, 0)})</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      toast.info("Cart cleared");
                    }}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Clear All</span>
                  </button>
                </div>

                <ul className="space-y-3">
                  {items.map((item) => {
                    const priced = quote.data?.pricedLines.find((p: any) => p.key === item.key);
                    const lineSubtotalPaise = priced ? priced.unitPaise * item.quantity : 0;

                    return (
                      <li
                        key={item.key}
                        className="rounded-3xl border border-amber-400/25 bg-gradient-to-b from-white via-zinc-50/70 to-amber-50/10 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-extrabold text-base text-zinc-900 dark:text-zinc-50">
                            {priced?.name ?? item.itemId}
                          </p>

                          {item.instructions && (
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-400/20 px-2 py-0.5 rounded-lg inline-block">
                              📝 {item.instructions}
                            </p>
                          )}

                          {priced && (
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="tabular-nums font-black text-base text-zinc-950 dark:text-zinc-100">
                                {formatPaise(lineSubtotalPaise, { locale })}
                              </span>
                              <span className="text-xs text-zinc-400">
                                ({formatPaise(priced.unitPaise, { locale })} each)
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Stepper & Remove Action */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800 sm:border-t-0">
                          <div className="flex items-center gap-1 rounded-2xl bg-amber-500/15 border border-amber-400/40 p-1">
                            <button
                              type="button"
                              className="size-8 rounded-xl bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-black shadow-2xs hover:bg-zinc-100 active:scale-90 transition flex items-center justify-center cursor-pointer"
                              onClick={() => updateQty(item.key, item.quantity - 1)}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="size-3.5 stroke-[3]" />
                            </button>
                            <span className="w-7 text-center font-black text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              className="size-8 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-xs hover:from-amber-600 hover:to-yellow-500 active:scale-90 transition flex items-center justify-center cursor-pointer"
                              onClick={() => updateQty(item.key, item.quantity + 1)}
                              aria-label="Increase quantity"
                            >
                              <Plus className="size-3.5 stroke-[3]" />
                            </button>
                          </div>

                          <button
                            type="button"
                            className="size-8 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition flex items-center justify-center"
                            onClick={() => {
                              remove(item.key);
                              toast.info("Item removed");
                            }}
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* APPLY COUPON SECTION WITH GRADIENT INPUT */}
              <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-white to-yellow-500/5 dark:from-zinc-900 dark:to-zinc-850 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="size-4 text-amber-600" />
                  <h3 className="font-display text-sm font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Apply Gourmet Coupon &amp; VIP Perks
                  </h3>
                </div>

                <form
                  className="relative flex items-center rounded-2xl border-2 border-amber-400/50 focus-within:border-amber-500 bg-white dark:bg-zinc-900 shadow-xs p-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyPromoCode(code);
                  }}
                >
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. VIPGOLD)"
                    aria-label={t("cart.coupon")}
                    className="h-10 w-full rounded-xl bg-transparent px-3 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {t("cart.apply") || "APPLY"}
                  </button>
                </form>

                {/* Quick Tap Coupons Carousel */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                  <button
                    type="button"
                    onClick={() => applyPromoCode("VIPGOLD")}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-amber-500/15 border border-amber-400/40 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-500/25 transition cursor-pointer"
                  >
                    <Crown className="size-3 text-amber-600" />
                    <span>VIPGOLD • Extra 15% OFF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPromoCode("FESTIVE50")}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer"
                  >
                    <Sparkles className="size-3 text-emerald-600" />
                    <span>FESTIVE50 • Flat ₹50 OFF</span>
                  </button>
                </div>

                {quote.data?.promoName && (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-3 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5">
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                      <span>Coupon applied: <strong>{quote.data.promoName}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => applyPromoCode("")}
                      className="text-rose-600 font-extrabold hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {coupon && quote.data && !quote.data.promoName && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    ⚠️ {t("cart.invalidCoupon") || "Invalid coupon code for this order."}
                  </p>
                )}
              </div>

              {/* CHECKOUT UPSELL ENGINE */}
              {restaurantId && items.length > 0 && (
                <CheckoutUpsellEngine
                  restaurantId={restaurantId}
                  restaurantName={restaurantName}
                  locale={locale}
                  deliveryFeePaise={quote.data?.quote.deliveryFeePaise}
                  currentSubtotalPaise={quote.data?.quote.foodSubtotalPaise}
                />
              )}

              {/* BILL SUMMARY WITH CLEAR BREAKDOWN */}
              <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-b from-white via-zinc-50/50 to-amber-50/15 dark:from-zinc-900 dark:to-zinc-900 p-5 sm:p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h3 className="font-display text-base font-extrabold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <span>Detailed Bill Summary</span>
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                      Verified Safe
                    </span>
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">CGST Sec 9(5) ECO</span>
                </div>

                {quote.isPending ? (
                  <p className="text-sm text-zinc-400 py-3">{t("common.loading") || "Calculating bill in real-time..."}</p>
                ) : quote.isError ? (
                  <button
                    type="button"
                    className="text-sm font-bold text-amber-600 hover:underline"
                    onClick={() => void quote.refetch()}
                  >
                    {t("common.retry") || "Failed to calculate bill. Tap to retry."}
                  </button>
                ) : quote.data ? (
                  <>
                    <QuoteLines lines={quote.data.quote.lines} locale={locale} />
                    {quote.data.quote.savingsPaise > 0 && (
                      <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border border-emerald-400/40 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="size-4 text-emerald-600" />
                          <span>Total Savings on this order</span>
                        </span>
                        <span className="font-black text-sm tabular-nums">
                          {formatPaise(quote.data.quote.savingsPaise, { locale })}
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>

              {isMinOrderBlocked && (
                <div className="rounded-2xl bg-amber-500/15 border border-amber-400/50 p-4 text-xs font-bold text-amber-900 dark:text-amber-200">
                  ⚠️ {t("cart.minOrder", { amount: formatPaise(quote.data?.quote.minOrderPaise ?? 0, { locale }) })}
                </div>
              )}

              {/* PROCEED TO CHECKOUT BUTTON WITH GOLDEN GRADIENT */}
              <div className="sticky bottom-4 z-40">
                <button
                  type="button"
                  disabled={!quote.data || isMinOrderBlocked}
                  onClick={() => void navigate({ to: "/checkout" })}
                  className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black shadow-[0_10px_35px_rgba(245,158,11,0.5)] flex items-center justify-between px-6 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="text-left">
                    <span className="block text-[10px] uppercase font-black tracking-wider text-zinc-900/70">
                      Total Payable
                    </span>
                    <span className="font-display text-xl sm:text-2xl font-black tabular-nums text-zinc-950">
                      {formatPaise(totalPayablePaise, { locale })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm sm:text-base font-black uppercase tracking-wider">
                      {t("cart.checkout") || "Proceed to Checkout"}
                    </span>
                    <ChevronRight className="size-5 stroke-[3] animate-pulse" />
                  </div>
                </button>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-amber-600 transition"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Add more dishes from menu</span>
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </CustomerShell>
  );
}
