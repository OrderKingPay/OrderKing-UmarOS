import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import {
  rankUpsellCandidates,
  type CheckoutUpsellRequest,
  type RawUpsellItem,
  type RawUpsellCategory,
  type RawUpsellAddon,
} from "@/lib/upsell-logic";

export * from "@/lib/upsell-logic";

export const getCheckoutUpsells = createServerFn({ method: "POST" })
  .validator((input: CheckoutUpsellRequest) => input)
  .handler(async ({ data }: any) => {
    const sql = await getSql();
    if (!data.restaurantId) return { upsells: [] };

    // Fetch live menu items for this restaurant
    const items = await sql<RawUpsellItem>`
      select id, category_id, name_en, name_bn, description_en, image_url, veg, bestseller, available, base_price_paise
      from menu_items
      where restaurant_id = ${data.restaurantId} and available = true
      order by sort_order asc
    `;

    // Fetch categories for this restaurant
    const categories = await sql<RawUpsellCategory>`
      select id, name_en
      from menu_categories
      where restaurant_id = ${data.restaurantId}
      order by sort_order asc
    `;

    // Fetch available add-ons linked to the items currently in the cart
    const itemIdsInCart = data.cartItemIds || [];
    const addonsForCartItems: RawUpsellAddon[] = [];

    if (itemIdsInCart.length > 0) {
      const groups = await sql<{ id: string; item_id: string; name_en: string }>`
        select id, item_id, name_en from addon_groups
      `;
      const relevantGroups = groups.filter((g) => itemIdsInCart.includes(g.item_id));
      if (relevantGroups.length > 0) {
        const groupIds = relevantGroups.map((g) => g.id);
        const addons = await sql<{ id: string; group_id: string; name_en: string; price_paise: number; available: boolean }>`
          select id, group_id, name_en, price_paise, available from addons where available = true
        `;
        const relevantAddons = addons.filter((a) => groupIds.includes(a.group_id));
        for (const addon of relevantAddons) {
          const g = relevantGroups.find((rg) => rg.id === addon.group_id);
          if (g) {
            addonsForCartItems.push({
              addonId: addon.id,
              groupId: g.id,
              itemId: g.item_id,
              addonName: addon.name_en,
              addonPricePaise: addon.price_paise,
              groupName: g.name_en,
            });
          }
        }
      }
    }

    const upsells = rankUpsellCandidates({
      items,
      categories,
      cartItemIds: data.cartItemIds || [],
      cartAddonIds: data.cartAddonIds || [],
      addonsForCartItems,
      isVegOnly: data.isVegOnly,
    });

    return { upsells };
  });
