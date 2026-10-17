import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { loadConfig } from "@/lib/server/load-config";
import { distanceKm, travelMinutes } from "@/lib/geo";
import { isOpenNow, type HourWindow } from "@/lib/hours";
import { getMarketContext } from "@/lib/server/dynamic-sort";
import type { RestaurantCard } from "@/lib/market-types";
import { searchLimiter } from "@/lib/security/rate-limiter";
import { CURATED_DISHES, filterDishes } from "@/lib/predictive-search";
import { isDeliveryActiveInLocation } from "@/lib/geo/geofence-guard";

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

export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
        const rateCheck = searchLimiter.isAllowed(clientIp);
        if (!rateCheck.allowed) {
          return new Response(
            JSON.stringify({ error: "Too many search requests. Please slow down." }),
            {
              status: 429,
              headers: {
                "content-type": "application/json",
                "Retry-After": String(Math.ceil(rateCheck.resetMs / 1000)),
              },
            }
          );
        }

        const url = new URL(request.url);
        const rawQ = url.searchParams.get("q") || "";
        const q = rawQ.trim().slice(0, 80);
        const lat = parseFloat(url.searchParams.get("lat") || "0");
        const lng = parseFloat(url.searchParams.get("lng") || "0");
        const veg = url.searchParams.get("veg") === "true";
        const openNow = url.searchParams.get("openNow") === "true";
        const category = (url.searchParams.get("category") || "").slice(0, 50);

        const unavailable = (reason: string) => new Response(JSON.stringify({
          restaurants: [], deliveryAvailable: false, reason,
          sections: { offers: [], popular: [], fast: [], budget: [], veg: [], newKitchens: [] },
        }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
        try {
          const sql = await getSql();

          if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0 ||
              lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return unavailable("Choose your delivery location to check availability.");
          }

          // Active delivery zone validation (e.g. Karimganj, Delhi NCR / Connaught Place, Mumbai, Bengaluru, etc.)
          const deliveryActive = isDeliveryActiveInLocation(lat, lng);
          if (!deliveryActive) {
            return unavailable("Verified food delivery is not available at this location yet.");
          }

          // Non-blocking telemetry check for platform launch controls
          let publicLaunchAllowed = true;
          try {
            const launch = await sql.query<{
              public_launch: boolean;
              dispatch_enabled: boolean;
              rider_gps_enabled: boolean;
              payments_mode: string;
            }>(
              "select public_launch, dispatch_enabled, rider_gps_enabled, payments_mode from platform_launch_controls where org_id = $1 limit 1",
              ["org_orderking"]
            );
            if (launch.length > 0 && launch[0].public_launch === false) {
              publicLaunchAllowed = false;
            }
          } catch {
            // DB control table check should not fail-closed active catalog browsing
          }

          if (!publicLaunchAllowed) {
            return unavailable("Verified food delivery is not available at this location yet.");
          }

          // Non-blocking rider presence check: do not fail closed with empty catalog if riders are not toggled right now
          let activeRiderZones = new Set<string>();
          try {
            const eligibleRiders = await sql.query<{ zone_id: string }>(
              "select distinct zone_id from riders where online = 1 and upper(coalesce(kyc_status, '')) in ('APPROVED','VERIFIED') and data_mode = 'LIVE'"
            );
            activeRiderZones = new Set(eligibleRiders.map((r) => r.zone_id));
          } catch {
            // Non-blocking
          }
          const cfg = await loadConfig();
          const params: any[] = [];
          
          let query = `
            SELECT r.id, r.slug, r.name, r.description_en, r.description_bn, r.cover_image, r.cuisine_summary,
                   r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes, r.min_order_paise, r.promoted, r.data_label,
                   o.id as outlet_id, o.zone_id, z.name as zone_name, o.address_line, o.area, o.lat, o.lng, o.open_override,
                   z.delivery_base_paise, z.delivery_per_km_paise, z.delivery_free_over_paise
            FROM restaurants r
            JOIN restaurant_outlets o ON o.restaurant_id = r.id AND o.active = true
            JOIN service_zones z ON z.id = o.zone_id
            WHERE r.active = true AND upper(coalesce(r.kyc_status, '')) in ('APPROVED','VERIFIED') AND r.data_mode = 'LIVE'
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
            
            // Set default delivery estimate (e.g. 25-30m) so users can browse dishes and menus without seeing '0 places'
            const prep = row.prep_minutes || 15;
            const travel = travelMinutes(dist, cfg.marketplace.riderSpeedKmh);
            const etaMinutes = Math.max(25, Math.min(60, prep + (travel > 0 ? travel : 10)));

            const card: RestaurantCard = {
              id: row.id,
              slug: row.slug,
              name: row.name,
              coverImage: row.cover_image,
              cuisineSummary: row.cuisine_summary,
              vegOnly: row.veg_only,
              prepMinutes: prep,
              dataLabel: row.data_label,
              promoted: row.promoted,
              distanceKm: Math.round(dist * 10) / 10,
              etaMinutes,
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

          // Never insert fabricated catalog entries when the verified list is empty.

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

          const dishes = filterDishes(CURATED_DISHES, q, { veg, rating4Plus: false, fastDelivery: false, greatOffers: false });

          return new Response(JSON.stringify({ 
            restaurants: cards,
            dishes,
            deliveryAvailable: cards.length > 0,
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
          console.warn("GET /api/search database unavailable; no unverified restaurants will be shown.");
          const fallback: RestaurantCard[] = [];
          const fallbackDishes = filterDishes(CURATED_DISHES, q, { veg, rating4Plus: false, fastDelivery: false, greatOffers: false });
          return new Response(JSON.stringify({ 
            restaurants: fallback,
            dishes: fallbackDishes,
            deliveryAvailable: false,
            reason: "Restaurant availability cannot be verified right now.",
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
