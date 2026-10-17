import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Mic,
  X,
  Clock,
  Flame,
  Trash2,
  Utensils,
  Store,
  Star,
  Zap,
  Percent,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  MapPin,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/market/shell";
import { CartConflictModal } from "@/components/market/cart-conflict-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { KitchenCard } from "@/components/market/restaurant-card";
import { VoiceSearchDialog } from "@/components/market/voice-search-dialog";
import { useT } from "@/components/providers";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCartStore, cartCount } from "@/lib/stores/cart";
import { useLocationStore } from "@/lib/stores/location";
import {
  TRENDING_SEARCHES,
  TOP_CUISINES,
  CURATED_DISHES,
  CURATED_RESTAURANTS,
  RECENT_SEARCHES_KEY,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  highlightMatches,
  cleanSearchQuery,
  getPredictiveSuggestions,
  filterDishes,
  filterRestaurants,
  addDishToCart,
  replaceAndAddDishToCart,
  useDebounceValue,
  type SearchDishItem,
  type SearchFilterState,
  type PredictiveSuggestion,
} from "@/lib/predictive-search";
import type { RestaurantCard } from "@/lib/market-types";

type SearchParams = {
  q?: string;
  tab?: "dishes" | "restaurants";
  veg?: boolean;
  rating4Plus?: boolean;
  fast?: boolean;
  offers?: boolean;
  category?: string;
  openNow?: boolean;
};

export const Route = createFileRoute("/search")({
  validateSearch: (raw: Record<string, unknown>): SearchParams => ({
    q: typeof raw.q === "string" ? raw.q : "",
    tab: raw.tab === "restaurants" ? "restaurants" : "dishes",
    veg: raw.veg === true || raw.veg === "true",
    rating4Plus: raw.rating4Plus === true || raw.rating4Plus === "true",
    fast: raw.fast === true || raw.fast === "true",
    offers: raw.offers === true || raw.offers === "true",
    category: typeof raw.category === "string" ? raw.category : undefined,
    openNow: raw.openNow === true || raw.openNow === "true",
  }),
  component: PredictiveSearchPage,
});

