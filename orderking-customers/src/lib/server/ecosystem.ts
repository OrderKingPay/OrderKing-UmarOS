import crypto from "node:crypto";
import { getSql } from "../db";
import { newId, publicOrderCode } from "../ids";
import { canTransition, assertTransition, type OrderStatus } from "../orders/state";

export interface EcosystemOrderSummary {
  orderId: string;
  publicId: string;
  status: OrderStatus;
  deliveryOtp: string;
  totalPaise: number;
  riderId?: string | null;
  deliveredAt?: string | null;
}

/**
 * Step 1: Customer creates food/parcel order in PostgreSQL `orders` table with status 'CREATED'.
 */
export async function customerCreateOrder(params: {
  userId?: string;
  restaurantId?: string | null;
  outletId?: string | null;
  zoneId?: string;
  category?: string;
  itemName?: string;
  totalPaise?: number;
  paymentMethod?: string;
  deliveryOtp?: string;
  idempotencyKey?: string;
  notes?: string;
  addressSnapshot?: any;
}): Promise<EcosystemOrderSummary> {
  const sql = await getSql();

  const userId = params.userId || "usr_customer_default";
  const orderId = newId("ord");
  const publicId = publicOrderCode("ORD");
  const deliveryOtp = params.deliveryOtp || String(crypto.randomInt(1000, 10000));
  const method = params.paymentMethod || "COD";
  const totalPaise = params.totalPaise ?? 24500;
  const paymentStatus = method === "COD" ? "pending_collection" : "paid";
  const zoneId = params.zoneId || "zone_cp";
  const idempotencyKey = params.idempotencyKey || newId("idk");

  const addressSnapshot =
    typeof params.addressSnapshot === "string"
      ? params.addressSnapshot
      : JSON.stringify(
          params.addressSnapshot || {
            line1: "Regal Building, Connaught Place",
            area: "Central Delhi",
            lat: 28.6315,
            lng: 77.2167,
          }
        );

  await sql.transaction(async (tx) => {
    // 1. Insert order with canonical status 'CREATED'
    await tx`
      INSERT INTO orders (
        id, public_id, user_id, restaurant_id, outlet_id, zone_id,
        address_snapshot, status, payment_method, payment_status,
        idempotency_key, food_subtotal_paise, restaurant_discount_paise,
        platform_discount_paise, delivery_fee_paise, service_fee_paise,
        tax_paise, packaging_paise, total_paise, commission_bps,
        commission_paise, restaurant_payable_paise, notes, delivery_otp,
        data_label, placed_at, updated_at
      ) VALUES (
        ${orderId}, ${publicId}, ${userId}, ${params.restaurantId ?? null}, ${params.outletId ?? null}, ${zoneId},
        ${addressSnapshot}, ${'CREATED'}, ${method}, ${paymentStatus},
        ${idempotencyKey}, ${totalPaise}, ${0},
        ${0}, ${0}, ${0},
        ${0}, ${0}, ${totalPaise}, ${0},
        ${0}, ${totalPaise}, ${(params.notes ?? "").slice(0, 240)}, ${deliveryOtp},
        ${'REAL'}, NOW(), NOW()
      )
    `;

    // 2. Insert order items
    const itemName = params.itemName || "Royal Mutton Dum Biryani (Full)";
    await tx`
      INSERT INTO order_items (
        id, order_id, item_id, variant_id, name_snapshot, quantity,
        unit_price_paise, addons_snapshot, instructions, line_total_paise
      ) VALUES (
        ${newId("oit")}, ${orderId}, ${newId("itm")}, ${null},
        ${itemName}, ${1}, ${totalPaise},
        ${"[]"}, ${null}, ${totalPaise}
      )
    `;

    // 3. Write initial canonical row to order_events
    await tx`
      INSERT INTO order_events (
        id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
      ) VALUES (
        ${newId("oev")}, ${orderId}, ${null}, ${'CREATED'}, ${userId}, ${'customer'},
        ${'Order created in canonical connected ecosystem'}, NOW()
      )
    `;
  });

  return {
    orderId,
    publicId,
    status: "CREATED",
    deliveryOtp,
    totalPaise,
  };
}

/**
 * Step 2A: Partner KDS accepts order and transitions to 'PREPARING'.
 */
export async function partnerAcceptOrder(
  orderId: string,
  options?: { restaurantId?: string; actorUserId?: string; prepMinutes?: number }
) {
  const sql = await getSql();

  const rows = await sql<{ id: string; status: string }>`
    SELECT id, status FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const currentStatus = (rows[0].status || "CREATED") as OrderStatus;

  // Validate state machine transition
  assertTransition(currentStatus, "PREPARING");

  const actorUserId = options?.actorUserId || "partner_chef_1";
  const prepMinutes = options?.prepMinutes || 20;

  await sql`
    UPDATE orders
    SET status = 'PREPARING',
        prep_minutes = ${prepMinutes},
        accepted_at = COALESCE(accepted_at, NOW()),
        updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await sql`
    INSERT INTO order_events (
      id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
    ) VALUES (
      ${newId("oev")}, ${orderId}, ${currentStatus}, ${'PREPARING'},
      ${actorUserId}, ${'restaurant'}, ${`Order accepted by KDS with ${prepMinutes}m prep SLA`}, NOW()
    )
  `;

  return { ok: true, status: "PREPARING" as const };
}

/**
 * Step 2B: Partner marks order as 'READY' for delivery partner pickup.
 */
