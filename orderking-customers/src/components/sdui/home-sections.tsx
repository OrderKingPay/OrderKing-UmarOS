import React, { useState, useEffect, useMemo, type ComponentType } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  ChevronRight,
  ChevronDown,
  Crown,
  Sparkles,
  Zap,
  Star,
  Percent,
  Coins,
  RotateCcw,
  Utensils,
  Gift,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  CloudRain,
} from "lucide-react";
import type { LayoutSection } from "@orderking/ui";
import { useCustomization } from "@orderking/ui";
import { CuratedCollections } from "@/components/market/curated-collections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KitchenCard } from "@/components/market/restaurant-card";
import { LocationDialog } from "@/components/market/location-dialog";
import { HomeFeed } from "@/components/market/home-feed";
import { useLocationStore } from "@/lib/stores/location";
import { useDietStore } from "@/lib/stores/diet";
import { useCartStore } from "@/lib/stores/cart";
import { useHomeFilterStore } from "@/lib/stores/home-filter";
import { listCategories } from "@/lib/server/catalog";
import { listMyOrders, reorderItems } from "@/lib/server/orders";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { RestaurantCard } from "@/lib/market-types";

// ============================================================================
// CURATED CATEGORY DEFINITIONS
// ============================================================================

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

// ============================================================================
// 1. SDUI SECTION: LOCATION PICKER (header_location)
// ============================================================================

export function LocationPickerSection({ section }: { section: LayoutSection }) {
  const location = useLocationStore((s) => s.location);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section
      data-sdui-section="location_picker"
      aria-label={section.title || "Delivery Location"}
      className="w-full"
    >
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-yellow-500/10 border border-amber-200/80 p-3 shadow-2xs">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2.5 text-left min-w-0 flex-1 group cursor-pointer"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 border border-amber-300 text-amber-900 group-hover:scale-105 transition-transform shadow-2xs">
            <MapPin className="size-4.5 text-[#E23744]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900/80 leading-none">
              {section.title || "Deliver To"}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-gray-950 truncate">
                {location?.label || location?.cityName || "Select your location"}
              </span>
              <ChevronDown className="size-3.5 text-gray-500 shrink-0 group-hover:text-amber-800 transition-colors" />
            </div>
          </div>
        </button>

        <div className="shrink-0 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-tight text-emerald-800 bg-emerald-100/80 border border-emerald-300/80 px-2 py-0.5 rounded-full shadow-2xs">
            <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Express 25m
          </span>
        </div>
      </div>

      <LocationDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}

// ============================================================================
// 2. SDUI SECTION: SEARCH INPUT (search_bar)
// ============================================================================

