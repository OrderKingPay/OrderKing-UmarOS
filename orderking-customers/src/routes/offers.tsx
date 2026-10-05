
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
    description: "Flat 50% discount on your food orders.",
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
    description: "Exclusive member discount with unlimited free delivery.",
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
      <div className="px-4 py-5">
        <h1 className="font-display text-3xl">{t("offers.title")}</h1>
        <p className="mt-1 text-sm text-zinc-400">Apply coupons directly for instant cart savings & free delivery</p>

        {/* Featured Zomato-Style Promo Cards */}
        <div className="mt-4 space-y-3">
          {FEATURED_OFFERS.map((f) => (
            <div
              key={f.id}
              className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-fuchsia-500/20 bg-white/5 p-4 shadow-[0_0_15px_rgba(217,70,239,0.1)] transition hover:border-fuchsia-500/50 hover:shadow-[0_0_25px_rgba(217,70,239,0.2)] backdrop-blur-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 px-2 py-0.5 text-[11px] font-bold text-fuchsia-400">
                    {f.badge}
                  </span>
                  <h2 className="mt-1 font-bold text-base text-white">{f.name}</h2>
                  <p className="mt-0.5 text-xs text-zinc-400">{f.description}</p>
                  <p className="mt-1 text-[11px] font-medium text-zinc-500">
                    Min order: {formatPaise(f.minOrderPaise, { locale })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded border border-dashed border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1 font-mono text-xs font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">
                    {f.code}
                  </span>
                  <Button
                    className="mt-2 block w-full text-xs bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold shadow-[0_0_15px_rgba(217,70,239,0.4)] border border-fuchsia-500/50 transition-colors"
                    size="sm"
                    onClick={() => {
                      setCoupon(f.code);
                      toast.success(`Coupon ${f.code} applied!`);
                    }}
                  >
                    {t("cart.apply")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {serverPromos.length > 0 && (
          <div className="mt-6 space-y-3">
            <h2 className="font-display text-lg font-bold">Partner Restaurant Deals</h2>
            <ul className="space-y-3">
              {serverPromos.map((p) => (
                <li key={p.id} className="rounded-[var(--radius-2xl)] bg-white/5 border border-white/10 p-4 shadow-sm">
                  <p className="font-medium">{p.name}</p>
                  {p.code ? <p className="font-mono text-sm">{p.code}</p> : null}
                  <p className="text-xs text-zinc-400">
                    {p.fundedBy === "RESTAURANT"
                      ? t("offers.fundedByRestaurant")
                      : p.fundedBy === "PLATFORM"
                        ? t("offers.fundedByPlatform")
                        : t("offers.fundedByShared")}
                  </p>
                  <p className="text-xs text-zinc-400">{t("offers.min", { amount: formatPaise(p.minOrderPaise, { locale }) })}</p>
                  {p.code ? (
                    <Button
                      size="sm"
                      className="mt-2 border border-white/20 bg-white/5 text-white hover:bg-white/10"
                      onClick={() => {
                        setCoupon(p.code!);
                        toast.success(t("cart.applied"));
                      }}
                    >
                      {t("cart.apply")}
                    </Button>
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
