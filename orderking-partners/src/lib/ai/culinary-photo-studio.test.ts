import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  CULINARY_PHOTO_DATABASE,
  CULINARY_STUDIO_LIGHTING_PRESETS,
  matchDishCulinaryTaxonomy,
  generateProceduralCulinaryCanvas,
} from "./culinary-photo-studio.ts";

describe("King AI Culinary Photo Studio & Taxonomy Engine", () => {
  test("contains curated, appetizing culinary photo database for Indian restaurants", () => {
    assert.ok(CULINARY_PHOTO_DATABASE.length >= 20);
    for (const preset of CULINARY_PHOTO_DATABASE) {
      assert.ok(preset.dishName.length > 0);
      assert.ok(preset.primaryPhotoUrl.startsWith("http"));
      assert.ok(preset.keywords.length > 0);
      assert.ok(preset.basePriceRupees > 0);
      assert.ok(["VEG", "NONVEG", "EGG"].includes(preset.diet));
    }
  });

  test("accurately matches Paneer Tikka with vegetarian classification and tandoor category", () => {
    const match = matchDishCulinaryTaxonomy("Tandoori Paneer Tikka");
    assert.equal(match.diet, "VEG");
    assert.equal(match.category, "Starters & Tandoor");
    assert.ok(match.description.includes("cottage cheese") || match.description.includes("Paneer"));
    assert.ok(match.suggestedPhotoUrl.startsWith("http"));
  });

  test("accurately matches Chicken Biryani with non-veg classification and biryani category", () => {
    const match = matchDishCulinaryTaxonomy("Special Hyderabadi Chicken Biryani");
    assert.equal(match.diet, "NONVEG");
    assert.equal(match.category, "Biryani & Rice");
    assert.ok(match.description.includes("Basmati rice"));
    assert.ok(match.suggestedPhotoUrl.startsWith("http"));
  });

  test("accurately matches Masala Dosa with South Indian category", () => {
    const match = matchDishCulinaryTaxonomy("Crispy Butter Masala Dosa");
    assert.equal(match.diet, "VEG");
    assert.equal(match.category, "South Indian");
    assert.ok(match.description.includes("sambar") || match.description.includes("chutney"));
  });

  test("accurately matches Butter Naan with bread category", () => {
    const match = matchDishCulinaryTaxonomy("Garlic Butter Naan");
    assert.equal(match.diet, "VEG");
    assert.equal(match.category, "Indian Breads (Roti / Naan)");
  });

  test("accurately matches Gulab Jamun with dessert category", () => {
    const match = matchDishCulinaryTaxonomy("Hot Gulab Jamun with Ice Cream");
    assert.equal(match.diet, "VEG");
    assert.equal(match.category, "Beverages & Desserts");
  });

  test("accurately matches Egg Curry with egg dietary classification", () => {
    const match = matchDishCulinaryTaxonomy("Dhaba Style Double Egg Curry");
    assert.equal(match.diet, "EGG");
    assert.equal(match.category, "Main Course & Curries");
  });

  test("heuristically categorizes and tags custom uncataloged dishes gracefully", () => {
    const match = matchDishCulinaryTaxonomy("Grandma's Mutton Korma");
    assert.equal(match.diet, "NONVEG");
    assert.equal(match.category, "Main Course & Curries");
    assert.ok(match.suggestedPhotoUrl.startsWith("http"));
  });

  test("supports 4 studio lighting styles with calibrated parameters", () => {
    const styles = ["warm_tandoor", "fine_dining", "fresh_garden", "royal_handi"] as const;
    for (const s of styles) {
      const preset = CULINARY_STUDIO_LIGHTING_PRESETS[s];
      assert.ok(preset.label.length > 0);
      assert.ok(preset.settings.contrast >= 1.0);
      assert.ok(preset.settings.warmth >= 0.98);
    }
  });

  test("generates fallback procedural visual data URI in non-browser environments", () => {
    const uri = generateProceduralCulinaryCanvas("Signature Dal Makhani", "VEG", "warm_tandoor");
    assert.ok(uri.startsWith("data:image/"));
    assert.ok(uri.includes("Signature%20Dal%20Makhani") || uri.includes("Dal"));
  });

  test("strictly enforces zero competitor names and zero forbidden terms", () => {
    const serialized = JSON.stringify(CULINARY_PHOTO_DATABASE).toLowerCase();
    assert.ok(!serialized.includes("zomato"));
    assert.ok(!serialized.includes("swiggy"));
    assert.ok(!serialized.includes("umar"));
  });
});
