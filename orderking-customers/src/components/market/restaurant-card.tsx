
import { Link } from "@tanstack/react-router";
import { Clock3, Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBrand, useT } from "@/components/providers";
import { formatPaiseCompact } from "@/lib/money";
import type { RestaurantCard } from "@/lib/market-types";

export function KitchenCard({ restaurant }: { restaurant: RestaurantCard }) {
  const { t, lang } = useT();
  const { business, marketplace } = useBrand();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  return (
    <Link
      to="/r/$slug"
      params={{ slug: restaurant.slug }}
      className="block overflow-hidden rounded-[var(--radius-2xl)] bg-[#0a0a0a]/80 backdrop-blur-2xl text-white no-underline border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] group"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-white/5 border-b border-white/10">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt=""
            className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : null}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {marketplace.sampleCatalogueBanner && restaurant.dataLabel !== "REAL" && marketplace.launchMode !== "live" ? (
            <Badge tone="warn">{t("common.sample")}</Badge>
          ) : null}
          {restaurant.promoted ? <Badge>{t("common.ad")}</Badge> : null}
          {!restaurant.open ? <Badge tone="danger">{t("common.closed")}</Badge> : null}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight tracking-tight text-white">{restaurant.name}</h3>
          {restaurant.vegOnly ? (
            <span className="mt-1 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" aria-label={t("common.veg")}>
              <Leaf className="size-4" />
            </span>
          ) : null}
        </div>
        <p className="text-sm font-medium text-zinc-400 truncate">{restaurant.cuisineSummary}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-zinc-500 mt-0.5">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden />
            {t("home.etaMin", { n: restaurant.etaMinutes })}
          </span>
          <span aria-hidden>·</span>
          <span>{t("home.deliveryFrom", { fee: formatPaiseCompact(restaurant.deliveryFeePaise, locale) })}</span>
          <span aria-hidden>·</span>
          <span>{t("home.minOrder", { amount: formatPaiseCompact(restaurant.minOrderPaise, locale) })}</span>
        </p>
        {restaurant.hasOffer && restaurant.offerLabel ? (
          <p className="mt-2 text-xs font-bold text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]">{restaurant.offerLabel}</p>
        ) : null}
        {restaurant.ratingAvg == null ? (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {t("common.new")}
            </span>
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-black text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <span className="text-[10px]">★</span>
              {restaurant.ratingAvg.toFixed(1)}
            </span>
            <span className="text-[10px] font-semibold text-zinc-500">
              ({restaurant.ratingCount}+)
            </span>
          </div>
        )}
        <span className="sr-only">{business.currency}</span>
      </div>
    </Link>
  );
}
