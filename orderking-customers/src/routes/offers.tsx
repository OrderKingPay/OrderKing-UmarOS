
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/market/shell";
import { useT } from "@/components/providers";
import { listPromos } from "@/lib/server/account";
import { formatPaise } from "@/lib/money";
import { useCartStore } from "@/lib/stores/cart";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/offers")({ component: OffersPage });

const FEATURED_OFFERS = [
  {
    id: "feat_local40",
    name: "Hyperlocal Launch: ₹40 OFF",
    code: "LOCAL40",
    description: "Flat ₹40 OFF on orders above ₹299 for the first 100 neighborhood food lovers.",
    minOrderPaise: 29900,
    badge: "⚡ Launch Special",
  },
  {
    id: "feat_bogo",
    name: "Buy 1 Get 1 Free (BOGO Feast)",
    code: "BOGO2026",
    description: "Get 1 free on selected main course dishes and biryanis.",
    minOrderPaise: 29900,
    badge: "🔥 Most Popular",
  },
  {
    id: "feat_welcome",
    name: "Welcome 50% OFF (Up to ₹100)",
    code: "ORDERKING",
    description: "Flat 50% Courtesy Saving on your food orders.",
    minOrderPaise: 14900,
    badge: "🎉 First Order",
  },
  {
    id: "feat_freedel",
    name: "Free Delivery Above ₹199",
    code: "FREEDEL",
    description: "100% free delivery across all Karimganj & Silchar restaurants.",
    minOrderPaise: 19900,
    badge: "🚀 Zero Delivery Fee",
  },
  {
    id: "feat_goldvip",
    name: "Gold VIP Extra 15% OFF",
    code: "GOLDVIP",
    description: "Exclusive member privilege with unlimited free delivery.",
    minOrderPaise: 24900,
    badge: "⭐ VIP Only",
  },
];

function OffersPage() {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const setCoupon = useCartStore((s) => s.setCoupon);
  const promos = useQuery({ queryKey: ["promos"], queryFn: () => listPromos() });
  const serverPromos = promos.data?.promos ?? [];

  return (
    <CustomerShell>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-stone-900 tracking-tight">
              {t("offers.title")}
            </h1>
            <p className="mt-0.5 text-xs font-bold text-amber-800">
              Royal Coupons, Instant Savings &amp; VIP Passes
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-xs font-black text-amber-950 shadow-2xs">
            <span>🎟️</span>
            <span>{FEATURED_OFFERS.length + serverPromos.length} Deals</span>
          </span>
        </div>

        {/* Featured Luxury Deal Cards */}
        <div className="mt-5 space-y-3.5">
          {FEATURED_OFFERS.map((f) => (
            <div
              key={f.id}
              className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-white via-amber-50/50 to-yellow-50/30 p-5 shadow-[0_8px_30px_rgba(245,158,11,0.1)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.2)] transition-all group"
            >
              {/* Subtle ambient radial shimmer */}
              <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10 blur-2xl" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950 shadow-2xs">
                      {f.badge}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500">
                      Min order: {formatPaise(f.minOrderPaise, { locale })}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-lg font-black text-stone-900 leading-snug">
                    {f.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">{f.description}</p>
                </div>

                <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-amber-900/10 sm:pl-4">
                  <span className="inline-block rounded-xl border border-amber-400/80 bg-gradient-to-r from-amber-400/20 via-yellow-300/30 to-amber-400/20 px-3 py-1 font-mono text-xs font-black tracking-widest text-amber-950 shadow-2xs">
                    {f.code}
                  </span>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs px-5 py-2 rounded-xl shadow-md shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all h-9"
                    onClick={() => {
                      setCoupon(f.code);
                      toast.success(`Coupon ${f.code} applied to cart!`);
                    }}
                  >
                    {t("cart.apply")} ➔
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {serverPromos.length > 0 && (
          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-base">🍽️</span>
              <h2 className="font-display text-lg font-black text-stone-900">Partner Kitchen Deals</h2>
            </div>
            <ul className="space-y-3">
              {serverPromos.map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.12)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-extrabold text-stone-900 text-sm">{p.name}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {p.fundedBy === "RESTAURANT"
                        ? t("offers.fundedByRestaurant")
                        : p.fundedBy === "PLATFORM"
                          ? t("offers.fundedByPlatform")
                          : t("offers.fundedByShared")}
                    </p>
                    <p className="text-[11px] font-bold text-amber-800 mt-1">
                      {t("offers.min", { amount: formatPaise(p.minOrderPaise, { locale }) })}
                    </p>
                  </div>
                  {p.code ? (
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-2 py-1 font-mono text-xs font-bold text-amber-900">
                        {p.code}
                      </span>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-xs"
                        onClick={() => {
                          setCoupon(p.code!);
                          toast.success(t("cart.applied"));
                        }}
                      >
                        {t("cart.apply")}
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
