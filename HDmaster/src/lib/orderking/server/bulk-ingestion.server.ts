import type { Sql } from "../../db.ts";

export type IngestionRestaurant = {
  name: string;
  cuisine: string;
  address?: string;
  zoneCode: string;
  lat?: number;
  lng?: number;
  phone?: string;
  ratingBps?: number;
  commissionBps?: number;
  avgPrepMinutes?: number;
  menuItems: Array<{
    name: string;
    description?: string;
    pricePaise: number;
    category?: string;
    isVeg?: boolean;
    imageUrl?: string;
  }>;
};

export type IngestionReport = {
  restaurantsIngested: number;
  menuItemsIngested: number;
  zonesUpdated: string[];
  durationMs: number;
  errors: string[];
};

/**
 * High-Speed Bulk Catalog Ingestion Engine
 * Capable of importing thousands of restaurants and menus scraped/extracted from
 * Google Places, FSSAI registries, or partner POS systems into Order King's database.
 */
export async function bulkIngestCatalog(
  sql: Sql,
  orgId: string,
  catalog: IngestionRestaurant[]
): Promise<IngestionReport> {
  const start = Date.now();
  let restaurantsIngested = 0;
  let menuItemsIngested = 0;
  const zones = new Set<string>();
  const errors: string[] = [];

  for (const r of catalog) {
    try {
      const restId = `rest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      zones.add(r.zoneCode);

      // 1. Insert Restaurant record
      await sql`
        INSERT INTO restaurants (
          id, org_id, name, cuisine, status, zone_code, commission_bps, rating_bps,
          lat, lng, kyc_status, onboarding_step, avg_prep_minutes, version, created_at
        ) VALUES (
          ${restId},
          ${orgId},
          ${r.name},
          ${r.cuisine},
          'ACTIVE',
          ${r.zoneCode},
          ${r.commissionBps ?? 1000}, -- 10% default
          ${r.ratingBps ?? 4500},     -- 4.5 stars default
          ${r.lat ?? 24.8333},
          ${r.lng ?? 92.7789},
          'APPROVED',
          'COMPLETED',
          ${r.avgPrepMinutes ?? 18},
          1,
          now()
        );
      `;
      restaurantsIngested++;

      // 2. Insert Menu Items in batch
      for (const item of r.menuItems) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await sql`
          INSERT INTO menu_items (
            id, org_id, restaurant_id, name, description, price_paise, category, is_available, created_at
          ) VALUES (
            ${itemId},
            ${orgId},
            ${restId},
            ${item.name},
            ${item.description || ''},
            ${item.pricePaise},
            ${item.category || r.cuisine},
            true,
            now()
          );
        `;
        menuItemsIngested++;
      }
    } catch (err) {
      errors.push(`Failed ingesting ${r.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    restaurantsIngested,
    menuItemsIngested,
    zonesUpdated: Array.from(zones),
    durationMs: Date.now() - start,
    errors,
  };
}

/**
 * Normalizes external scraped menu JSON from Google Maps / Zomato / Swiggy public structures
 * into Order King's canonical ingestion format.
 */
export function normalizeScrapedMenu(rawData: Record<string, unknown>): IngestionRestaurant {
  const name = String(rawData.name || "Unnamed Restaurant");
  const cuisine = String(rawData.cuisine || rawData.primaryCuisine || "Multi-Cuisine");
  const zoneCode = String(rawData.zoneCode || rawData.zone || "ZONE_1");
  const lat = typeof rawData.lat === "number" ? rawData.lat : 24.8333;
  const lng = typeof rawData.lng === "number" ? rawData.lng : 92.7789;

  const rawItems = Array.isArray(rawData.items) ? rawData.items : [];
  const menuItems = rawItems.map((it: Record<string, unknown>) => {
    let price = 15000; // default 150 INR in paise
    if (typeof it.pricePaise === "number") {
      price = it.pricePaise;
    } else if (typeof it.price === "number") {
      price = Math.round(it.price * 100);
    }

    return {
      name: String(it.name || "Dish"),
      description: typeof it.description === "string" ? it.description : "",
      pricePaise: price,
      category: typeof it.category === "string" ? it.category : cuisine,
      isVeg: Boolean(it.isVeg),
      imageUrl: typeof it.imageUrl === "string" ? it.imageUrl : undefined,
    };
  });

  return {
    name,
    cuisine,
    zoneCode,
    lat,
    lng,
    menuItems,
  };
}
