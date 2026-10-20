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
  Store,
  ExternalLink,
} from "lucide-react";
import { KitchenCard } from "@/components/market/restaurant-card";
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
    name: "Biryani",
    slug: "biryani",
    emoji: "🍚",
    gradient: "from-orange-400 to-amber-500",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Pizza",
    slug: "pizza",
    emoji: "🍕",
    gradient: "from-red-400 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Rolls",
    slug: "rolls",
    emoji: "🌯",
    gradient: "from-teal-400 to-cyan-500",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Thali",
    slug: "thali",
    emoji: "🍽️",
    gradient: "from-amber-400 to-yellow-500",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Burgers",
    slug: "burger",
    emoji: "🍔",
    gradient: "from-yellow-400 to-orange-500",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Desserts",
    slug: "desserts",
    emoji: "🍰",
    gradient: "from-pink-400 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Curry",
    slug: "north-indian",
    emoji: "🍛",
    gradient: "from-emerald-400 to-green-500",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Chinese",
    slug: "chinese",
    emoji: "🥡",
    gradient: "from-sky-400 to-blue-500",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "South Indian",
    slug: "south-indian",
    emoji: "🫓",
    gradient: "from-purple-400 to-violet-500",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Cakes",
    slug: "cake",
    emoji: "🎂",
    gradient: "from-fuchsia-400 to-pink-500",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=240&auto=format&fit=crop&q=80",
  },
];

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
    highlight: "Saravanaa Bhavan, Karim's, Wenger's and more",
    gradient: "from-amber-500 to-orange-500",
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
    highlight: "Sovereign Assam Core 15km Zone",
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
          id: c.id || `db-cat-${i}`,
          slug: c.slug || `cat-${i}`,
          name: c.name || "Category",
          emoji: curated.emoji,
          gradient: curated.gradient,
          imageUrl: c.imageUrl || curated.imageUrl,
        };
      });
    }
    return CURATED_FOOD_CATEGORIES.map((c, i) => ({
      id: `cat-${i}`,
      slug: c.slug,
      name: c.name,
      emoji: c.emoji,
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
    const raw: RestaurantCard[] =
      list.data?.restaurants && list.data.restaurants.length > 0
        ? list.data.restaurants
        : [];

    const matched = raw
      .filter((r) => {
        if (!r) return false;
        if (dietFilter === "veg" && !r.vegOnly) return false;
        if (selectedCategory) {
          const s = selectedCategory.toLowerCase();
          const matchCat =
            (r.cuisineSummary && r.cuisineSummary.toLowerCase().includes(s)) ||
            r.name.toLowerCase().includes(s) ||
            r.slug.toLowerCase().includes(s);
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
        if (filterBudget && minOrder > 20000) return false;
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
    <div className="space-y-4 px-3 py-2 sm:px-4 sm:py-3 bg-[#FCFAF7] text-gray-900">
      {/* 1. HORIZONTAL CIRCULAR FOOD CATEGORIES */}
      {!q && list.data?.deliveryAvailable !== false && (
        <section aria-label="Food Categories" className="pt-0.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-950 tracking-tight">
              Explore food
            </h2>
            <Link
              to="/search"
              className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-0.5"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
            {displayCategories.map((c, i) => {
              const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
              return (
                <button
                  type="button"
                  key={c.id || c.slug || `cat-${i}`}
                  onClick={() => setSelectedCategory(isSelected ? null : c.id || c.slug)}
                  className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center select-none focus:outline-none transition-transform active:scale-95"
                >
                  {/* Distinct gradient colored ring around image */}
                  <div
                    className={cn(
                      "size-16 sm:size-20 rounded-full p-[2.5px] bg-gradient-to-tr transition-all duration-300 shadow-sm relative",
                      c.gradient,
                      isSelected
                        ? "scale-105 ring-3 ring-amber-400 shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
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
                      isSelected ? "text-[#E23744]" : "text-gray-900 group-hover:text-black"
                    )}
                  >
                    {c.name}
                  </span>

                  {/* Emoji Label below name */}
                  <span className="text-[11px] leading-none mt-0.5 transition-transform group-hover:scale-125" aria-hidden>
                    {c.emoji}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. SECONDARY QUICK FILTER PILLS (Distinct Color Background when active) & RESULT COUNT */}
      {(list.data?.restaurants?.length ?? 0) > 0 && <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <div className="flex items-center gap-2 shrink-0">
          {/* Pure Veg Filter: Zomato standard green dot & badge */}
          <button
            type="button"
            onClick={() => setDietFilter(dietFilter === "veg" ? "all" : "veg")}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
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
          {/* Fast Delivery: Amber / Orange */}
          <button
            type="button"
            onClick={() => setFilterFast(!filterFast)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
              filterFast
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.3)] ring-1 ring-amber-400"
                : "bg-white hover:bg-amber-50/60 text-gray-700 border-gray-200 hover:border-amber-300"
            )}
          >
            <Zap className={cn("size-3.5", filterFast ? "fill-white text-white" : "text-amber-500")} />
            <span>Fast Delivery</span>
          </button>

          {/* Rating 4.0+: Emerald / Teal */}
          <button
            type="button"
            onClick={() => setFilterRating(!filterRating)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
              filterRating
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500"
                : "bg-white hover:bg-emerald-50/60 text-gray-700 border-gray-200 hover:border-emerald-300"
            )}
          >
            <Star className={cn("size-3.5", filterRating ? "fill-white text-white" : "text-emerald-600 fill-emerald-600/30")} />
            <span>Rating 4.0+</span>
          </button>

          {/* Great Offers: Rose / Crimson */}
          <button
            type="button"
            onClick={() => setFilterOffers(!filterOffers)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
              filterOffers
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600 shadow-[0_2px_10px_rgba(225,29,72,0.3)] ring-1 ring-rose-500"
                : "bg-white hover:bg-rose-50/60 text-gray-700 border-gray-200 hover:border-rose-300"
            )}
          >
            <Percent className={cn("size-3.5", filterOffers ? "text-white" : "text-rose-600")} />
            <span>Great Offers</span>
          </button>

          {/* Under ₹200: Indigo / Purple */}
          <button
            type="button"
            onClick={() => setFilterBudget(!filterBudget)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
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
        <span className="text-[11px] font-bold text-amber-950 bg-amber-100/70 border border-amber-200/60 px-2.5 py-1 rounded-full shrink-0">
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

      {/* Restaurant menu transparency banner */}
      {!q && list.data?.deliveryAvailable !== false && (
        <section aria-label="Restaurant menu transparency" className="pt-0.5">
          <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs">
                <Percent className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs sm:text-sm text-emerald-950 tracking-tight">
                    Explore local restaurant menus
                  </span>
                  <span className="inline-flex items-center rounded-full bg-emerald-200/80 text-emerald-950 font-black text-[10px] px-2 py-0.5 border border-emerald-300/60">
                    Compare final checkout prices
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 font-medium leading-tight">
                  Menus and delivery availability depend on participating restaurants. Review all fees and the final total before paying.
                </p>
              </div>
            </div>
            <div className="shrink-0 self-end sm:self-auto">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-white/90 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-2xs">
                <Sparkles className="size-3 text-emerald-600" />
                See Menu Prices
              </span>
            </div>
          </div>
        </section>
      )}

      {/* RESTAURANTS GRID */}
      <section aria-label="Restaurants Grid" className="pt-1">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
            {!isDeliveryActive
              ? `Services in ${location?.zoneName || (location?.cityName && location.cityName !== "Locating..." ? location.cityName : "your area")}`
              : selectedCategory
              ? "Filtered restaurants"
              : dietFilter === "veg"
              ? "Pure vegetarian restaurants"
              : `Restaurants in ${location?.zoneName || (location?.cityName && location.cityName !== "Locating..." ? location.cityName : "your area")}`}
          </h2>
        </div>

        {list.isPending && !list.data ? (
          /* Warm Ivory/Amber Gradient Shimmer Skeletons */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2" aria-busy="true" aria-label="Loading restaurants">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-900/10 bg-white shadow-sm flex flex-col relative"
              >
                <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-gradient-to-r from-amber-100/70 via-amber-50 to-amber-100/70 animate-pulse">
                  <div className="absolute top-3 left-3 h-5 w-24 rounded-full bg-amber-200/60" />
                  <div className="absolute bottom-3 right-3 h-6 w-16 rounded-xl bg-amber-200/70" />
                </div>
                <div className="p-4 space-y-3 bg-gradient-to-b from-white to-amber-50/30">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-3/5 rounded-lg bg-gradient-to-r from-amber-200/80 to-amber-100 animate-pulse" />
                    <div className="h-5 w-12 rounded-md bg-amber-200/60 animate-pulse" />
                  </div>
                  <div className="h-3.5 w-2/5 rounded-md bg-amber-100/80 animate-pulse" />
                  <div className="pt-2 flex items-center justify-between border-t border-amber-900/5">
                    <div className="h-3 w-28 rounded-md bg-amber-100/70 animate-pulse" />
                    <div className="h-4 w-16 rounded-full bg-amber-200/50 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : list.isError && !list.data ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">Unable to load restaurants right now</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 bg-white text-gray-900 border-red-200 hover:bg-red-100"
              onClick={() => void list.refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="space-y-4">
            {list.data && list.data.restaurants.length > 0 && (
              <div className="rounded-2xl border border-amber-200/80 bg-white p-6 text-center space-y-3 shadow-sm">
                <Utensils className="size-8 text-amber-500 mx-auto" />
                <h3 className="font-extrabold text-gray-900 text-base">No restaurants match your current filters</h3>
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
                  className="bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold"
                >
                  Reset Filters
                </Button>
              </div>
            )}
            {/* Active Hyperlocal Discovery & Flagship Hub Switcher (Zero Blank Dead-Ends) */}
            <div
              role="status"
              data-testid="food-availability-note"
              className="rounded-3xl border border-amber-200/90 bg-gradient-to-b from-white via-amber-50/25 to-white p-5 sm:p-6 text-left shadow-sm space-y-5"
            >
              {/* Header and status notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
                      <Sparkles className="size-3 text-amber-600" />
                      Active Hub Discovery
                    </span>
                    {!isDeliveryActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                        Outside Delivery Radius
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
                    {!isDeliveryActive || list.data?.deliveryAvailable === false
                      ? "Food delivery is not currently available at this address."
                      : "No restaurants match your criteria at this address."}
                  </h3>
                  <p className="text-xs text-stone-600 max-w-xl">
                    Browse live restaurants, authentic menus, and real-time ordering by switching to one of our active flagship culinary hubs below:
                  </p>
                </div>
              </div>

              {/* 1-Click Active Flagship Hubs */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-red-500" />
                    1-Click Active Flagship Hubs
                  </p>
                  <span className="text-[10px] text-stone-500 font-medium">Instant Menu Reload</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ACTIVE_FLAGSHIP_HUBS.map((hub) => {
                    const isSelected =
                      location?.zoneId === hub.zoneId ||
                      (location?.cityId === hub.cityId && Math.abs(location.lat - hub.lat) < 0.05);

                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => {
                          setLocation({
                            cityId: hub.cityId,
                            cityName: hub.cityName,
                            zoneId: hub.zoneId,
                            zoneName: hub.zoneName,
                            label: hub.label,
                            line1: hub.line1,
                            lat: hub.lat,
                            lng: hub.lng,
                          });
                          toast.success(`Switched to ${hub.name} (${hub.flagshipLabel})`);
                        }}
                        className={cn(
                          "group relative flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 active:scale-[0.98] cursor-pointer",
                          isSelected
                            ? "border-[#E23744] bg-red-50/50 shadow-sm ring-1 ring-[#E23744]/20"
                            : "border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50/40 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr text-white shadow-xs transition-transform group-hover:scale-105",
                              hub.gradient
                            )}
                          >
                            <MapPin className="size-4" />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-gray-950 truncate">
                                {hub.name}
                              </span>
                              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                                {hub.flagshipLabel}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 font-medium truncate">
                              {hub.description}
                            </p>
                            <p className="text-[10px] text-amber-700 font-bold truncate">
                              ⭐ {hub.highlight}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 pt-1">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-colors",
                              isSelected
                                ? "bg-[#E23744] text-white"
                                : "bg-stone-100 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-900"
                            )}
                          >
                            {isSelected ? "Active" : "Switch"}
                            <ChevronRight className="size-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prominent Restaurant Owner Onboarding Banner (0% Commission) */}
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 p-4 sm:p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200">
                    <Store className="size-3" />
                    Direct Merchant Network
                  </div>
                  <h4 className="text-sm sm:text-base font-black tracking-tight text-white">
                    Restaurant Owner? Onboard your kitchen in 60 seconds (0% commission)
                  </h4>
                  <p className="text-xs text-white/90 max-w-lg leading-relaxed">
                    Expand your reach with OrderKing's zero-commission hyperlocal food network. Instant digital KYC, live catalog listing, and automated delivery dispatch.
                  </p>
                </div>
                <a
                  href="https://partners.orderkingpay.com/onboarding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-white hover:bg-stone-100 text-gray-950 px-4 py-2.5 text-xs font-black transition-all shadow-sm hover:shadow active:scale-95 no-underline"
                >
                  <span>Onboard Kitchen in 60s</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>
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

    </div>
  );
}
