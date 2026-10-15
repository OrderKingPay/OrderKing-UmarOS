import { Link } from "@tanstack/react-router";
import { Clock, Star, Utensils, Flame, Sparkles } from "lucide-react";
import { formatPaiseCompact } from "@/lib/money";
import type { RestaurantCard } from "@/lib/market-types";
import { useT } from "@/components/providers";

/** Trigger subtle haptic click on card selection */
function hapticTap() {
  try {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(8);
    }
  } catch {
    /* silent on unsupported */
  }
}

export function KitchenCard({ restaurant }: { restaurant: RestaurantCard }) {
  const { lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";

  const numRatingAvg =
    restaurant.ratingAvg != null
      ? typeof restaurant.ratingAvg === "number"
        ? restaurant.ratingAvg
        : Number(restaurant.ratingAvg || 0)
      : null;
  const hasRating = numRatingAvg != null && !isNaN(numRatingAvg) && numRatingAvg > 0;

  const numRatingCount =
    typeof restaurant.ratingCount === "number"
      ? restaurant.ratingCount
      : Number(restaurant.ratingCount || 0);

  const numDistanceKm =
    restaurant.distanceKm != null
      ? typeof restaurant.distanceKm === "number"
        ? restaurant.distanceKm
        : Number(restaurant.distanceKm)
      : null;
  const hasDistance = numDistanceKm != null && !isNaN(numDistanceKm) && numDistanceKm > 0;

  return (
    <Link
      to="/r/$slug"
      params={{ slug: restaurant.slug || "" }}
      onClick={hapticTap}
      className="group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white border border-gray-100/90 shadow-[0_2px_16px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.12),0_4px_16px_-2px_rgba(0,0,0,0.06)] hover:border-amber-300/40 hover:-translate-y-1 active:scale-[0.97] active:brightness-[0.98] transition-all duration-200 ease-out will-change-transform no-underline"
    >
      {/* ─── Image Section ─── */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-gray-100">
        {restaurant.coverImage ? (
          <img
            src={restaurant.coverImage}
            alt={restaurant.name || "Restaurant"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6 text-center select-none">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/90 shadow-sm border border-orange-100 mb-2 group-hover:scale-110 transition-transform">
              <Utensils className="size-8 text-[#E23744]" />
            </div>
            <span className="font-bold text-gray-800 text-sm tracking-tight line-clamp-1">{restaurant.name || "Restaurant"}</span>
            <span className="text-xs text-gray-500 font-medium">{restaurant.cuisineSummary || ""}</span>
          </div>
        )}

        {/* ─── Top-Left Badges Stack ─── */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 z-10">
          {/* Featured Ad - Obsidian & 24K Gold Luxury */}
          {restaurant.promoted && (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg border border-amber-400/50"
              style={{
                background: "linear-gradient(135deg, rgba(17,17,20,0.95) 0%, rgba(36,28,15,0.95) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(251,191,36,0.35)",
              }}
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 shadow-[0_0_6px_rgba(251,191,36,1)]" />
              </span>
              <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                Featured Ad
              </span>
            </span>
          )}

          {/* Pure Veg - FSSAI Compliant Green Square & Circle */}
          {restaurant.vegOnly && (
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-extrabold tracking-tight shadow-md border border-emerald-400/60"
              style={{
                background: "linear-gradient(135deg, rgba(6,78,59,0.95), rgba(4,120,87,0.92))",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                color: "#a7f3d0",
                boxShadow: "0 4px 12px rgba(6,78,59,0.3), inset 0 1px 0 rgba(110,231,183,0.35)",
              }}
            >
              <span className="size-3 rounded-[3px] border-[1.5px] border-emerald-300 flex items-center justify-center bg-white/95">
                <span className="size-1.5 rounded-full bg-emerald-600" />
              </span>
              Pure Veg
            </span>
          )}
        </div>

        {/* ─── Closed Overlay ─── */}
        {!restaurant.open && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 shadow-lg">
              <Clock className="size-4 text-rose-600" />
              <span className="text-sm font-extrabold text-gray-900">Closed Now</span>
            </div>
          </div>
        )}

        {/* ─── Offer Ribbon (Top Right) with Pulsing Fire Icon ─── */}
        {restaurant.hasOffer && restaurant.offerLabel && (
          <div className="absolute top-2.5 right-0 z-10">
            <div
              className="rounded-l-xl px-2.5 sm:px-3 py-1 text-[10.5px] font-black text-white shadow-lg flex items-center gap-1.5 border-l border-y border-amber-200/40"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #f97316 55%, #f59e0b 100%)",
                boxShadow: "0 4px 14px rgba(239, 68, 68, 0.45)",
              }}
            >
              <Flame className="size-3.5 fill-amber-200 text-amber-100 animate-pulse shrink-0" />
              <span className="truncate max-w-[125px] sm:max-w-[170px] uppercase tracking-wide">
                {restaurant.offerLabel}
              </span>
            </div>
          </div>
        )}

        {/* ─── Bottom Gradient Bar with ETA + Distance ─── */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-8 flex items-end justify-between text-white z-10">
          <div className="flex items-center gap-1.5 bg-white/95 text-gray-900 px-2.5 py-1 rounded-lg text-xs font-bold shadow-md shrink-0 backdrop-blur-sm border border-white/60">
            <Clock className="size-3 text-[#E23744]" />
            <span>{restaurant.etaMinutes ?? 30} min</span>
            {hasDistance ? (
              <span className="text-gray-400 font-normal">· {numDistanceKm!.toFixed(1)} km</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── Info Section ─── */}
      <div className="p-3 sm:p-4 space-y-1.5">
        {/* Name + Gradient Rating Badge */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-extrabold text-[17px] sm:text-lg text-gray-900 tracking-tight truncate leading-tight group-hover:text-[#E23744] transition-colors">
            {restaurant.name}
          </h3>

          {hasRating ? (
            <div
              className="flex items-center gap-1 text-white font-extrabold text-xs px-2 sm:px-2.5 py-[3px] rounded-lg shadow-sm shrink-0 border"
              style={{
                background:
                  numRatingAvg! >= 4.0
                    ? "linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)"
                    : numRatingAvg! >= 3.0
                    ? "linear-gradient(135deg, #f59e0b 0%, #d97706 60%, #b45309 100%)"
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 60%, #b91c1c 100%)",
                borderColor:
                  numRatingAvg! >= 4.0
                    ? "rgba(167, 243, 208, 0.4)"
                    : numRatingAvg! >= 3.0
                    ? "rgba(253, 230, 138, 0.4)"
                    : "rgba(254, 202, 202, 0.4)",
                boxShadow:
                  numRatingAvg! >= 4.0
                    ? "0 2px 8px rgba(16, 185, 129, 0.35)"
                    : numRatingAvg! >= 3.0
                    ? "0 2px 8px rgba(245, 158, 11, 0.35)"
                    : "0 2px 8px rgba(239, 68, 68, 0.35)",
              }}
            >
              <span>{numRatingAvg!.toFixed(1)}</span>
              <Star className="size-3 fill-white" />
              {numRatingCount > 0 && (
                <span className="text-[10px] opacity-90 font-medium">
                  ({numRatingCount > 999 ? `${(numRatingCount / 1000).toFixed(1)}k` : numRatingCount})
                </span>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 font-bold text-xs px-2 py-[3px] rounded-lg shrink-0 border border-amber-200/80 shadow-sm flex items-center gap-1">
              <Sparkles className="size-3 text-amber-600" />
              New
            </div>
          )}
        </div>

        {/* Cuisine + SafeInteger Paise Price */}
        <div className="flex items-center justify-between text-xs sm:text-[13px] text-gray-500 font-medium">
          <p className="truncate max-w-[70%]">{restaurant.cuisineSummary || ""}</p>
          <span className="text-gray-700 font-semibold shrink-0">
            {restaurant.minOrderPaise
              ? `${formatPaiseCompact(Number(restaurant.minOrderPaise || 0), locale)} for one`
              : "₹150 for one"}
          </span>
        </div>

        {/* Location + Free Delivery Emerald Badge */}
        <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 truncate">
            <span className="truncate">{restaurant.zoneName || "Local Delivery Area"}</span>
            {restaurant.vegOnly && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-[1px] shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Pure Veg
              </span>
            )}
          </div>

          <div className="shrink-0 font-semibold">
            {Number(restaurant.deliveryFeePaise || 0) === 0 ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 px-2 py-0.5 rounded-md text-[10.5px] font-black border border-emerald-300/80 shadow-[0_1px_4px_rgba(16,185,129,0.15)]">
                <Sparkles className="size-2.5 text-emerald-600 fill-emerald-500" />
                FREE Delivery
              </span>
            ) : (
              <span className="text-gray-600">
                {formatPaiseCompact(Number(restaurant.deliveryFeePaise || 0), locale)} delivery
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
