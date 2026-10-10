import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  rankUpsellCandidates,
  type RawUpsellItem,
  type RawUpsellCategory,
  type RawUpsellAddon,
} from "./upsell-logic.ts";

describe("1-Click Checkout Upsell Engine — Algorithmic Ranking & Monetization", () => {
  it("guarantees ZERO fake data when no items exist in database", () => {
    const upsells = rankUpsellCandidates({
      items: [],
      categories: [],
      cartItemIds: ["item_1"],
      cartAddonIds: [],
      addonsForCartItems: [],
    });
    assert.deepEqual(upsells, []);
  });

  it("filters out items that are already in the cart", () => {
    const items: RawUpsellItem[] = [
      {
        id: "bev_1",
        category_id: "cat_bev",
        name_en: "Cold Beverage Coke",
        image_url: null,
        veg: true,
        bestseller: true,
        available: true,
        base_price_paise: 4000,
      },
    ];
    const categories: RawUpsellCategory[] = [{ id: "cat_bev", name_en: "Beverages" }];

    // When bev_1 is already in cart:
    const upsells = rankUpsellCandidates({
      items,
      categories,
      cartItemIds: ["bev_1"],
      cartAddonIds: [],
      addonsForCartItems: [],
    });
    assert.equal(upsells.length, 0);
  });

  it("prioritizes high-margin cold beverages and extra cheese add-ons", () => {
    const items: RawUpsellItem[] = [
      {
        id: "main_curry",
        category_id: "cat_curry",
        name_en: "Special Biryani Curry",
        image_url: null,
        veg: false,
        bestseller: false,
        available: true,
        base_price_paise: 35000, // ₹350 (expensive main meal)
      },
      {
        id: "bev_coke",
        category_id: "cat_bev",
        name_en: "Chilled Cold Beverage",
        image_url: null,
        veg: true,
        bestseller: true,
        available: true,
        base_price_paise: 4000, // ₹40 (high-margin impulse add-on)
      },
      {
        id: "sides_fries",
        category_id: "cat_sides",
        name_en: "Crispy French Fries",
        image_url: null,
        veg: true,
        bestseller: false,
        available: true,
        base_price_paise: 6000, // ₹60
      },
    ];
    const categories: RawUpsellCategory[] = [
      { id: "cat_bev", name_en: "Beverages" },
      { id: "cat_curry", name_en: "Main Course" },
      { id: "cat_sides", name_en: "Sides" },
    ];
    const addonsForCartItems: RawUpsellAddon[] = [
      {
        addonId: "addon_cheese_1",
        groupId: "grp_1",
        itemId: "burger_in_cart",
        addonName: "Extra Mozzarella Cheese",
        addonPricePaise: 3000, // ₹30
        groupName: "Toppings",
      },
    ];

    const upsells = rankUpsellCandidates({
      items,
      categories,
      cartItemIds: ["burger_in_cart"],
      cartAddonIds: [],
      addonsForCartItems,
    });

    assert.ok(upsells.length >= 2);
    // Cold beverage and Extra cheese should lead the recommendations
    const topNames = upsells.slice(0, 2).map((u) => u.name);
    assert.ok(topNames.includes("Extra Mozzarella Cheese"));
    assert.ok(topNames.includes("Chilled Cold Beverage"));

    const cheeseUpsell = upsells.find((u) => u.name === "Extra Mozzarella Cheese");
    assert.equal(cheeseUpsell?.type, "addon");
    assert.equal(cheeseUpsell?.reason, "Add Extra Cheese");

    const bevUpsell = upsells.find((u) => u.name === "Chilled Cold Beverage");
    assert.equal(bevUpsell?.type, "item");
    assert.equal(bevUpsell?.reason, "Add a Cold Beverage");
  });

  it("strictly respects vegetarian diet constraints when isVegOnly is true", () => {
    const items: RawUpsellItem[] = [
      {
        id: "non_veg_wings",
        category_id: "cat_sides",
        name_en: "Crispy Chicken Wings",
        image_url: null,
        veg: false,
        bestseller: true,
        available: true,
        base_price_paise: 9000,
      },
      {
        id: "veg_lime_soda",
        category_id: "cat_bev",
        name_en: "Fresh Cold Lime Soda",
        image_url: null,
        veg: true,
        bestseller: false,
        available: true,
        base_price_paise: 4000,
      },
    ];
    const categories: RawUpsellCategory[] = [
      { id: "cat_bev", name_en: "Beverages" },
      { id: "cat_sides", name_en: "Sides" },
    ];

    const upsells = rankUpsellCandidates({
      items,
      categories,
      cartItemIds: [],
      cartAddonIds: [],
      addonsForCartItems: [],
      isVegOnly: true,
    });

    assert.equal(upsells.length, 1);
    assert.equal(upsells[0]?.name, "Fresh Cold Lime Soda");
  });

  it("caps suggestions to top 4 maximum to prevent checkout cognitive overload", () => {
    const items: RawUpsellItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `bev_${i}`,
      category_id: "cat_bev",
      name_en: `Cold Beverage ${i}`,
      image_url: null,
      veg: true,
      bestseller: i === 0,
      available: true,
      base_price_paise: 4000 + i * 500,
    }));
    const categories: RawUpsellCategory[] = [{ id: "cat_bev", name_en: "Beverages" }];

    const upsells = rankUpsellCandidates({
      items,
      categories,
      cartItemIds: [],
      cartAddonIds: [],
      addonsForCartItems: [],
    });

    assert.equal(upsells.length, 4);
  });
});
