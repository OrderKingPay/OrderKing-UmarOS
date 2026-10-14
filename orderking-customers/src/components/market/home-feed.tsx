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
} from "lucide-react";
import { KitchenCard } from "@/components/market/restaurant-card";
import { useBrand, useT } from "@/components/providers";
import { listCategories } from "@/lib/server/catalog";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import { useLocationStore } from "@/lib/stores/location";
import { useCartStore } from "@/lib/stores/cart";
import { useDietStore } from "@/lib/stores/diet";
import type { RestaurantCard } from "@/lib/market-types";
import { cn } from "@/lib/utils";
import { WhatsAppViralBountiesWidget } from "@/components/market/whatsapp-viral-bounties-widget";

// Curated high-resolution categories with distinct gradient colors
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
    name: "Curry",
    slug: "north-indian",
    emoji: "🍛",
    gradient: "from-emerald-400 to-green-500",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Rolls",
    slug: "rolls",
    emoji: "🌯",
    gradient: "from-teal-400 to-cyan-500",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=240&auto=format&fit=crop&q=80",
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
    name: "Desserts",
    slug: "desserts",
    emoji: "🍰",
    gradient: "from-pink-400 to-rose-500",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Cakes",
    slug: "cake",
    emoji: "🎂",
    gradient: "from-fuchsia-400 to-pink-500",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=240&auto=format&fit=crop&q=80",
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
  const cart = useCartStore();
  const navigate = useNavigate();

  // Global reactive diet preference: "all" | "veg"
  const { dietFilter, setDietFilter } = useDietStore();

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
        const curated =
          CURATED_FOOD_CATEGORIES.find(
            (cc) =>
              cc.slug.toLowerCase().includes(c.slug.toLowerCase()) ||
              c.slug.toLowerCase().includes(cc.slug.toLowerCase())
          ) || CURATED_FOOD_CATEGORIES[i % CURATED_FOOD_CATEGORIES.length];
        return {
          id: c.id,
          slug: c.slug,
          name: c.name,
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
      location.zoneId,
      location.lat,
      location.lng,
      q,
      dietFilter,
      openNow,
      selectedCategory,
      lang,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (dietFilter === "veg") params.set("veg", "true");
      if (openNow) params.set("openNow", "true");
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("lat", location.lat.toString());
      params.set("lng", location.lng.toString());
      params.set("zoneId", location.zoneId || "");
      if (lang) params.set("lang", lang);

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch restaurants");
      return (await response.json()) as { restaurants: RestaurantCard[]; deliveryAvailable: boolean; reason?: string };
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
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
    ["PENDING", "PLACED", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "ARRIVED"].includes(
      o.status
    )
  );

  // Filtered and sorted restaurants based on active controls
  const filteredRestaurants = useMemo(() => {
    const raw: RestaurantCard[] = list.data?.restaurants ?? [];
    return raw
      .filter((r) => {
        if (dietFilter === "veg" && !r.vegOnly) return false;
        if (filterRating && (r.ratingAvg ?? 0) < 4.0) return false;
        if (filterOffers && !r.hasOffer) return false;
        if (filterBudget && (r.minOrderPaise ?? 0) > 20000) return false;
        if (filterFast && (r.etaMinutes ?? 35) > 30) return false;
        return true;
      })
      .sort((a, b) => {
        if (filterFast) return (a.etaMinutes ?? 30) - (b.etaMinutes ?? 30);
        if (filterBudget) return (a.minOrderPaise ?? 20000) - (b.minOrderPaise ?? 20000);
        const scoreA = (a.ratingAvg ?? 4.0) * Math.log10(Math.max(10, a.ratingCount ?? 10));
        const scoreB = (b.ratingAvg ?? 4.0) * Math.log10(Math.max(10, b.ratingCount ?? 10));
        return scoreB - scoreA;
      });
  }, [list.data?.restaurants, dietFilter, filterRating, filterOffers, filterBudget, filterFast]);

  return (
    <div className="space-y-5 px-3 py-3 sm:px-4 sm:py-4 bg-[#FCFAF7] text-gray-900">
      {/* 1. ULTRA-LUXURY HORIZONTAL CIRCULAR FOOD CATEGORIES (Distinct Gradient Border & Emoji Labels) */}
      {!q && (
        <section aria-label="Food Categories" className="pt-1">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
                Inspiration for your order
              </h2>
              <p className="text-xs text-gray-500 font-medium">Explore top dishes &amp; restaurants</p>
            </div>
            <Link
              to="/search"
              className="text-xs font-black text-[#E23744] hover:underline flex items-center gap-0.5"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
            {displayCategories.map((c) => {
              const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
              return (
                <button
                  type="button"
                  key={c.slug}
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
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <div className="flex items-center gap-2 shrink-0">
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
        <span className="text-[11px] font-black text-amber-950 bg-amber-100/70 border border-amber-200/60 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
          {filteredRestaurants.length} places
        </span>
      </div>

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
                <h3 className="font-extrabold text-sm text-gray-900">{activeOrder.restaurantName}</h3>
                <p className="text-xs text-emerald-900/80 font-medium capitalize">
                  Status: {activeOrder.status.replace(/_/g, " ").toLowerCase()}
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

      {/* 5. RESTAURANTS GRID: MASSIVE EDGE-TO-EDGE CARDS */}
      <section aria-label="Restaurants Grid" className="pt-2">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-950 tracking-tight">
              {selectedCategory
                ? "Explore this category"
                : dietFilter === "veg"
                ? "Pure vegetarian restaurants"
                : `Restaurants in ${location.cityName || "Your Area"}`}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Explore menus and delivery options in {location.cityName || "your neighborhood"}
            </p>
          </div>
        </div>

        {list.isPending ? (
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
        ) : list.isError ? (
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
          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-white p-6 sm:p-8 text-center space-y-5 shadow-[0_4px_24px_rgba(245,158,11,0.06)]">
            <div className="relative mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-[0_6px_20px_rgba(245,158,11,0.3)]">
              <div className="flex size-[72px] items-center justify-center rounded-[14px] bg-slate-950 text-amber-300">
                <Utensils className="size-8 text-amber-300 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-lg sm:text-xl text-gray-950 tracking-tight">
                {(list.data?.restaurants?.length ?? 0) === 0
                  ? location.cityName && location.cityName !== "Locating..."
                    ? `Restaurants in ${location.cityName} are preparing for upcoming service`
                    : "Select your delivery location to explore menus"
                  : "No restaurants match your active filter"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                {(list.data?.restaurants?.length ?? 0) === 0
                  ? "Switch to a popular food zone below to browse verified restaurant menus and order immediately."
                  : "Try resetting filters to explore all available dining destinations in your area."}
              </p>
            </div>

            {/* Quick 1-Tap Active Culinary Hub City Chips */}
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800/80 bg-amber-100/60 px-3 py-1 rounded-full border border-amber-200/60">
                📍 Popular Culinary Hubs
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {[
                  { city: "Kolkata", area: "Park Street", tag: "Biryani & Kathi Rolls", lat: 22.55, lng: 88.35, cityId: "kolkata", zoneId: "kol-park" },
                  { city: "Bengaluru", area: "Koramangala", tag: "Craft Burgers & Cafes", lat: 12.93, lng: 77.62, cityId: "blr", zoneId: "blr-kor" },
                  { city: "New Delhi", area: "Connaught Place", tag: "Mughlai & Chaat", lat: 28.63, lng: 77.22, cityId: "del", zoneId: "del-cp" },
                  { city: "Mumbai", area: "Bandra West", tag: "Coastal & Street Food", lat: 19.06, lng: 72.83, cityId: "mum", zoneId: "mum-bandra" },
                  { city: "Silchar", area: "Central Silchar", tag: "Bengali & Thalis", lat: 24.83, lng: 92.77, cityId: "silchar", zoneId: "sil-central" },
                ].map((hub) => (
                  <button
                    key={hub.city}
                    type="button"
                    onClick={() => {
                      useLocationStore.getState().setLocation({
                        cityId: hub.cityId,
                        cityName: hub.city,
                        zoneId: hub.zoneId,
                        zoneName: hub.area,
                        label: `${hub.area}, ${hub.city}`,
                        line1: hub.area,
                        lat: hub.lat,
                        lng: hub.lng,
                      });
                      toast.success(`Location set to ${hub.area}, ${hub.city}`);
                    }}
                    className="group flex flex-col items-start px-3.5 py-2 rounded-2xl border border-amber-200/80 bg-white hover:border-amber-500 hover:bg-amber-50/60 transition-all shadow-2xs hover:shadow-xs active:scale-95 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 text-[#E23744] shrink-0" />
                      <span className="text-xs font-black text-gray-900 group-hover:text-[#E23744]">
                        {hub.city}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">({hub.area})</span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-semibold mt-0.5">
                      {hub.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-amber-900/10">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-white border-amber-300 font-black text-xs hover:bg-amber-50 text-gray-900 shadow-2xs"
                onClick={() => {
                  setFilterFast(false);
                  setFilterRating(false);
                  setFilterOffers(false);
                  setFilterBudget(false);
                  setSelectedCategory(null);
                }}
              >
                Reset Filters
              </Button>
              <Link
                to="/travel"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-black text-blue-950 no-underline hover:bg-blue-100 transition shadow-2xs"
              >
                ✈️ Travel 0% Fee
              </Link>
              <Link
                to="/earn"
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-100/80 to-yellow-100/80 px-3.5 py-2 text-xs font-black text-amber-950 no-underline hover:bg-amber-200 transition shadow-2xs"
              >
                👑 24K Gold Crown Rewards
              </Link>
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
                    {new Date(o.placedAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    })}
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

      {/* 2.5. ELEGANT GIFT TREAT TO FRIENDS (Compact WhatsApp Share) */}
      {!q && (
        <section aria-label="Gift Treat to Friends" className="pt-1">
          <WhatsAppViralBountiesWidget source="home_feed" />
        </section>
      )}


    </div>
  );
}
