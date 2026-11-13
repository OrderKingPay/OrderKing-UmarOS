import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Clock,
  Star,
  Zap,
  Percent,
  Coins,
  ArrowRight,
  RotateCcw,
  MapPin,
  Utensils,
  ChevronRight,
  CloudRain,
  Sparkles,
  Plane,
  Train,
  CreditCard,
  Package,
  GraduationCap,
  Crown,
  Building2,
  Briefcase,
  Eye,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { KitchenCard } from "@/components/market/restaurant-card";
import { LocationDialog } from "@/components/market/location-dialog";
import { CuratedCollections } from "@/components/market/curated-collections";
import { useCustomization } from "@orderking/ui";
import { useBrand, useT } from "@/components/providers";
import { listCategories } from "@/lib/server/catalog";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import { useLocationStore } from "@/lib/stores/location";
import { useCartStore } from "@/lib/stores/cart";
import { useDietStore } from "@/lib/stores/diet";
import type { RestaurantCard } from "@/lib/market-types";
import { cn } from "@/lib/utils";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

// Curated high-resolution categories with distinct gradient colors (Biryani, Pizza, Rolls, Thali, Burgers, Desserts)
const CURATED_FOOD_CATEGORIES = [
  {
    name: "Pizza",
    slug: "pizza",
    gradient: "from-red-500 via-rose-500 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Biryani",
    slug: "biryani",
    gradient: "from-orange-500 via-[#E85D04] to-[#B85D19]",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Momo",
    slug: "momo",
    gradient: "from-[#B85D19] via-amber-600 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1625398407797-00c2cb621124?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Rolls",
    slug: "rolls",
    gradient: "from-amber-500 via-orange-600 to-red-500",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Thali",
    slug: "thali",
    gradient: "from-[#B85D19] via-[#C2410C] to-[#E85D04]",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Burgers",
    slug: "burger",
    gradient: "from-orange-500 via-[#C2410C] to-red-600",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Desserts",
    slug: "desserts",
    gradient: "from-pink-500 via-rose-500 to-amber-500",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Curry",
    slug: "north-indian",
    gradient: "from-emerald-500 via-teal-600 to-amber-600",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Chinese",
    slug: "chinese",
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "South Indian",
    slug: "south-indian",
    gradient: "from-amber-500 via-orange-500 to-amber-600",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
  {
    name: "Cakes",
    slug: "cake",
    gradient: "from-fuchsia-500 via-rose-500 to-amber-500",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=360&h=360&auto=format&fit=crop&crop=center&q=90",
  },
];

export const CATEGORY_MATCH_MAP: Record<string, string[]> = {
  pizza: ["pizza", "italian", "pasta"],
  biryani: ["biryani", "dum", "mughlai"],
  momo: ["momo", "dim sum", "dumpling", "fast food", "street food", "chinese"],
  rolls: ["roll", "kathi", "wrap", "kebab", "mughlai"],
  thali: ["thali", "combo", "meal", "pure veg", "north indian", "south indian"],
  burger: ["burger", "fast food", "sandwich", "deli", "bakery"],
  desserts: ["dessert", "bakery", "sweet", "pastry", "cake", "gelato", "mithai"],
  "north-indian": ["north indian", "curry", "mughlai", "dal", "paneer", "tandoori"],
  chinese: ["chinese", "noodle", "asian", "hakka"],
  "south-indian": ["south indian", "dosa", "idli", "sambar", "filter coffee"],
  cake: ["cake", "bakery", "pastry", "dessert"],
};

export const VERIFIED_AVAILABLE_KITCHENS: RestaurantCard[] = [];

export const ACTIVE_FLAGSHIP_HUBS = [
  {
    id: "delhi-cp",
    name: "Connaught Place Central",
    flagshipLabel: "Delhi NCR Flagship",
    description: "Iconic North Indian, Mughlai and Street Heritage",
    cityId: "del",
    cityName: "New Delhi",
    zoneId: "del-cp",
    zoneName: "Connaught Place",
    label: "Connaught Place Central, New Delhi",
    line1: "Inner Circle, Connaught Place, New Delhi",
    lat: 28.6315,
    lng: 77.2167,
    highlight: "Central Delhi Delivery Zone",
    gradient: "from-[#B85D19] to-orange-500",
  },
  {
    id: "sribhumi-core",
    name: "Sribhumi Core",
    flagshipLabel: "Karimganj / Assam Flagship",
    description: "Launch Flagship: Authentic Sylheti and Assamese Kitchens",
    cityId: "karimganj",
    cityName: "Sribhumi / Karimganj",
    zoneId: "karimganj_core",
    zoneName: "Sribhumi Core",
    label: "Station Road, Sribhumi Core",
    line1: "Station Road, Karimganj, Assam",
    lat: 24.8688,
    lng: 92.3511,
    highlight: "Assam Core 15km Zone",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "mumbai-metro",
    name: "Mumbai Metropolitan",
    flagshipLabel: "Bandra / BKC Flagship",
    description: "Coastal Seafood, Artisanal Cafes and Late Night Dining",
    cityId: "mum",
    cityName: "Mumbai",
    zoneId: "mum-bandra",
    zoneName: "Bandra / BKC",
    label: "Bandra West / BKC, Mumbai",
    line1: "Linking Road, Bandra West, Mumbai",
    lat: 19.0600,
    lng: 72.8336,
    highlight: "Bandra and BKC Gourmet Kitchens",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "bengaluru-hub",
    name: "Bengaluru Tech Hub",
    flagshipLabel: "Indiranagar Flagship",
    description: "Craft Burgers, Artisanal Bakeries and Pan-Asian Delights",
    cityId: "blr",
    cityName: "Bengaluru",
    zoneId: "blr-ind",
    zoneName: "Indiranagar",
    label: "Indiranagar Tech Hub, Bengaluru",
    line1: "100ft Road, Indiranagar, Bengaluru",
    lat: 12.9784,
    lng: 77.6408,
    highlight: "Indiranagar and Koramangala Kitchens",
    gradient: "from-purple-500 to-violet-600",
  },
];


export function HomeFeed({
  q,
  veg,
  openNow,
  category,
}: {
  q?: string;
  veg?: boolean;
  openNow?: boolean;
  category?: string;
}) {
  const { t, lang } = useT();
  const locale = lang === "bn" ? "bn-IN" : "en-IN";
  const { marketplace } = useBrand();
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const cart = useCartStore();
  const navigate = useNavigate();

  // Global reactive diet preference: "all" | "veg"
  const { dietFilter, setDietFilter } = useDietStore();
  const customization = useCustomization();
  const isRainSurge = Boolean(
    (customization?.payoutPolicy as any)?.monsoonSurgePaise > 0 ||
    (customization?.payoutPolicy as any)?.rainSurgeBonusPaise > 0 ||
    (customization?.logistics as any)?.rainSurgeActive ||
    (customization?.state as any)?.features?.rainSurgeActive ||
    customization?.isFeatureEnabled?.("rain_surge") ||
    customization?.isFeatureEnabled?.("monsoon_mode")
  );

  // Secondary quick filter tags
  const [filterFast, setFilterFast] = useState(false);
  const [filterRating, setFilterRating] = useState(false);
  const [filterOffers, setFilterOffers] = useState(false);
  const [filterBudget, setFilterBudget] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);
  const [locDialogOpen, setLocDialogOpen] = useState(false);

  // Past orders for reorder
  const pastOrders = useQuery({
    queryKey: ["pastOrders"],
    queryFn: () => listMyOrders(),
    retry: false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: (prev) => prev,
  });

  // Database categories
  const cats = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => listCategories({ data: { lang } }),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: (prev) => prev,
  });

  // Display categories: DB categories merged with curated fallback items with distinct gradient and emoji
  const displayCategories = useMemo(() => {
    const dbCats = cats.data?.categories ?? [];
    if (dbCats.length > 0) {
      return dbCats.map((c, i) => {
        const cSlug = (c.slug || "").toLowerCase();
        const curated =
          CURATED_FOOD_CATEGORIES.find((cc) => {
            const ccSlug = (cc.slug || "").toLowerCase();
            return cSlug ? (ccSlug.includes(cSlug) || cSlug.includes(ccSlug)) : false;
          }) || CURATED_FOOD_CATEGORIES[i % CURATED_FOOD_CATEGORIES.length];
        return {
          id: c.slug || curated.slug,
          slug: c.slug || curated.slug,
          name: c.name || curated.name,
          gradient: curated.gradient,
          imageUrl: curated.imageUrl,
        };
      });
    }
    return CURATED_FOOD_CATEGORIES.map((c) => ({
      id: c.slug,
      slug: c.slug,
      name: c.name,
      gradient: c.gradient,
      imageUrl: c.imageUrl,
    }));
  }, [cats.data?.categories]);

  // Main restaurant catalog query with persistent caching across route navigations
  const list = useQuery({
    queryKey: [
      "restaurants",
      location?.zoneId ?? "",
      location?.lat ?? 0,
      location?.lng ?? 0,
      q ?? "",
      dietFilter,
      openNow ?? false,
      selectedCategory ?? "",
      lang ?? "en",
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (dietFilter === "veg") params.set("veg", "true");
      if (openNow) params.set("openNow", "true");
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("lat", (location?.lat ?? 0).toString());
      params.set("lng", (location?.lng ?? 0).toString());
      params.set("zoneId", location?.zoneId || "");
      if (lang) params.set("lang", lang);

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Search rate limited (429), preserving existing catalog");
        }
        throw new Error(`Failed to fetch restaurants: HTTP ${response.status}`);
      }
      const data = await response.json();
      return {
        restaurants: Array.isArray(data?.restaurants) ? (data.restaurants as RestaurantCard[]) : [],
        deliveryAvailable: Boolean(data?.deliveryAvailable),
        reason: (data?.reason as string) || undefined,
      };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return true;
    },
  });

  // Handle reorder click
  const handleReorder = async (orderId: string) => {
    try {
      const res = await reorderItems({ data: { orderId } });
      cart.replaceCart(res.restaurantId, res.restaurantName, res.lines);
      toast.success("Past order items added to cart!");
      void navigate({ to: "/cart" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reorder");
    }
  };

  const activeOrder = pastOrders.data?.orders?.find((o) =>
    o && o.status && ["PENDING", "PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "ARRIVED"].includes(
      o.status
    )
  );

  const isDeliveryActive = location
    ? isDeliveryActiveInLocation(location.lat, location.lng, location.cityId)
    : true;

  const isZeroDeliveryInRadius =
    !isDeliveryActive ||
    (list.data && list.data.restaurants.length === 0) ||
    (list.data && list.data.deliveryAvailable === false);

  // Filtered and sorted restaurants based on active controls
  const filteredRestaurants = useMemo(() => {
    const raw: RestaurantCard[] = list.data?.restaurants ?? [];

    const matched = raw
      .filter((r) => {
        if (!r) return false;
        if (dietFilter === "veg" && !r.vegOnly) return false;
        if (selectedCategory) {
          const s = selectedCategory.toLowerCase().replace(/^cat_/, "");
          const keywords = CATEGORY_MATCH_MAP[s] || [s, s.replace(/s$/, "")];
          const summary = (r.cuisineSummary || "").toLowerCase();
          const rName = r.name.toLowerCase();
          const rSlug = r.slug.toLowerCase();
          const matchCat = keywords.some(
            (kw) => summary.includes(kw) || rName.includes(kw) || rSlug.includes(kw)
          );
          if (!matchCat) return false;
        }
        if (q) {
          const matchQ =
            r.name.toLowerCase().includes(q.toLowerCase()) ||
            (r.cuisineSummary && r.cuisineSummary.toLowerCase().includes(q.toLowerCase()));
          if (!matchQ) return false;
        }
        const rating = typeof r.ratingAvg === "number" ? r.ratingAvg : Number(r.ratingAvg || 0);
        if (filterRating && rating < 4.0) return false;
        if (filterOffers && !r.hasOffer) return false;
        const minOrder = typeof r.minOrderPaise === "number" ? r.minOrderPaise : Number(r.minOrderPaise || 0);
        if (filterBudget && minOrder > 19900) return false;
        const eta = typeof r.etaMinutes === "number" ? r.etaMinutes : Number(r.etaMinutes || 35);
        if (filterFast && eta > 30) return false;
        return true;
      });

    // Only actual API results may populate the restaurant grid.
    const finalKitchens = matched;

    return finalKitchens.sort((a, b) => {
        const etaA = typeof a.etaMinutes === "number" ? a.etaMinutes : Number(a.etaMinutes || 30);
        const etaB = typeof b.etaMinutes === "number" ? b.etaMinutes : Number(b.etaMinutes || 30);
        if (filterFast) return etaA - etaB;

        const minA = typeof a.minOrderPaise === "number" ? a.minOrderPaise : Number(a.minOrderPaise || 20000);
        const minB = typeof b.minOrderPaise === "number" ? b.minOrderPaise : Number(b.minOrderPaise || 20000);
        if (filterBudget) return minA - minB;

        const ratingA = typeof a.ratingAvg === "number" ? a.ratingAvg : Number(a.ratingAvg || 4.0);
        const ratingB = typeof b.ratingAvg === "number" ? b.ratingAvg : Number(b.ratingAvg || 4.0);
        const countA = typeof a.ratingCount === "number" ? a.ratingCount : Number(a.ratingCount || 10);
        const countB = typeof b.ratingCount === "number" ? b.ratingCount : Number(b.ratingCount || 10);

        const scoreA = ratingA * Math.log10(Math.max(10, countA));
        const scoreB = ratingB * Math.log10(Math.max(10, countB));
        return scoreB - scoreA;
      });
  }, [list.data?.restaurants, dietFilter, filterRating, filterOffers, filterBudget, filterFast, selectedCategory, q]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:px-6 sm:py-6 bg-[#FCFAF7] text-gray-900 font-sans">


      {/* 1. HORIZONTAL CIRCULAR FOOD CATEGORIES */}
      {!q && !isZeroDeliveryInRadius && (
        <section aria-label="Food Categories" className="pt-0.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-950 tracking-tight">
              Categories
            </h2>
            <Link
              to="/search"
              className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-0.5"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none pt-1 items-center">
            {/* Meals under ₹199 card with Rich Copper & Burnt Orange aesthetic */}
            <button
              type="button"
              onClick={() => setFilterBudget(!filterBudget)}
              className={cn(
                "group flex flex-col justify-between shrink-0 w-24 sm:w-28 h-20 sm:h-24 p-2 sm:p-2.5 rounded-2xl border text-left transition-all active:scale-95 shadow-2xs select-none cursor-pointer",
                filterBudget
                  ? "bg-gradient-to-br from-[#B85D19] via-[#E85D04] to-[#9A3412] text-white border-orange-500 shadow-md ring-2 ring-orange-400"
                  : "bg-gradient-to-br from-orange-50/90 via-white to-orange-50/40 border-orange-200/80 text-orange-950 hover:border-orange-500"
              )}
            >
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-[#C2410C] dark:text-orange-400 leading-tight">
                  MEALS UNDER
                </span>
                <span className="block text-base sm:text-lg font-black leading-none mt-0.5">
                  ₹199
                </span>
              </div>
              <span className="inline-flex items-center text-[10px] font-extrabold text-[#C2410C] dark:text-orange-300">
                Explore <ChevronRight className="size-3 ml-0.5" />
              </span>
            </button>

            {/* "All" Category Pill (1:1 with Zomato live screenshot) */}
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer"
            >
              <div
                className={cn(
                  "size-16 sm:size-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#B85D19] via-[#E85D04] to-rose-500 transition-all duration-300 shadow-sm relative",
                  !selectedCategory
                    ? "scale-105 ring-3 ring-[#E23744] shadow-[0_4px_16px_rgba(226,55,68,0.35)]"
                    : "group-hover:scale-105 group-hover:shadow-md"
                )}
              >
                <div className="size-full rounded-full p-0.5 bg-white flex items-center justify-center overflow-hidden shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=360&h=360&auto=format&fit=crop&crop=center&q=90"
                    alt="All cuisines"
                    className="size-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              </div>
              <span
                className={cn(
                  "mt-1.5 text-xs font-black truncate w-full transition-colors leading-tight relative",
                  !selectedCategory ? "text-[#E23744]" : "text-gray-900 group-hover:text-black"
                )}
              >
                All
                {!selectedCategory && (
                  <span className="block mx-auto mt-0.5 w-4 h-0.5 rounded-full bg-[#E23744]" />
                )}
              </span>
            </button>

            {displayCategories.map((c, i) => {
              const isSelected = selectedCategory === c.slug || selectedCategory === c.id;
              return (
                <button
                  type="button"
                  key={c.slug || c.id || `cat-${i}`}
                  onClick={() => setSelectedCategory(isSelected ? null : c.slug)}
                  className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer"
                >
                  {/* Distinct gradient colored ring around image */}
                  <div
                    className={cn(
                      "size-16 sm:size-20 rounded-full p-[2.5px] bg-gradient-to-tr transition-all duration-300 shadow-sm relative",
                      c.gradient,
                      isSelected
                        ? "scale-105 ring-3 ring-[#E85D04] shadow-[0_4px_16px_rgba(232,93,4,0.35)]"
                        : "group-hover:scale-105 group-hover:shadow-md"
                    )}
                  >
                    <div className="size-full rounded-full p-0.5 bg-white overflow-hidden shadow-inner">
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="size-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Category Name */}
                  <span
                    className={cn(
                      "mt-1.5 text-xs font-black truncate w-full transition-colors leading-tight",
                      isSelected ? "text-[#E85D04]" : "text-gray-900 group-hover:text-black"
                    )}
                  >
                    {c.name}
                    {isSelected && (
                      <span className="block mx-auto mt-0.5 w-4 h-0.5 rounded-full bg-[#E85D04]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. SECONDARY QUICK FILTER PILLS (Zomato 1:1 Parity) & RESULT COUNT */}
      {(list.data?.restaurants?.length ?? 0) > 0 && <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <div className="flex items-center gap-2 shrink-0">
          {/* Filters Button */}
          <button
            type="button"
            className="flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 font-bold transition-all border border-gray-200 bg-white hover:bg-stone-50 text-gray-800 shadow-2xs select-none active:scale-95 cursor-pointer"
          >
            <SlidersHorizontal className="size-3.5 text-gray-600" />
            <span>Filters</span>
            <ChevronDown className="size-3 text-gray-500" />
          </button>

          {/* Near & Fast: Zomato lightning badge */}
          <button
            type="button"
            onClick={() => setFilterFast(!filterFast)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterFast
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500"
                : "bg-white hover:bg-emerald-50/60 text-gray-700 border-gray-200 hover:border-emerald-300"
            )}
          >
            <Zap className={cn("size-3.5", filterFast ? "fill-white text-white" : "text-emerald-600 fill-emerald-600/30")} />
            <span>⚡ Near &amp; Fast</span>
          </button>

          {/* No packaging charges */}
          <button
            type="button"
            onClick={() => setFilterOffers(!filterOffers)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterOffers
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600 shadow-[0_2px_10px_rgba(225,29,72,0.3)] ring-1 ring-rose-500"
                : "bg-white hover:bg-rose-50/60 text-gray-700 border-gray-200 hover:border-rose-300"
            )}
          >
            <span>No packaging charges</span>
          </button>

          {/* Pure Veg Filter: Zomato standard green dot & badge */}
          <button
            type="button"
            onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              dietFilter === "veg"
                ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500"
                : "bg-white hover:bg-emerald-50/60 text-gray-700 border-gray-200 hover:border-emerald-300"
            )}
          >
            <span className="size-2.5 rounded-[2px] border border-emerald-500 flex items-center justify-center bg-white shrink-0">
              <span className="size-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>Pure Veg</span>
          </button>

          {/* Rating 4.0+: Emerald / Teal */}
          <button
            type="button"
            onClick={() => setFilterRating(!filterRating)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterRating
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500"
                : "bg-white hover:bg-emerald-50/60 text-gray-700 border-gray-200 hover:border-emerald-300"
            )}
          >
            <Star className={cn("size-3.5", filterRating ? "fill-white text-white" : "text-emerald-600 fill-emerald-600/30")} />
            <span>Rating 4.0+</span>
          </button>

          {/* Under ₹200: Indigo / Purple */}
          <button
            type="button"
            onClick={() => setFilterBudget(!filterBudget)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterBudget
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white border-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.3)] ring-1 ring-indigo-400"
                : "bg-white hover:bg-purple-50/60 text-gray-700 border-gray-200 hover:border-purple-300"
            )}
          >
            <Coins className={cn("size-3.5", filterBudget ? "text-white" : "text-indigo-600")} />
            <span>Under ₹200</span>
          </button>
        </div>

        {/* Place Count */}
        <span className="text-[11px] font-bold text-orange-950 bg-orange-100/80 border border-orange-200/80 px-2.5 py-1 rounded-full shrink-0">
          {`${filteredRestaurants.length} restaurants found`}
        </span>
      </div>}

      {/* 3. ACTIVE ORDER BANNER (Real Data Only) */}
      {activeOrder && !q && (
        <section aria-label="Active Order">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Live Order in Progress</p>
                <h3 className="font-extrabold text-sm text-gray-900">{activeOrder.restaurantName || "Order"}</h3>
                <p className="text-xs text-emerald-900/80 font-medium capitalize">
                  Status: {(activeOrder.status || "").replace(/_/g, " ").toLowerCase()}
                </p>
              </div>
            </div>
            <Link
              to="/orders/$id"
              params={{ id: activeOrder.id }}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition shadow-sm no-underline"
            >
              Track Order
            </Link>
          </div>
        </section>
      )}

      {/* RECOMMENDED WITH DEALS (1:1 with Zomato Screenshot 1 & 2) */}
      {!q && !isZeroDeliveryInRadius && filteredRestaurants.length > 0 && (
        <section aria-label="Recommended with Deals" className="pt-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2.5">
            RECOMMENDED WITH DEALS
          </h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-none">
            {filteredRestaurants.slice(0, 8).map((r) => {
              const rating = typeof r.ratingAvg === "number" ? r.ratingAvg : Number(r.ratingAvg || 4.2);
              const eta = typeof r.etaMinutes === "number" ? r.etaMinutes : Number(r.etaMinutes || 25);
              return (
                <Link
                  key={r.id}
                  to="/r/$slug"
                  params={{ slug: r.slug || r.id }}
                  className="group flex flex-col shrink-0 w-44 sm:w-52 rounded-2xl bg-white border border-stone-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-orange-500 transition-all no-underline text-left cursor-pointer active:scale-95"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                    <img
                      src={r.coverImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80"}
                      alt={r.name}
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Top Deal Badge (Authentic offers only, zero fake badges) */}
                    {r.hasOffer && r.offerLabel && (
                      <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-xs text-white text-[9.5px] font-black px-2 py-0.5 rounded-md shadow-xs">
                        {r.offerLabel}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-0.5 bg-emerald-800 text-white text-[10.5px] font-black px-1.5 py-0.5 rounded-md">
                        {rating.toFixed(1)} <Star className="size-2.5 fill-white" />
                      </span>
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                      {r.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                      <Zap className="size-3 fill-emerald-600 text-emerald-600" />
                      <span>{eta}-{eta + 5} mins</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4-TILE EXPLORE MORE SECTION (1:1 with Zomato Screenshot 3) */}
      {!q && !isZeroDeliveryInRadius && (
        <section aria-label="Explore More" className="pt-2">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2.5">
            EXPLORE MORE
          </h2>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            <Link
              to="/search"
              search={{ q: "offers" }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group no-underline text-center active:scale-95"
            >
              <div className="size-11 sm:size-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5 group-hover:scale-105 transition-transform">
                <Percent className="size-5 sm:size-6 text-blue-600 stroke-[2.5]" />
              </div>
              <span className="text-xs font-black text-stone-900 leading-tight">Offers</span>
            </Link>

            <button
              type="button"
              onClick={() => setFilterRating(!filterRating)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl bg-white border shadow-2xs hover:shadow-xs transition-all group text-center active:scale-95 cursor-pointer",
                filterRating ? "border-orange-500 ring-1 ring-orange-500" : "border-stone-200/80 hover:border-orange-500"
              )}
            >
              <div className="size-11 sm:size-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#E85D04] mb-1.5 group-hover:scale-105 transition-transform">
                <Star className="size-5 sm:size-6 text-[#E85D04] fill-[#E85D04]/40" />
              </div>
              <span className="text-xs font-black text-stone-900 leading-tight">Top 10</span>
            </button>

            <Link
              to="/travel"
              search={{ tab: "trains" }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:border-sky-400 hover:shadow-xs transition-all group no-underline text-center active:scale-95"
            >
              <div className="size-11 sm:size-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-1.5 group-hover:scale-105 transition-transform">
                <Train className="size-5 sm:size-6 text-sky-600" />
              </div>
              <span className="text-xs font-black text-stone-900 leading-tight">Food on train</span>
            </Link>

            <Link
              to="/search"
              search={{ q: "collections" }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs hover:border-orange-500 hover:shadow-xs transition-all group no-underline text-center active:scale-95"
            >
              <div className="size-11 sm:size-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-1.5 group-hover:scale-105 transition-transform">
                <Utensils className="size-5 sm:size-6 text-orange-600" />
              </div>
              <span className="text-xs font-black text-stone-900 leading-tight">Collections</span>
            </Link>
          </div>
        </section>
      )}

      {/* RESTAURANTS GRID (1:1 with Zomato Screenshot 3) */}
      <section aria-label="Restaurants Grid" className="pt-2">
        {!isZeroDeliveryInRadius && (
          <div className="mb-3 space-y-0.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-500 font-mono">
              {filteredRestaurants.length} RESTAURANTS DELIVERING TO YOU
            </h2>
            <p className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
              Featured
            </p>
          </div>
        )}

        {list.isPending && !list.data ? (
          /* Warm Copper / Sunset Orange Gradient Shimmer Skeletons */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2" aria-busy="true" aria-label="Loading restaurants">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border border-orange-950/10 bg-white shadow-sm flex flex-col relative"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-gradient-to-r from-orange-100/50 via-stone-50 to-orange-100/50 animate-pulse">
                  <div className="absolute top-3 left-3 h-5 w-24 rounded-full bg-orange-200/40" />
                  <div className="absolute bottom-3 right-3 h-6 w-16 rounded-xl bg-orange-200/50" />
                </div>
                <div className="p-4 space-y-3 bg-gradient-to-b from-white to-orange-50/20">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-3/5 rounded-lg bg-gradient-to-r from-orange-200/60 to-orange-100/40 animate-pulse" />
                    <div className="h-5 w-12 rounded-md bg-orange-200/40 animate-pulse" />
                  </div>
                  <div className="h-3.5 w-2/5 rounded-md bg-orange-100/50 animate-pulse" />
                  <div className="pt-2 flex items-center justify-between border-t border-orange-950/5">
                    <div className="h-3 w-28 rounded-md bg-orange-100/40 animate-pulse" />
                    <div className="h-4 w-16 rounded-full bg-orange-200/30 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="space-y-4">
            {list.data && list.data.restaurants.length > 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3 shadow-xs">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 mx-auto">
                  <Utensils className="size-6 text-stone-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">No restaurants match your filters</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">Try resetting your filters or selecting a different dish category.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setFilterFast(false);
                    setFilterRating(false);
                    setFilterOffers(false);
                    setFilterBudget(false);
                  }}
                  className="bg-[#E23744] hover:bg-[#cf2f3c] text-white border-transparent font-bold rounded-xl px-5 py-2 cursor-pointer"
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Sleek Native Delivery Status Bar (Top Competitor Standard) */}
                <div
                  role="status"
                  data-testid="food-availability-note"
                  className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/25 text-orange-950"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#B85D19] via-[#E85D04] to-[#C2410C] text-white shrink-0 shadow-xs">
                      <MapPin className="size-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-black block truncate text-gray-950">
                        {location?.zoneName && !["Current GPS Position", "Current Location"].includes(location.zoneName)
                          ? location.zoneName
                          : location?.cityName && !["Locating...", "Current GPS Position"].includes(location.cityName)
                          ? location.cityName
                          : "Your Location"}
                      </span>
                      <span className="text-[11px] text-gray-600 block truncate font-medium">
                        Food delivery is not available in your location, kindly update your location.
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setLocDialogOpen(true)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#B85D19] via-[#E85D04] to-[#C2410C] hover:brightness-105 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer border-0"
                  >
                    <MapPin className="size-3" />
                    <span>Update Location</span>
                  </Button>
                </div>

                {/* Active KingPay Connected Services */}
                <div className="space-y-3 pt-2">
                  <div className="text-center">
                    <h4 className="text-sm sm:text-base font-black text-gray-950 tracking-tight">
                      Available Services
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5">
                      Book travel, pay bills, or explore courses and jobs.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                    {/* 1. KingPay Wallet */}
                    <Link
                      to="/kingpay"
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(232,93,4,0.18)] hover:border-orange-500 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform">
                          <CreditCard className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-orange-900 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                          UPI
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-[#E85D04] block leading-snug transition-colors">
                          KingPay Wallet
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Direct UPI &amp; Bills
                        </span>
                      </div>
                    </Link>

                    {/* 2. Flights */}
                    <Link
                      to="/travel"
                      search={{ tab: "flights" }}
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.18)] hover:border-sky-400 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-[0_2px_8px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-transform">
                          <Plane className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full">
                          Travel
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-sky-600 block leading-snug transition-colors">
                          Flights
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Domestic &amp; International
                        </span>
                      </div>
                    </Link>

                    {/* 3. Hotels */}
                    <Link
                      to="/travel"
                      search={{ tab: "hotels" }}
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(232,93,4,0.18)] hover:border-orange-500 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#B85D19] via-[#E85D04] to-[#C2410C] text-white shadow-[0_2px_8px_rgba(232,93,4,0.3)] group-hover:scale-105 transition-transform">
                          <Building2 className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-orange-900 bg-orange-50 border border-orange-200/80 px-2 py-0.5 rounded-full">
                          Hotels
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-[#E85D04] block leading-snug transition-colors">
                          Hotels &amp; Stays
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Worldwide Stays
                        </span>
                      </div>
                    </Link>

                    {/* 4. Trains & PNR */}
                    <Link
                      to="/travel"
                      search={{ tab: "trains" }}
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(99,102,241,0.18)] hover:border-indigo-400 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform">
                          <Train className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
                          IRCTC
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-indigo-600 block leading-snug transition-colors">
                          Trains &amp; PNR
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          IRCTC Booking &amp; Status
                        </span>
                      </div>
                    </Link>

                    {/* 5. King AI Tutor */}
                    <Link
                      to="/tutor"
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(20,184,166,0.18)] hover:border-teal-400 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-[0_2px_8px_rgba(20,184,166,0.3)] group-hover:scale-105 transition-transform">
                          <GraduationCap className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-full">
                          Tutor
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-teal-600 block leading-snug transition-colors">
                          King AI Tutor
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Academic Tutor · CBSE &amp; State
                        </span>
                      </div>
                    </Link>

                    {/* 6. King Jobs */}
                    <Link
                      to="/tutor-jobs"
                      className="group flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/90 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(168,85,247,0.18)] hover:border-purple-400 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] no-underline min-h-[116px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-[0_2px_8px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform">
                          <Briefcase className="size-4.5" />
                        </span>
                        <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                          Jobs
                        </span>
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black text-gray-950 group-hover:text-purple-600 block leading-snug transition-colors">
                          King Jobs
                        </span>
                        <span className="text-[10px] text-gray-500 block mt-0.5">
                          Hyperlocal Gigs &amp; Apply
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Honest "Popular Locations" */}
                <div
                  data-testid="flagship-viewing-mode-card"
                  className="rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs text-center space-y-3"
                >
                  <div className="flex items-center justify-center gap-2 text-stone-600">
                    <Eye className="size-4 text-[#E85D04]" />
                    <span className="text-xs font-black uppercase tracking-wider text-orange-900">
                      Explore Hubs
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-gray-950">
                      Popular Locations
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5 font-medium">
                      Explore restaurants and food menus in available service zones.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {ACTIVE_FLAGSHIP_HUBS.map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => {
                          setLocation({
                            label: hub.label,
                            line1: hub.line1,
                            lat: hub.lat,
                            lng: hub.lng,
                            cityId: hub.cityId,
                            cityName: hub.cityName,
                            zoneId: hub.zoneId,
                            zoneName: hub.zoneName,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:border-orange-500 bg-stone-50 hover:bg-orange-50/60 text-xs font-bold text-gray-800 hover:text-orange-950 transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <MapPin className="size-3 text-[#E85D04]" />
                        <span>{hub.cityName} ({hub.zoneName})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {filteredRestaurants.map((restaurant) => (
              <KitchenCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>

      {/* 4. REORDER CAROUSEL (Real Past Orders Only) */}
      {pastOrders.data?.orders && pastOrders.data.orders.length > 0 && !q && (
        <section aria-label="Order Again">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">Order Again</h2>
              <p className="text-xs text-gray-500 font-medium">Order again from restaurants you've tried</p>
            </div>
            <Link to="/orders" className="text-xs font-bold text-[#E23744] hover:underline">
              View all orders
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {pastOrders.data.orders.slice(0, 4).map((o) => (
              <div
                key={o.id}
                className="flex w-64 shrink-0 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{o.restaurantName}</h3>
                    <span className="text-xs font-bold text-gray-700">
                      {formatPaise(o.totalPaise, { locale })}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">{o.itemPreview || "Previous order"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {(() => {
                      try {
                        const d = o.placedAt ? new Date(o.placedAt) : null;
                        return d && !isNaN(d.getTime())
                          ? d.toLocaleDateString(locale, { month: "short", day: "numeric" })
                          : "Recent";
                      } catch {
                        return "Recent";
                      }
                    })()}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleReorder(o.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-[#E23744] hover:text-white px-3 py-1 text-xs font-bold text-gray-800 transition"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Location Selector Dialog */}
      <LocationDialog open={locDialogOpen} onOpenChange={setLocDialogOpen} />
    </div>
  );
}
