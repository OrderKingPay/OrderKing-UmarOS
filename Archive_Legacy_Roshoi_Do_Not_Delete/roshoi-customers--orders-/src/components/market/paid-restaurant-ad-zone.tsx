import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export interface SponsoredRestaurantAd {
  id: string;
  name: string;
  logoUrl?: string;
  emojiFallback: string;
  rating: number;
  cuisine: string;
  adSpendRank: number; // 1 = highest bid / top ranking
  specialOffer?: string;
}

const DEFAULT_SPONSORED_ADS: SponsoredRestaurantAd[] = [
  {
    id: "rest-royal-biryani",
    name: "Royal Biryani House",
    emojiFallback: "🍗",
    rating: 4.9,
    cuisine: "Dum Biryani & Kebabs",
    adSpendRank: 1,
    specialOffer: "0% Markup · Free Delivery",
  },
  {
    id: "rest-pizza-roma",
    name: "Pizza Roma Artisanal",
    emojiFallback: "🍕",
    rating: 4.8,
    cuisine: "Wood-fired Pizza",
    adSpendRank: 2,
    specialOffer: "Flat ₹50 OFF",
  },
  {
    id: "rest-shagun-thali",
    name: "Shagun Pure Veg Thali",
    emojiFallback: "🥗",
    rating: 4.8,
    cuisine: "North Indian & Gujarati",
    adSpendRank: 3,
    specialOffer: "Unlimited Refills",
  },
  {
    id: "rest-bengal-sweet",
    name: "Kolkata Sweet Corner",
    emojiFallback: "🍮",
    rating: 4.7,
    cuisine: "Mithai & Chaat",
    adSpendRank: 4,
    specialOffer: "Fresh Rosogolla",
  },
];

interface PaidRestaurantAdZoneProps {
  ads?: SponsoredRestaurantAd[];
  className?: string;
}

/**
 * 👑 PAID RESTAURANT ADVERTISEMENT ZONE
 * 
 * Strict Work Order Specification:
 * - Sits in the freed vertical space above the switch button.
 * - Auto-scales:
 *   - 1-3 ads: Larger rounded icon cards with restaurant name, cuisine & rating.
 *   - 4+ ads: Compact micro-pills, maximizing ad inventory while keeping vertical height under 48px.
 * - Ranked strictly by ad spend (`adSpendRank`).
 */
export function PaidRestaurantAdZone({
  ads = DEFAULT_SPONSORED_ADS,
  className = "",
}: PaidRestaurantAdZoneProps) {
  // Sort strictly by ad spend rank (ascending: rank 1 first)
  const sortedAds = [...ads].sort((a, b) => a.adSpendRank - b.adSpendRank);
  const isCompactMode = sortedAds.length >= 4;

  if (sortedAds.length === 0) return null;

  return (
    <section
      aria-label="Sponsored Restaurants"
      className={`relative z-10 overflow-hidden ${className}`}
    >
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Sponsored
          </span>
          <span className="text-[10px] text-muted font-medium">Top Rated Kitchens</span>
        </div>
        <span className="text-[9px] text-muted/70 font-mono">Ranked by Ad Bid</span>
      </div>

      {isCompactMode ? (
        /* COMPACT MICRO-PILL RIBBON (4+ ADS) */
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5 pt-0.5">
          {sortedAds.map((ad) => (
            <Link
              key={ad.id}
              to="/r/$slug"
              params={{ slug: ad.id }}
              className="group flex h-8 shrink-0 items-center gap-2 rounded-full border border-border/80 bg-surface-2/90 px-2.5 shadow-xs hover:border-amber-400 hover:bg-amber-500/10 transition-all active:scale-95 no-underline cursor-pointer"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs shadow-xs">
                {ad.emojiFallback}
              </span>
              <span className="truncate text-xs font-bold text-fg group-hover:text-amber-500 max-w-[120px]">
                {ad.name}
              </span>
              <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                <Star className="size-2.5 fill-amber-400 text-amber-400" />
                <span>{ad.rating.toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* PROMINENT AUTO-SCALE CARDS (1-3 ADS) */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sortedAds.map((ad) => (
            <Link
              key={ad.id}
              to="/r/$slug"
              params={{ slug: ad.id }}
              className="group flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface-2/90 p-2 shadow-xs hover:border-amber-400 hover:bg-amber-500/10 transition-all active:scale-95 no-underline cursor-pointer"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface text-xl shadow-xs group-hover:scale-105 transition-transform">
                {ad.emojiFallback}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="truncate text-xs font-black text-fg group-hover:text-amber-500">
                    {ad.name}
                  </h4>
                  <div className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    <Star className="size-2.5 fill-amber-400 text-amber-400" />
                    <span>{ad.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="truncate text-[10px] text-muted">{ad.cuisine}</p>
                {ad.specialOffer ? (
                  <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {ad.specialOffer}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
