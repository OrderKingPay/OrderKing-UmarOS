import { useSyncExternalStore } from "react";
import { useEffect, useState, useMemo } from "react";
import type { RestaurantCard } from "./market-types";
import { useCartStore, cartKey, type CartItem } from "./stores/cart";

export const RECENT_SEARCHES_KEY = "orderking_recent_searches";
export const MAX_RECENT_SEARCHES = 5;

export const TRENDING_SEARCHES = [
  "Hyderabadi Chicken Biryani",
  "Paneer Butter Masala",
  "Crispy Masala Dosa",
  "Margherita Pizza",
  "Kolkata Kathi Roll",
  "Cold Coffee & Shakes",
  "Momo Platter",
] as const;

export type TrendingSearchItem = (typeof TRENDING_SEARCHES)[number];

export type SearchDishItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl: string | null;
  veg: boolean;
  isJain?: boolean;
  pricePaise: number;
  restaurantId: string;
  restaurantName: string;
  restaurantSlug: string;
  ratingAvg: number | null;
  ratingCount: number;
  bestseller?: boolean;
  etaMinutes: number;
  deliveryFeePaise: number;
  hasOffer?: boolean;
  offerLabel?: string | null;
  cuisine?: string;
};

export type SearchFilterState = {
  veg: boolean;
  rating4Plus: boolean;
  fastDelivery: boolean; // <25 mins
  greatOffers: boolean;
};

export type PredictiveSuggestion = {
  id: string;
  text: string;
  rawText: string;
  type: "dish" | "restaurant" | "trending" | "cuisine";
  category?: string;
  badge?: string;
  subtitle?: string;
};

export const TOP_CUISINES = [
  { name: "Biryani", query: "Biryani" },
  { name: "Pizza", query: "Pizza" },
  { name: "North Indian", query: "North Indian" },
  { name: "South Indian", query: "Dosa" },
  { name: "Rolls", query: "Rolls" },
  { name: "Momos", query: "Momos" },
  { name: "Burgers", query: "Burger" },
  { name: "Cafe & Shakes", query: "Coffee" },
  { name: "Desserts", query: "Dessert" },
];

/** Remove emoji and trailing spaces for clean query string matching */
export function cleanSearchQuery(term: string): string {
  if (!term) return "";
  // Strip emoji characters and symbols
  return term
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      "",
    )
    .trim();
}

/** Get recent search queries from localStorage */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/** Save a query to recent searches in localStorage */
export function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getRecentSearches();

  if (typeof window === "undefined" || !window.localStorage) return [trimmed];

  try {
    const current = getRecentSearches();
    // Case-insensitive deduplication, putting new search at index 0
    const filtered = current.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    );
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [trimmed];
  }
}

/** Clear all recent searches from localStorage */
export function clearRecentSearches(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // silent catch
  }
}

/**
 * Break a string into matched and unmatched segments for substring highlighting.
 */
export function highlightMatches(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  if (!text) return [];
  const q = query.trim();
  if (!q) return [{ text, match: false }];

  // Escape regex special characters
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length <= 1) {
    return [{ text, match: false }];
  }

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === q.toLowerCase(),
    }));
}

/**
 * Curated high-resolution restaurants for instant search responses
 */
export const CURATED_RESTAURANTS: RestaurantCard[] = [];

export const CURATED_DISHES: SearchDishItem[] = [];

import {
  matchMultilingualDish,
  isMultilingualDishMatch,
  MULTILINGUAL_DISH_REGISTRY,
} from "./search/multilingual-dish-matcher";

export { matchMultilingualDish, isMultilingualDishMatch, MULTILINGUAL_DISH_REGISTRY };

/**
 * Filter and prioritize predictive auto-suggestions based on user's partial query.
 */
export function getPredictiveSuggestions(
  query: string,
  dishes: SearchDishItem[] = [],
  restaurants: RestaurantCard[] = [],
): PredictiveSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: PredictiveSuggestion[] = [];
  const seen = new Set<string>();

  // 0. Check Multilingual regional/phonetic match
  const multi = matchMultilingualDish(query);
  if (multi.matched && multi.canonicalName) {
    const cleanKey = multi.canonicalName.toLowerCase();
    if (!seen.has(cleanKey)) {
      seen.add(cleanKey);
      results.push({
        id: `multi-${multi.dishGroupId}`,
        text: `${multi.canonicalName} (${multi.matchedVariation})`,
        rawText: multi.canonicalName,
        type: "dish",
        badge: "Multilingual",
        subtitle: `Matches across Hindi / Bengali / Assamese`,
      });
    }
  }

  // 1. Check trending searches
  for (const trending of TRENDING_SEARCHES) {
    const clean = cleanSearchQuery(trending);
    const multiMatch = multi.matched && multi.canonicalName && clean.toLowerCase().includes(multi.canonicalName.toLowerCase());
    if (clean.toLowerCase().includes(q) || trending.toLowerCase().includes(q) || multiMatch) {
      if (!seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        results.push({
          id: `trending-${clean}`,
          text: trending,
          rawText: clean,
          type: "trending",
          badge: "Trending",
        });
      }
    }
  }

  // 2. Check dishes (with multilingual support)
  for (const dish of dishes) {
    const directMatch = dish.name.toLowerCase().includes(q);
    const multiMatch = isMultilingualDishMatch(dish, query);
    if (directMatch || multiMatch) {
      const key = dish.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `dish-${dish.id}`,
          text: dish.name,
          rawText: dish.name,
          type: "dish",
          badge: dish.veg ? "Veg" : "Non-Veg",
          subtitle: `in ${dish.restaurantName}`,
        });
      }
    }
  }

  // 3. Check restaurants (with multilingual cuisine support)
  for (const r of restaurants) {
    const directMatch = r.name.toLowerCase().includes(q);
    const multiMatch = isMultilingualDishMatch({ name: r.name, cuisine: r.cuisineSummary }, query);
    if (directMatch || multiMatch) {
      const key = r.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `rest-${r.id}`,
          text: r.name,
          rawText: r.name,
          type: "restaurant",
          badge: r.ratingAvg ? `★ ${r.ratingAvg.toFixed(1)}` : "Restaurant",
          subtitle: r.cuisineSummary,
        });
      }
    }
  }

  // 4. Check top cuisines
  for (const c of TOP_CUISINES) {
    const directMatch = c.name.toLowerCase().includes(q);
    const multiMatch = multi.matched && multi.canonicalName && c.name.toLowerCase().includes(multi.canonicalName.toLowerCase());
    if (directMatch || multiMatch) {
      const key = c.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `cuisine-${c.name}`,
          text: c.name,
          rawText: c.query,
          type: "cuisine",
          badge: "Cuisine",
        });
      }
    }
  }

  return results.slice(0, 8);
}

