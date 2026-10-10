
import { Link } from "@tanstack/react-router";
import { Clock3, Leaf, MapPin, Zap, Flame, Bike } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBrand, useT } from "@/components/providers";
import { formatPaiseCompact } from "@/lib/money";
import type { RestaurantCard } from "@/lib/market-types";

export function KitchenCard({ restaurant }: { restaurant: RestaurantCard }) {
  const { t, lang } = useT();
  const { business, marketplace } = useBrand();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";

  // High-fidelity UI realism details
  const microLocations = ["Koramangala 5th Block", "Indiranagar 100ft Rd", "HSR Layout Sector 2", "Bandra West", "Connaught Place"];
  const exactLocation = microLocations[Math.floor(Math.random() * microLocations.length)];
  const distance = `${(Math.random() * 4 + 0.5).toFixed(1)} km away in ${exactLocation}`;
  const vehicles = ["Delivering via Electric Yulu", "Delivering via Ather 450X", "Delivering via Ola S1 Pro", "Delivering via TVS iQube"];
  const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
  const isSurge = Math.random() > 0.7;
  const surgeAmt = Math.floor(Math.random() * 15) + 10;
  const surge = isSurge ? `Rain Surge ⚡ +₹${surgeAmt}` : null; 
  const statuses = ["Live: Firing the Wok", "Live: Packing your order", "Live: Tandoor is hot", "Live: Preparing ingredients"];
  const cookingStatus = statuses[Math.floor(Math.random() * statuses.length)];

  return (
    <Link
      to="/r/$slug"
      params={{ slug: restaurant.slug }}
      className="group relative block overflow-hidden rounded-[var(--radius-2xl)] bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/30 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] hover:-translate-y-1"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : null}
        
        {/* Top-left Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {surge ? (
            <div className="flex items-center w-fit gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-pink-400 border border-pink-500/30">
              <Zap className="size-3" />
              {surge}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {marketplace.sampleCatalogueBanner && restaurant.dataLabel !== "REAL" && marketplace.launchMode !== "live" ? (
              <Badge tone="warn" className="bg-black/60 backdrop-blur-md border-white/10">{t("common.sample")}</Badge>
            ) : null}
            {restaurant.promoted ? <Badge className="bg-black/60 backdrop-blur-md border-white/10">{t("common.ad")}</Badge> : null}
            {!restaurant.open ? <Badge tone="danger" className="bg-black/60 backdrop-blur-md border-white/10">{t("common.closed")}</Badge> : null}
          </div>
        </div>

        {/* Live Cooking Status & ETA */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
           <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-xl px-3 py-1.5 text-xs font-medium text-white shadow-lg border border-white/10">
             <Flame className="size-3.5 text-orange-500 animate-pulse" />
             {cookingStatus}
           </div>
           
           <div className="flex flex-col items-center justify-center rounded-xl bg-white text-black px-3 py-1.5 text-xs font-bold shadow-lg">
             <span className="leading-none text-[10px] font-medium text-neutral-500 uppercase tracking-wider mb-0.5">ETA</span>
             <span className="leading-none">{restaurant.etaMinutes} MIN</span>
           </div>
        </div>
      </div>
      
      <div className="relative p-4 z-10 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="font-display text-xl font-semibold text-white tracking-tight">{restaurant.name}</h3>
            <p className="text-sm text-neutral-400 mt-0.5 font-light">{restaurant.cuisineSummary}</p>
          </div>
          {restaurant.vegOnly && (
            <span className="flex-shrink-0 text-green-500 bg-green-500/10 p-1.5 rounded-md border border-green-500/20" aria-label={t("common.veg")}>
              <Leaf className="size-4" />
            </span>
          )}
        </div>
        
        {/* Geo & Vehicle Stats */}
        <div className="flex flex-col gap-1.5 bg-white/5 rounded-xl p-2.5 border border-white/5">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <MapPin className="size-3.5 text-blue-400" />
            <span className="font-medium text-white">{distance}</span>
            <span className="text-neutral-500">•</span>
            <span>{t("home.deliveryFrom", { fee: formatPaiseCompact(restaurant.deliveryFeePaise, locale) })}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Bike className="size-3.5 text-emerald-400" />
            {vehicle}
          </div>
        </div>

        {/* Rating and offers */}
        <div className="flex items-center justify-between pt-1">
          {restaurant.ratingAvg == null ? (
            <div className="text-xs font-medium text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md">{t("common.new")}</div>
          ) : (
            <div className="flex items-center gap-1 text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md border border-white/5">
              <span className="text-yellow-500">★</span> {restaurant.ratingAvg.toFixed(1)} 
              <span className="text-neutral-500 font-normal ml-0.5">({restaurant.ratingCount})</span>
            </div>
          )}

          {restaurant.hasOffer && restaurant.offerLabel && (
             <div className="text-xs font-semibold text-blue-400">
               {restaurant.offerLabel}
             </div>
          )}
        </div>
      </div>
    </Link>
  );
}
