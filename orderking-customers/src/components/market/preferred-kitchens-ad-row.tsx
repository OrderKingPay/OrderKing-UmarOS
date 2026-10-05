
import { Link } from "@tanstack/react-router";
import { Sparkles, Star } from "lucide-react";

export type PreferredKitchenAd = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  emoji: string;
  rating: number;
  deliveryMinutes: number;
  cuisine: string;
  adSpendRank: number; // 1 = highest ad spend
  isPreferred: boolean;
};

const PREFERRED_KITCHENS_ADS: PreferredKitchenAd[] = [
  {
    id: "rst_biryani",
    name: "Station Biryani House",
    slug: "station-biryani-house",
    emoji: "🍗",
    rating: 4.9,
    deliveryMinutes: 20,
    cuisine: "Royal Dum Biryani",
    adSpendRank: 1,
    isPreferred: true,
  },
  {
    id: "rst_thali",
    name: "Central Thali Ghar",
    slug: "central-thali-ghar",
    emoji: "🥘",
    rating: 4.8,
    deliveryMinutes: 18,
    cuisine: "Pure Veg Thalis",
    adSpendRank: 2,
    isPreferred: true,
  },
  {
    id: "rst_rolls",
    name: "Roll Factory",
    slug: "roll-factory",
    emoji: "🌯",
    rating: 4.7,
    deliveryMinutes: 15,
    cuisine: "Kathi & Egg Rolls",
    adSpendRank: 3,
    isPreferred: false,
  },
  {
    id: "rst_pizza",
    name: "Crust & Craft Pizza",
    slug: "crust-and-craft-pizza",
    emoji: "🍕",
    rating: 4.8,
    deliveryMinutes: 22,
    cuisine: "Woodfired Pizza",
    adSpendRank: 4,
    isPreferred: true,
  },
  {
    id: "rst_momo",
    name: "Barak Momo Hut",
    slug: "barak-momo-hut",
    emoji: "🥟",
    rating: 4.7,
    deliveryMinutes: 16,
    cuisine: "Crispy Momos",
    adSpendRank: 5,
    isPreferred: false,
  },
  {
    id: "rst_fish",
    name: "Surma Fish Kitchen",
    slug: "surma-fish-kitchen",
    emoji: "🐟",
    rating: 4.9,
    deliveryMinutes: 24,
    cuisine: "Bengali Fish Curry",
    adSpendRank: 6,
    isPreferred: true,
  },
];

export function PreferredKitchensAdRow({ className = "" }: { className?: string }) {
  // Sort strictly by ad spend rank ascending (top ad spend first) + performance rating descending
  const sortedKitchens = [...PREFERRED_KITCHENS_ADS].sort((a, b) => {
    if (a.adSpendRank !== b.adSpendRank) return a.adSpendRank - b.adSpendRank;
    return b.rating - a.rating;
  });

  return (
    <section aria-label="Preferred & Featured Kitchens" className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
            <Sparkles className="size-3 text-amber-400" />
            Featured &amp; Top Preferred Kitchens
          </span>
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-extrabold text-amber-400 border border-amber-500/30">
            AD
          </span>
        </div>
        <span className="text-[10px] text-zinc-500">Ranked by Quality &amp; Trust</span>
      </div>

      {/* Clean compact horizontal row of small-icon restaurants */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
        {sortedKitchens.map((k) => (
          <Link
            key={k.id}
            to="/r/$slug"
            params={{ slug: k.slug }}
            className="group flex flex-col items-center w-20 shrink-0 text-center no-underline cursor-pointer"
          >
            {/* Small icon container with gold bezel for preferred / sponsored */}
            <div className="relative flex size-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0a0a0a] via-black to-amber-500/10 p-1 border border-white/10 group-hover:border-amber-400/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-200 group-active:scale-95">
              <span className="text-2xl group-hover:scale-110 transition-transform">{k.emoji}</span>
              
              {/* Star Rating Badge */}
              <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1 py-0.5 text-[9px] font-black text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)] backdrop-blur-md">
                <span>★</span>
                <span>{k.rating}</span>
              </span>

              {/* Ad indicator */}
              {k.adSpendRank <= 3 && (
                <span className="absolute -top-1 -left-1 rounded bg-amber-500 text-black px-1 py-0 text-[8px] font-black leading-tight shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                  AD
                </span>
              )}
            </div>

            {/* Restaurant Name */}
            <span className="mt-1 block text-[11px] font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1 w-full leading-tight">
              {k.name}
            </span>

            {/* Delivery time */}
            <span className="text-[9px] text-zinc-500 font-medium block leading-tight">
              {k.deliveryMinutes}m · {k.cuisine.split(" ")[0]}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
