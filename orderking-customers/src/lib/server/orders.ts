import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { newId, publicOrderCode } from "@/lib/ids";
import { canTransition, customerMayCancel, SIMULATED_ADVANCE, type OrderStatus } from "@/lib/orders/state";
import type { CartLineInput, OrderDetail, OrderSummary } from "@/lib/market-types";
import { loadConfig } from "./load-config";
import { buildQuote } from "./quote";
import { cancelOrderViaHDmaster } from "./hdmaster-orders";
const buckets = new Map<string, number[]>();
function rateLimit(key: string, n: number, windowMs: number): boolean { const now = Date.now(); const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs); if (arr.length >= n) return false; arr.push(now); buckets.set(key, arr); return true; }
async function isFirstOrder(userId: string): Promise<boolean> { const sql = await getSql(); const rows = await sql<{ c: number }>`select count(*)::int as c from orders where user_id = ${userId} and status not in ('FAILED_PAYMENT','CANCELLED')`; return (rows[0]?.c ?? 0) === 0; }
async function writeEvent(orderId: string, fromStatus: string | null, toStatus: string, actorUserId: string, actorRole: string, note?: string) { const sql = await getSql(); await sql`insert into order_events (id, order_id, from_status, to_status, actor_user_id, actor_role, note) values (${newId("oev")}, ${orderId}, ${fromStatus}, ${toStatus}, ${actorUserId}, ${actorRole}, ${note ?? null})`; }
export const placeOrder = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input: { restaurantId: string; zoneId: string; lat: number; lng: number; coupon?: string | null; tipPaise?: number; lines: CartLineInput[]; address: { line1: string; area: string; landmark?: string; instructions?: string; label?: string }; paymentMethod: "COD" | "UPI_SANDBOX" | "KING_PAY" | "RAZORPAY"; notes?: string; idempotencyKey: string }) => input).handler(async ({ context, data }) => {
  if (!rateLimit(`order:${context.userId}`, 5, 60_000)) throw new Error("Too many order attempts. Wait a minute.");
  if (!data.address.line1.trim()) throw new Error("Delivery address is required.");
  if (data.lines.length === 0) throw new Error("Cart is empty.");
  const cfg = await loadConfig();
  const production = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (production && cfg.marketplace.launchMode !== "live") {
    throw new Error("Order placement is unavailable until HDmaster live mode is connected.");
  }
  if (production && data.paymentMethod === "UPI_SANDBOX") {
    throw new Error("Sandbox UPI is not available in production.");
  }
  const sql = await getSql();
  const existing = await sql<{ id: string; public_id: string }>`select id, public_id from orders where idempotency_key = ${data.idempotencyKey} and user_id = ${context.userId}`; if (existing[0]) return { orderId: existing[0].id, publicId: existing[0].public_id, duplicate: true }; const first = await isFirstOrder(context.userId); const built = await buildQuote({ restaurantId: data.restaurantId, zoneId: data.zoneId, lat: data.lat, lng: data.lng, coupon: data.coupon, lines: data.lines }, first); if (built.result.quote.blockers.length) throw new Error(`Order blocked: ${built.result.quote.blockers.join(", ")}`); if (cfg.marketplace.launchMode === "live") {
      const { hdmasterConfig } = await import("./hdmaster-orders");
      const { baseUrl, token } = hdmasterConfig();
      const payload = {
        customerRef: context.userId,
        restaurantId: built.restaurantId,
        cityId: "city_1", // default city since customer app has none yet
        zoneId: built.zoneId,
        paymentMethod: data.paymentMethod,
        foodPaise: built.result.quote.foodSubtotalPaise,
        restaurantDiscountPaise: built.result.quote.restaurantDiscountPaise,
        platformDiscountPaise: built.result.quote.platformDiscountPaise,
        deliveryFeePaise: built.result.quote.deliveryFeePaise,
        serviceFeePaise: built.result.quote.serviceFeePaise,
        taxPaise: built.result.quote.taxPaise,
        totalPaise: built.result.quote.totalPaise + (data.tipPaise || 0),
        commissionPaise: built.result.quote.commissionPaise,
        address: data.address,
        notes: data.notes,
        lines: built.pricedLines.map(l => ({ itemId: l.itemId, name: l.name, qty: l.quantity, unitPaise: l.unitPaise }))
      };
      const res = await fetch(baseUrl + "/v1/admin/customer-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token, "Idempotency-Key": data.idempotencyKey },
          body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("Failed to create order on HDmaster", errorText);
        throw new Error("Failed to place order in live mode. Server says: " + errorText);
      }
      const created = await res.json();
      return { orderId: created.data.orderId, publicId: created.data.publicId, duplicate: false, deliveryOtp: created.data.deliveryOtp };
    } throw new Error("Order placement requires the live HDmaster order path. Sample/local order creation is disabled.");
  });

export const reorderItems = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string }) => input)
  .handler(async ({ context, data }) => {
    const cfg = await loadConfig();
    let restaurantId: string;
    let items: { item_id: string; variant_id: string | null; quantity: number; instructions: string | null }[] = [];
    
    if (cfg.marketplace.launchMode === "live") {
      const { hdmasterConfig } = await import("./hdmaster-orders");
      const { baseUrl, token } = hdmasterConfig();
      const res = await fetch(`${baseUrl}/v1/admin/customer-orders/${data.orderId}?customerRef=${context.userId}`, { headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Order not found");
      const payload = await res.json();
      restaurantId = payload.data.order.restaurantId;
      // Note: we need the menu item IDs, but HDmaster API currently only returns the item name in its summary!
      // This is a gap in the API because we only returned `name`, `qty`, `unit_paise`.
      // We will have to update HDmaster handleCustomerOrderDetailHttp to return `menu_item_id` as well.
      items = payload.data.order.items.map((i: any) => ({
        item_id: i.itemId,
        variant_id: null,
        quantity: i.quantity,
        instructions: null
      }));
    } else {
      const order = await getOwnedOrder(context.userId, data.orderId);
      if (!order) throw new Error("Order not found");
      restaurantId = order.restaurant_id;
      const sql = await getSql();
      items = await sql<{
        item_id: string;
        variant_id: string | null;
        quantity: number;
        instructions: string | null;
      }>`select item_id, variant_id, quantity, instructions from order_items where order_id = ${order.id}`;
    }

    const sql = await getSql();
    const rst = await sql<{ id: string; name: string; slug: string }>`
      select id, name, slug from restaurants where id = ${restaurantId}
    `;
    const restaurant = rst[0];
    if (!restaurant) throw new Error("Restaurant no longer available");

    const lines: CartLineInput[] = items.map((it) => ({
      itemId: it.item_id,
      variantId: it.variant_id,
      addonIds: [],
      quantity: it.quantity,
      instructions: it.instructions ?? "",
    }));

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
      lines,
    };
  });





