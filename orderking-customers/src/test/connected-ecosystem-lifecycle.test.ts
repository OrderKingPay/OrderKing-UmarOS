import { describe, it, expect, vi, afterAll } from "vitest";

// Framework transport mock for isolated Node/Vitest runtime
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder: any = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: any) => handler,
    };
    return builder;
  },
}));

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () => null,
}));

import { getSql } from "../lib/db";
import { canTransition, assertTransition } from "../lib/orders/state";
import {
  customerCreateOrder,
  partnerAcceptOrder,
  partnerMarkReady,
  riderAssignOrder,
  riderDepartOrder,
  riderDeliverOrder,
  validateStateTransition,
  getUmarOSOrderMetrics,
  type EcosystemOrderSummary,
} from "../lib/server/ecosystem";

describe("Connected Ecosystem Lifecycle Integration: Customer, Partner, Rider and Umar OS", () => {
  let createdOrder: EcosystemOrderSummary;
  const testRiderId = "rdr_ecosystem_pilot_01";
  const testUserId = "usr_eco_customer_test";

  afterAll(async () => {
    if (createdOrder?.orderId) {
      const sql = await getSql();
      await sql`DELETE FROM order_events WHERE order_id = ${createdOrder.orderId}`;
      await sql`DELETE FROM order_items WHERE order_id = ${createdOrder.orderId}`;
      await sql`DELETE FROM orders WHERE id = ${createdOrder.orderId}`;
    }
  });

  it("Test 1: Customer creates food/parcel order in PostgreSQL orders table with status = 'CREATED'", async () => {
    const idempotencyKey = `eco_test_idk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    createdOrder = await customerCreateOrder({
      userId: testUserId,
      itemName: "Awadhi Gosht Dum Biryani & Mirchi Salan",
      totalPaise: 38500,
      paymentMethod: "COD",
      idempotencyKey,
      notes: "Please call on arrival at building gate",
    });

    expect(createdOrder).toBeDefined();
    expect(createdOrder.orderId).toMatch(/^ord_/);
    expect(createdOrder.publicId).toMatch(/^ORD-/);
    expect(createdOrder.status).toBe("CREATED");
    expect(createdOrder.deliveryOtp).toHaveLength(4);
    expect(createdOrder.totalPaise).toBe(38500);

    // Verify row persisted directly in PostgreSQL orders table with status = 'CREATED'
    const sql = await getSql();
    const orderRows = await sql<{
      id: string;
      public_id: string;
      status: string;
      payment_method: string;
      payment_status: string;
      total_paise: number;
      delivery_otp: string;
    }>`
      SELECT id, public_id, status, payment_method, payment_status, total_paise, delivery_otp
      FROM orders
      WHERE id = ${createdOrder.orderId}
      LIMIT 1
    `;

    expect(orderRows).toHaveLength(1);
    const dbOrder = orderRows[0]!;
    expect(dbOrder.status).toBe("CREATED");
    expect(dbOrder.public_id).toBe(createdOrder.publicId);
    expect(dbOrder.delivery_otp).toBe(createdOrder.deliveryOtp);
    expect(dbOrder.payment_method).toBe("COD");
    expect(dbOrder.payment_status).toBe("pending_collection");
    expect(dbOrder.total_paise).toBe(38500);

    // Verify initial row written to order_events table
    const eventRows = await sql<{
      order_id: string;
      from_status: string | null;
      to_status: string;
      actor_role: string;
    }>`
      SELECT order_id, from_status, to_status, actor_role
      FROM order_events
      WHERE order_id = ${createdOrder.orderId}
      ORDER BY created_at ASC
    `;

    expect(eventRows.length).toBeGreaterThanOrEqual(1);
    expect(eventRows[0]!.to_status).toBe("CREATED");
    expect(eventRows[0]!.actor_role).toBe("customer");
  });

  it("Test 2: Partner KDS accepts order and transitions to 'PREPARING' -> 'READY'", async () => {
    const sql = await getSql();

    // 2A. Kitchen accepts order -> transitions status to 'PREPARING'
    const acceptRes = await partnerAcceptOrder(createdOrder.orderId, {
      prepMinutes: 25,
      actorUserId: "partner_head_chef",
    });
    expect(acceptRes.ok).toBe(true);
    expect(acceptRes.status).toBe("PREPARING");

    // Check DB status is PREPARING
    const prepOrder = await sql<{ status: string; prep_minutes: number }>`
      SELECT status, prep_minutes FROM orders WHERE id = ${createdOrder.orderId} LIMIT 1
    `;
    expect(prepOrder[0]!.status).toBe("PREPARING");
    expect(prepOrder[0]!.prep_minutes).toBe(25);

    // 2B. Kitchen marks cooking complete -> transitions status to 'READY'
    const readyRes = await partnerMarkReady(createdOrder.orderId, {
      actorUserId: "partner_head_chef",
    });
    expect(readyRes.ok).toBe(true);
    expect(readyRes.status).toBe("READY");

    // Check DB status is READY and ready_at timestamp is set
    const readyOrder = await sql<{ status: string; ready_at: string | null }>`
      SELECT status, ready_at::text as ready_at FROM orders WHERE id = ${createdOrder.orderId} LIMIT 1
    `;
    expect(readyOrder[0]!.status).toBe("READY");
    expect(readyOrder[0]!.ready_at).not.toBeNull();

    // Verify order_events audit trail contains both PREPARING and READY transitions
    const events = await sql<{ to_status: string; actor_role: string }>`
      SELECT to_status, actor_role
      FROM order_events
      WHERE order_id = ${createdOrder.orderId}
      ORDER BY created_at ASC
    `;
    const statuses = events.map((e) => e.to_status);
    expect(statuses).toContain("PREPARING");
    expect(statuses).toContain("READY");
  });

  it("Test 3: Rider dispatch engine assigns rider, transitioning order to 'RIDER_ASSIGNED' -> 'ON_THE_WAY'", async () => {
    const sql = await getSql();

    // 3A. Dispatch engine matches and assigns delivery partner
    const assignRes = await riderAssignOrder(createdOrder.orderId, testRiderId, {
      riderUserId: "usr_fleet_pilot_01",
    });
    expect(assignRes.ok).toBe(true);
    expect(assignRes.status).toBe("RIDER_ASSIGNED");
    expect(assignRes.riderId).toBe(testRiderId);

    // Check DB status is RIDER_ASSIGNED and rider_id is persisted
    const assignedOrder = await sql<{ status: string; rider_id: string }>`
      SELECT status, rider_id FROM orders WHERE id = ${createdOrder.orderId} LIMIT 1
    `;
    expect(assignedOrder[0]!.status).toBe("RIDER_ASSIGNED");
    expect(assignedOrder[0]!.rider_id).toBe(testRiderId);

    // 3B. Delivery partner picks up package and departs kitchen -> transitions to 'ON_THE_WAY'
    const departRes = await riderDepartOrder(createdOrder.orderId, {
      riderUserId: "usr_fleet_pilot_01",
    });
    expect(departRes.ok).toBe(true);
    expect(departRes.status).toBe("ON_THE_WAY");

    // Check DB status is ON_THE_WAY
    const onTheWayOrder = await sql<{ status: string }>`
      SELECT status FROM orders WHERE id = ${createdOrder.orderId} LIMIT 1
    `;
    expect(onTheWayOrder[0]!.status).toBe("ON_THE_WAY");

    // Verify order_events audit trail has RIDER_ASSIGNED and ON_THE_WAY
    const events = await sql<{ to_status: string; actor_role: string }>`
      SELECT to_status, actor_role
      FROM order_events
      WHERE order_id = ${createdOrder.orderId}
      ORDER BY created_at ASC
    `;
    const statuses = events.map((e) => e.to_status);
    expect(statuses).toContain("RIDER_ASSIGNED");
    expect(statuses).toContain("ON_THE_WAY");
  });

  it("Test 4: Rider completes handover with valid OTP, transitioning order to 'DELIVERED'", async () => {
    const sql = await getSql();

    // Wrong OTP must be rejected
    await expect(
      riderDeliverOrder(createdOrder.orderId, "0000", { riderUserId: "usr_fleet_pilot_01" })
    ).rejects.toThrow("OTP verification failed");

    // Valid customer OTP completes handover
    const deliverRes = await riderDeliverOrder(createdOrder.orderId, createdOrder.deliveryOtp, {
      riderUserId: "usr_fleet_pilot_01",
    });
    expect(deliverRes.ok).toBe(true);
    expect(deliverRes.status).toBe("DELIVERED");

    // Verify DB orders record: status = 'DELIVERED', delivered_at set, COD collected
    const deliveredOrder = await sql<{
      status: string;
      delivered_at: string | null;
      payment_status: string;
    }>`
      SELECT status, delivered_at::text as delivered_at, payment_status
      FROM orders
      WHERE id = ${createdOrder.orderId}
      LIMIT 1
    `;
    expect(deliveredOrder[0]!.status).toBe("DELIVERED");
    expect(deliveredOrder[0]!.delivered_at).not.toBeNull();
    expect(deliveredOrder[0]!.payment_status).toBe("collected");

    // Verify order_events records completion
    const finalEvents = await sql<{ to_status: string; actor_role: string }>`
      SELECT to_status, actor_role
      FROM order_events
      WHERE order_id = ${createdOrder.orderId} AND to_status = 'DELIVERED'
      LIMIT 1
    `;
    expect(finalEvents).toHaveLength(1);
    expect(finalEvents[0]!.actor_role).toBe("rider");
  });

  it("Test 5: Verify negative invariant: unauthorized status jumps (e.g., CREATED straight to DELIVERED) are strictly rejected", () => {
    // 5A. CREATED cannot skip directly to DELIVERED
    expect(canTransition("CREATED", "DELIVERED")).toBe(false);
    expect(() => assertTransition("CREATED", "DELIVERED")).toThrow(/Illegal order transition/);
    expect(() => validateStateTransition("CREATED", "DELIVERED")).toThrow(
      /Unauthorized status jump rejected: cannot transition directly from CREATED to DELIVERED/
    );

    // 5B. CREATED cannot jump directly to READY or ON_THE_WAY
    expect(canTransition("CREATED", "READY")).toBe(false);
    expect(() => assertTransition("CREATED", "READY")).toThrow(/Illegal order transition/);

    expect(canTransition("CREATED", "ON_THE_WAY")).toBe(false);
    expect(() => assertTransition("CREATED", "ON_THE_WAY")).toThrow(/Illegal order transition/);

    // 5C. Terminal status DELIVERED cannot transition back to CREATED or PLACED
    expect(canTransition("DELIVERED", "CREATED")).toBe(false);
    expect(canTransition("DELIVERED", "PLACED")).toBe(false);
    expect(() => assertTransition("DELIVERED", "CREATED")).toThrow(/Illegal order transition/);
  });

  it("Test 6: Verify Umar OS query reflects the completed order and updated platform metrics", async () => {
    const metrics = await getUmarOSOrderMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.todayOrders).toBeGreaterThan(0);
    expect(Array.isArray(metrics.recentOrders)).toBe(true);
    expect(metrics.recentOrders.length).toBeGreaterThan(0);

    // Verify our completed order is visible in Umar OS query with status = 'DELIVERED'
    const foundOrder = metrics.recentOrders.find((ord) => ord.id === createdOrder.orderId);
    expect(foundOrder).toBeDefined();
    expect(foundOrder!.status).toBe("DELIVERED");
    expect(foundOrder!.total_paise).toBe(38500);
  });
});
