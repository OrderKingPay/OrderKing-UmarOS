import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  TRENDING_SEARCHES,
  RECENT_SEARCHES_KEY,
  MAX_RECENT_SEARCHES,
  CURATED_DISHES,
  CURATED_RESTAURANTS,
  TOP_CUISINES,
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
  createDebounce,
  type SearchDishItem,
  type SearchFilterState,
} from "../lib/predictive-search";
import { useCartStore } from "../lib/stores/cart";

// In-memory localStorage mock for node test environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe("Supreme Tier-1 Parity Predictive Search Engine", () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = new LocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", { localStorage: localStorageMock });
    useCartStore.getState().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. DEBOUNCED QUERY FILTERING
  // ─────────────────────────────────────────────────────────────
  describe("1. Debounced Query Filtering", () => {
    it("debounces rapid input changes and executes only once after 150ms", () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const debounced = createDebounce(callback, 150);

      // Rapid keystrokes
      debounced.run("b");
      debounced.run("bi");
      debounced.run("bir");
      debounced.run("biry");
      debounced.run("biryani");

      // Not called immediately
      expect(callback).not.toHaveBeenCalled();

      // Advance 100ms: still not called
      vi.advanceTimersByTime(100);
      expect(callback).not.toHaveBeenCalled();

      // Advance another 50ms (total 150ms): called exactly once with latest value
      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("biryani");

      vi.useRealTimers();
    });

    it("cancels pending debounced execution when requested", () => {
      vi.useFakeTimers();
      const callback = vi.fn();
      const debounced = createDebounce(callback, 150);

      debounced.run("pizza");
      debounced.cancel();

      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("filters dishes case-insensitively by name, description, cuisine, or restaurant", () => {
      const defaultFilters: SearchFilterState = {
        veg: false,
        rating4Plus: false,
        fastDelivery: false,
        greatOffers: false,
      };

      // Exact name match
      const biryaniResults = filterDishes(CURATED_DISHES, "biryani", defaultFilters);
      expect(biryaniResults.length).toBeGreaterThanOrEqual(1);
      expect(biryaniResults.some((d) => d.name.toLowerCase().includes("biryani"))).toBe(true);

      // Case-insensitivity ("BIRYANI")
      const upperResults = filterDishes(CURATED_DISHES, "BIRYANI", defaultFilters);
      expect(upperResults.length).toEqual(biryaniResults.length);

      // Substring match
      const partialResults = filterDishes(CURATED_DISHES, "paneer", defaultFilters);
      expect(partialResults.length).toBeGreaterThanOrEqual(1);
      expect(partialResults[0].name).toContain("Paneer");

      // Cuisine match
      const pizzaResults = filterDishes(CURATED_DISHES, "Pizza", defaultFilters);
      expect(pizzaResults.length).toBeGreaterThanOrEqual(1);
      expect(pizzaResults.some((d) => d.cuisine === "Pizza")).toBe(true);

      // Restaurant match
      const mtrResults = filterDishes(CURATED_DISHES, "MTR 1920", defaultFilters);
      expect(mtrResults.length).toBeGreaterThanOrEqual(1);
      expect(mtrResults[0].restaurantName).toContain("MTR 1920");

      // Non-matching query returns empty array
      const noResults = filterDishes(CURATED_DISHES, "xyzrandomnonexistentquery123", defaultFilters);
      expect(noResults).toEqual([]);

      // Empty query returns all dishes
      const allResults = filterDishes(CURATED_DISHES, "", defaultFilters);
      expect(allResults.length).toBe(CURATED_DISHES.length);
    });

    it("filters restaurants case-insensitively by name or cuisine summary", () => {
      const defaultFilters: SearchFilterState = {
        veg: false,
        rating4Plus: false,
        fastDelivery: false,
        greatOffers: false,
      };

      const paradise = filterRestaurants(CURATED_RESTAURANTS, "paradise", defaultFilters);
      expect(paradise.length).toBe(1);
      expect(paradise[0].name).toBe("Paradise Biryani Mahal");

      const italian = filterRestaurants(CURATED_RESTAURANTS, "italian", defaultFilters);
      expect(italian.length).toBeGreaterThanOrEqual(1);
      expect(italian[0].cuisineSummary.toLowerCase()).toContain("italian");

      const empty = filterRestaurants(CURATED_RESTAURANTS, "", defaultFilters);
      expect(empty.length).toBe(CURATED_RESTAURANTS.length);
    });

    it("cleans search queries by stripping emoji characters", () => {
      expect(cleanSearchQuery("Hyderabadi Chicken Biryani 🍗")).toBe("Hyderabadi Chicken Biryani");
      expect(cleanSearchQuery("Paneer Butter Masala 🧀")).toBe("Paneer Butter Masala");
      expect(cleanSearchQuery("Margherita Pizza 🍕")).toBe("Margherita Pizza");
      expect(cleanSearchQuery("   Cold Coffee & Shakes ☕  ")).toBe("Cold Coffee & Shakes");
      expect(cleanSearchQuery("")).toBe("");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. RECENT SEARCH PERSISTENCE AND CLEAR
  // ─────────────────────────────────────────────────────────────
  describe("2. Recent Search Persistence and Clear", () => {
    it("stores up to 5 unique recent searches in localStorage under orderking_recent_searches", () => {
      expect(RECENT_SEARCHES_KEY).toBe("orderking_recent_searches");
      expect(getRecentSearches()).toEqual([]);

      saveRecentSearch("Biryani");
      saveRecentSearch("Pizza");
      saveRecentSearch("Dosa");

      const list1 = getRecentSearches();
      expect(list1).toEqual(["Dosa", "Pizza", "Biryani"]);
      expect(localStorageMock.getItem(RECENT_SEARCHES_KEY)).toBe(JSON.stringify(list1));

      // Adding 4th and 5th
      saveRecentSearch("Rolls");
      saveRecentSearch("Momos");
      const list2 = getRecentSearches();
      expect(list2).toEqual(["Momos", "Rolls", "Dosa", "Pizza", "Biryani"]);
      expect(list2.length).toBe(MAX_RECENT_SEARCHES);

      // Adding 6th search drops the oldest ("Biryani") to maintain max 5
      saveRecentSearch("Burgers");
      const list3 = getRecentSearches();
      expect(list3).toEqual(["Burgers", "Momos", "Rolls", "Dosa", "Pizza"]);
      expect(list3.length).toBe(5);
      expect(list3.includes("Biryani")).toBe(false);
    });

    it("deduplicates case-insensitively and floats rerun searches to the front", () => {
      saveRecentSearch("Biryani");
      saveRecentSearch("Pizza");
      saveRecentSearch("Momos");

      // Rerun "biryani" in lowercase
      saveRecentSearch("biryani");
      const updated = getRecentSearches();
      expect(updated[0]).toBe("biryani");
      expect(updated.filter((item) => item.toLowerCase() === "biryani").length).toBe(1);
      expect(updated).toEqual(["biryani", "Momos", "Pizza"]);
    });

    it("ignores empty or whitespace-only searches", () => {
      saveRecentSearch("Pizza");
      saveRecentSearch("");
      saveRecentSearch("   ");
      expect(getRecentSearches()).toEqual(["Pizza"]);
    });

    it("clears recent searches completely when 'Clear History' is clicked", () => {
      saveRecentSearch("Biryani");
      saveRecentSearch("Pizza");
      expect(getRecentSearches().length).toBe(2);

      clearRecentSearches();
      expect(getRecentSearches()).toEqual([]);
      expect(localStorageMock.getItem(RECENT_SEARCHES_KEY)).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. TRENDING SUGGESTIONS & SUBSTRING HIGHLIGHTING
  // ─────────────────────────────────────────────────────────────
  describe("3. Trending Suggestions and Substring Highlighting", () => {
    it("contains the exact 7 required trending searches in TRENDING_SEARCHES", () => {
      const expected = [
        "Hyderabadi Chicken Biryani 🍗",
        "Paneer Butter Masala 🧀",
        "Crispy Masala Dosa 🥞",
        "Margherita Pizza 🍕",
        "Kolkata Kathi Roll 🌯",
        "Cold Coffee & Shakes ☕",
        "Momo Platter 🥟",
      ];

      expect(TRENDING_SEARCHES).toEqual(expected);
      expect(TRENDING_SEARCHES.length).toBe(7);
    });

    it("generates predictive auto-suggestions matching partial queries", () => {
      const suggestions = getPredictiveSuggestions("biry");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);

      // Matches trending biryani
      const trendingMatch = suggestions.find((s) => s.type === "trending");
      expect(trendingMatch).toBeDefined();
      expect(trendingMatch?.text).toContain("Hyderabadi Chicken Biryani");

      // Matches dish biryani
      const dishMatch = suggestions.find((s) => s.type === "dish");
      expect(dishMatch).toBeDefined();
      expect(dishMatch?.text.toLowerCase()).toContain("biryani");

      // Suggestions are capped to 8 max
      expect(suggestions.length).toBeLessThanOrEqual(8);
    });

    it("matches trending items when query matches part of the cleaned text", () => {
      const dosaSuggestions = getPredictiveSuggestions("dosa");
      expect(dosaSuggestions.some((s) => s.text.includes("Crispy Masala Dosa"))).toBe(true);

      const coffeeSuggestions = getPredictiveSuggestions("coffee");
      expect(coffeeSuggestions.some((s) => s.text.includes("Cold Coffee"))).toBe(true);

      const rollSuggestions = getPredictiveSuggestions("roll");
      expect(rollSuggestions.some((s) => s.text.includes("Kolkata Kathi Roll"))).toBe(true);

      const momoSuggestions = getPredictiveSuggestions("momo");
      expect(momoSuggestions.some((s) => s.text.includes("Momo Platter"))).toBe(true);
    });

    it("highlights matched substrings accurately for auto-suggest dropdown", () => {
      const text = "Hyderabadi Chicken Biryani";
      const parts = highlightMatches(text, "Chicken");

      expect(parts).toEqual([
        { text: "Hyderabadi ", match: false },
        { text: "Chicken", match: true },
        { text: " Biryani", match: false },
      ]);

      // Case-insensitive match highlighting
      const caseParts = highlightMatches(text, "biryani");
      expect(caseParts).toEqual([
        { text: "Hyderabadi Chicken ", match: false },
        { text: "Biryani", match: true },
      ]);

      // No match
      const noMatch = highlightMatches(text, "pizza");
      expect(noMatch).toEqual([{ text: "Hyderabadi Chicken Biryani", match: false }]);

      // Empty query
      const empty = highlightMatches(text, "");
      expect(empty).toEqual([{ text: "Hyderabadi Chicken Biryani", match: false }]);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. 1-TAP DISH CART ADDITION FROM SEARCH
  // ─────────────────────────────────────────────────────────────
  describe("4. 1-Tap Dish Cart Addition from Search", () => {
    it("adds a dish directly to the cart immediately without leaving search", () => {
      const dish = CURATED_DISHES[0]; // Hyderabadi Chicken Biryani from Paradise Biryani Mahal
      expect(useCartStore.getState().items).toEqual([]);

      const result = addDishToCart(dish);
      expect(result).toBe("ok");

      const state = useCartStore.getState();
      expect(state.restaurantId).toBe(dish.restaurantId);
      expect(state.restaurantName).toBe(dish.restaurantName);
      expect(state.items.length).toBe(1);
      expect(state.items[0].itemId).toBe(dish.id);
      expect(state.items[0].quantity).toBe(1);
    });

    it("increments quantity when adding the same dish again from search", () => {
      const dish = CURATED_DISHES[0];
      addDishToCart(dish);
      const secondAdd = addDishToCart(dish);

      expect(secondAdd).toBe("ok");
      const state = useCartStore.getState();
      expect(state.items.length).toBe(1);
      expect(state.items[0].quantity).toBe(2);
    });

    it("adds another dish from the SAME restaurant to the cart", () => {
      // Find two dishes from Paradise Biryani Mahal
      const paradiseDishes = CURATED_DISHES.filter((d) => d.restaurantId === "rest-paradise-biryani");
      expect(paradiseDishes.length).toBeGreaterThanOrEqual(2);

      addDishToCart(paradiseDishes[0]);
      const res = addDishToCart(paradiseDishes[1]);

      expect(res).toBe("ok");
      const state = useCartStore.getState();
      expect(state.items.length).toBe(2);
      expect(state.restaurantId).toBe("rest-paradise-biryani");
    });

    it("returns 'replace' when attempting to add a dish from a DIFFERENT restaurant", () => {
      const paradiseDish = CURATED_DISHES.find((d) => d.restaurantId === "rest-paradise-biryani")!;
      const punjabDish = CURATED_DISHES.find((d) => d.restaurantId === "rest-punjab-grill")!;

      addDishToCart(paradiseDish);
      expect(useCartStore.getState().restaurantId).toBe("rest-paradise-biryani");

      // Attempt adding Punjab Grill dish
      const res = addDishToCart(punjabDish);
      expect(res).toBe("replace");

      // Original cart remains untouched
      expect(useCartStore.getState().restaurantId).toBe("rest-paradise-biryani");
      expect(useCartStore.getState().items[0].itemId).toBe(paradiseDish.id);
    });

    it("replaces cart with the new restaurant's dish via replaceAndAddDishToCart", () => {
      const paradiseDish = CURATED_DISHES.find((d) => d.restaurantId === "rest-paradise-biryani")!;
      const punjabDish = CURATED_DISHES.find((d) => d.restaurantId === "rest-punjab-grill")!;

      addDishToCart(paradiseDish);
      expect(useCartStore.getState().restaurantId).toBe("rest-paradise-biryani");

      // Replace cart
      replaceAndAddDishToCart(punjabDish);

      const state = useCartStore.getState();
      expect(state.restaurantId).toBe(punjabDish.restaurantId);
      expect(state.restaurantName).toBe(punjabDish.restaurantName);
      expect(state.items.length).toBe(1);
      expect(state.items[0].itemId).toBe(punjabDish.id);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. FILTER CHIP TOGGLES
  // ─────────────────────────────────────────────────────────────
  describe("5. Quick Filter Chip Toggles", () => {
    it("toggles Pure Veg 🌱 filter correctly", () => {
      const vegFilter: SearchFilterState = {
        veg: true,
        rating4Plus: false,
        fastDelivery: false,
        greatOffers: false,
      };

      const dishes = filterDishes(CURATED_DISHES, "", vegFilter);
      expect(dishes.length).toBeGreaterThan(0);
      expect(dishes.every((d) => d.veg === true)).toBe(true);

      const restaurants = filterRestaurants(CURATED_RESTAURANTS, "", vegFilter);
      expect(restaurants.length).toBeGreaterThan(0);
      expect(restaurants.every((r) => r.vegOnly === true)).toBe(true);
    });

    it("toggles Rating 4.0+ ⭐ filter correctly", () => {
      const ratingFilter: SearchFilterState = {
        veg: false,
        rating4Plus: true,
        fastDelivery: false,
        greatOffers: false,
      };

      const dishes = filterDishes(CURATED_DISHES, "", ratingFilter);
      expect(dishes.length).toBeGreaterThan(0);
      expect(dishes.every((d) => (d.ratingAvg ?? 0) >= 4.0)).toBe(true);

      const restaurants = filterRestaurants(CURATED_RESTAURANTS, "", ratingFilter);
      expect(restaurants.length).toBeGreaterThan(0);
      expect(restaurants.every((r) => (r.ratingAvg ?? 0) >= 4.0)).toBe(true);
    });

    it("toggles Fast Delivery ⚡ (<25 mins) filter correctly", () => {
      const fastFilter: SearchFilterState = {
        veg: false,
        rating4Plus: false,
        fastDelivery: true,
        greatOffers: false,
      };

      const dishes = filterDishes(CURATED_DISHES, "", fastFilter);
      expect(dishes.length).toBeGreaterThan(0);
      expect(dishes.every((d) => d.etaMinutes <= 25)).toBe(true);

      const restaurants = filterRestaurants(CURATED_RESTAURANTS, "", fastFilter);
      expect(restaurants.length).toBeGreaterThan(0);
      expect(restaurants.every((r) => r.etaMinutes <= 25)).toBe(true);
    });

    it("toggles Great Offers 🏷️ filter correctly", () => {
      const offersFilter: SearchFilterState = {
        veg: false,
        rating4Plus: false,
        fastDelivery: false,
        greatOffers: true,
      };

      const dishes = filterDishes(CURATED_DISHES, "", offersFilter);
      expect(dishes.length).toBeGreaterThan(0);
      expect(dishes.every((d) => d.hasOffer === true)).toBe(true);

      const restaurants = filterRestaurants(CURATED_RESTAURANTS, "", offersFilter);
      expect(restaurants.length).toBeGreaterThan(0);
      expect(restaurants.every((r) => r.hasOffer === true)).toBe(true);
    });

    it("combines multiple filter chips simultaneously (e.g. Pure Veg + Fast Delivery)", () => {
      const multiFilter: SearchFilterState = {
        veg: true,
        rating4Plus: true,
        fastDelivery: true,
        greatOffers: false,
      };

      const dishes = filterDishes(CURATED_DISHES, "", multiFilter);
      expect(dishes.length).toBeGreaterThan(0);
      expect(dishes.every((d) => d.veg && (d.ratingAvg ?? 0) >= 4.0 && d.etaMinutes <= 25)).toBe(true);
    });
  });
});