export async function partnerMarkReady(
  orderId: string,
  options?: { actorUserId?: string }
) {
  const sql = await getSql();

  const rows = await sql<{ id: string; status: string }>`
    SELECT id, status FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const currentStatus = (rows[0].status || "PREPARING") as OrderStatus;

  assertTransition(currentStatus, "READY");

  const actorUserId = options?.actorUserId || "partner_chef_1";

  await sql`
    UPDATE orders
    SET status = 'READY',
        ready_at = NOW(),
        updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await sql`
    INSERT INTO order_events (
      id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
    ) VALUES (
      ${newId("oev")}, ${orderId}, ${currentStatus}, ${'READY'},
      ${actorUserId}, ${'restaurant'}, ${'Food prepared and packed. Ready for rider pickup.'}, NOW()
    )
  `;

  return { ok: true, status: "READY" as const };
}

/**
 * Step 3A: Rider dispatch engine assigns rider, transitioning order to 'RIDER_ASSIGNED' and setting rider_id.
 */
export async function riderAssignOrder(
  orderId: string,
  riderId: string,
  options?: { riderUserId?: string }
) {
  const sql = await getSql();

  const rows = await sql<{ id: string; status: string }>`
    SELECT id, status FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const currentStatus = (rows[0].status || "READY") as OrderStatus;

  assertTransition(currentStatus, "RIDER_ASSIGNED");

  const riderUserId = options?.riderUserId || "rider_user_1";

  await sql`
    UPDATE orders
    SET status = 'RIDER_ASSIGNED',
        rider_id = ${riderId},
        updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await sql`
    INSERT INTO order_events (
      id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
    ) VALUES (
      ${newId("oev")}, ${orderId}, ${currentStatus}, ${'RIDER_ASSIGNED'},
      ${riderUserId}, ${'rider'}, ${`Rider ${riderId} assigned to delivery dispatch`}, NOW()
    )
  `;

  return { ok: true, status: "RIDER_ASSIGNED" as const, riderId };
}

/**
 * Step 3B: Rider departs restaurant with food, transitioning status to 'ON_THE_WAY'.
 */
export async function riderDepartOrder(
  orderId: string,
  options?: { riderUserId?: string }
) {
  const sql = await getSql();

  const rows = await sql<{ id: string; status: string }>`
    SELECT id, status FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const currentStatus = (rows[0].status || "RIDER_ASSIGNED") as OrderStatus;

  assertTransition(currentStatus, "ON_THE_WAY");

  const riderUserId = options?.riderUserId || "rider_user_1";

  await sql`
    UPDATE orders
    SET status = 'ON_THE_WAY',
        updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await sql`
    INSERT INTO order_events (
      id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
    ) VALUES (
      ${newId("oev")}, ${orderId}, ${currentStatus}, ${'ON_THE_WAY'},
      ${riderUserId}, ${'rider'}, ${'Rider departed restaurant with package. Out for delivery.'}, NOW()
    )
  `;

  return { ok: true, status: "ON_THE_WAY" as const };
}

/**
 * Step 4: Rider completes handover with valid OTP, transitioning order to 'DELIVERED'.
 */
export async function riderDeliverOrder(
  orderId: string,
  otp: string,
  options?: { riderUserId?: string }
) {
  const sql = await getSql();

  const rows = await sql<{ id: string; status: string; delivery_otp: string; payment_method: string }>`
    SELECT id, status, delivery_otp, payment_method FROM orders WHERE id = ${orderId} LIMIT 1
  `;
  if (!rows[0]) throw new Error("Order not found");
  const currentStatus = (rows[0].status || "ON_THE_WAY") as OrderStatus;

  assertTransition(currentStatus, "DELIVERED");

  if (!otp || typeof otp !== "string" || otp.trim().length !== 4) {
    throw new Error("A valid 4-digit customer OTP is required for delivery completion.");
  }

  if (rows[0].delivery_otp && rows[0].delivery_otp !== otp.trim()) {
    throw new Error("OTP verification failed. Delivery handover code does not match customer OTP.");
  }

  const riderUserId = options?.riderUserId || "rider_user_1";

  await sql`
    UPDATE orders
    SET status = 'DELIVERED',
        payment_status = CASE WHEN payment_method = 'COD' THEN 'collected' ELSE payment_status END,
        delivered_at = NOW(),
        updated_at = NOW()
    WHERE id = ${orderId}
  `;

  await sql`
    INSERT INTO order_events (
      id, order_id, from_status, to_status, actor_user_id, actor_role, note, created_at
    ) VALUES (
      ${newId("oev")}, ${orderId}, ${currentStatus}, ${'DELIVERED'},
      ${riderUserId}, ${'rider'}, ${'Customer OTP verified. Handover complete and order delivered.'}, NOW()
    )
  `;

  return { ok: true, status: "DELIVERED" as const };
}

/**
 * Step 5: Enforces state machine guard rejecting unauthorized status jumps.
 */
export function validateStateTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Unauthorized status jump rejected: cannot transition directly from ${from} to ${to}`);
  }
}

/**
 * Step 6: Umar OS query retrieving real-time order counts and status updates.
 */
export async function getUmarOSOrderMetrics() {
  const sql = await getSql();
  const [countRes, recentRes] = await Promise.all([
    sql<{ count: number }>`SELECT COUNT(*) as count FROM orders`,
    sql<{ id: string; status: string; total_paise: number }>`
      SELECT id, status, total_paise FROM orders ORDER BY id DESC LIMIT 10
    `,
  ]);

  return {
    todayOrders: Number(countRes[0]?.count || 0),
    recentOrders: recentRes.map((r) => ({
      id: r.id,
      status: r.status,
      total_paise: Number(r.total_paise || 0),
    })),
  };
}
