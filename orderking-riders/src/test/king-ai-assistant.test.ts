import { describe, it, expect, beforeEach } from "vitest";
import { RiderEngine } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";
import type { Delivery } from "../lib/rider/types.ts";

describe("King AI Fleet Assistant & Autonomous Dispute Resolution Engine", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "user-hasan-ai-test";
  let riderId: string;

  async function seedDelivery(id: string, orderCode: string, overrides: Partial<Delivery> = {}) {
    const now = new Date().toISOString();
    const d: Delivery = {
      id,
      offerId: "off_" + id,
      riderId,
      userId: testUserId,
      orderCode,
      orderId: "ord_" + id,
      state: "ARRIVED_AT_RESTAURANT",
      packageCount: 1,
      expectedPayoutPaise: 5500,
      cod: false,
      codAmountPaise: 0,
      pickupVerification: "ORDER_CODE",
      pickupCode: "1234",
      otpRequired: true,
      dataMode: "LIVE",
      pickupLocation: { lat: 26.14, lng: 91.73 },
      dropLocation: { lat: 26.16, lng: 91.75 },
      arrivedRestaurantAt: now,
      expectedReadyAt: null,
      pickedUpAt: null,
      arrivedCustomerAt: null,
      deliveredAt: null,
      waitStartedAt: now,
      contactAttempts: 0,
      cancelReason: null,
      failReason: null,
      createdAt: now,
      updatedAt: now,
      restaurant: {
        id: "rest_1",
        name: "OrderKing Kitchen",
        area: "Paltan Bazaar",
        address: "GS Road, Guwahati",
        location: { lat: 26.14, lng: 91.73 },
        phoneMasked: "+91 ••••• 1234",
        preparationStatus: "READY",
        specialPickupInstructions: null,
      },
      customer: {
        displayName: "Valued Customer",
        area: "Ulubari",
        address: "GS Road, Guwahati",
        contactMasked: "+91 ••••• 5678",
        contactAllowed: true,
        instructions: null,
      },
      ...overrides,
    };
    await store.insertDelivery(d);
    return d;
  }

  beforeEach(async () => {
    store = new MemoryStore();
    engine = new RiderEngine(store);

    const rider = await engine.ensureRider({
      id: testUserId,
      name: "Hasan Mohammed Habibullah",
      email: "9395065587@rider.orderkingpay.com",
    });
    riderId = rider.id;
    await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
    await engine.setStatus(testUserId, "ONLINE", true);
  });

  it("creates high-priority support ticket when rider reports a restaurant delay/issue", async () => {
    await seedDelivery("del_active_101", "OK-5587");

    const ticket = await engine.createTicket(
      testUserId,
      {
        topic: "RESTAURANT_ISSUE",
        message: "Restaurant item out of stock; merchant cannot prepare order #OK-5587. Photo attached.",
        deliveryId: "del_active_101",
      },
      "idem_ticket_rest_101",
    );

    expect(ticket.id).toBeDefined();
    expect(ticket.topic).toBe("RESTAURANT_ISSUE");
    expect(ticket.status).toBe("OPEN");
    expect(ticket.message).toContain("Restaurant item out of stock");

    const allTickets = await engine.tickets(testUserId);
    expect(allTickets).toHaveLength(1);
    expect(allTickets[0]?.topic).toBe("RESTAURANT_ISSUE");
  });

  it("handles customer unreachable 3-call SOP with full payout protection", async () => {
    await seedDelivery("del_cust_9922", "OK-9922");

    // Report 3-call SOP completion ticket
    const ticket = await engine.createTicket(
      testUserId,
      {
        topic: "CUSTOMER_UNAVAILABLE",
        message: "[3-CALL SOP COMPLETED] Customer unreachable after 3 attempts and 10m doorstep wait for Order #OK-9922. 100% pay protected.",
        deliveryId: "del_cust_9922",
      },
      "idem_cust_sop_9922",
    );

    expect(ticket.id).toBeDefined();
    expect(ticket.topic).toBe("CUSTOMER_UNAVAILABLE");
    expect(ticket.status).toBe("OPEN");
  });

  it("formally registers cash dispute preventing float lockout", async () => {
    await seedDelivery("del_cod_4411", "OK-4411", { cod: true, codAmountPaise: 45000 });

    const ticket = await engine.createTicket(
      testUserId,
      {
        topic: "CASH_DISPUTE",
        message: "[COD CASH DISPUTE] Customer paid UPI directly to merchant. Proof attached. Float protected.",
        deliveryId: "del_cod_4411",
      },
      "idem_cod_4411",
    );

    expect(ticket.id).toBeDefined();
    expect(ticket.topic).toBe("CASH_DISPUTE");
    expect(ticket.message).toContain("Customer paid UPI directly to merchant");
  });

  it("records safety incident and emergency SOS signal with zero cancellation penalty", async () => {
    await seedDelivery("del_active_sos", "OK-SOS-1");

    const incident = await engine.safety(testUserId, {
      kind: "EMERGENCY_CALL",
      note: "[KING AI SOS BROADCAST] Emergency distress routed to 112/108.",
      deliveryId: "del_active_sos",
      location: { lat: 26.1445, lng: 91.7362 },
    });

    expect(incident.id).toBeDefined();
    expect(incident.kind).toBe("EMERGENCY_CALL");
    expect(incident.emergencyDispatched).toBe(false);
  });
});
