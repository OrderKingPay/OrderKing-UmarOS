import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { isOpenNow, type HourWindow } from "@/lib/hours";
import { newId, publicOrderCode } from "@/lib/ids";
import { canTransition, customerMayCancel, SIMULATED_ADVANCE, type OrderStatus } from "@/lib/orders/state";
import type { CartLineInput, OrderDetail, OrderSummary } from "@/lib/market-types";
import { loadConfig } from "./load-config";
import { buildQuote } from "./quote";
import { cancelOrderViaHDmaster } from "./hdmaster-orders";

export const COD_MAX_PAISE = 200_000; // ₹2,000.00 statutory COD risk ceiling
export const TIP_MAX_PAISE = 100_000; // ₹1,000.00 maximum tip ceiling

export type RazorpayVerificationInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaise?: number;
};

const buckets = new Map<string, number[]>();
function rateLimit(key: string, n: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= n) return false;
  arr.push(now);
  buckets.set(key, arr);
  return true;
}

async function isFirstOrder(userId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ c: number }>`select count(*)::int as c from orders where user_id = ${userId} and status not in ('FAILED_PAYMENT','CANCELLED')`;
  return (rows[0]?.c ?? 0) === 0;
}

async function writeEvent(
  orderId: string,
  fromStatus: string | null,
  toStatus: string,
  actorUserId: string,
  actorRole: string,
  note?: string
) {
  const sql = await getSql();
  await sql`insert into order_events (id, order_id, from_status, to_status, actor_user_id, actor_role, note) values (${newId("oev")}, ${orderId}, ${fromStatus}, ${toStatus}, ${actorUserId}, ${actorRole}, ${note ?? null})`;
}

