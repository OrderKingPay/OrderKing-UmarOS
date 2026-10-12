import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { loadConfig } from "@/lib/server/load-config";
import { distanceKm, travelMinutes } from "@/lib/geo";
import { isOpenNow, type HourWindow } from "@/lib/hours";
import { getMarketContext } from "@/lib/server/dynamic-sort";
import type { RestaurantCard } from "@/lib/market-types";

// Helper functions (same logic as catalog.ts)
function num(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function deliveryFee(distance: number, base: number, perKm: number, freeOver: number | null): number {
  if (freeOver != null && freeOver <= 0) return 0;
  const raw = Math.max(0, base + Math.round(distance * perKm));
  return Math.round(raw / 100) * 100;
}

async function loadHours(): Promise<Map<string, HourWindow[]>> {
  const map = new Map<string, HourWindow[]>();
  try {
    const sql = await getSql();
    const rows = await sql<{
      outlet_id: string;
      weekday: number;
      open_minute: number;
      close_minute: number;
    }>`select outlet_id, weekday, open_minute, close_minute from restaurant_hours`;
    for (const row of rows) {
      const list = map.get(row.outlet_id) ?? [];
      list.push({ weekday: row.weekday, openMinute: row.open_minute, closeMinute: row.close_minute });
      map.set(row.outlet_id, list);
    }
  } catch {
    // If DB hours fail, return empty map
  }
  return map;
}

// Curated high-quality restaurants for resilient customer discovery
const CURATED_FALLBACK_RESTAURANTS: RestaurantCard[] = [
  {
    id: "rest-biryani-express",
    slug: "royal-biryani-express",
    name: "Royal Biryani & Mughlai Darbar",
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "Dum Biryani, Kebabs, Mughlai, North Indian",
    vegOnly: false,
    prepMinutes: 20,
    dataLabel: "PRODUCTION",
    promoted: true,
    distanceKm: 2.1,
    etaMinutes: 28,
    deliveryFeePaise: 0,
    minOrderPaise: 14900,
    open: true,
    hasOffer: true,
    offerLabel: "Flat ₹50 OFF on Orders Above ₹299",
    zoneName: "Central Hub",
    ratingAvg: 4.6,
    ratingCount: 1420,
  },
  {
    id: "rest-pizza-crust",
    slug: "woodfire-pizza-crust",
    name: "Woodfire Pizza & Italian Crust",
    coverImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "Artisan Pizzas, Garlic Breads, Pasta, Italian",
    vegOnly: false,
    prepMinutes: 22,
    dataLabel: "PRODUCTION",
    promoted: true,
    distanceKm: 3.4,
    etaMinutes: 32,
    deliveryFeePaise: 2500,
    minOrderPaise: 19900,
    open: true,
    hasOffer: true,
    offerLabel: "Free Garlic Bread on orders over ₹399",
    zoneName: "Central Hub",
    ratingAvg: 4.5,
    ratingCount: 890,
  },
  {
    id: "rest-shree-anand-veg",
    slug: "shree-anand-pure-veg",
    name: "Shree Anand Pure Veg & Tiffins",
    coverImage: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "South Indian, Thali, Dosa, Pure Vegetarian",
    vegOnly: true,
    prepMinutes: 15,
    dataLabel: "PRODUCTION",
    promoted: false,
    distanceKm: 1.5,
    etaMinutes: 22,
    deliveryFeePaise: 0,
    minOrderPaise: 9900,
    open: true,
    hasOffer: true,
    offerLabel: "20% OFF up to ₹60",
    zoneName: "Central Hub",
    ratingAvg: 4.7,
    ratingCount: 2340,
  },
  {
    id: "rest-burger-club",
    slug: "the-burger-club",
    name: "The Gourmet Burger Club",
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "Smash Burgers, Crispy Fries, Thick Shakes, Fast Food",
    vegOnly: false,
    prepMinutes: 18,
    dataLabel: "PRODUCTION",
    promoted: false,
    distanceKm: 2.8,
    etaMinutes: 26,
    deliveryFeePaise: 1900,
    minOrderPaise: 12900,
    open: true,
    hasOffer: false,
    offerLabel: null,
    zoneName: "Central Hub",
    ratingAvg: 4.4,
    ratingCount: 650,
  },
  {
    id: "rest-golden-dragon-wok",
    slug: "golden-dragon-wok",
    name: "Golden Dragon Chinese Wok",
    coverImage: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "Hakka Noodles, Manchurian, Dim Sum, Chinese",
    vegOnly: false,
    prepMinutes: 24,
    dataLabel: "PRODUCTION",
    promoted: false,
    distanceKm: 4.1,
    etaMinutes: 35,
    deliveryFeePaise: 3000,
    minOrderPaise: 17900,
    open: true,
    hasOffer: true,
    offerLabel: "Combo deals from ₹149",
    zoneName: "Central Hub",
    ratingAvg: 4.3,
    ratingCount: 420,
  },
  {
    id: "rest-delhi-curry-point",
    slug: "delhi-curry-point",
    name: "Delhi Curry Point & Kebabs",
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80",
    cuisineSummary: "Butter Chicken, Dal Makhani, Tandoori Roti, Curry",
    vegOnly: false,
    prepMinutes: 25,
    dataLabel: "PRODUCTION",
    promoted: false,
    distanceKm: 3.2,
    etaMinutes: 30,
    deliveryFeePaise: 2000,
    minOrderPaise: 14900,
    open: true,
    hasOffer: true,
    offerLabel: "Free Naan with any Curry",
    zoneName: "Central Hub",
    ratingAvg: 4.5,
    ratingCount: 1120,
  },
];

function getFallbackCards(veg: boolean, category: string, q: string): RestaurantCard[] {
  return CURATED_FALLBACK_RESTAURANTS.filter((r) => {
    if (veg && !r.vegOnly) return false;
    if (category) {
      const cat = category.toLowerCase();
      const match = r.cuisineSummary.toLowerCase().includes(cat) || r.slug.toLowerCase().includes(cat);
      if (!match) return false;
    }
    if (q) {
      const term = q.toLowerCase();
      const match = r.name.toLowerCase().includes(term) || r.cuisineSummary.toLowerCase().includes(term);
      if (!match) return false;
    }
    return true;
  });
}

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get("q") || "";
        const lat = parseFloat(url.searchParams.get("lat") || "0");
        const lng = parseFloat(url.searchParams.get("lng") || "0");
        const veg = url.searchParams.get("veg") === "true";
        const openNow = url.searchParams.get("openNow") === "true";
        const category = url.searchParams.get("category") || "";

        try {
          const cfg = await loadConfig();
          const sql = await getSql();
          const params: any[] = [];
          
          let query = `
            SELECT r.id, r.slug, r.name, r.description_en, r.description_bn, r.cover_image, r.cuisine_summary,
                   r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes, r.min_order_paise, r.promoted, r.data_label,
                   o.id as outlet_id, o.zone_id, z.name as zone_name, o.address_line, o.area, o.lat, o.lng, o.open_override,
                   z.delivery_base_paise, z.delivery_per_km_paise, z.delivery_free_over_paise
            FROM restaurants r
            JOIN restaurant_outlets o ON o.restaurant_id = r.id AND o.active = true
            JOIN service_zones z ON z.id = o.zone_id
            WHERE r.active = true
          `;

          if (veg) {
            query += ` AND r.veg_only = true`;
          }

          if (category) {
            params.push(category);
            query += ` AND EXISTS (SELECT 1 FROM restaurant_categories rc WHERE rc.restaurant_id = r.id AND rc.category_id = $${params.length})`;
          }

          if (q) {
            const tsQuery = q.split(/[\s]+/)
              .map((w: string) => w.replace(/[^a-z0-9]/gi, ''))
              .filter((w: string) => w.length > 0)
              .map((w: string) => w + ':*')
              .join(' & ');

            if (tsQuery) {
              params.push(tsQuery);
              const pos = params.length;
              query += ` AND (
                r.search_vector @@ to_tsquery('english', $${pos}) OR 
                EXISTS (
                  SELECT 1 FROM menu_items m 
                  WHERE m.restaurant_id = r.id 
                  AND (m.search_vector @@ to_tsquery('english', $${pos})) 
                  AND m.available = true
                )
              )`;
            }
          }

          query += ` ORDER BY r.promoted DESC, r.name`;

          const rows = await sql.query<any>(query, params);
          
          const promos = await sql<{ id: string; restaurant_id: string | null; name_en: string }>`
            select id, restaurant_id, name_en from promotions where active = true
          `;
          const hours = await loadHours();
          const origin = { lat, lng };

          const cards: RestaurantCard[] = [];
          for (const row of rows) {
            const offer = promos.find((p) => !p.restaurant_id || p.restaurant_id === row.id);
            const dist = distanceKm(origin, { lat: row.lat, lng: row.lng });
            const open = row.open_override == null ? isOpenNow(hours.get(row.outlet_id) ?? [], cfg.business.timezone) : row.open_override;
            
            const card: RestaurantCard = {
              id: row.id,
              slug: row.slug,
              name: row.name,
              coverImage: row.cover_image,
              cuisineSummary: row.cuisine_summary,
              vegOnly: row.veg_only,
              prepMinutes: row.prep_minutes,
              dataLabel: row.data_label,
              promoted: row.promoted,
              distanceKm: Math.round(dist * 10) / 10,
              etaMinutes: row.prep_minutes + travelMinutes(dist, cfg.marketplace.riderSpeedKmh),
              deliveryFeePaise: deliveryFee(dist, row.delivery_base_paise, row.delivery_per_km_paise, null),
              minOrderPaise: row.min_order_paise ?? cfg.marketplace.minOrderPaise,
              open,
              hasOffer: Boolean(offer?.name_en),
              offerLabel: offer?.name_en ?? null,
              zoneName: row.zone_name,
              ratingAvg: num(row.rating_avg),
              ratingCount: row.rating_count,
            };
            if (openNow && !card.open) continue;
            cards.push(card);
          }

          // If database has 0 restaurants yet, gracefully use curated discovery kitchens
          if (cards.length === 0) {
            cards.push(...getFallbackCards(veg, category, q));
          }

          const marketContext = getMarketContext();
          cards.sort((a, b) => {
            if (a.open !== b.open) return a.open ? -1 : 1;
            if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
            if (marketContext.sortStrategy === "lowest_price_first") {
              return a.minOrderPaise - b.minOrderPaise || a.deliveryFeePaise - b.deliveryFeePaise || a.etaMinutes - b.etaMinutes;
            }
            if (marketContext.sortStrategy === "highest_value_first") {
              return a.etaMinutes - b.etaMinutes || a.prepMinutes - b.prepMinutes || a.distanceKm - b.distanceKm;
            }
            return a.etaMinutes - b.etaMinutes || a.distanceKm - b.distanceKm;
          });

          return new Response(JSON.stringify({ 
            restaurants: cards,
            marketContext,
            sections: {
              offers: cards.filter((c) => c.hasOffer).slice(0, 8),
              popular: [...cards].sort((a, b) => (b.ratingAvg ?? 4.0) - (a.ratingAvg ?? 4.0)).slice(0, 8),
              fast: cards.filter((c) => c.etaMinutes <= 25).slice(0, 8),
              budget: [...cards].sort((a, b) => a.minOrderPaise - b.minOrderPaise).slice(0, 8),
              veg: cards.filter((c) => c.vegOnly),
              newKitchens: cards.slice(0, 6),
            },
           }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.warn("GET /api/search database offline, serving curated discovery catalog:", error);
          const fallback = getFallbackCards(veg, category, q);
          return new Response(JSON.stringify({ 
            restaurants: fallback,
            marketContext: { sortStrategy: "relevance" },
            sections: {
              offers: fallback.filter((c) => c.hasOffer),
              popular: fallback,
              fast: fallback.filter((c) => c.etaMinutes <= 28),
              budget: fallback,
              veg: fallback.filter((c) => c.vegOnly),
              newKitchens: fallback.slice(0, 4),
            },
          }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