export function SearchBarSection({
  section,
  placeholder,
}: {
  section: LayoutSection;
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const resolvedPlaceholder =
    (section.props?.placeholder as string) ||
    placeholder ||
    "Search 'Biryani', 'Pizza', 'Momos'...";

  return (
    <section
      data-sdui-section="search_input"
      aria-label={section.title || "Search"}
      className="w-full"
    >
      <button
        type="button"
        onClick={() => void navigate({ to: "/search" })}
        className="flex h-11 w-full items-center gap-2.5 rounded-2xl border border-amber-300/70 bg-white/90 backdrop-blur-md px-3.5 text-left text-gray-400 shadow-[0_2px_12px_rgba(245,158,11,0.06)] hover:border-amber-400 hover:bg-white transition-all cursor-pointer group active:scale-[0.99]"
      >
        <Search className="size-4 shrink-0 text-amber-600 group-hover:scale-110 transition-transform" />
        <span className="text-xs sm:text-sm font-medium text-gray-600 flex-1 truncate">
          {resolvedPlaceholder}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100/70 border border-amber-200/70 px-2 py-0.5 rounded-full">
          Search
        </span>
      </button>
    </section>
  );
}

// ============================================================================
// 3. SDUI SECTION: BANNER CAROUSEL (promo_carousel)
// ============================================================================

export function BannerCarouselSection({
  section,
  autoplay = true,
  intervalMs = 4500,
}: {
  section: LayoutSection;
  autoplay?: boolean;
  intervalMs?: number;
}) {
  const isAutoplay = Boolean(section.props?.autoplay ?? autoplay);
  const slideInterval = Number(section.props?.intervalMs ?? intervalMs);

  const banners = [
    {
      id: "prestige_offer",
      title: "Prestige Culinary Excellence",
      subtitle: "0% Menu Markups · Direct Chef Pricing",
      tag: "👑 Verified Gastronomy",
      cta: "Explore Kitchens",
      link: "/search",
      gradient: "from-amber-500 via-yellow-400 to-amber-600",
      bgClass: "from-amber-950 via-stone-900 to-amber-950",
      accent: "text-amber-300",
    },
    {
      id: "gold_crown_rewards",
      title: "24K Gold Crown Rewards",
      subtitle: "Earn instant cashback credits on every order",
      tag: "✨ Instant Credits",
      cta: "View Rewards",
      link: "/earn",
      gradient: "from-yellow-400 via-amber-300 to-yellow-500",
      bgClass: "from-slate-950 via-amber-950 to-slate-900",
      accent: "text-amber-200",
    },
    {
      id: "travel_zero_fee",
      title: "Sovereign Travel Booking",
      subtitle: "0% convenience fee on verified flights & trains",
      tag: "✈️ 0% Fee Guarantee",
      cta: "Book Travel",
      link: "/travel",
      gradient: "from-blue-500 via-indigo-500 to-cyan-500",
      bgClass: "from-blue-950 via-slate-900 to-indigo-950",
      accent: "text-blue-300",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isAutoplay) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, slideInterval);
    return () => clearInterval(timer);
  }, [isAutoplay, slideInterval, banners.length]);

  const active = banners[currentIndex] || banners[0];

  return (
    <section
      data-sdui-section="banner_carousel"
      aria-label={section.title || "Special Offers"}
      className="w-full select-none"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-4 sm:p-5 text-white shadow-md transition-all duration-500 bg-gradient-to-br",
          active.bgClass
        )}
      >
        {/* Glow ambient background decoration */}
        <div className="pointer-events-none absolute -right-10 -bottom-10 size-40 rounded-full bg-amber-500/20 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20">
              {active.tag}
            </span>
            <div className="flex gap-1.5">
              {banners.map((b, idx) => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "size-2 rounded-full transition-all cursor-pointer",
                    currentIndex === idx
                      ? "w-5 bg-amber-400"
                      : "bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
              {active.title}
            </h3>
            <p className="text-xs text-stone-300 leading-snug">
              {active.subtitle}
            </p>
          </div>

          <div className="pt-1">
            <Link
              to={active.link}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-sm hover:brightness-105 active:scale-95 transition-all no-underline"
            >
              <span>{active.cta}</span>
              <ArrowRight className="size-3 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 4. SDUI SECTION: CATEGORY GRID (top_categories)
// ============================================================================

export function CategoryGridSection({ section }: { section: LayoutSection }) {
  const { selectedCategory, setSelectedCategory } = useHomeFilterStore();

  const categoriesQuery = useQuery({
    queryKey: ["sdui_categories"],
    queryFn: () => listCategories({ data: { lang: "en" } }),
    staleTime: 1000 * 60 * 15,
    placeholderData: (prev) => prev,
  });

  const displayCategories = useMemo(() => {
    const dbCats = categoriesQuery.data?.categories ?? [];
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
  }, [categoriesQuery.data?.categories]);

  return (
    <section
      data-sdui-section="category_grid"
      aria-label={section.title || "Food Categories"}
      className="w-full pt-1"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-gray-950 tracking-tight">
            {section.title || "Inspiration for your order"}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Explore curated dishes &amp; authentic kitchens
          </p>
        </div>
        <Link
          to="/search"
          className="text-xs font-black text-[#E23744] hover:underline flex items-center gap-0.5"
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
              className="group flex flex-col items-center shrink-0 w-16 sm:w-20 text-center select-none focus:outline-none transition-transform active:scale-95 cursor-pointer"
            >
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

              <span
                className={cn(
                  "mt-1.5 text-xs font-black truncate w-full transition-colors leading-tight",
                  isSelected ? "text-[#E23744]" : "text-gray-900 group-hover:text-black"
                )}
              >
                {c.name}
              </span>

              <span
                className="text-[11px] leading-none mt-0.5 transition-transform group-hover:scale-125"
                aria-hidden
              >
                {c.emoji}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// 5. SDUI SECTION: RESTAURANT FEED (restaurant_list / restaurant_feed)
// ============================================================================

export function RestaurantFeedSection({ section }: { section: LayoutSection }) {
  const location = useLocationStore((s) => s.location);
  const { dietFilter } = useDietStore();
  const cart = useCartStore();
  const navigate = useNavigate();

  const {
    selectedCategory,
    setSelectedCategory,
    filterFast,
    setFilterFast,
    filterRating,
    setFilterRating,
    filterOffers,
    setFilterOffers,
    filterBudget,
    setFilterBudget,
    resetFilters,
  } = useHomeFilterStore();

  // Past orders for reorder
  const pastOrders = useQuery({
    queryKey: ["pastOrders"],
    queryFn: () => listMyOrders(),
    retry: false,
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  // Main restaurant catalog query
  const list = useQuery({
    queryKey: [
      "sdui_restaurants",
      location?.zoneId ?? "",
      location?.lat ?? 0,
      location?.lng ?? 0,
      dietFilter,
      selectedCategory ?? "",
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dietFilter === "veg") params.set("veg", "true");
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("lat", (location?.lat ?? 0).toString());
      params.set("lng", (location?.lng ?? 0).toString());
      params.set("zoneId", location?.zoneId || "");

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch restaurants: HTTP ${response.status}`);
      }
      const data = await response.json();
      return {
        restaurants: Array.isArray(data?.restaurants)
          ? (data.restaurants as RestaurantCard[])
          : [],
      };
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });

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
    o &&
    o.status &&
    [
      "PENDING",
      "PLACED",
      "CONFIRMED",
      "PREPARING",
      "READY_FOR_PICKUP",
      "OUT_FOR_DELIVERY",
      "ARRIVED",
    ].includes(o.status)
  );

  const filteredRestaurants = useMemo(() => {
    const raw: RestaurantCard[] = list.data?.restaurants ?? [];
    return raw
      .filter((r) => {
        if (!r) return false;
        if (dietFilter === "veg" && !r.vegOnly) return false;
        const rating =
          typeof r.ratingAvg === "number" ? r.ratingAvg : Number(r.ratingAvg || 0);
        if (filterRating && rating < 4.0) return false;
        if (filterOffers && !r.hasOffer) return false;
        const minOrder =
          typeof r.minOrderPaise === "number" ? r.minOrderPaise : Number(r.minOrderPaise || 0);
        if (filterBudget && minOrder > 20000) return false;
        const eta =
          typeof r.etaMinutes === "number" ? r.etaMinutes : Number(r.etaMinutes || 35);
        if (filterFast && eta > 30) return false;
        return true;
      })
      .sort((a, b) => {
        const ratingA =
          typeof a.ratingAvg === "number" ? a.ratingAvg : Number(a.ratingAvg || 4.0);
        const ratingB =
          typeof b.ratingAvg === "number" ? b.ratingAvg : Number(b.ratingAvg || 4.0);
        return ratingB - ratingA;
      });
  }, [list.data?.restaurants, dietFilter, filterRating, filterOffers, filterBudget, filterFast]);

  return (
    <section
      data-sdui-section="restaurant_feed"
      aria-label={section.title || "Restaurants"}
      className="w-full space-y-4 pt-1"
    >
      {/* Quick Filter Controls */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setFilterFast(!filterFast)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterFast
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-500"
                : "bg-white hover:bg-amber-50/60 text-gray-700 border-gray-200"
            )}
          >
            <Zap className={cn("size-3.5", filterFast ? "fill-white text-white" : "text-amber-500")} />
            <span>Fast Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterRating(!filterRating)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterRating
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600"
                : "bg-white hover:bg-emerald-50/60 text-gray-700 border-gray-200"
            )}
          >
            <Star className={cn("size-3.5", filterRating ? "fill-white text-white" : "text-emerald-600")} />
            <span>Rating 4.0+</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterOffers(!filterOffers)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterOffers
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600"
                : "bg-white hover:bg-rose-50/60 text-gray-700 border-gray-200"
            )}
          >
            <Percent className={cn("size-3.5", filterOffers ? "text-white" : "text-rose-600")} />
            <span>Great Offers</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterBudget(!filterBudget)}
            className={cn(
              "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95 cursor-pointer",
              filterBudget
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 text-white border-indigo-600"
                : "bg-white hover:bg-purple-50/60 text-gray-700 border-gray-200"
            )}
          >
            <Coins className={cn("size-3.5", filterBudget ? "text-white" : "text-indigo-600")} />
            <span>Under ₹200</span>
          </button>
        </div>

        <span className="text-[11px] font-black text-amber-950 bg-amber-100/70 border border-amber-200/60 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
          {filteredRestaurants.length} places
        </span>
      </div>

      {/* Live Active Order Banner */}
      {activeOrder && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-600"></span>
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Live Order in Progress
              </p>
              <h3 className="font-extrabold text-sm text-gray-900">
                {activeOrder.restaurantName || "Order"}
              </h3>
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
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-950 tracking-tight">
            {selectedCategory
              ? "Explore this category"
              : section.title || `Restaurants in ${location?.cityName || "Your Area"}`}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Verified kitchens &amp; chef-prepared delicacies
          </p>
        </div>
      </div>

      {/* Grid or Empty/Loading State */}
      {list.isPending && !list.data ? (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-amber-900/10 bg-white p-4 space-y-3 animate-pulse"
            >
              <div className="aspect-[16/10] w-full rounded-xl bg-amber-100/70" />
              <div className="h-5 w-3/5 rounded-md bg-amber-200/60" />
              <div className="h-4 w-2/5 rounded-md bg-amber-100/80" />
            </div>
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-white p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Utensils className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-base sm:text-lg text-gray-950">
              No restaurants matching active filter
            </h3>
            <p className="text-xs text-gray-600">
              Try resetting filters to explore dining destinations in your area.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="bg-white border-amber-300 font-bold text-xs"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
          {filteredRestaurants.map((restaurant) => (
            <KitchenCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}

      {/* Reorder past items if available */}
      {pastOrders.data?.orders && pastOrders.data.orders.length > 0 && (
        <div className="pt-3">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight">
              Order Again
            </h3>
            <Link to="/orders" className="text-xs font-bold text-[#E23744] hover:underline">
              View all orders
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {pastOrders.data.orders.slice(0, 3).map((o) => (
              <div
                key={o.id}
                className="flex w-64 shrink-0 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm"
              >
                <div>
                  <h4 className="line-clamp-1 text-sm font-bold text-gray-900">
                    {o.restaurantName}
                  </h4>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                    {o.itemPreview || "Previous order"}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-xs font-bold text-gray-700">
                    {formatPaise(o.totalPaise, { locale: "en-IN" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleReorder(o.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 hover:bg-[#E23744] hover:text-white px-3 py-1 text-xs font-bold text-gray-800 transition cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 6. COMPREHENSIVE FEED & FALLBACK SECTIONS
// ============================================================================

export function MonsoonSurgeBannerSection() {
  const customization = useCustomization();
  const isRainSurge = Boolean(
    (customization?.payoutPolicy as any)?.monsoonSurgePaise > 0 ||
    (customization?.payoutPolicy as any)?.rainSurgeBonusPaise > 0 ||
    (customization?.logistics as any)?.rainSurgeActive ||
    (customization?.state as any)?.features?.rainSurgeActive ||
    customization?.isFeatureEnabled?.("rain_surge") ||
    customization?.isFeatureEnabled?.("monsoon_mode")
  );

  if (!isRainSurge) return null;

  return (
    <div className="rounded-2xl border border-sky-400/50 bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-indigo-500/20 p-4 text-sky-950 dark:text-sky-100 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-300 text-xl font-bold">
          🌧️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-black text-sky-950 dark:text-sky-100">
              Monsoon Rain Surge Active
            </span>
            <span className="rounded-full bg-sky-500/30 border border-sky-400/40 px-2 py-0.5 text-[9px] font-black uppercase text-sky-900 dark:text-sky-200">
              Priority Dispatch
            </span>
          </div>
          <p className="text-xs text-sky-800/90 dark:text-sky-300/90 mt-0.5">
            Heavy rainfall active in your area. Deliveries are compensated with monsoon hazard bonuses.
          </p>
        </div>
      </div>
      <CloudRain className="size-6 text-sky-500 shrink-0 hidden sm:block animate-bounce" />
    </div>
  );
}

export function CuratedCollectionsSection({ section }: { section?: LayoutSection }) {
  return <CuratedCollections className="py-2" />;
}

export function HomeFeedSection() {
  return <HomeFeed />;
}

export function HomeSectionFallback({ section }: { section: LayoutSection }) {
  return (
    <div
      data-sdui-section={section.type}
      className="rounded-2xl border border-dashed border-amber-200 p-4 text-center text-xs text-gray-500"
    >
      <span>{section.title || `Section: ${section.type}`}</span>
    </div>
  );
}

// ============================================================================
// 7. CANONICAL HOME SDUI SECTION REGISTRY
// ============================================================================

export const homeSectionRegistry: Record<string, ComponentType<any>> = {
  location_picker: LocationPickerSection,
  search_input: SearchBarSection,
  banner_carousel: BannerCarouselSection,
  category_grid: CategoryGridSection,
  restaurant_feed: RestaurantFeedSection,
  restaurant_list: RestaurantFeedSection,
  home_feed: HomeFeedSection,
  curated_collections: CuratedCollectionsSection,
  monsoon_surge_banner: MonsoonSurgeBannerSection,
};