export const getCheckoutContext = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { restaurantId?: string | null }) => input)
  .handler(async ({ context, data }: any) => {
    const sql = await getSql();
    const cfg = await loadConfig();
    let walletBalancePaise = 0;
    try {
      const walletRows = await sql<{ balance_paise: number }>`
        SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} LIMIT 1
      `;
      const rawBal = Number(walletRows[0]?.balance_paise ?? 0);
      walletBalancePaise = Number.isFinite(rawBal) ? Math.max(0, Math.floor(rawBal)) : 0;
    } catch {
      walletBalancePaise = 0;
    }

    let restaurantOpen = true;
    if (data?.restaurantId) {
      const rstRows = await sql<{ id: string; active: boolean }>`
        SELECT id, active FROM restaurants WHERE id = ${data.restaurantId} LIMIT 1
      `;
      const outletRows = await sql<{ id: string; active: boolean; open_override: boolean | null }>`
        SELECT id, active, open_override FROM restaurant_outlets WHERE restaurant_id = ${data.restaurantId} AND active = true LIMIT 1
      `;
      const rst = rstRows[0];
      const outlet = outletRows[0];
      if (!rst || !rst.active || !outlet || !outlet.active) {
        restaurantOpen = false;
      } else if (outlet.open_override != null) {
        restaurantOpen = Boolean(outlet.open_override);
      } else {
        const hourRows = await sql<{ weekday: number; open_minute: number; close_minute: number }>`
          SELECT weekday, open_minute, close_minute FROM restaurant_hours WHERE outlet_id = ${outlet.id}
        `;
        const hours: HourWindow[] = hourRows.map((h) => ({
          weekday: h.weekday,
          openMinute: h.open_minute,
          closeMinute: h.close_minute,
        }));
        restaurantOpen = isOpenNow(hours, cfg.business.timezone);
      }
    }

    return {
      walletBalancePaise,
      restaurantOpen,
      codMaxPaise: COD_MAX_PAISE,
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    restaurantId: string;
    zoneId: string;
    lat: number;
    lng: number;
    coupon?: string | null;
    tipPaise?: number;
    donationPaise?: number;
    lines: CartLineInput[];
    address: { line1: string; area: string; landmark?: string; instructions?: string; label?: string };
    paymentMethod: "COD" | "UPI_SANDBOX" | "KING_PAY" | "RAZORPAY_ONLINE";
    razorpayPayment?: RazorpayVerificationInput;
    notes?: string;
    idempotencyKey: string;
  }) => input)
  .handler(async ({ context, data }: any) => {
    if (!rateLimit(`order:${context.userId}`, 5, 60_000)) throw new Error("Too many order attempts. Wait a minute.");
    if (!data.idempotencyKey || typeof data.idempotencyKey !== "string" || data.idempotencyKey.trim().length < 8) {
      throw new Error("A valid idempotency key is required.");
    }
    if (!data.address?.line1?.trim()) throw new Error("Delivery address is required.");
    if (!data.zoneId || typeof data.zoneId !== "string" || !data.zoneId.trim()) {
      throw new Error("Delivery service zone is required.");
    }
    if (
      !Number.isFinite(data.lat) ||
      !Number.isFinite(data.lng) ||
      Math.abs(data.lat) > 90 ||
      Math.abs(data.lng) > 180 ||
      (data.lat === 0 && data.lng === 0)
    ) {
      throw new Error("Valid delivery coordinates are required.");
    }
    if (!Array.isArray(data.lines) || data.lines.length === 0) throw new Error("Cart is empty.");
    for (const line of data.lines) {
      if (!line?.itemId || typeof line.itemId !== "string") {
        throw new Error("Invalid cart item identifier.");
      }
      if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) {
        throw new Error("Item quantity must be an integer between 1 and 20.");
      }
    }

    const rawTip = data.tipPaise ?? 0;
    if (!Number.isInteger(rawTip) || rawTip < 0 || rawTip > TIP_MAX_PAISE) {
      throw new Error("Tip amount must be a non-negative integer in paise (maximum ₹1,000.00).");
    }
    const tip = rawTip;

    const rawDonation = data.donationPaise ?? 0;
    if (!Number.isInteger(rawDonation) || rawDonation < 0 || rawDonation > 10_000) {
      throw new Error("Donation amount must be a non-negative integer in paise.");
    }
    const donation = rawDonation;

    // Fail closed: neither a browser toggle nor a local pilot can authorize public checkout.
    const liveSql = await getSql();
    const release = await liveSql.query<{
      public_launch: boolean;
      dispatch_enabled: boolean;
      rider_gps_enabled: boolean;
      payments_mode: string;
    }>(
      "select public_launch, dispatch_enabled, rider_gps_enabled, payments_mode from platform_launch_controls where org_id = $1 limit 1",
      ["org_orderking"]
    );
    if (
      !release[0]?.public_launch ||
      !release[0]?.dispatch_enabled ||
      !release[0]?.rider_gps_enabled ||
      release[0]?.payments_mode !== "LIVE"
    ) {
      throw new Error("Food checkout is unavailable until restaurants, riders and payments are verified for live service.");
    }

    const cfg = await loadConfig();
    const production = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
    if (production && cfg.marketplace.launchMode !== "live") {
      throw new Error("Order placement is unavailable until HDmaster live mode is connected.");
    }
    if (production && data.paymentMethod === "UPI_SANDBOX") {
      throw new Error("Sandbox UPI is not available in production.");
    }

    const sql = await getSql();
    const existing = await sql<{ id: string; public_id: string }>`
      select id, public_id from orders where idempotency_key = ${data.idempotencyKey} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      return { orderId: existing[0].id, publicId: existing[0].public_id, duplicate: true };
    }

    const first = await isFirstOrder(context.userId);
    const built = await buildQuote(
      {
        restaurantId: data.restaurantId,
        zoneId: data.zoneId,
        lat: data.lat,
        lng: data.lng,
        coupon: data.coupon,
        lines: data.lines,
      },
      first
    );
    if (!built.result.isDeliverable || built.result.quote.blockers.length > 0) {
      throw new Error(`Order blocked: ${built.result.quote.blockers.join(", ") || "UNDELIVERABLE"}`);
    }

    // Verify restaurant outlet availability and operating hours
    const outletRows = await sql<{ open_override: boolean | null; active: boolean }>`
      select open_override, active from restaurant_outlets where id = ${built.outletId} and restaurant_id = ${built.restaurantId} limit 1
    `;
    const outletRow = outletRows[0];
    if (!outletRow || !outletRow.active) {
      throw new Error("Restaurant outlet is currently unavailable.");
    }
    const hourRows = await sql<{ weekday: number; open_minute: number; close_minute: number }>`
      select weekday, open_minute, close_minute from restaurant_hours where outlet_id = ${built.outletId}
    `;
    const hours: HourWindow[] = hourRows.map((h) => ({
      weekday: h.weekday,
      openMinute: h.open_minute,
      closeMinute: h.close_minute,
    }));
    const isRestaurantOpen =
      outletRow.open_override == null
        ? isOpenNow(hours, cfg.business.timezone)
        : Boolean(outletRow.open_override);
    if (!isRestaurantOpen) {
      throw new Error("Restaurant is currently closed and not accepting orders.");
    }

    // Server-authoritative integer-paise line & total verification
    for (const pricedLine of built.pricedLines) {
      if (!pricedLine.available) {
        throw new Error(`Item is currently unavailable: ${pricedLine.name}`);
      }
      if (!Number.isInteger(pricedLine.unitPaise) || pricedLine.unitPaise <= 0) {
        throw new Error(`Invalid server-authoritative unit price for item: ${pricedLine.name}`);
      }
      if (!Number.isInteger(pricedLine.quantity) || pricedLine.quantity < 1 || pricedLine.quantity > 20) {
        throw new Error(`Invalid item quantity for: ${pricedLine.name}`);
      }
    }

    const q = built.result.quote;
    const expectedSubtotal = built.pricedLines.reduce((sum, l) => sum + l.unitPaise * l.quantity, 0);
    if (!Number.isInteger(q.foodSubtotalPaise) || q.foodSubtotalPaise !== expectedSubtotal || q.foodSubtotalPaise <= 0) {
      throw new Error("Server quote subtotal integrity check failed.");
    }
    if (
      q.restaurantDiscountPaise < 0 ||
      q.platformDiscountPaise < 0 ||
      q.restaurantDiscountPaise + q.platformDiscountPaise > q.foodSubtotalPaise
    ) {
      throw new Error("Invalid promotional discount calculation.");
    }
    const reconstructedTotal =
      q.foodSubtotalPaise -
      q.restaurantDiscountPaise -
      q.platformDiscountPaise +
      q.packagingPaise +
      q.deliveryFeePaise +
      q.serviceFeePaise +
      q.taxPaise;
    if (!Number.isInteger(q.totalPaise) || q.totalPaise !== reconstructedTotal || q.totalPaise <= 0) {
      throw new Error("Server quote total paise integrity check failed.");
    }

    const finalTotalPaise = q.totalPaise + tip + donation;
    const method = data.paymentMethod;

    // Enforce payment method rules & cryptographic verification
    if (method === "COD" && finalTotalPaise > COD_MAX_PAISE) {
      throw new Error("Cash on Delivery is only eligible for orders up to ₹2,000.00. Please pay via UPI or KingPay.");
    }

    if (method === "RAZORPAY_ONLINE") {
      const rzp = data.razorpayPayment as RazorpayVerificationInput | undefined;
      if (!rzp || !rzp.razorpayOrderId?.trim() || !rzp.razorpayPaymentId?.trim() || !rzp.razorpaySignature?.trim()) {
        throw new Error("Online payment requires a verified Razorpay order ID, payment ID, and cryptographic signature.");
      }
      if (rzp.amountPaise != null && rzp.amountPaise !== finalTotalPaise) {
        throw new Error(
          `Payment amount mismatch: gateway order is ${rzp.amountPaise} paise, server authoritative total is ${finalTotalPaise} paise.`
        );
      }
      const { verifyRazorpaySignature } = await import("./razorpay.server");
      const isValidSig = verifyRazorpaySignature({
        razorpayOrderId: rzp.razorpayOrderId,
        razorpayPaymentId: rzp.razorpayPaymentId,
        razorpaySignature: rzp.razorpaySignature,
      });
      if (!isValidSig) {
        throw new Error("Razorpay payment signature verification failed. Tampered or unverified payment rejected.");
      }
      const replayRows = await sql<{ id: string }>`
        select id from payments where idempotency_key = ${`rzp:${rzp.razorpayPaymentId}`} limit 1
      `;
      if (replayRows[0]) {
        throw new Error("Duplicate Razorpay payment ID rejected (replay protection).");
      }
    }

    if (cfg.marketplace.launchMode === "live") {
      const { hdmasterConfig } = await import("./hdmaster-orders");
      const { baseUrl, token } = hdmasterConfig();
      const payload = {
        customerRef: context.userId,
        restaurantId: built.restaurantId,
        cityId: "city_1",
        zoneId: built.zoneId,
        paymentMethod: method,
        foodPaise: q.foodSubtotalPaise,
        restaurantDiscountPaise: q.restaurantDiscountPaise,
        platformDiscountPaise: q.platformDiscountPaise,
        deliveryFeePaise: q.deliveryFeePaise,
        serviceFeePaise: q.serviceFeePaise,
        taxPaise: q.taxPaise,
        totalPaise: finalTotalPaise,
        commissionPaise: q.commissionPaise,
        address: data.address,
        notes: data.notes,
        lines: built.pricedLines.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.quantity, unitPaise: l.unitPaise })),
      };
      const res = await fetch(baseUrl + "/v1/admin/customer-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          "Idempotency-Key": data.idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error");
        console.error("Failed to create order on HDmaster", errorText);
        throw new Error("Failed to place order in live mode. Server says: " + errorText);
      }
      const created = await res.json();
      return {
        orderId: created.data.orderId,
        publicId: created.data.publicId,
        duplicate: false,
        deliveryOtp: created.data.deliveryOtp,
      };
    }

    const orderId = newId("ord");
    const publicId = publicOrderCode(cfg.marketplace.orderPrefix);
    const otp = String(crypto.randomInt(1000, 10000));
    const paymentStatus =
      method === "COD"
        ? "pending_collection"
        : method === "KING_PAY"
          ? "wallet_paid"
          : method === "RAZORPAY_ONLINE"
            ? "paid"
            : "sandbox_paid";
    const addressSnapshot = JSON.stringify({ ...data.address, lat: data.lat, lng: data.lng, zoneId: data.zoneId });

    await sql.transaction(async (tx) => {
      if (built.promo?.firstOrderOnly) {
        const priorRedemption = await tx<{ id: string }>`
          select id from promotion_redemptions where promotion_id = ${built.promo.id} and user_id = ${context.userId} limit 1
        `;
        if (priorRedemption[0]) {
          throw new Error("This first-order promotion has already been redeemed on your account.");
        }
      }

      if (method === "KING_PAY") {
        const walletRows = await tx<{ balance_paise: number }>`
          SELECT balance_paise FROM kingpay_wallets WHERE user_id = ${context.userId} FOR UPDATE
        `;
        const currentBalance = Number(walletRows[0]?.balance_paise ?? 0);
        if (currentBalance < finalTotalPaise) {
          throw new Error(
            `Insufficient KingPay wallet balance (Available: ₹${(currentBalance / 100).toFixed(2)}, Required: ₹${(finalTotalPaise / 100).toFixed(2)})`
          );
        }
        await tx`UPDATE kingpay_wallets SET balance_paise = balance_paise - ${finalTotalPaise}, updated_at = NOW() WHERE user_id = ${context.userId}`;
        await tx`INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description) VALUES (${newId("kpt")}, ${context.userId}, ${finalTotalPaise}, 'DEBIT', ${`Order payment for #${publicId}`})`;
      }

      await tx`insert into orders (id, public_id, user_id, restaurant_id, outlet_id, zone_id, address_snapshot, status, payment_method, payment_status, idempotency_key, food_subtotal_paise, restaurant_discount_paise, platform_discount_paise, delivery_fee_paise, service_fee_paise, tax_paise, packaging_paise, total_paise, commission_bps, commission_paise, restaurant_payable_paise, promotion_id, notes, delivery_otp, data_label) values (${orderId}, ${publicId}, ${context.userId}, ${built.restaurantId}, ${built.outletId}, ${built.zoneId}, ${addressSnapshot}, ${"PLACED"}, ${method}, ${paymentStatus}, ${data.idempotencyKey}, ${q.foodSubtotalPaise}, ${q.restaurantDiscountPaise}, ${q.platformDiscountPaise}, ${q.deliveryFeePaise}, ${q.serviceFeePaise}, ${q.taxPaise}, ${q.packagingPaise}, ${finalTotalPaise}, ${q.commissionBps}, ${q.commissionPaise}, ${q.restaurantPayablePaise}, ${built.promo?.id ?? null}, ${(data.notes ?? "").slice(0, 240)}, ${otp}, ${built.dataLabel})`;
      for (const line of built.pricedLines) {
        await tx`insert into order_items (id, order_id, item_id, variant_id, name_snapshot, quantity, unit_price_paise, addons_snapshot, instructions, line_total_paise) values (${newId("oit")}, ${orderId}, ${line.itemId}, ${line.variantId}, ${line.name}, ${line.quantity}, ${line.unitPaise}, ${JSON.stringify(line.addons)}, ${line.instructions || null}, ${line.unitPaise * line.quantity})`;
      }
      for (let i = 0; i < q.lines.length; i++) {
        const line = q.lines[i]!;
        await tx`insert into order_price_lines (id, order_id, code, name, amount_paise, source, funded_by, reason, sort_order) values (${newId("opl")}, ${orderId}, ${line.code}, ${line.name}, ${line.amountPaise}, ${line.source}, ${line.fundedBy}, ${line.reason}, ${i})`;
      }
      if (tip > 0) {
        await tx`insert into order_price_lines (id, order_id, code, name, amount_paise, source, funded_by, reason, sort_order) values (${newId("opl")}, ${orderId}, ${"RIDER_TIP"}, ${"Delivery partner tip"}, ${tip}, ${"delivery"}, ${"CUSTOMER"}, ${"100% goes directly to the delivery partner."}, ${q.lines.length})`;
      }
      if (donation > 0) {
        await tx`insert into order_price_lines (id, order_id, code, name, amount_paise, source, funded_by, reason, sort_order) values (${newId("opl")}, ${orderId}, ${"DONATION_FEEDING_INDIA"}, ${"Feeding India Donation"}, ${donation}, ${"platform"}, ${"CUSTOMER"}, ${"Micro-donation to Feeding India to feed daily wage earners and children in need."}, ${q.lines.length + (tip > 0 ? 1 : 0)})`;
      }

      const paymentProvider =
        method === "COD"
          ? "COD"
          : method === "KING_PAY"
            ? "KING_PAY"
            : method === "RAZORPAY_ONLINE"
              ? "RAZORPAY"
              : "UPI_SANDBOX";
      const paymentRowStatus =
        method === "COD"
          ? "pending"
          : method === "KING_PAY"
            ? "wallet_paid"
            : method === "RAZORPAY_ONLINE"
              ? "captured"
              : "sandbox_paid";
      const paymentIdemKey =
        method === "RAZORPAY_ONLINE" && data.razorpayPayment?.razorpayPaymentId
          ? `rzp:${data.razorpayPayment.razorpayPaymentId}`
          : `${data.idempotencyKey}:pay`;
      const paymentPayload =
        method === "KING_PAY"
          ? JSON.stringify({ kingPay: true, note: "Deducted from KingPay wallet balance" })
          : method === "RAZORPAY_ONLINE" && data.razorpayPayment
            ? JSON.stringify({
                razorpayOrderId: data.razorpayPayment.razorpayOrderId,
                razorpayPaymentId: data.razorpayPayment.razorpayPaymentId,
                signatureVerified: true,
              })
            : method === "UPI_SANDBOX"
              ? JSON.stringify({ sandbox: true, note: "Not a real UPI transfer" })
              : null;

      await tx`insert into payments (id, order_id, provider, status, amount_paise, currency, idempotency_key, raw_payload) values (${newId("pay")}, ${orderId}, ${paymentProvider}, ${paymentRowStatus}, ${finalTotalPaise}, ${"INR"}, ${paymentIdemKey}, ${paymentPayload})`;
      if (built.promo) {
        await tx`insert into promotion_redemptions (id, promotion_id, user_id, order_id) values (${newId("red")}, ${built.promo.id}, ${context.userId}, ${orderId})`;
      }
      const points = Math.floor(q.foodSubtotalPaise / 10000);
      await tx`insert into loyalty_accounts (user_id, points, lifetime_points, tier) values (${context.userId}, ${points}, ${points}, ${"starter"}) on conflict (user_id) do update set points = loyalty_accounts.points + ${points}, lifetime_points = loyalty_accounts.lifetime_points + ${points}, updated_at = now()`;
      await tx`insert into loyalty_transactions (id, user_id, order_id, delta, reason) values (${newId("loy")}, ${context.userId}, ${orderId}, ${points}, ${"order_placed"})`;
      const earnedCoins = Math.max(10, Math.floor(q.foodSubtotalPaise / 100) * 10);
      await tx`
        INSERT INTO kingpay_wallets (user_id, balance_paise, king_coins)
        VALUES (${context.userId}, 0, ${earnedCoins})
        ON CONFLICT (user_id) DO UPDATE SET
          king_coins = COALESCE(kingpay_wallets.king_coins, 0) + ${earnedCoins},
          updated_at = NOW()
      `;
    });

    await writeEvent(orderId, null, "PLACED", context.userId, "customer", "Order placed");
    const paymentConfirmedNote =
      method === "COD"
        ? "Pay on delivery (cash or verified rider UPI)."
        : method === "KING_PAY"
          ? "Paid via KingPay wallet."
          : method === "RAZORPAY_ONLINE"
            ? "Verified online payment received."
            : "Marked sandbox-paid.";
    await sql`insert into notifications (id, user_id, title, body, kind, entity_id) values (${newId("ntf")}, ${context.userId}, ${"Order confirmed"}, ${`Order ${publicId} is confirmed. ${paymentConfirmedNote}`}, ${"ORDER_PLACED"}, ${orderId})`;
    await sql`insert into notification_outbox (id, channel, status, payload) values (${newId("nbox")}, ${"sms"}, ${"pending"}, ${JSON.stringify({ reason: "provider_not_connected", event: "ORDER_PLACED", orderId })})`;
    await sql`insert into audit_logs (id, actor_user_id, actor_role, action, entity, entity_id, metadata) values (${newId("aud")}, ${context.userId}, ${"customer"}, ${"order.place"}, ${"order"}, ${orderId}, ${JSON.stringify({ publicId, method })})`;
    await sql`insert into analytics_events (id, user_id, name, payload) values (${newId("evt")}, ${context.userId}, ${"order_placed"}, ${JSON.stringify({ orderId })})`;
    return { orderId, publicId, duplicate: false, deliveryOtp: otp };
  });

async function getOwnedOrder(userId: string, orderId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    public_id: string;
    user_id: string;
    restaurant_id: string;
    status: OrderStatus;
    payment_method: string;
    payment_status: string;
    total_paise: number;
    placed_at: string;
    notes: string | null;
    delivery_otp: string | null;
    address_snapshot: string;
    data_label: string;
  }>`select id, public_id, user_id, restaurant_id, status, payment_method, payment_status, total_paise, placed_at::text as placed_at, notes, delivery_otp, address_snapshot, data_label from orders where id = ${orderId} and user_id = ${userId}`;
  return rows[0] ?? null;
}

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    try {
      const cfg = await loadConfig();
      if (cfg.marketplace.launchMode === "live") {
        const { hdmasterConfig } = await import("./hdmaster-orders");
        const { baseUrl, token } = hdmasterConfig();
        const res = await fetch(`${baseUrl}/v1/admin/customer-orders?customerRef=${context.userId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch orders from HDmaster");
        const payload = await res.json();
        return payload.data as { orders: OrderSummary[] };
      }
      const sql = await getSql();
      const rows = await sql<{
        id: string;
        public_id: string;
        status: OrderStatus;
        restaurant_id: string;
        total_paise: number;
        placed_at: string;
        data_label: string;
        restaurant_name: string;
        restaurant_slug: string;
        preview: string | null;
      }>`select o.id, o.public_id, o.status, o.restaurant_id, o.total_paise, o.placed_at::text as placed_at, o.data_label, r.name as restaurant_name, r.slug as restaurant_slug, (select string_agg(name_snapshot, ', ') from (select name_snapshot from order_items where order_id = o.id limit 3) s) as preview from orders o join restaurants r on r.id = o.restaurant_id where o.user_id = ${context.userId} order by o.placed_at desc limit 50`;
      const orders: OrderSummary[] = rows.map((r) => ({
        id: r.id,
        publicId: r.public_id,
        status: r.status,
        restaurantId: r.restaurant_id,
        restaurantName: r.restaurant_name,
        restaurantSlug: r.restaurant_slug,
        totalPaise: r.total_paise,
        placedAt: r.placed_at,
        itemPreview: r.preview ?? "",
        dataLabel: r.data_label as OrderSummary["dataLabel"],
      }));
      return { orders };
    } catch (err) {
      console.error("listMyOrders failed:", err);
      return { orders: [] };
    }
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string }) => input)
  .handler(async ({ context, data }: any) => {
    try {
      const cfg = await loadConfig();
      if (cfg.marketplace.launchMode === "live") {
        const { hdmasterConfig } = await import("./hdmaster-orders");
        const { baseUrl, token } = hdmasterConfig();
        const res = await fetch(`${baseUrl}/v1/admin/customer-orders/${data.orderId}?customerRef=${context.userId}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (res.status === 404) return { order: null };
        if (!res.ok) throw new Error("Failed to fetch order from HDmaster");
        const payload = await res.json();
        const orderData = payload.data.order;
        return {
          order: {
            summary: {
              id: orderData.id,
              publicId: orderData.id,
              status: orderData.status,
              restaurantName: orderData.restaurantName,
              restaurantSlug: orderData.restaurantSlug,
              totalPaise: orderData.totalPaise,
              placedAt: orderData.placedAt,
              itemPreview: orderData.items.map((i: any) => i.name).join(", "),
              dataLabel: orderData.dataMode,
            },
            status: orderData.status,
            paymentMethod: orderData.paymentMethod,
            paymentStatus: orderData.paymentStatus,
            deliveryOtp: orderData.deliveryOtp,
            notes: orderData.notes,
            address: orderData.addressSnapshot,
            lines: [],
            items: orderData.items,
            events: orderData.events,
            restaurantSimulated: orderData.dataMode === "SIMULATED",
            canCancel: ["PENDING", "CONFIRMED"].includes(orderData.status),
          } as OrderDetail,
        };
      }
      const order = await getOwnedOrder(context.userId, data.orderId);
      if (!order) return { order: null as OrderDetail | null };
      const sql = await getSql();
      const rst = await sql<{ name: string; slug: string; data_label: string }>`select name, slug, data_label from restaurants where id = ${order.restaurant_id}`;
      const items = await sql<{ name_snapshot: string; quantity: number; line_total_paise: number; instructions: string | null }>`select name_snapshot, quantity, line_total_paise, instructions from order_items where order_id = ${order.id}`;
      const lines = await sql<{ code: string; name: string; amount_paise: number; source: string; funded_by: string | null; reason: string }>`select code, name, amount_paise, source, funded_by, reason from order_price_lines where order_id = ${order.id} order by sort_order`;
      const events = await sql<{ to_status: string; created_at: string; note: string | null }>`select to_status, created_at::text as created_at, note from order_events where order_id = ${order.id} order by created_at`;
      const restaurant = rst[0];
      const detail: OrderDetail = {
        summary: {
          id: order.id,
          publicId: order.public_id,
          status: order.status,
          restaurantName: restaurant?.name ?? "Kitchen",
          restaurantSlug: restaurant?.slug ?? "",
          totalPaise: order.total_paise,
          placedAt: order.placed_at,
          itemPreview: items.map((i) => i.name_snapshot).join(", "),
          dataLabel: order.data_label as OrderSummary["dataLabel"],
        },
        status: order.status,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        deliveryOtp: order.delivery_otp,
        notes: order.notes,
        address: order.address_snapshot,
        lines: lines.map((l) => ({
          code: l.code,
          name: l.name,
          amountPaise: l.amount_paise,
          source: l.source as OrderDetail["lines"][number]["source"],
          fundedBy: (l.funded_by ?? "CUSTOMER") as OrderDetail["lines"][number]["fundedBy"],
          reason: l.reason,
        })),
        items: items.map((i) => ({
          name: i.name_snapshot,
          quantity: i.quantity,
          lineTotalPaise: i.line_total_paise,
          instructions: i.instructions,
        })),
        events: events.map((e) => ({ toStatus: e.to_status, createdAt: e.created_at, note: e.note })),
        restaurantSimulated: restaurant?.data_label === "SIMULATED",
        canCancel: customerMayCancel(order.status),
      };
      return { order: detail };
    } catch (err) {
      console.error("getMyOrder failed:", err);
      return { order: null };
    }
  });

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string; reason?: string; idempotencyKey?: string }) => input)
  .handler(async ({ context, data }: any) => {
    const order = await getOwnedOrder(context.userId, data.orderId);
    if (!order) throw new Error("Order not found");
    if (!customerMayCancel(order.status)) throw new Error("This order can no longer be cancelled.");
    if (!canTransition(order.status, "CANCELLED_BY_CUSTOMER") && !canTransition(order.status, "CANCELLED")) {
      throw new Error("Illegal cancellation");
    }
    const cfg = await loadConfig();
    if (cfg.marketplace.launchMode === "live") {
      return cancelOrderViaHDmaster({
        data: {
          orderId: data.orderId,
          reason: data.reason,
          idempotencyKey: data.idempotencyKey ?? `cancel:${data.orderId}:${Date.now()}`,
        },
      });
    }
    const sql = await getSql();
    const nextStatus = "CANCELLED_BY_CUSTOMER";
    const totalRefundPaise = order.total_paise;

    await sql`update orders set status = ${nextStatus}, payment_status = ${"refunded"}, updated_at = now() where id = ${order.id} and user_id = ${context.userId}`;
    await writeEvent(order.id, order.status, nextStatus, context.userId, "customer", data.reason || "Cancelled by customer within 60s grace window (100% instant refund)");

    // 100% Instant Refund to KingPay wallet or UPI without human intervention or restaurant dispute
    if (order.payment_method !== "COD" && totalRefundPaise > 0) {
      await sql`
        INSERT INTO kingpay_wallets (user_id, balance_paise, updated_at)
        VALUES (${context.userId}, ${totalRefundPaise}, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET balance_paise = kingpay_wallets.balance_paise + ${totalRefundPaise}, updated_at = NOW()
      `;
      await sql`
        INSERT INTO kingpay_transactions (id, user_id, amount_paise, type, description)
        VALUES (${newId("kpt")}, ${context.userId}, ${totalRefundPaise}, 'CREDIT', ${`100% Instant Refund for Cancelled Order #${order.public_id}`})
      `;
      await sql`UPDATE payments SET status = 'refunded' WHERE order_id = ${order.id}`;
    }

    await sql`
      INSERT INTO notifications (id, user_id, title, body, kind, entity_id)
      VALUES (${newId("ntf")}, ${context.userId}, ${"100% Instant Refund Issued"}, ${`Order #${order.public_id} was cancelled. 100% refund of ₹${(totalRefundPaise / 100).toFixed(2)} processed to KingPay Wallet/UPI without dispute.`}, ${"ORDER_CANCELLED"}, ${order.id})
    `;

    return { ok: true, orderId: order.id, status: nextStatus, refundPaise: totalRefundPaise, authoritative: "customer-app" as const };
  });

export const advanceSimulatedOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string }) => input)
  .handler(async ({ context, data }: any) => {
    const order = await getOwnedOrder(context.userId, data.orderId);
    if (!order) throw new Error("Order not found");
    const sql = await getSql();
    const rst = await sql<{ data_label: string }>`select data_label from restaurants where id = ${order.restaurant_id}`;
    if (rst[0]?.data_label !== "SIMULATED") throw new Error("Only sample kitchens can be advanced in development.");
    const next = SIMULATED_ADVANCE[order.status];
    if (!next) return { status: order.status };
    if (!canTransition(order.status, next)) throw new Error("Illegal transition");
    await sql`update orders set status = ${next}, updated_at = now() where id = ${order.id} and user_id = ${context.userId}`;
    await writeEvent(order.id, order.status, next, context.userId, "system", "Sample kitchen status advanced");
    if (next === "DELIVERED") {
      await sql`update payments set status = ${"collected"} where order_id = ${order.id} and provider = ${"COD"}`;
      await sql`update orders set payment_status = ${"collected"} where id = ${order.id} and payment_method = ${"COD"}`;
    }
    return { status: next };
  });

export const reorderItems = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { orderId: string }) => input)
  .handler(async ({ context, data }: any) => {
    const cfg = await loadConfig();
    let restaurantId: string;
    let items: {
      item_id: string;
      variant_id: string | null;
      quantity: number;
      instructions: string | null;
      addons_snapshot?: any;
    }[] = [];

    if (cfg.marketplace.launchMode === "live") {
      const { hdmasterConfig } = await import("./hdmaster-orders");
      const { baseUrl, token } = hdmasterConfig();
      const res = await fetch(`${baseUrl}/v1/admin/customer-orders/${data.orderId}?customerRef=${context.userId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Order not found");
      const payload = await res.json();
      restaurantId = payload.data.order.restaurantId;
      items = payload.data.order.items.map((i: any) => ({
        item_id: i.itemId,
        variant_id: null,
        quantity: i.quantity,
        instructions: null,
        addons_snapshot: i.addons_snapshot || i.addons || null,
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
        addons_snapshot: any;
      }>`select item_id, variant_id, quantity, instructions, addons_snapshot from order_items where order_id = ${order.id}`;
    }

    const sql = await getSql();
    const rst = await sql<{ id: string; name: string; slug: string }>`
      select id, name, slug from restaurants where id = ${restaurantId}
    `;
    const restaurant = rst[0];
    if (!restaurant) throw new Error("Restaurant no longer available");

    const lines: CartLineInput[] = items.map((it) => {
      let addonIds: string[] = [];
      if (it.addons_snapshot) {
        try {
          const parsed = typeof it.addons_snapshot === "string" ? JSON.parse(it.addons_snapshot) : it.addons_snapshot;
          if (Array.isArray(parsed)) {
            addonIds = parsed
              .map((a: any) => (typeof a === "string" ? a : a?.id || a?.addonId || a?.name))
              .filter(Boolean);
          }
        } catch {
          addonIds = [];
        }
      }
      return {
        itemId: it.item_id,
        variantId: it.variant_id,
        addonIds,
        quantity: it.quantity,
        instructions: it.instructions ?? "",
      };
    });

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
      lines,
    };
  });