function PredictiveSearchPage() {
  const { t, lang } = useT();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const location = useLocationStore((s) => s.location);

  // Cart Store hooks
  const cartItems = useCartStore((s) => s.items);
  const cartRestaurantName = useCartStore((s) => s.restaurantName);
  const totalCartCount = cartCount(cartItems);

  // Local state
  const [draft, setDraft] = useState(search.q ?? "");
  const [activeTab, setActiveTab] = useState<"dishes" | "restaurants">(search.tab ?? "dishes");
  const [isFocused, setIsFocused] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [replaceModalItem, setReplaceModalItem] = useState<SearchDishItem | null>(null);

  // 150ms debounced search query
  const debouncedDraft = useDebounceValue(draft, 150);

  // Quick Filters state
  const [filterVeg, setFilterVeg] = useState(Boolean(search.veg));
  const [filterRating4Plus, setFilterRating4Plus] = useState(Boolean(search.rating4Plus));
  const [filterFast, setFilterFast] = useState(Boolean(search.fast || search.openNow));
  const [filterOffers, setFilterOffers] = useState(Boolean(search.offers));

  const filterState: SearchFilterState = useMemo(
    () => ({
      veg: filterVeg,
      rating4Plus: filterRating4Plus,
      fastDelivery: filterFast,
      greatOffers: filterOffers,
    }),
    [filterVeg, filterRating4Plus, filterFast, filterOffers],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Sync draft if route q changes externally
  useEffect(() => {
    if (search.q !== undefined && search.q !== draft) {
      setDraft(search.q);
    }
  }, [search.q]);

  // Click outside to close auto-suggest dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch backend search results (with fallback to curated catalog)
  const searchQuery = useQuery({
    queryKey: [
      "predictive-search-api",
      debouncedDraft,
      filterVeg,
      filterRating4Plus,
      filterFast,
      filterOffers,
      location?.lat ?? 0,
      location?.lng ?? 0,
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedDraft) params.set("q", debouncedDraft);
        if (filterVeg) params.set("veg", "true");
        if (filterFast) params.set("fast", "true");
        params.set("lat", (location?.lat ?? 0).toString());
        params.set("lng", (location?.lng ?? 0).toString());

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          return {
            restaurants: CURATED_RESTAURANTS,
            dishes: CURATED_DISHES,
          };
        }
        const data = await res.json();
        return {
          restaurants: Array.isArray(data?.restaurants) && data.restaurants.length > 0 ? (data.restaurants as RestaurantCard[]) : CURATED_RESTAURANTS,
          dishes: Array.isArray(data?.dishes) && data.dishes.length > 0 ? (data.dishes as SearchDishItem[]) : CURATED_DISHES,
        };
      } catch {
        return {
          restaurants: CURATED_RESTAURANTS,
          dishes: CURATED_DISHES,
        };
      }
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  });

  const rawDishes = searchQuery.data?.dishes ?? CURATED_DISHES;
  const rawRestaurants = searchQuery.data?.restaurants ?? CURATED_RESTAURANTS;

  // Filtered live results
  const filteredDishes = useMemo(
    () => filterDishes(rawDishes, debouncedDraft, filterState),
    [rawDishes, debouncedDraft, filterState],
  );

  const filteredRestaurants = useMemo(
    () => filterRestaurants(rawRestaurants, debouncedDraft, filterState),
    [rawRestaurants, debouncedDraft, filterState],
  );

  // Predictive Auto-suggestions for dropdown
  const suggestions: PredictiveSuggestion[] = useMemo(() => {
    if (!draft.trim()) return [];
    return getPredictiveSuggestions(draft, rawDishes, rawRestaurants);
  }, [draft, rawDishes, rawRestaurants]);

  // Execute a search query and persist to recent searches
  const executeSearch = (query: string) => {
    const clean = query.trim();
    setDraft(clean);
    setIsFocused(false);

    if (clean) {
      const updated = saveRecentSearch(clean);
      setRecentSearches(updated);
    }

    void navigate({
      search: {
        ...search,
        q: clean,
        tab: activeTab,
        veg: filterVeg,
        rating4Plus: filterRating4Plus,
        fast: filterFast,
        offers: filterOffers,
      },
    });
  };

  const handleClearHistory = () => {
    clearRecentSearches();
    setRecentSearches([]);
    toast.success("Search history cleared");
  };

  const handleDishAdd = (dish: SearchDishItem) => {
    const res = addDishToCart(dish);
    if (res === "replace") {
      setReplaceModalItem(dish);
    } else {
      toast.success(`Added ${dish.name} to cart!`);
    }
  };

  const handleConfirmReplace = () => {
    if (replaceModalItem) {
      replaceAndAddDishToCart(replaceModalItem);
      toast.success(`Cart updated with ${replaceModalItem.name}!`);
      setReplaceModalItem(null);
    }
  };

  return (
    <CustomerShell onSearch={() => undefined}>
      <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] pb-28 text-gray-900">
        {/* TOP SEARCH HEADER WITH PREDICTIVE BAR */}
        <div className="sticky top-0 z-40 border-b border-amber-900/10 bg-[#FFFDF9]/95 backdrop-blur-md px-3 pt-3.5 pb-2.5 sm:px-6 shadow-xs">
          <div className="mx-auto max-w-4xl" ref={containerRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch(draft);
              }}
              className="relative flex items-center rounded-2xl border-2 border-amber-300/90 bg-white p-1.5 shadow-[0_6px_24px_rgba(245,158,11,0.12)] transition-all focus-within:border-amber-500 focus-within:shadow-[0_8px_30px_rgba(245,158,11,0.2)]"
            >
              {/* Search Icon */}
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-xs ml-0.5">
                <Search className="size-4" />
              </div>

              {/* Text Input */}
              <Input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setIsFocused(true);
                }}
                onFocus={() => setIsFocused(true)}
                placeholder="Search 'Biryani', 'Momos', 'Butter Chicken', 'Dosa'..."
                aria-label="Search food and restaurants"
                className="border-none bg-transparent shadow-none text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 h-10 text-sm sm:text-base font-bold px-3 w-full"
                autoFocus
              />

              {/* Clear Button */}
              {draft && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft("");
                    executeSearch("");
                  }}
                  className="mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 transition active:scale-90"
                  aria-label="Clear query"
                >
                  <X className="size-3.5" />
                </button>
              )}

              {/* Voice Search Microphone with Animated Pulse Ring */}
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="relative mr-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-100 to-orange-100 text-amber-900 hover:from-amber-200 hover:to-orange-200 border border-amber-300/80 shadow-2xs transition active:scale-95 group"
                aria-label="Search with voice"
                title="Search with voice (English / Hindi / Bengali)"
              >
                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-red-500" />
                </span>
                <Mic className="size-4 text-amber-800 group-hover:scale-110 transition-transform" />
              </button>
            </form>

            {/* ZERO-TYPING MULTILINGUAL QUICK CHIPS BAR */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 scrollbar-none select-none">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-900/70 shrink-0 flex items-center gap-0.5 pr-0.5">
                <Sparkles className="size-2.5 text-amber-600" />
                <span>Zero-Typing:</span>
              </span>
              {[
                { name: "Biryani", query: "Biryani", emoji: "🍚", regional: "बिरयानी / বিরিয়ানি" },
                { name: "Momos", query: "Momos", emoji: "🥟", regional: "मोमोज / মোমো" },
                { name: "Butter Chicken", query: "Butter Chicken", emoji: "🍗", regional: "बटर चिकन / বাটার চিকেন" },
                { name: "Dosa", query: "Dosa", emoji: "🥞", regional: "दोसा / দোসা" },
                { name: "Paneer", query: "Paneer", emoji: "🧀", regional: "पनीर / পনির" },
                { name: "Thali", query: "Thali", emoji: "🍽️", regional: "थाली / থালি" },
                { name: "Rolls", query: "Rolls", emoji: "🌯", regional: "কাঠি রোল / ৰোল" },
              ].map((chip) => (
                <button
                  key={chip.name}
                  type="button"
                  onClick={() => {
                    setDraft(chip.query);
                    executeSearch(chip.query);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black shadow-2xs shrink-0 transition-all active:scale-95 cursor-pointer border",
                    draft.toLowerCase() === chip.query.toLowerCase()
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-[0_2px_8px_rgba(245,158,11,0.35)]"
                      : "bg-white hover:bg-amber-50/90 text-gray-800 border-amber-200/80 hover:border-amber-400"
                  )}
                  title={`Zero-Typing Quick Search: ${chip.name} (${chip.regional})`}
                >
                  <span className="text-xs">{chip.emoji}</span>
                  <span>{chip.name}</span>
                  <span className="text-[9.5px] opacity-75 hidden sm:inline">· {chip.regional}</span>
                </button>
              ))}
            </div>

            {/* PREDICTIVE AUTO-SUGGEST DROPDOWN WITH SUBSTRING HIGHLIGHTING */}
            {isFocused && draft.trim().length > 0 && suggestions.length > 0 && (
              <div className="absolute left-3 right-3 sm:left-auto sm:w-[calc(100%-48px)] max-w-4xl mt-2 rounded-2xl border border-amber-200 bg-white/98 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-amber-100 flex items-center justify-between text-[11px] font-black uppercase text-amber-900/70 bg-amber-50/60 px-3 py-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-amber-600" />
                    <span>Instant Suggestions</span>
                  </span>
                  <span>150ms Debounced</span>
                </div>
                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {suggestions.map((sug) => {
                    const parts = highlightMatches(sug.text, draft);
                    return (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => executeSearch(sug.rawText)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-left hover:bg-amber-50/80 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-sm">
                            {sug.type === "dish" ? "🍲" : sug.type === "restaurant" ? "🏪" : sug.type === "trending" ? "🔥" : "🍽️"}
                          </span>
                          <div className="truncate">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {parts.map((p, idx) =>
                                p.match ? (
                                  <span
                                    key={idx}
                                    className="font-black text-amber-800 bg-amber-100/90 px-0.5 rounded"
                                  >
                                    {p.text}
                                  </span>
                                ) : (
                                  <span key={idx}>{p.text}</span>
                                ),
                              )}
                            </p>
                            {sug.subtitle && (
                              <p className="text-[11px] text-gray-500 font-medium truncate">
                                {sug.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {sug.badge && (
                          <span className="ml-2 shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 group-hover:bg-amber-200 group-hover:text-amber-950 transition">
                            {sug.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* QUICK FILTER CHIPS & RESULTS COUNT */}
            <div className="mt-2.5 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <div className="flex items-center gap-2 shrink-0">
                {/* Pure Veg Chip */}
                <button
                  type="button"
                  onClick={() => setFilterVeg(!filterVeg)}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
                    filterVeg
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-[0_2px_10px_rgba(5,150,105,0.3)] ring-1 ring-emerald-500 scale-105"
                      : "bg-white hover:bg-emerald-50 text-gray-700 border-gray-200 hover:border-emerald-300",
                  )}
                >
                  <span className="size-2 rounded-full bg-emerald-400" />
                  <span>Pure Veg 🌱</span>
                </button>

                {/* Rating 4.0+ Chip */}
                <button
                  type="button"
                  onClick={() => setFilterRating4Plus(!filterRating4Plus)}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
                    filterRating4Plus
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-500 shadow-[0_2px_10px_rgba(245,158,11,0.3)] ring-1 ring-amber-400 scale-105"
                      : "bg-white hover:bg-amber-50 text-gray-700 border-gray-200 hover:border-amber-300",
                  )}
                >
                  <Star className={cn("size-3.5", filterRating4Plus ? "fill-white text-white" : "text-amber-500")} />
                  <span>Rating 4.0+ ⭐</span>
                </button>

                {/* Fast Delivery (<25 mins) Chip */}
                <button
                  type="button"
                  onClick={() => setFilterFast(!filterFast)}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
                    filterFast
                      ? "bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white border-orange-500 shadow-[0_2px_10px_rgba(234,88,12,0.3)] ring-1 ring-orange-400 scale-105"
                      : "bg-white hover:bg-orange-50 text-gray-700 border-gray-200 hover:border-orange-300",
                  )}
                >
                  <Zap className={cn("size-3.5", filterFast ? "fill-white text-white" : "text-orange-500")} />
                  <span>Fast Delivery ⚡ (&lt;25 mins)</span>
                </button>

                {/* Great Offers Chip */}
                <button
                  type="button"
                  onClick={() => setFilterOffers(!filterOffers)}
                  className={cn(
                    "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 font-black transition-all border shadow-2xs select-none active:scale-95",
                    filterOffers
                      ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-600 shadow-[0_2px_10px_rgba(225,29,72,0.3)] ring-1 ring-rose-500 scale-105"
                      : "bg-white hover:bg-rose-50 text-gray-700 border-gray-200 hover:border-rose-300",
                  )}
                >
                  <Percent className={cn("size-3.5", filterOffers ? "text-white" : "text-rose-600")} />
                  <span>Great Offers 🏷️</span>
                </button>
              </div>

              {/* Live Count Indicator */}
              <span className="text-[11px] font-black text-amber-950 bg-amber-100/80 border border-amber-300/80 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
                {activeTab === "dishes" ? `${filteredDishes.length} dishes` : `${filteredRestaurants.length} kitchens`}
              </span>
            </div>
          </div>
        </div>

        {/* MAIN BODY CONTENT */}
        <div className="mx-auto max-w-4xl px-3 sm:px-6 pt-3 space-y-4">
          {/* 1. RECENT SEARCHES (Stores last 5 searches in localStorage with 1-tap rerun and 'Clear History') */}
          {!draft.trim() && recentSearches.length > 0 && (
            <section aria-label="Recent Searches" className="rounded-2xl border border-amber-200/80 bg-white/90 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-amber-600" />
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Recent Searches</h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-red-600 hover:underline transition"
                >
                  <Trash2 className="size-3" />
                  <span>Clear History</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {recentSearches.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => executeSearch(item)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 px-3.5 py-1.5 text-xs font-extrabold text-amber-950 transition active:scale-95 shadow-2xs"
                  >
                    <RotateCcw className="size-3 text-amber-600 shrink-0" />
                    <span>{item}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 2. TRENDING / POPULAR SEARCHES PILL DECK */}
          {!draft.trim() && (
            <section aria-label="Trending Searches" className="rounded-2xl border border-orange-200/80 bg-gradient-to-r from-orange-50/50 via-amber-50/40 to-yellow-50/50 p-4 shadow-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <Flame className="size-4 text-orange-600 animate-pulse" />
                <h3 className="text-sm font-black text-gray-900 tracking-tight">
                  Popular &amp; Trending Searches
                </h3>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {TRENDING_SEARCHES.map((trending) => {
                  const clean = cleanSearchQuery(trending);
                  return (
                    <button
                      key={trending}
                      type="button"
                      onClick={() => executeSearch(clean)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white hover:border-orange-400 hover:bg-orange-50/80 px-3.5 py-1.5 text-xs font-black text-gray-900 hover:text-orange-950 transition active:scale-95 shadow-2xs group"
                    >
                      <span className="group-hover:scale-110 transition-transform">🔥</span>
                      <span>{trending}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. DUAL-TAB SELECTOR (Dishes Tab & Restaurants Tab) */}
          <div className="flex items-center rounded-2xl bg-amber-100/80 p-1 border border-amber-200/90 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("dishes")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all duration-200 select-none",
                activeTab === "dishes"
                  ? "bg-white text-gray-950 shadow-md scale-[1.01]"
                  : "text-amber-900/80 hover:text-amber-950",
              )}
            >
              <Utensils className="size-4 text-orange-600" />
              <span>Dishes</span>
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900">
                {filteredDishes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("restaurants")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-sm transition-all duration-200 select-none",
                activeTab === "restaurants"
                  ? "bg-white text-gray-950 shadow-md scale-[1.01]"
                  : "text-amber-900/80 hover:text-amber-950",
              )}
            >
              <Store className="size-4 text-orange-600" />
              <span>Restaurants</span>
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900">
                {filteredRestaurants.length}
              </span>
            </button>
          </div>

          {/* 4. LIVE RESULTS GRID */}
          {activeTab === "dishes" ? (
            /* DISHES TAB */
            filteredDishes.length > 0 ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {filteredDishes.map((dish) => {
                  const cartLine = cartItems.find((i) => i.itemId === dish.id);
                  const qtyInCart = cartLine ? cartLine.quantity : 0;

                  return (
                    <div
                      key={dish.id}
                      className="group flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3.5 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-amber-300/60 transition-all duration-200"
                    >
                      <div className="flex gap-3.5">
                        {/* Dish Details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Veg/Non-Veg/Jain FSSAI Badge */}
                          <div className="flex items-center gap-1.5">
                            {dish.isJain ? (
                              <span
                                className="inline-flex items-center gap-0.5 rounded-[4px] border border-amber-400/80 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-900 shadow-2xs"
                                title="Sattvic Jain (No onion, no garlic)"
                              >
                                <span>🕉️</span>
                                <span>Jain</span>
                              </span>
                            ) : dish.veg ? (
                              <span
                                className="inline-flex size-3.5 items-center justify-center rounded-[3px] border-[1.5px] border-emerald-600 bg-white p-[1px]"
                                title="Pure Veg"
                              >
                                <span className="size-1.5 rounded-full bg-emerald-600" />
                              </span>
                            ) : (
                              <span
                                className="inline-flex size-3.5 items-center justify-center rounded-[3px] border-[1.5px] border-red-700 bg-white p-[1px]"
                                title="Non-Veg"
                              >
                                <span className="size-1.5 rounded-full bg-red-700" />
                              </span>
                            )}
                            {dish.bestseller && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-900">
                                Bestseller
                              </span>
                            )}
                          </div>

                          {/* Dish Name */}
                          <h4 className="font-extrabold text-base text-gray-950 leading-snug line-clamp-1 group-hover:text-amber-800 transition-colors">
                            {dish.name}
                          </h4>

                          {/* Restaurant Name */}
                          <Link
                            to="/r/$slug"
                            params={{ slug: dish.restaurantSlug }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-amber-800 hover:underline truncate"
                          >
                            <Store className="size-3 text-gray-400 shrink-0" />
                            <span className="truncate">{dish.restaurantName}</span>
                          </Link>

                          {/* Price & Rating */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-sm font-black text-gray-900">
                              {formatPaise(dish.pricePaise, { compact: true })}
                            </span>
                            {dish.ratingAvg && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-[10px] font-black text-white">
                                <span>{dish.ratingAvg.toFixed(1)}</span>
                                <Star className="size-2.5 fill-white" />
                              </span>
                            )}
                            <span className="text-[11px] text-gray-400 font-medium">· {dish.etaMinutes} mins</span>
                          </div>

                          {/* Description */}
                          {dish.description && (
                            <p className="text-[11px] text-gray-500 line-clamp-2 pt-1 font-medium leading-relaxed">
                              {dish.description}
                            </p>
                          )}
                        </div>

                        {/* Dish Thumbnail Photo & 1-Tap ADD Button */}
                        <div className="relative flex flex-col items-center shrink-0 w-28 sm:w-32">
                          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt={dish.name}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center bg-amber-50 text-2xl">
                                🍲
                              </div>
                            )}
                          </div>

                          {/* 1-Tap Green '+ ADD' Button */}
                          <div className="absolute -bottom-2 z-10 w-24">
                            {qtyInCart > 0 ? (
                              <div className="flex items-center justify-between rounded-xl bg-emerald-700 text-white font-black text-xs px-2 py-1 shadow-md border border-emerald-600">
                                <button
                                  type="button"
                                  onClick={() => useCartStore.getState().updateQty(cartLine!.key, qtyInCart - 1)}
                                  className="p-0.5 hover:scale-125 transition"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="size-3" />
                                </button>
                                <span>{qtyInCart}</span>
                                <button
                                  type="button"
                                  onClick={() => useCartStore.getState().updateQty(cartLine!.key, qtyInCart + 1)}
                                  className="p-0.5 hover:scale-125 transition"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDishAdd(dish)}
                                className="w-full rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-black text-xs py-1.5 uppercase tracking-wider border border-emerald-500 shadow-md shadow-emerald-700/15 active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                              >
                                <Plus className="size-3 stroke-[3]" />
                                <span>ADD</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY DISH STATE */
              <EmptyState
                query={draft}
                onReset={() => {
                  setDraft("");
                  setFilterVeg(false);
                  setFilterRating4Plus(false);
                  setFilterFast(false);
                  setFilterOffers(false);
                  executeSearch("");
                }}
                onSelectCuisine={(c) => executeSearch(c)}
              />
            )
          ) : (
            /* RESTAURANTS TAB */
            filteredRestaurants.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredRestaurants.map((restaurant) => (
                  <KitchenCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              /* EMPTY RESTAURANTS STATE */
              <EmptyState
                query={draft}
                onReset={() => {
                  setDraft("");
                  setFilterVeg(false);
                  setFilterRating4Plus(false);
                  setFilterFast(false);
                  setFilterOffers(false);
                  executeSearch("");
                }}
                onSelectCuisine={(c) => executeSearch(c)}
              />
            )
          )}
        </div>

        {/* 5. FLOATING BOTTOM CART BAR (Tier-1 Parity 1-tap checkout transition) */}
        {totalCartCount > 0 && (
          <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <Link
              to="/cart"
              className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-4 py-3 shadow-[0_8px_24px_rgba(5,150,105,0.4)] border border-emerald-400/50 hover:brightness-105 active:scale-98 transition no-underline"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white font-black text-sm">
                  {totalCartCount}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wide leading-none">
                    Item added to cart
                  </p>
                  <p className="text-[11px] text-emerald-100 font-medium truncate max-w-[180px]">
                    from {cartRestaurantName || "Kitchen"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 font-black text-sm">
                <span>View Cart</span>
                <ArrowRight className="size-4" />
              </div>
            </Link>
          </div>
        )}

        {/* 6. VOICE SEARCH MODAL */}
        <VoiceSearchDialog
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onSearch={(voicedText) => {
            executeSearch(voicedText);
            toast.success(`Searching for "${voicedText}"`);
          }}
        />

        {/* 7. REPLACE CART CONFIRMATION DIALOG */}
        <CartConflictModal
          isOpen={Boolean(replaceModalItem)}
          currentRestaurantName={cartRestaurantName}
          newRestaurantName={replaceModalItem?.restaurantName || "this restaurant"}
          onCancel={() => setReplaceModalItem(null)}
          onConfirm={handleConfirmReplace}
        />
      </div>
    </CustomerShell>
  );
}

/**
 * Empty state component with suggestions and 1-tap cuisine pills
 */
function EmptyState({
  query,
  onReset,
  onSelectCuisine,
}: {
  query: string;
  onReset: () => void;
  onSelectCuisine: (cuisine: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-amber-200/80 bg-white/95 p-6 sm:p-8 text-center space-y-5 shadow-[0_4px_24px_rgba(245,158,11,0.06)]">
      <div className="mx-auto flex size-18 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-500 text-3xl shadow-md text-white">
        🔍
      </div>

      <div className="space-y-1.5">
        <h3 className="font-black text-lg sm:text-xl text-gray-950 tracking-tight">
          {query ? `No match found for "${query}"` : "No results match your active filters"}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Check for typos or explore popular cuisines and trending items below.
        </p>
      </div>

      {/* 1-Tap Browse Top Cuisines */}
      <div className="space-y-2 pt-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-amber-900/80 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200/80">
          🍽️ Browse Top Cuisines
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-lg mx-auto">
          {TOP_CUISINES.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => onSelectCuisine(c.query)}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-white hover:border-amber-500 hover:bg-amber-50/80 px-3.5 py-1.5 text-xs font-black text-gray-900 transition active:scale-95 shadow-2xs"
            >
              <span>{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 pt-3 border-t border-amber-900/10">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="rounded-xl border-amber-300 font-black text-xs hover:bg-amber-50"
        >
          Reset All Filters
        </Button>
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs px-4 py-2 shadow-md hover:from-amber-600 hover:to-orange-600 transition"
        >
          <span>Explore Home</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