/**
 * Filter dishes according to active search query and quick filter chips.
 */
export function filterDishes(
  dishes: SearchDishItem[],
  query: string,
  filters: SearchFilterState,
): SearchDishItem[] {
  const q = query.trim().toLowerCase();

  return dishes.filter((dish) => {
    // Text search matching dish name, description, cuisine, or restaurant (plus multilingual variations)
    if (q) {
      const nameMatch = dish.name.toLowerCase().includes(q);
      const descMatch = Boolean(dish.description?.toLowerCase().includes(q));
      const restMatch = dish.restaurantName.toLowerCase().includes(q);
      const cuisineMatch = Boolean(dish.cuisine?.toLowerCase().includes(q));
      const multiMatch = isMultilingualDishMatch(dish, query);

      if (!nameMatch && !descMatch && !restMatch && !cuisineMatch && !multiMatch) {
        return false;
      }
    }

    // Filter: Pure Veg 🌱
    if (filters.veg && !dish.veg) {
      return false;
    }

    // Filter: Rating 4.0+ ⭐
    if (filters.rating4Plus) {
      const rating = typeof dish.ratingAvg === "number" ? dish.ratingAvg : Number(dish.ratingAvg || 0);
      if (rating < 4.0) return false;
    }

    // Filter: Fast Delivery ⚡ (<25 mins)
    if (filters.fastDelivery && dish.etaMinutes > 25) {
      return false;
    }

    // Filter: Great Offers 🏷️
    if (filters.greatOffers && !dish.hasOffer) {
      return false;
    }

    return true;
  });
}

/**
 * Filter restaurants according to active search query and quick filter chips.
 */
export function filterRestaurants(
  restaurants: RestaurantCard[],
  query: string,
  filters: SearchFilterState,
): RestaurantCard[] {
  const q = query.trim().toLowerCase();

  return restaurants.filter((r) => {
    // Text search matching restaurant name or cuisine summary (plus multilingual variations)
    if (q) {
      const nameMatch = r.name.toLowerCase().includes(q);
      const cuisineMatch = Boolean(r.cuisineSummary?.toLowerCase().includes(q));
      const multiMatch = isMultilingualDishMatch({ name: r.name, cuisine: r.cuisineSummary }, query);

      if (!nameMatch && !cuisineMatch && !multiMatch) {
        return false;
      }
    }

    // Filter: Pure Veg 🌱
    if (filters.veg && !r.vegOnly) {
      return false;
    }

    // Filter: Rating 4.0+ ⭐
    if (filters.rating4Plus) {
      const rating = typeof r.ratingAvg === "number" ? r.ratingAvg : Number(r.ratingAvg || 0);
      if (rating < 4.0) return false;
    }

    // Filter: Fast Delivery ⚡ (<25 mins)
    if (filters.fastDelivery && r.etaMinutes > 25) {
      return false;
    }

    // Filter: Great Offers 🏷️
    if (filters.greatOffers && !r.hasOffer) {
      return false;
    }

    return true;
  });
}

/**
 * 1-Tap add dish to cart directly from the predictive search page.
 * Uses `useCartStore` without navigating away.
 */
export function addDishToCart(dish: SearchDishItem): "ok" | "replace" {
  const line: Omit<CartItem, "key"> = {
    itemId: dish.id,
    variantId: null,
    addonIds: [],
    quantity: 1,
    instructions: "",
  };

  const item: CartItem = {
    ...line,
    key: cartKey(line),
  };

  return useCartStore.getState().addItem(dish.restaurantId, dish.restaurantName, item);
}

/**
 * 1-Tap replace and add dish to cart (when switching restaurants).
 */
export function replaceAndAddDishToCart(dish: SearchDishItem): void {
  const line: Omit<CartItem, "key"> = {
    itemId: dish.id,
    variantId: null,
    addonIds: [],
    quantity: 1,
    instructions: "",
  };

  const item: CartItem = {
    ...line,
    key: cartKey(line),
  };

  useCartStore.getState().replaceAndAdd(dish.restaurantId, dish.restaurantName, item);
}

/**
 * Debounce helper for function execution (150ms default).
 */
export function createDebounce<T extends (...args: any[]) => void>(
  fn: T,
  waitMs = 150,
): { run: (...args: Parameters<T>) => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const run = (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, waitMs);
  };

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { run, cancel };
}

/**
 * React hook for 150ms debouncing values.
 */
export function useDebounceValue<T>(value: T, delayMs = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
