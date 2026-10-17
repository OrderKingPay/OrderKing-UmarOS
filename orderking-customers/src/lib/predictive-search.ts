import { useSyncExternalStore } from "react";
import { useEffect, useState, useMemo } from "react";
import type { RestaurantCard } from "./market-types";
import { useCartStore, cartKey, type CartItem } from "./stores/cart";

export const RECENT_SEARCHES_KEY = "orderking_recent_searches";
export const MAX_RECENT_SEARCHES = 5;

export const TRENDING_SEARCHES = [
  "Hyderabadi Chicken Biryani 🍗",
  "Paneer Butter Masala 🧀",
  "Crispy Masala Dosa 🥞",
  "Margherita Pizza 🍕",
  "Kolkata Kathi Roll 🌯",
  "Cold Coffee & Shakes ☕",
  "Momo Platter 🥟",
] as const;

export type TrendingSearchItem = (typeof TRENDING_SEARCHES)[number];

export type SearchDishItem = {
  id: string;
  name: string;
  description?: string;
  imageUrl: string | null;
  veg: boolean;
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
  { name: "Biryani", emoji: "🍚", query: "Biryani" },
  { name: "Pizza", emoji: "🍕", query: "Pizza" },
  { name: "North Indian", emoji: "🍛", query: "North Indian" },
  { name: "South Indian", emoji: "🥞", query: "Dosa" },
  { name: "Rolls", emoji: "🌯", query: "Rolls" },
  { name: "Momos", emoji: "🥟", query: "Momos" },
  { name: "Burgers", emoji: "🍔", query: "Burger" },
  { name: "Cafe & Shakes", emoji: "☕", query: "Coffee" },
  { name: "Desserts", emoji: "🍰", query: "Dessert" },
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
export const CURATED_RESTAURANTS: RestaurantCard[] = [
  {
    id: "rest-paradise-biryani",
    slug: "paradise-biryani-mahal",
    name: "Paradise Biryani Mahal",
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "Hyderabadi, Biryani, Mughlai, Kebabs",
    vegOnly: false,
    prepMinutes: 18,
    dataLabel: "VERIFIED",
    promoted: true,
    distanceKm: 1.8,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    minOrderPaise: 15000,
    open: true,
    hasOffer: true,
    offerLabel: "₹50 FLAT OFF",
    zoneName: "Central Food Hub",
    ratingAvg: 4.6,
    ratingCount: 1420,
  },
  {
    id: "rest-punjab-grill",
    slug: "punjab-grill-dhaba",
    name: "Punjab Grill & Dhaba",
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "North Indian, Paneer, Dal Makhani, Tandoor",
    vegOnly: true,
    prepMinutes: 20,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 2.2,
    etaMinutes: 24,
    deliveryFeePaise: 0,
    minOrderPaise: 12000,
    open: true,
    hasOffer: true,
    offerLabel: "20% OFF",
    zoneName: "Sector 4",
    ratingAvg: 4.5,
    ratingCount: 890,
  },
  {
    id: "rest-mtr-south",
    slug: "mtr-1920-south-kitchen",
    name: "MTR 1920 South Kitchen",
    coverImage: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "South Indian, Dosa, Idli, Filter Coffee",
    vegOnly: true,
    prepMinutes: 12,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 1.1,
    etaMinutes: 18,
    deliveryFeePaise: 0,
    minOrderPaise: 10000,
    open: true,
    hasOffer: false,
    offerLabel: null,
    zoneName: "Temple Road",
    ratingAvg: 4.7,
    ratingCount: 2310,
  },
  {
    id: "rest-toscano-pizza",
    slug: "toscano-woodfired-pizza",
    name: "Toscano Woodfired Pizza",
    coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "Italian, Sourdough Pizza, Pasta, Garlic Bread",
    vegOnly: false,
    prepMinutes: 20,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 2.5,
    etaMinutes: 25,
    deliveryFeePaise: 2500,
    minOrderPaise: 20000,
    open: true,
    hasOffer: true,
    offerLabel: "BUY 1 GET 1",
    zoneName: "City Square",
    ratingAvg: 4.4,
    ratingCount: 740,
  },
  {
    id: "rest-kusum-rolls",
    slug: "kusum-rolls-street-bites",
    name: "Kusum Rolls & Street Bites",
    coverImage: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "Kolkata Kathi Rolls, Street Food, Wraps",
    vegOnly: false,
    prepMinutes: 14,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 1.4,
    etaMinutes: 20,
    deliveryFeePaise: 0,
    minOrderPaise: 8000,
    open: true,
    hasOffer: false,
    offerLabel: null,
    zoneName: "Park Corner",
    ratingAvg: 4.5,
    ratingCount: 1650,
  },
  {
    id: "rest-daily-brew",
    slug: "the-daily-brew-cafe",
    name: "The Daily Brew Cafe",
    coverImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "Cold Brew, Thick Shakes, Cafe, Pastries",
    vegOnly: true,
    prepMinutes: 10,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 0.9,
    etaMinutes: 15,
    deliveryFeePaise: 0,
    minOrderPaise: 10000,
    open: true,
    hasOffer: true,
    offerLabel: "₹40 FLAT OFF",
    zoneName: "Civic Centre",
    ratingAvg: 4.3,
    ratingCount: 520,
  },
  {
    id: "rest-tibetan-momos",
    slug: "tibetan-delight-momos",
    name: "Tibetan Delight & Momos",
    coverImage: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "Tibetan, Steamed Momos, Fried Wontons, Thukpa",
    vegOnly: false,
    prepMinutes: 15,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 1.6,
    etaMinutes: 20,
    deliveryFeePaise: 0,
    minOrderPaise: 12000,
    open: true,
    hasOffer: false,
    offerLabel: null,
    zoneName: "Market Complex",
    ratingAvg: 4.6,
    ratingCount: 1100,
  },
  {
    id: "rest-burger-forge",
    slug: "burger-forge-fries",
    name: "Burger Forge & Fries",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=720&auto=format&fit=crop&q=80",
    cuisineSummary: "American, Gourmet Burgers, Loaded Fries",
    vegOnly: false,
    prepMinutes: 16,
    dataLabel: "VERIFIED",
    promoted: false,
    distanceKm: 2.1,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    minOrderPaise: 15000,
    open: true,
    hasOffer: true,
    offerLabel: "₹60 OFF ON ₹299",
    zoneName: "High Street",
    ratingAvg: 4.5,
    ratingCount: 830,
  },
];

/**
 * Curated high-resolution dishes matching all trending items and top searches
 */
export const CURATED_DISHES: SearchDishItem[] = [
  {
    id: "dish-hyderabadi-biryani",
    name: "Hyderabadi Chicken Biryani",
    description: "Authentic dum biryani layered with aromatic basmati rice, tender spiced chicken, saffron, and fried onions.",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80",
    veg: false,
    pricePaise: 26000, // ₹260
    restaurantId: "rest-paradise-biryani",
    restaurantName: "Paradise Biryani Mahal",
    restaurantSlug: "paradise-biryani-mahal",
    ratingAvg: 4.8,
    ratingCount: 680,
    bestseller: true,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "₹50 FLAT OFF",
    cuisine: "Biryani",
  },
  {
    id: "dish-paneer-butter-masala",
    name: "Paneer Butter Masala",
    description: "Cottage cheese cubes simmered in a velvety, rich tomato cashew butter gravy with fresh cream.",
    imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 22000, // ₹220
    restaurantId: "rest-punjab-grill",
    restaurantName: "Punjab Grill & Dhaba",
    restaurantSlug: "punjab-grill-dhaba",
    ratingAvg: 4.7,
    ratingCount: 450,
    bestseller: true,
    etaMinutes: 24,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "20% OFF",
    cuisine: "North Indian",
  },
  {
    id: "dish-crispy-masala-dosa",
    name: "Crispy Masala Dosa",
    description: "Golden crispy fermented crepe filled with spiced potato masala, served with coconut chutney and piping hot sambar.",
    imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 14000, // ₹140
    restaurantId: "rest-mtr-south",
    restaurantName: "MTR 1920 South Kitchen",
    restaurantSlug: "mtr-1920-south-kitchen",
    ratingAvg: 4.8,
    ratingCount: 1240,
    bestseller: true,
    etaMinutes: 18,
    deliveryFeePaise: 0,
    hasOffer: false,
    offerLabel: null,
    cuisine: "South Indian",
  },
  {
    id: "dish-margherita-pizza",
    name: "Margherita Pizza",
    description: "Classic Neapolitan style pizza with San Marzano tomato sauce, fresh buffalo mozzarella, and aromatic basil leaves.",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 29900, // ₹299
    restaurantId: "rest-toscano-pizza",
    restaurantName: "Toscano Woodfired Pizza",
    restaurantSlug: "toscano-woodfired-pizza",
    ratingAvg: 4.5,
    ratingCount: 380,
    bestseller: true,
    etaMinutes: 25,
    deliveryFeePaise: 2500,
    hasOffer: true,
    offerLabel: "BUY 1 GET 1",
    cuisine: "Pizza",
  },
  {
    id: "dish-kolkata-kathi-roll",
    name: "Kolkata Kathi Roll",
    description: "Flaky paratha layered with seasoned egg, tender chicken skewers, sliced red onions, green chillies, and signature spices.",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80",
    veg: false,
    pricePaise: 12000, // ₹120
    restaurantId: "rest-kusum-rolls",
    restaurantName: "Kusum Rolls & Street Bites",
    restaurantSlug: "kusum-rolls-street-bites",
    ratingAvg: 4.6,
    ratingCount: 780,
    bestseller: true,
    etaMinutes: 20,
    deliveryFeePaise: 0,
    hasOffer: false,
    offerLabel: null,
    cuisine: "Rolls",
  },
  {
    id: "dish-cold-coffee-shakes",
    name: "Cold Coffee & Shakes",
    description: "Chilled arabica espresso blended with rich cream, vanilla ice cream, and chocolate drizzle.",
    imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 15000, // ₹150
    restaurantId: "rest-daily-brew",
    restaurantName: "The Daily Brew Cafe",
    restaurantSlug: "the-daily-brew-cafe",
    ratingAvg: 4.5,
    ratingCount: 310,
    bestseller: true,
    etaMinutes: 15,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "₹40 FLAT OFF",
    cuisine: "Cafe",
  },
  {
    id: "dish-momo-platter",
    name: "Momo Platter",
    description: "Grand assortment of steamed, pan-fried, and chilli momos served with fiery Sichuan chutney and mayo dip.",
    imageUrl: "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=500&auto=format&fit=crop&q=80",
    veg: false,
    pricePaise: 18000, // ₹180
    restaurantId: "rest-tibetan-momos",
    restaurantName: "Tibetan Delight & Momos",
    restaurantSlug: "tibetan-delight-momos",
    ratingAvg: 4.7,
    ratingCount: 520,
    bestseller: true,
    etaMinutes: 20,
    deliveryFeePaise: 0,
    hasOffer: false,
    offerLabel: null,
    cuisine: "Momos",
  },
  {
    id: "dish-veg-dum-biryani",
    name: "Royal Veg Dum Biryani",
    description: "Flavored long grain rice cooked with garden fresh vegetables, paneer cubes, and traditional royal spices.",
    imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 21000, // ₹210
    restaurantId: "rest-paradise-biryani",
    restaurantName: "Paradise Biryani Mahal",
    restaurantSlug: "paradise-biryani-mahal",
    ratingAvg: 4.5,
    ratingCount: 420,
    bestseller: false,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "₹50 FLAT OFF",
    cuisine: "Biryani",
  },
  {
    id: "dish-dal-makhani-combo",
    name: "Dal Makhani & Butter Naan",
    description: "Slow-cooked black lentils overnight in butter & cream, served with two hot butter naans.",
    imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80",
    veg: true,
    pricePaise: 19000, // ₹190
    restaurantId: "rest-punjab-grill",
    restaurantName: "Punjab Grill & Dhaba",
    restaurantSlug: "punjab-grill-dhaba",
    ratingAvg: 4.6,
    ratingCount: 610,
    bestseller: false,
    etaMinutes: 24,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "20% OFF",
    cuisine: "North Indian",
  },
  {
    id: "dish-double-smash-burger",
    name: "Double Smash Gourmet Burger",
    description: "Twin grilled patties with melted English cheddar, crisp lettuce, gherkins, and smoked aioli on toasted brioche.",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    veg: false,
    pricePaise: 26000, // ₹260
    restaurantId: "rest-burger-forge",
    restaurantName: "Burger Forge & Fries",
    restaurantSlug: "burger-forge-fries",
    ratingAvg: 4.6,
    ratingCount: 390,
    bestseller: true,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    hasOffer: true,
    offerLabel: "₹60 OFF ON ₹299",
    cuisine: "Burgers",
  },
];

/**
 * Filter and prioritize predictive auto-suggestions based on user's partial query.
 */
export function getPredictiveSuggestions(
  query: string,
  dishes: SearchDishItem[] = CURATED_DISHES,
  restaurants: RestaurantCard[] = CURATED_RESTAURANTS,
): PredictiveSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: PredictiveSuggestion[] = [];
  const seen = new Set<string>();

  // 1. Check trending searches
  for (const trending of TRENDING_SEARCHES) {
    const clean = cleanSearchQuery(trending);
    if (clean.toLowerCase().includes(q) || trending.toLowerCase().includes(q)) {
      if (!seen.has(clean.toLowerCase())) {
        seen.add(clean.toLowerCase());
        results.push({
          id: `trending-${clean}`,
          text: trending,
          rawText: clean,
          type: "trending",
          badge: "Trending 🔥",
        });
      }
    }
  }

  // 2. Check dishes
  for (const dish of dishes) {
    if (dish.name.toLowerCase().includes(q)) {
      const key = dish.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `dish-${dish.id}`,
          text: dish.name,
          rawText: dish.name,
          type: "dish",
          badge: dish.veg ? "Veg 🌱" : "Non-Veg 🍗",
          subtitle: `in ${dish.restaurantName}`,
        });
      }
    }
  }

  // 3. Check restaurants
  for (const r of restaurants) {
    if (r.name.toLowerCase().includes(q)) {
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
    if (c.name.toLowerCase().includes(q)) {
      const key = c.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push({
          id: `cuisine-${c.name}`,
          text: `${c.name} ${c.emoji}`,
          rawText: c.query,
          type: "cuisine",
          badge: "Cuisine 🍽️",
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
    // Text search matching dish name, description, cuisine, or restaurant
    if (q) {
      const nameMatch = dish.name.toLowerCase().includes(q);
      const descMatch = Boolean(dish.description?.toLowerCase().includes(q));
      const restMatch = dish.restaurantName.toLowerCase().includes(q);
      const cuisineMatch = Boolean(dish.cuisine?.toLowerCase().includes(q));

      if (!nameMatch && !descMatch && !restMatch && !cuisineMatch) {
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
    // Text search matching restaurant name or cuisine summary
    if (q) {
      const nameMatch = r.name.toLowerCase().includes(q);
      const cuisineMatch = Boolean(r.cuisineSummary?.toLowerCase().includes(q));

      if (!nameMatch && !cuisineMatch) {
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
