import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { loadConfig } from "@/lib/server/load-config";
import { distanceKm, travelMinutes } from "@/lib/geo";
import { isOpenNow, localMinutesNow, type HourWindow } from "@/lib/hours";
import type { RestaurantDetail, MenuCategoryView, RestaurantCard } from "@/lib/market-types";

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
  return map;
}

// @ts-ignore
export const Route = createFileRoute("/api/restaurant")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const slug = url.searchParams.get("slug") || "";
          const lat = parseFloat(url.searchParams.get("lat") || "0");
          const lng = parseFloat(url.searchParams.get("lng") || "0");
          const lang = url.searchParams.get("lang") || "en";

          const cfg = await loadConfig();
          const sql = await getSql();
          
          const rows = await sql.query<any>(
            `SELECT r.id, r.slug, r.name, r.description_en, r.description_bn, r.cover_image, r.cuisine_summary,
                    r.veg_only, r.rating_avg, r.rating_count, r.prep_minutes, r.min_order_paise, r.promoted, r.data_label,
                    o.id as outlet_id, o.zone_id, z.name as zone_name, o.address_line, o.area, o.lat, o.lng, o.open_override,
                    z.delivery_base_paise, z.delivery_per_km_paise, z.delivery_free_over_paise
             FROM restaurants r
             JOIN restaurant_outlets o ON o.restaurant_id = r.id AND o.active = true
             JOIN service_zones z ON z.id = o.zone_id
             WHERE r.slug = $1 AND r.active = true LIMIT 1`,
            [slug]
          );
          
          const row = rows[0];
          if (!row) return new Response(JSON.stringify({ restaurant: null }), { status: 200, headers: { "content-type": "application/json" } });

          const hours = await loadHours();
          const promos = await sql<{ name_en: string; restaurant_id: string | null }>`
            select name_en, restaurant_id from promotions where active = true
          `;
          const offer = promos.find((p) => !p.restaurant_id || p.restaurant_id === row.id);
          
          const dist = distanceKm({ lat, lng }, { lat: row.lat, lng: row.lng });
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

          const cats = await sql<{ id: string; name_en: string; name_bn: string }>`
            select id, name_en, name_bn from menu_categories where restaurant_id = ${row.id} order by sort_order
          `;
          const items = await sql<{
            id: string; category_id: string; name_en: string; name_bn: string; description_en: string;
            description_bn: string; image_url: string | null; veg: boolean; spicy_level: number;
            bestseller: boolean; available: boolean; base_price_paise: number;
          }>`
            select id, category_id, name_en, name_bn, description_en, description_bn, image_url, veg, spicy_level,
                   bestseller, available, base_price_paise
            from menu_items where restaurant_id = ${row.id} order by sort_order
          `;
          const variants = await sql<{
            id: string; item_id: string; name_en: string; name_bn: string; price_paise: number;
            is_default: boolean; available: boolean;
          }>`select id, item_id, name_en, name_bn, price_paise, is_default, available from menu_variants order by sort_order`;
          const groups = await sql<{
            id: string; item_id: string; name_en: string; name_bn: string; required: boolean;
            min_select: number; max_select: number;
          }>`select id, item_id, name_en, name_bn, required, min_select, max_select from addon_groups`;
          const addons = await sql<{
            id: string; group_id: string; name_en: string; name_bn: string; price_paise: number; available: boolean;
          }>`select id, group_id, name_en, name_bn, price_paise, available from addons`;

          const windows = hours.get(row.outlet_id) ?? [];
          const { weekday } = localMinutesNow(cfg.business.timezone);
          const today = windows.find((w: any) => w.weekday === weekday) ?? windows[0];
          const hoursLabel = today
            ? `${String(Math.floor(today.openMinute / 60)).padStart(2, "0")}:${String(today.openMinute % 60).padStart(2, "0")} – ${String(Math.floor(today.closeMinute / 60)).padStart(2, "0")}:${String(today.closeMinute % 60).padStart(2, "0")}`
            : "";

          const categories: MenuCategoryView[] = cats.map((c) => ({
            id: c.id,
            name: lang === "bn" ? c.name_bn : c.name_en,
            items: items
              .filter((it) => it.category_id === c.id)
              .map((it) => ({
                id: it.id,
                name: lang === "bn" ? it.name_bn : it.name_en,
                description: lang === "bn" ? it.description_bn : it.description_en,
                imageUrl: it.image_url,
                veg: it.veg,
                spicyLevel: it.spicy_level,
                bestseller: it.bestseller,
                available: it.available,
                basePricePaise: it.base_price_paise,
                variants: variants
                  .filter((v) => v.item_id === it.id)
                  .map((v) => ({
                    id: v.id,
                    name: lang === "bn" ? v.name_bn : v.name_en,
                    pricePaise: v.price_paise,
                    isDefault: v.is_default,
                    available: v.available,
                  })),
                addonGroups: groups
                  .filter((g) => g.item_id === it.id)
                  .map((g) => ({
                    id: g.id,
                    name: lang === "bn" ? g.name_bn : g.name_en,
                    required: g.required,
                    minSelect: g.min_select,
                    maxSelect: g.max_select,
                    addons: addons
                      .filter((a) => a.group_id === g.id)
                      .map((a) => ({
                        id: a.id,
                        name: lang === "bn" ? a.name_bn : a.name_en,
                        pricePaise: a.price_paise,
                        available: a.available,
                      })),
                  })),
              })),
          }));

          const detail: RestaurantDetail = {
            card,
            description: lang === "bn" ? row.description_bn : row.description_en,
            outletId: row.outlet_id,
            addressLine: row.address_line,
            area: row.area,
            hoursLabel,
            categories,
          };
          return new Response(JSON.stringify({ restaurant: detail }), { status: 200, headers: { "content-type": "application/json" } });
        } catch (error) {
          console.error("GET /api/restaurant error:", error);
          return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },
    },
  },
});
