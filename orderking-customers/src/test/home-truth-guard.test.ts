import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { HERO_CULINARY_DISHES } from "@/components/market/ultra-luxury-hero";

const heroSource = readFileSync(new URL("../components/market/ultra-luxury-hero.tsx", import.meta.url), "utf8");
const homeSource = readFileSync(new URL("../routes/index.tsx", import.meta.url), "utf8");
const homeSectionsSource = readFileSync(new URL("../components/sdui/home-sections.tsx", import.meta.url), "utf8");
const emptyStateSource = readFileSync(new URL("../components/market/royal-discovery-showcase.tsx", import.meta.url), "utf8");

describe("Customer home is honest before merchant onboarding", () => {
  it("keeps illustrative culinary showcase separate from sellable inventory", () => {
    expect(HERO_CULINARY_DISHES.length).toBeGreaterThan(0);
    for (const dish of HERO_CULINARY_DISHES) {
      expect(dish.query.length).toBeGreaterThan(0);
      expect(dish.imageUrl.startsWith("https://")).toBe(true);
      expect(dish).not.toHaveProperty("pricePaise");
      expect(dish).not.toHaveProperty("ratingAvg");
      expect(dish).not.toHaveProperty("etaMinutes");
    }
    expect(heroSource).toContain("Illustrative imagery");
    expect(heroSource).toContain("Not live menu offers");
    expect(heroSource).toContain("Search available menus");
  });

  it("never advertises unverified fees, certifications or delivery times", () => {
    for (const source of [heroSource, homeSource, homeSectionsSource, emptyStateSource]) {
      expect(source).not.toContain("0% Menu Markups");
      expect(source).not.toContain("FSSAI Verified Kitchens");
      expect(source).not.toContain("100% Direct Chef Delivery");
      expect(source).not.toContain("Express 25m");
    }
    expect(homeSource).toContain("isDeliveryActiveInLocation(location.lat, location.lng, location.cityId) : false");
    expect(emptyStateSource).not.toContain("FEATURED_ROYAL_KITCHENS");
    expect(emptyStateSource).not.toContain("ROYAL100");
    expect(emptyStateSource).not.toContain("Pan-India Live");
    expect(emptyStateSource).toContain("No restaurants are available for ordering here yet.");
  });
});
