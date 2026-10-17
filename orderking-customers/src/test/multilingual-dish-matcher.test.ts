import { describe, it, expect, vi } from "vitest";
import {
  matchMultilingualDish,
  isMultilingualDishMatch,
  detectQueryScript,
  normalizeMultilingualQuery,
  MULTILINGUAL_DISH_REGISTRY,
} from "../lib/search/multilingual-dish-matcher";
import {
  filterDishes,
  filterRestaurants,
  getPredictiveSuggestions,
  createDebounce,
  CURATED_DISHES,
  CURATED_RESTAURANTS,
  type SearchFilterState,
} from "../lib/search/predictive-search";

const defaultFilters: SearchFilterState = {
  veg: false,
  rating4Plus: false,
  fastDelivery: false,
  greatOffers: false,
};

describe("Multilingual Indian Dish Autocorrect & Predictive Matcher", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. SCRIPT DETECTION & NORMALIZATION
  // ─────────────────────────────────────────────────────────────
  describe("1. Script Detection & Normalization", () => {
    it("detects Hindi (Devanagari) script accurately", () => {
      expect(detectQueryScript("बिरयानी")).toBe("hi");
      expect(detectQueryScript("मोमोज")).toBe("hi");
      expect(detectQueryScript("थाली")).toBe("hi");
      expect(detectQueryScript("दोसा")).toBe("hi");
      expect(detectQueryScript("चाट")).toBe("hi");
    });

    it("detects Bengali script accurately", () => {
      expect(detectQueryScript("বিরিয়ানি")).toBe("bn");
      expect(detectQueryScript("মোমো")).toBe("bn");
      expect(detectQueryScript("থালি")).toBe("bn");
      expect(detectQueryScript("কাঠি রোল")).toBe("bn");
      expect(detectQueryScript("দোসা")).toBe("bn");
      expect(detectQueryScript("ফুচকা")).toBe("bn");
    });

    it("detects Assamese script with unique characters (ৰ / ৱ)", () => {
      expect(detectQueryScript("বিৰিয়ানি")).toBe("as");
      expect(detectQueryScript("কাঠি ৰোল")).toBe("as");
      expect(detectQueryScript("পানি পুৰী")).toBe("as");
    });

    it("detects English and phonetic queries", () => {
      expect(detectQueryScript("biryani")).toBe("en");
      expect(detectQueryScript("dhosa")).toBe("en");
      expect(detectQueryScript("fuchka")).toBe("en");
      expect(detectQueryScript("golgappa")).toBe("en");
    });

    it("normalizes queries by trimming whitespace and stripping zero-width joiners", () => {
      expect(normalizeMultilingualQuery("  बिरयानी  ")).toBe("बिरयानी");
      expect(normalizeMultilingualQuery("বিরিয়ানি\u200B")).toBe("বিরিয়ানি");
      expect(normalizeMultilingualQuery("Kathi---Roll  ")).toBe("kathi roll");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. BIRYANI VARIATIONS ACROSS ALL 4 LANGUAGES & PHONETIC TYPOS
  // ─────────────────────────────────────────────────────────────
  describe("2. Biryani Variations (English, Hindi, Bengali, Assamese)", () => {
    const biryaniQueries = [
      "biryani",
      "biriyani",
      "बिरयानी",
      "বিরিয়ানি",
      "বিৰিয়ানি",
      "dum biryani",
      "murgh biryani",
    ];

    biryaniQueries.forEach((query) => {
      it(`matches '${query}' to Biryani canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Biryani");
        expect(match.dishGroupId).toBe("biryani");
      });

      it(`filters curated dishes to Biryani when searching '${query}'`, () => {
        const dishes = filterDishes(CURATED_DISHES, query, defaultFilters);
        expect(dishes.length).toBeGreaterThanOrEqual(1);
        expect(dishes.some((d) => d.name.toLowerCase().includes("biryani"))).toBe(true);
      });
    });

    it("matches restaurants serving Biryani with Hindi script 'बिरयानी'", () => {
      const rests = filterRestaurants(CURATED_RESTAURANTS, "बिरयानी", defaultFilters);
      expect(rests.length).toBeGreaterThanOrEqual(1);
      expect(rests.some((r) => r.cuisineSummary.toLowerCase().includes("biryani"))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. MOMOS VARIATIONS (English, Hindi, Bengali, Assamese, Dumplings)
  // ─────────────────────────────────────────────────────────────
  describe("3. Momos Variations", () => {
    const momoQueries = [
      "momos",
      "momo",
      "मोमोज",
      "মোমো",
      "dumplings",
      "steamed momo",
    ];

    momoQueries.forEach((query) => {
      it(`matches '${query}' to Momos canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Momos");
        expect(match.dishGroupId).toBe("momos");
      });

      it(`filters curated dishes to Momos when searching '${query}'`, () => {
        const dishes = filterDishes(CURATED_DISHES, query, defaultFilters);
        expect(dishes.length).toBeGreaterThanOrEqual(1);
        expect(dishes.some((d) => d.name.toLowerCase().includes("momo"))).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. THALI VARIATIONS (English, Hindi, Bengali, Regional)
  // ─────────────────────────────────────────────────────────────
  describe("4. Thali Variations", () => {
    const thaliQueries = [
      "thali",
      "थाली",
      "থালি",
      "দক্ষিণ ভারতীয় থালি",
      "special thali",
    ];

    thaliQueries.forEach((query) => {
      it(`matches '${query}' to Thali canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Thali");
        expect(match.dishGroupId).toBe("thali");
      });
    });

    it("matches Indian platter dishes when searching 'থালি' or 'थाली'", () => {
      const match = matchMultilingualDish("থালি");
      expect(match.matched).toBe(true);
      expect(match.canonicalName).toBe("Thali");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. ROLLS VARIATIONS (English, Hindi, Bengali, Kathi, Chicken)
  // ─────────────────────────────────────────────────────────────
  describe("5. Rolls Variations", () => {
    const rollQueries = [
      "roll",
      "kathi roll",
      "रोल",
      "কাঠি রোল",
      "chicken roll",
      "paneer roll",
    ];

    rollQueries.forEach((query) => {
      it(`matches '${query}' to Rolls canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Rolls");
        expect(match.dishGroupId).toBe("rolls");
      });

      it(`filters curated dishes to Kolkata Kathi Roll when searching '${query}'`, () => {
        const dishes = filterDishes(CURATED_DISHES, query, defaultFilters);
        expect(dishes.length).toBeGreaterThanOrEqual(1);
        expect(dishes.some((d) => d.name.toLowerCase().includes("roll"))).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. DOSA VARIATIONS (English, Hindi, Bengali, Phonetic 'Dhosa')
  // ─────────────────────────────────────────────────────────────
  describe("6. Dosa Variations", () => {
    const dosaQueries = [
      "dosa",
      "dhosa",
      "दोसा",
      "দোসা",
      "masala dosa",
    ];

    dosaQueries.forEach((query) => {
      it(`matches '${query}' to Dosa canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Dosa");
        expect(match.dishGroupId).toBe("dosa");
      });

      it(`filters curated dishes to Crispy Masala Dosa when searching '${query}'`, () => {
        const dishes = filterDishes(CURATED_DISHES, query, defaultFilters);
        expect(dishes.length).toBeGreaterThanOrEqual(1);
        expect(dishes.some((d) => d.name.toLowerCase().includes("dosa"))).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. CHAAT / GOLGAPPA / FUCHKA / PANI PURI VARIATIONS
  // ─────────────────────────────────────────────────────────────
  describe("7. Chaat Variations (Golgappa, Fuchka, Pani Puri)", () => {
    const chaatQueries = [
      "chaat",
      "chat",
      "चाट",
      "চাট",
      "golgappa",
      "fuchka",
      "pani puri",
    ];

    chaatQueries.forEach((query) => {
      it(`matches '${query}' to Chaat canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Chaat");
        expect(match.dishGroupId).toBe("chaat");
      });
    });

    it("matches Bengali 'ফুচকা' and Assamese 'পানি পুৰী' to Chaat group", () => {
      expect(matchMultilingualDish("ফুচকা").canonicalName).toBe("Chaat");
      expect(matchMultilingualDish("পানি পুৰী").canonicalName).toBe("Chaat");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7.5. BUTTER CHICKEN VARIATIONS (English, Hindi, Bengali, Assamese)
  // ─────────────────────────────────────────────────────────────
  describe("7.5. Butter Chicken Variations (English, Hindi, Bengali, Assamese)", () => {
    const butterChickenQueries = [
      "butter chicken",
      "murgh makhani",
      "chicken makhani",
      "बटर चिकन",
      "মুর্গ মাখানি",
      "বাটার চিকেন",
      "বাটাৰ চিকেন",
    ];

    butterChickenQueries.forEach((query) => {
      it(`matches '${query}' to Butter Chicken canonical group`, () => {
        const match = matchMultilingualDish(query);
        expect(match.matched).toBe(true);
        expect(match.canonicalName).toBe("Butter Chicken");
        expect(match.dishGroupId).toBe("butter-chicken");
      });

      it(`filters curated dishes to Butter Chicken when searching '${query}'`, () => {
        const dishes = filterDishes(CURATED_DISHES, query, defaultFilters);
        expect(dishes.length).toBeGreaterThanOrEqual(1);
        expect(dishes.some((d) => d.name.toLowerCase().includes("butter chicken"))).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. 150MS DEBOUNCED PREDICTIVE SUGGESTIONS INTEGRATION
  // ─────────────────────────────────────────────────────────────
  describe("8. Predictive Suggestions & 150ms Debounced Wiring", () => {
    it("returns multilingual predictive suggestions for Hindi query 'बिरयानी'", () => {
      const suggestions = getPredictiveSuggestions("बिरयानी");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);

      // Includes multilingual badge or dish match
      const multi = suggestions.find((s) => s.badge?.includes("Multilingual") || s.type === "dish");
      expect(multi).toBeDefined();

      // Dishes matching Biryani are returned
      const dishMatches = suggestions.filter((s) => s.type === "dish");
      expect(dishMatches.length).toBeGreaterThanOrEqual(1);
      expect(dishMatches.some((d) => d.text.toLowerCase().includes("biryani"))).toBe(true);
    });

    it("returns multilingual predictive suggestions for Bengali query 'মোমো'", () => {
      const suggestions = getPredictiveSuggestions("মোমো");
      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      const dishMatches = suggestions.filter((s) => s.type === "dish");
      expect(dishMatches.some((d) => d.text.toLowerCase().includes("momo"))).toBe(true);
    });

    it("debounces rapid multilingual input with 150ms wait", () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debounced = createDebounce(fn, 150);

      debounced.run("বি");
      debounced.run("বিৰি");
      debounced.run("বিৰিয়ানি");

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(149);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith("বিৰিয়ানি");

      vi.useRealTimers();
    });
  });
});
