import { Link } from "@tanstack/react-router";
import { Clock, Star, Utensils } from "lucide-react";
import { formatPaiseCompact } from "@/lib/money";
import type { RestaurantCard } from "@/lib/market-types";
import { useT } from "@/components/providers";

export function KitchenCard({ restaurant }: { restaurant: RestaurantCard }) {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";

  return (
    <Link
      to="/r/$slug"
      params={{ slug: restaurant.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 no-underline"
    >
      {/* Large Image Container */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-gray-100">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt={restaurant.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Attractive Large Image Placeholder */
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6 text-center select-none">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-orange-100 mb-2 group-hover:scale-110 transition-transform">
              <Utensils className="size-8 text-[#E23744]" />
            </div>
            <span className="font-bold text-gray-800 text-sm tracking-tight line-clamp-1">{restaurant.name}</span>
            <span className="text-xs text-gray-500 font-medium">{restaurant.cuisineSummary}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
          {restaurant.promoted && (
            <span className="rounded-md bg-white/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-xs">
              Ad
            </span>
          )}
          {!restaurant.open && (
            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider shadow-xs">
              Closed
            </span>
          )}
        </div>

        {/* Bottom Banner Over Image */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-6 flex items-end justify-between text-white z-10">
          {/* Offer Pill */}
          {restaurant.hasOffer && restaurant.offerLabel ? (
            <div className="flex items-center gap-1 font-bold text-xs text-white bg-blue-600/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm">
              <span className="text-[11px]">🏷️</span>
              <span className="truncate max-w-[140px] sm:max-w-[180px]">{restaurant.offerLabel}</span>
            </div>
          ) : (
            <div />
          )}

          {/* ETA & Distance Pill */}
          <div className="flex items-center gap-1 bg-white/95 text-gray-900 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md shrink-0">
            <Clock className="size-3 text-[#E23744]" />
            <span>{restaurant.etaMinutes ?? 30} mins</span>
            {restaurant.distanceKm ? (
              <span className="text-gray-400 font-normal">· {restaurant.distanceKm.toFixed(1)} km</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Info Section: High Contrast, Clean Typography */}
      <div className="p-3.5 sm:p-4 space-y-1.5">
        {/* Name and Rating */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 tracking-tight truncate leading-tight group-hover:text-[#E23744] transition-colors">
            {restaurant.name}
          </h3>

          {restaurant.ratingAvg != null ? (
            <div className="flex items-center gap-1 bg-emerald-700 text-white font-bold text-xs px-2 py-0.5 rounded-md shadow-xs shrink-0">
              <span>{restaurant.ratingAvg.toFixed(1)}</span>
              <Star className="size-3 fill-white" />
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 font-bold text-xs px-2 py-0.5 rounded-md shrink-0">
              New
            </div>
          )}
        </div>

        {/* Cuisine & Price */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 font-medium">
          <p className="truncate max-w-[70%]">{restaurant.cuisineSummary}</p>
          <span className="text-gray-700 font-semibold shrink-0">
            {restaurant.minOrderPaise
              ? `₹${Math.round(restaurant.minOrderPaise / 100)} for one`
              : "₹150 for one"}
          </span>
        </div>

        {/* Location & Delivery Info */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 truncate">
            <span className="truncate">{restaurant.zoneName || "Local Delivery Area"}</span>
            {restaurant.vegOnly && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.2 shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Pure Veg
              </span>
            )}
          </div>

          <div className="shrink-0 font-semibold">
            {restaurant.deliveryFeePaise === 0 ? (
              <span className="text-emerald-700">Free Delivery</span>
            ) : (
              <span className="text-gray-600">
                {formatPaiseCompact(restaurant.deliveryFeePaise, locale)} delivery
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
