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
import type { RestaurantCard } from "@/lib/market-types";
import { cn } from "@/lib/utils";

// Curated high-resolution categories for Zomato-parity "Inspiration for your first order"
const CURATED_FOOD_CATEGORIES = [
  {
    name: "Biryani",
    slug: "biryani",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Pizza",
    slug: "pizza",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Thali",
    slug: "thali",
    imageUrl: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Burgers",
    slug: "burger",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Curry",
    slug: "north-indian",
    imageUrl: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Rolls",
    slug: "rolls",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Chinese",
    slug: "chinese",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "South Indian",
    slug: "south-indian",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Desserts",
    slug: "desserts",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=240&auto=format&fit=crop&q=80",
  },
  {
    name: "Cakes",
    slug: "cake",
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

  // Diet switch state: "all" | "veg" | "non-veg"
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">(veg ? "veg" : "all");

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
  });

  // Database categories
  const cats = useQuery({
    queryKey: ["categories", lang],
    queryFn: () => listCategories({ data: { lang } }),
  });

  // Display categories: DB categories merged with curated fallback items
  const displayCategories = useMemo(() => {
    const dbCats = cats.data?.categories ?? [];
    if (dbCats.length > 0) {
      return dbCats.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        imageUrl:
          c.imageUrl ||
          CURATED_FOOD_CATEGORIES.find((cc) => cc.slug.toLowerCase().includes(c.slug.toLowerCase()))
            ?.imageUrl ||
          CURATED_FOOD_CATEGORIES[0].imageUrl,
      }));
    }
    return CURATED_FOOD_CATEGORIES.map((c, i) => ({
      id: `cat-${i}`,
      slug: c.slug,
      name: c.name,
      imageUrl: c.imageUrl,
    }));
  }, [cats.data?.categories]);

  // Main restaurant catalog query
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
      return (await response.json()) as { restaurants: RestaurantCard[] };
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
        if (dietFilter === "non-veg" && r.vegOnly) return false;
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
    <div className="space-y-5 px-3 py-3 sm:px-4 sm:py-4 bg-white text-gray-900">
      {/* 1. SLIDING VEG / NON-VEG SWITCH & QUICK FILTER BAR */}
      <div className="sticky top-[4.5rem] z-30 bg-white/95 backdrop-blur-md -mx-3 px-3 py-2 border-b border-gray-100 flex flex-col gap-2.5 sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          {/* Sliding Segmented Pill Switch */}
          <div className="inline-flex items-center rounded-full bg-gray-100 p-1 border border-gray-200 shadow-xs relative">
            {/* Option: All */}
            <button
              type="button"
              onClick={() => setDietFilter("all")}
              className={cn(
                "relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors select-none",
                dietFilter === "all" ? "text-gray-900" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {dietFilter === "all" && (
                <motion.div
                  layoutId="diet-pill-active"
                  className="absolute inset-0 rounded-full bg-white shadow-sm border border-gray-200/80 -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              All
            </button>

            {/* Option: Veg Only */}
            <button
              type="button"
              onClick={() => setDietFilter("veg")}
              className={cn(
                "relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 select-none",
                dietFilter === "veg" ? "text-emerald-700" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {dietFilter === "veg" && (
                <motion.div
                  layoutId="diet-pill-active"
                  className="absolute inset-0 rounded-full bg-white shadow-sm border border-emerald-200 -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="size-3.5 rounded-xs border border-emerald-600 flex items-center justify-center p-0.5 bg-white">
                <span className="size-1.5 rounded-full bg-emerald-600" />
              </span>
              <span>Veg</span>
            </button>

            {/* Option: Non-Veg */}
            <button
              type="button"
              onClick={() => setDietFilter("non-veg")}
              className={cn(
                "relative z-10 px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 select-none",
                dietFilter === "non-veg" ? "text-rose-700" : "text-gray-500 hover:text-gray-800"
              )}
            >
              {dietFilter === "non-veg" && (
                <motion.div
                  layoutId="diet-pill-active"
                  className="absolute inset-0 rounded-full bg-white shadow-sm border border-rose-200 -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="size-3.5 rounded-xs border border-rose-600 flex items-center justify-center p-0.5 bg-white">
                <span className="size-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-rose-600" />
              </span>
              <span>Non-Veg</span>
            </button>
          </div>

          {/* Result Count Indicator */}
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {filteredRestaurants.length} places
          </span>
        </div>

        {/* Secondary Quick Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setFilterFast(!filterFast)}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 font-bold transition-all border shadow-xs select-none",
              filterFast
                ? "bg-[#E23744] text-white border-[#E23744]"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            <Zap className={cn("size-3.5", filterFast ? "fill-white text-white" : "text-[#E23744]")} />
            <span>Fast Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterRating(!filterRating)}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 font-bold transition-all border shadow-xs select-none",
              filterRating
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            <Star className={cn("size-3.5", filterRating ? "fill-white text-white" : "text-amber-500 fill-amber-500")} />
            <span>Rating 4.0+</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterOffers(!filterOffers)}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 font-bold transition-all border shadow-xs select-none",
              filterOffers
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            <Percent className={cn("size-3.5", filterOffers ? "text-white" : "text-blue-600")} />
            <span>Great Offers</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterBudget(!filterBudget)}
            className={cn(
              "flex items-center gap-1 shrink-0 rounded-full px-3 py-1.5 font-bold transition-all border shadow-xs select-none",
              filterBudget
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
            )}
          >
            <Coins className={cn("size-3.5", filterBudget ? "text-white" : "text-gray-600")} />
            <span>Under ₹200</span>
          </button>
        </div>
      </div>

      {/* 2. ZOMATO HORIZONTAL CIRCULAR FOOD CATEGORIES ("Eat what makes you happy") */}
      {!q && (
        <section aria-label="Food Categories" className="pt-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                Inspiration for your first order
              </h2>
              <p className="text-xs text-gray-500 font-medium">Explore popular dishes and cuisines</p>
            </div>
            <Link
              to="/search"
              className="text-xs font-bold text-[#E23744] hover:underline flex items-center gap-0.5"
            >
              See all <ChevronRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
            {displayCategories.map((c) => {
              const isSelected = selectedCategory === c.id || selectedCategory === c.slug;
              return (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => setSelectedCategory(isSelected ? null : c.id || c.slug)}
                  className="group flex flex-col items-center shrink-0 w-18 sm:w-20 text-center select-none focus:outline-none"
                >
                  <div
                    className={cn(
                      "size-18 sm:size-20 rounded-full overflow-hidden border-2 p-0.5 transition-all duration-300 shadow-sm",
                      isSelected
                        ? "border-[#E23744] ring-2 ring-[#E23744]/20 scale-105"
                        : "border-gray-200 group-hover:border-gray-300 group-hover:scale-105"
                    )}
                  >
                    <img
                      src={c.imageUrl}
                      alt={c.name}
                      className="size-full object-cover rounded-full transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={cn(
                      "mt-1.5 text-xs font-bold truncate w-full transition-colors",
                      isSelected ? "text-[#E23744]" : "text-gray-800 group-hover:text-black"
                    )}
                  >
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

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

      {/* 4. REORDER CAROUSEL (Real Past Orders Only) */}
      {pastOrders.data?.orders && pastOrders.data.orders.length > 0 && !q && (
        <section aria-label="Order Again">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">Order Again</h2>
              <p className="text-xs text-gray-500 font-medium">From your past favorite kitchens</p>
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
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">{o.itemPreview || "Past culinary order"}</p>
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

      {/* 5. RESTAURANTS GRID: MASSIVE EDGE-TO-EDGE CARDS */}
      <section aria-label="Restaurants Grid" className="pt-2">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
              {selectedCategory
                ? "Category Selections"
                : dietFilter === "veg"
                ? "Pure Vegetarian Restaurants"
                : dietFilter === "non-veg"
                ? "Non-Veg Specialty Kitchens"
                : "Restaurants delivering to your area"}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Real-time available restaurants matching your preferences
            </p>
          </div>
        </div>

        {list.isPending ? (
          /* High-Contrast Light Mode Skeletons */
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-white shadow-sm flex flex-col"
              >
                <div className="aspect-[16/10] sm:aspect-[16/9] w-full bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 w-2/3 bg-gray-200 rounded-md animate-pulse" />
                  <div className="h-4 w-1/3 bg-gray-100 rounded-md animate-pulse" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-md animate-pulse pt-2" />
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
              className="mt-3 bg-white text-gray-900"
              onClick={() => void list.refetch()}
            >
              Try Again
            </Button>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center space-y-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-sm text-2xl mx-auto">
              🍽️
            </div>
            <h3 className="font-extrabold text-base text-gray-900">No restaurants match your filters</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Try switching back to 'All Foods' or clearing your filter selection to view more available kitchens.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white border-gray-300 font-bold"
              onClick={() => {
                setDietFilter("all");
                setFilterFast(false);
                setFilterRating(false);
                setFilterOffers(false);
                setFilterBudget(false);
                setSelectedCategory(null);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {filteredRestaurants.map((restaurant) => (
              <KitchenCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
