export type CheckoutUpsellRequest = {
  restaurantId: string;
  cartItemIds: string[];
  cartAddonIds?: string[];
  isVegOnly?: boolean;
};

export type CheckoutUpsellItem = {
  id: string;
  type: "item" | "addon";
  itemId: string;
  variantId: string | null;
  addonId?: string;
  targetItemKey?: string;
  name: string;
  description?: string;
  pricePaise: number;
  imageUrl?: string | null;
  veg: boolean;
  categoryName?: string;
  reason: string;
  badge?: string;
  marginScore: number;
};

export type RawUpsellItem = {
  id: string;
  category_id: string;
  name_en: string;
  name_bn?: string;
  description_en?: string;
  image_url: string | null;
  veg: boolean;
  bestseller: boolean;
  available: boolean;
  base_price_paise: number;
};

export type RawUpsellCategory = {
  id: string;
  name_en: string;
};

export type RawUpsellAddon = {
  addonId: string;
  groupId: string;
  itemId: string;
  addonName: string;
  addonPricePaise: number;
  groupName: string;
};

/**
 * Pure algorithmic ranking engine for checkout upsells.
 * Strictly guarantees ZERO fake data: returns empty list if no genuine candidates exist in the database.
 * Maximizes Average Order Value (AOV) by prioritizing high-margin beverages, extra cheese, dips, and sides.
 */
export function rankUpsellCandidates(params: {
  items: RawUpsellItem[];
  categories: RawUpsellCategory[];
  cartItemIds: string[];
  cartAddonIds: string[];
  addonsForCartItems: RawUpsellAddon[];
  isVegOnly?: boolean;
}): CheckoutUpsellItem[] {
  const candidates: CheckoutUpsellItem[] = [];
  const catMap = new Map(params.categories.map((c) => [c.id, c.name_en.toLowerCase()]));

  // 1. Process direct item add-ons (e.g. Extra Cheese, Gourmet Dips)
  for (const addon of params.addonsForCartItems) {
    if (params.cartAddonIds.includes(addon.addonId)) continue;

    const lowerName = addon.addonName.toLowerCase();
    const lowerGroup = addon.groupName.toLowerCase();
    let score = 110;
    let reason = "Popular Add-on";
    let badge = "Add-on";

    if (lowerName.includes("cheese") || lowerGroup.includes("cheese")) {
      score = 145;
      reason = "Add Extra Cheese";
      badge = "High Margin";
    } else if (
      lowerName.includes("dip") ||
      lowerName.includes("sauce") ||
      lowerName.includes("mayo") ||
      lowerName.includes("chutney")
    ) {
      score = 135;
      reason = "Gourmet Dip / Sauce";
      badge = "Popular Pairing";
    }

    if (addon.addonPricePaise <= 5000) score += 30;
    else if (addon.addonPricePaise <= 10000) score += 15;

    candidates.push({
      id: `addon:${addon.addonId}:${addon.itemId}`,
      type: "addon",
      itemId: addon.itemId,
      variantId: null,
      addonId: addon.addonId,
      name: addon.addonName,
      pricePaise: addon.addonPricePaise,
      veg: true,
      reason,
      badge,
      marginScore: score,
    });
  }

  // 2. Process standalone high-margin impulse items (Cold Beverages, Sides, Desserts)
  const BEVERAGE_REGEX = /beverage|drink|cold drink|cola|coke|pepsi|sprite|thums up|fanta|lemonade|lassi|chaas|juice|shake|iced tea|coffee|soda|water/i;
  const TOPPING_REGEX = /cheese|extra cheese|dip|sauce|mayo|chutney|butter/i;
  const SIDES_REGEX = /fries|french fries|garlic bread|papad|raita|salad|roti|naan|side|wedges|nuggets|snack/i;
  const DESSERT_REGEX = /dessert|sweet|ice cream|brownie|gulab jamun|cake|pastry|kheer|mishti|halwa/i;

  for (const item of params.items) {
    if (!item.available) continue;
    if (params.cartItemIds.includes(item.id)) continue;
    if (params.isVegOnly && !item.veg) continue;

    const catName = catMap.get(item.category_id) || "";
    const textToMatch = `${item.name_en} ${catName} ${item.description_en || ""}`.toLowerCase();

    let baseScore = 40;
    let reason = "Chef's Recommendation";
    let badge = "Recommended";

    if (BEVERAGE_REGEX.test(textToMatch)) {
      baseScore = 130;
      reason = "Add a Cold Beverage";
      badge = "High Margin";
    } else if (TOPPING_REGEX.test(textToMatch)) {
      baseScore = 125;
      reason = "Add Extra Cheese & Dips";
      badge = "Popular Pairing";
    } else if (SIDES_REGEX.test(textToMatch)) {
      baseScore = 105;
      reason = "Complete Your Meal";
      badge = "Best Value";
    } else if (DESSERT_REGEX.test(textToMatch)) {
      baseScore = 100;
      reason = "Sweet Meal Finisher";
      badge = "Sweet Treat";
    }

    // Price elasticity & impulse factor:
    // Low friction items under ₹60 convert effortlessly without budget friction
    if (item.base_price_paise <= 6000) {
      baseScore += 45;
    } else if (item.base_price_paise <= 12000) {
      baseScore += 25;
    } else if (item.base_price_paise <= 20000) {
      baseScore += 10;
    } else {
      // Main meals > ₹200 are not checkout impulse add-ons
      baseScore -= 40;
    }

    if (item.bestseller) {
      baseScore += 25;
    }

    candidates.push({
      id: `item:${item.id}`,
      type: "item",
      itemId: item.id,
      variantId: null,
      name: item.name_en,
      description: item.description_en,
      pricePaise: item.base_price_paise,
      imageUrl: item.image_url,
      veg: item.veg,
      categoryName: catName,
      reason,
      badge,
      marginScore: baseScore,
    });
  }

  // Sort descending by algorithmic margin score and take top 4
  candidates.sort((a, b) => b.marginScore - a.marginScore);
  return candidates.slice(0, 4);
}
