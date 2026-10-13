import { describe, it, expect, beforeEach } from "vitest";
import { RiderEngine } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";
import {
  canTransition,
  assertTransition,
  CANONICAL_LIFECYCLE_STATES,
} from "../lib/rider/machine.ts";
import {
  calculateRiderPayout,
  enforcePayoutFloor,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
} from "../lib/rider/money.ts";
import { RiderError, type DispatchOffer } from "../lib/rider/types.ts";

describe("Rider Dispatch & Payout Lifecycle", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "rider-user-001";

  beforeEach(async () => {
    store = new MemoryStore();
    engine = new RiderEngine(store);
    await engine.ensureRider({ id: testUserId, name: "Principal Test Rider", email: "rider@orderking.in" });
    await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
    await engine.setStatus(testUserId, "ONLINE", true);
  });

  function createMockOffer(overrides: Partial<DispatchOffer> = {}): DispatchOffer {
    return {
      id: "offer-" + Math.random().toString(36).slice(2, 8),
      orderCode: "ORD-TEST-100",
      riderId: store.ridersByUser.get(testUserId) ?? "rider-1",
      restaurant: {
        id: "rest-101",
        name: "OrderKing Kitchen",
        area: "Indiranagar",
        address: "100ft Road, Bangalore",
        location: { lat: 12.9716, lng: 77.5946 },
        phoneMasked: "•••• 9876",
        specialPickupInstructions: null,
        preparationStatus: "READY",
      },
      customer: {
        displayName: "Customer Test",
        area: "Koramangala",
        address: "5th Block, Koramangala",
        contactMasked: "•••• 1234",
        contactAllowed: true,
        instructions: "Call upon arrival",
      },
      pickupLocation: { lat: 12.9716, lng: 77.5946 },
      dropLocation: { lat: 12.9352, lng: 77.6245 },
      dropArea: "Koramangala",
      approxDistanceKm: 4.5,
      estimatedTravelKm: 4.5,
      estimatedTotalRouteKm: 4.5,
      expectedPayoutPaise: 2000, // Deliberately lower than statutory ₹35 to test floor
      packageCount: 1,
      cod: false,
      codAmountPaise: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      status: "OPEN",
      dataMode: "LIVE",
      ...overrides,
    };
  }

  describe("1. Canonical State Machine & Transition Validation", () => {
    it("defines the canonical lifecycle states in strict sequence", () => {
      expect(CANONICAL_LIFECYCLE_STATES).toEqual([
        "OFFER_PRESENTED",
        "ACCEPTED",
        "ARRIVED_AT_STORE",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ]);
    });

    it("validates valid step-by-step canonical lifecycle transitions", () => {
      expect(canTransition("OFFER_PRESENTED", "ACCEPTED")).toBe(true);
      expect(canTransition("ACCEPTED", "ARRIVED_AT_STORE")).toBe(true);
      expect(canTransition("ARRIVED_AT_STORE", "PICKED_UP")).toBe(true);
      expect(canTransition("PICKED_UP", "OUT_FOR_DELIVERY")).toBe(true);
      expect(canTransition("OUT_FOR_DELIVERY", "DELIVERED")).toBe(true);
    });

    it("validates granular rider app lifecycle transitions", () => {
      expect(canTransition("OFFERED", "ACCEPTED")).toBe(true);
      expect(canTransition("ACCEPTED", "ARRIVING_AT_RESTAURANT")).toBe(true);
      expect(canTransition("ACCEPTED", "ARRIVED_AT_RESTAURANT")).toBe(true);
      expect(canTransition("ARRIVING_AT_RESTAURANT", "ARRIVED_AT_RESTAURANT")).toBe(true);
      expect(canTransition("ARRIVED_AT_RESTAURANT", "PICKED_UP")).toBe(true);
      expect(canTransition("PICKED_UP", "ON_THE_WAY")).toBe(true);
      expect(canTransition("ON_THE_WAY", "ARRIVED_AT_CUSTOMER")).toBe(true);
      expect(canTransition("ARRIVED_AT_CUSTOMER", "DELIVERED")).toBe(true);
    });

    it("rejects invalid state transition skips and illegal progressions", () => {
      // Cannot jump from OFFER_PRESENTED to PICKED_UP or DELIVERED
      expect(canTransition("OFFER_PRESENTED", "PICKED_UP")).toBe(false);
      expect(canTransition("OFFER_PRESENTED", "DELIVERED")).toBe(false);
      expect(canTransition("OFFERED", "DELIVERED")).toBe(false);

      // Cannot jump from ACCEPTED to DELIVERED
      expect(canTransition("ACCEPTED", "DELIVERED")).toBe(false);
      expect(canTransition("ACCEPTED", "PICKED_UP")).toBe(false);

      // Cannot jump from ARRIVED_AT_STORE directly to DELIVERED
      expect(canTransition("ARRIVED_AT_STORE", "DELIVERED")).toBe(false);

      // Cannot jump from PICKED_UP directly to DELIVERED (must go OUT_FOR_DELIVERY / ON_THE_WAY first)
      expect(canTransition("PICKED_UP", "DELIVERED")).toBe(false);

      // Cannot transition from terminal DELIVERED to any state
      expect(canTransition("DELIVERED", "ACCEPTED")).toBe(false);
      expect(canTransition("DELIVERED", "PICKED_UP")).toBe(false);

      // Cannot self-transition
      expect(canTransition("ACCEPTED", "ACCEPTED")).toBe(false);
      expect(canTransition("PICKED_UP", "PICKED_UP")).toBe(false);
    });

    it("assertTransition throws RiderError with INVALID_STATE for illegal jumps", () => {
      expect(() => assertTransition("OFFER_PRESENTED", "DELIVERED")).toThrow(RiderError);
      expect(() => assertTransition("ACCEPTED", "DELIVERED")).toThrow(RiderError);
      expect(() => assertTransition("PICKED_UP", "DELIVERED")).toThrow(RiderError);
      expect(() => assertTransition("DELIVERED", "ACCEPTED")).toThrow(RiderError);

      try {
        assertTransition("PICKED_UP", "DELIVERED");
      } catch (err) {
        expect(err).toBeInstanceOf(RiderError);
        expect((err as RiderError).code).toBe("INVALID_STATE");
        expect((err as RiderError).status).toBe(409);
      }
    });

    it("executes the full lifecycle progression end-to-end via RiderEngine", async () => {
      const offer = createMockOffer();
      await store.insertOffer(offer, testUserId);

      // 1. OFFER_PRESENTED -> ACCEPTED
      const respondRes = await engine.respondOffer(testUserId, offer.id, "ACCEPT", undefined, "key-accept-1");
      const delivery = respondRes.delivery!;
      expect(delivery.state).toBe("ACCEPTED");

      // 2. ACCEPTED -> ARRIVING_AT_RESTAURANT -> ARRIVED_AT_RESTAURANT
      const arriving = await engine.arriving(testUserId, delivery.id, "key-arr-1");
      expect(arriving.state).toBe("ARRIVING_AT_RESTAURANT");

      const arrived = await engine.arriveRestaurant(testUserId, delivery.id, "key-arr-2");
      expect(arrived.state).toBe("ARRIVED_AT_RESTAURANT");

      // 3. ARRIVED_AT_RESTAURANT -> PICKED_UP
      const pickedUp = await engine.pickup(
        testUserId,
        delivery.id,
        { method: "ORDER_CODE", code: delivery.pickupCode },
        "key-pk-1",
      );
      expect(pickedUp.state).toBe("PICKED_UP");

      // 4. PICKED_UP -> ON_THE_WAY -> ARRIVED_AT_CUSTOMER
      const onTheWay = await engine.startDelivery(testUserId, delivery.id, "key-st-1");
      expect(onTheWay.state).toBe("ON_THE_WAY");

      const arrivedCust = await engine.arriveCustomer(testUserId, delivery.id, "key-ac-1");
      expect(arrivedCust.state).toBe("ARRIVED_AT_CUSTOMER");

      // 5. ARRIVED_AT_CUSTOMER -> DELIVERED (via valid OTP)
      const validOtp = await engine.otpForSimulation(testUserId, delivery.id);
      expect(validOtp).toMatch(/^\d{4}$/);

      const delivered = await engine.deliver(testUserId, delivery.id, validOtp!, "key-del-1");
      expect(delivered.state).toBe("DELIVERED");
      expect(delivered.deliveredAt).toBeTruthy();
    });
  });

  describe("2. Customer 4-Digit OTP Verification on Delivery Completion", () => {
    let activeDeliveryId: string;
    let correctOtp: string;

    beforeEach(async () => {
      const offer = createMockOffer();
      await store.insertOffer(offer, testUserId);
      const { delivery } = await engine.respondOffer(testUserId, offer.id, "ACCEPT", undefined, "key-acc-" + offer.id);
      activeDeliveryId = delivery!.id;

      // Progress to ARRIVED_AT_CUSTOMER
      await engine.arriving(testUserId, activeDeliveryId, "key-a1-" + activeDeliveryId);
      await engine.arriveRestaurant(testUserId, activeDeliveryId, "key-a2-" + activeDeliveryId);
      await engine.pickup(
        testUserId,
        activeDeliveryId,
        { method: "ORDER_CODE", code: delivery!.pickupCode },
        "key-p-" + activeDeliveryId,
      );
      await engine.startDelivery(testUserId, activeDeliveryId, "key-s-" + activeDeliveryId);
      await engine.arriveCustomer(testUserId, activeDeliveryId, "key-c-" + activeDeliveryId);

      const otp = await engine.otpForSimulation(testUserId, activeDeliveryId);
      expect(otp).toBeTruthy();
      expect(otp).toMatch(/^\d{4}$/);
      correctOtp = otp!;
    });

    it("strictly requires OTP to be provided", async () => {
      await expect(
        engine.deliver(testUserId, activeDeliveryId, undefined, "key-del-empty"),
      ).rejects.toThrow(RiderError);

      try {
        await engine.deliver(testUserId, activeDeliveryId, "", "key-del-empty2");
      } catch (err) {
        expect(err).toBeInstanceOf(RiderError);
        expect((err as RiderError).code).toBe("OTP_REQUIRED");
      }
    });

    it("strictly rejects non-4-digit OTP formats (short, long, alphanumeric)", async () => {
      // 3 digits
      await expect(
        engine.deliver(testUserId, activeDeliveryId, "123", "key-del-short"),
      ).rejects.toThrow(RiderError);

      // 5 digits
      await expect(
        engine.deliver(testUserId, activeDeliveryId, "12345", "key-del-long"),
      ).rejects.toThrow(RiderError);

      // Alphanumeric
      await expect(
        engine.deliver(testUserId, activeDeliveryId, "12A4", "key-del-alpha"),
      ).rejects.toThrow(RiderError);
    });

    it("rejects an incorrect 4-digit OTP with OTP_WRONG and tracks failed attempts", async () => {
      const incorrectOtp = correctOtp === "9999" ? "0000" : "9999";

      try {
        await engine.deliver(testUserId, activeDeliveryId, incorrectOtp, "key-del-wrong-1");
        expect.unreachable("Should have failed with OTP_WRONG");
      } catch (err) {
        expect(err).toBeInstanceOf(RiderError);
        expect((err as RiderError).code).toBe("OTP_WRONG");
      }

      const otpRec = await store.getOtp(activeDeliveryId);
      expect(otpRec?.attempts).toBe(1);
      expect(otpRec?.verifiedAt).toBeNull();
    });

    it("successfully delivers when the correct 4-digit OTP is supplied", async () => {
      const delivered = await engine.deliver(testUserId, activeDeliveryId, correctOtp, "key-del-correct");
      expect(delivered.state).toBe("DELIVERED");
      expect(delivered.deliveredAt).not.toBeNull();

      const otpRec = await store.getOtp(activeDeliveryId);
      expect(otpRec?.verifiedAt).not.toBeNull();
    });

    it("rejects delivery attempt if rider has not reached delivery stage", async () => {
      const otherUserId = "rider-user-002";
      await engine.ensureRider({ id: otherUserId, name: "Other Rider", email: "other@orderking.in" });
      await engine.systemSetKyc("ADMIN", otherUserId, "VERIFIED");
      await engine.setStatus(otherUserId, "ONLINE", true);

      const freshOffer = createMockOffer({
        riderId: store.ridersByUser.get(otherUserId)!,
        id: "fresh-offer-002",
      });
      await store.insertOffer(freshOffer, otherUserId);
      const { delivery: freshDelivery } = await engine.respondOffer(
        otherUserId,
        freshOffer.id,
        "ACCEPT",
        undefined,
        "key-fresh-accept",
      );

      const otp = await engine.otpForSimulation(otherUserId, freshDelivery!.id);

      await expect(
        engine.deliver(otherUserId, freshDelivery!.id, otp!, "key-premature-del"),
      ).rejects.toThrow(RiderError);

      try {
        await engine.deliver(otherUserId, freshDelivery!.id, otp!, "key-premature-del-2");
      } catch (err) {
        expect(err).toBeInstanceOf(RiderError);
        expect((err as RiderError).code).toBe("INVALID_STATE");
      }
    });
  });

  describe("3. Statutory ₹35 Base Fare Floor and Distance Rate Payouts", () => {
    it("defines the statutory constants accurately", () => {
      expect(STATUTORY_BASE_FARE_PAISE).toBe(3500); // ₹35.00
      expect(STATUTORY_BASE_DISTANCE_KM).toBe(2); // 2 km included
      expect(STATUTORY_DISTANCE_RATE_PER_KM_PAISE).toBe(1200); // ₹12.00/km beyond 2km
    });

    it("calculates payout with ₹35 base fare floor for distances <= 2km", () => {
      expect(calculateRiderPayout(0)).toBe(3500);
      expect(calculateRiderPayout(0.5)).toBe(3500);
      expect(calculateRiderPayout(1.5)).toBe(3500);
      expect(calculateRiderPayout(2.0)).toBe(3500);
    });

    it("calculates payout including ₹12/km distance rate for distance beyond 2km", () => {
      // 3.0 km: 2km base + 1km * 1200 paise = 3500 + 1200 = 4700 paise (₹47)
      expect(calculateRiderPayout(3.0)).toBe(4700);

      // 4.5 km: 2km base + 2.5km * 1200 paise = 3500 + 3000 = 6500 paise (₹65)
      expect(calculateRiderPayout(4.5)).toBe(6500);

      // 5.0 km: 2km base + 3km * 1200 paise = 3500 + 3600 = 7100 paise (₹71)
      expect(calculateRiderPayout(5.0)).toBe(7100);

      // 10.0 km: 2km base + 8km * 1200 paise = 3500 + 9600 = 13100 paise (₹131)
      expect(calculateRiderPayout(10.0)).toBe(13100);
    });

    it("enforcePayoutFloor strictly guarantees no payout drops below ₹35 (3500 paise)", () => {
      expect(enforcePayoutFloor(0)).toBe(3500);
      expect(enforcePayoutFloor(1000)).toBe(3500);
      expect(enforcePayoutFloor(2500)).toBe(3500);
      expect(enforcePayoutFloor(3499)).toBe(3500);
      expect(enforcePayoutFloor(3500)).toBe(3500);
      expect(enforcePayoutFloor(5000)).toBe(5000);
    });

    it("engine.presentOffer clamps offer expectedPayoutPaise to at least ₹35", () => {
      const lowOffer = createMockOffer({ expectedPayoutPaise: 1500 }); // ₹15 raw
      const presented = engine.presentOffer(lowOffer);
      expect(presented.expectedPayoutPaise).toBe(3500); // raised to ₹35

      const fairOffer = createMockOffer({ expectedPayoutPaise: 6500 }); // ₹65 raw
      const presentedFair = engine.presentOffer(fairOffer);
      expect(presentedFair.expectedPayoutPaise).toBe(6500);
    });

    it("engine.respondOffer creates delivery with at least ₹35 fare floor", async () => {
      const lowOffer = createMockOffer({ expectedPayoutPaise: 1200 }); // ₹12 raw
      await store.insertOffer(lowOffer, testUserId);

      const res = await engine.respondOffer(testUserId, lowOffer.id, "ACCEPT", undefined, "key-floor-acc");
      expect(res.delivery!.expectedPayoutPaise).toBeGreaterThanOrEqual(3500);
      expect(res.offer.expectedPayoutPaise).toBeGreaterThanOrEqual(3500);
    });

    it("delivery completion credits at least ₹35 base floor to rider earnings ledger", async () => {
      const offer = createMockOffer({ expectedPayoutPaise: 1000 }); // Below ₹35 floor
      await store.insertOffer(offer, testUserId);

      const { delivery } = await engine.respondOffer(testUserId, offer.id, "ACCEPT", undefined, "key-earn-acc");
      const deliveryId = delivery!.id;

      // Progress through lifecycle to completion
      await engine.arriving(testUserId, deliveryId, "k1-" + deliveryId);
      await engine.arriveRestaurant(testUserId, deliveryId, "k2-" + deliveryId);
      await engine.pickup(
        testUserId,
        deliveryId,
        { method: "ORDER_CODE", code: delivery!.pickupCode },
        "k3-" + deliveryId,
      );
      await engine.startDelivery(testUserId, deliveryId, "k4-" + deliveryId);
      await engine.arriveCustomer(testUserId, deliveryId, "k5-" + deliveryId);

      const otp = await engine.otpForSimulation(testUserId, deliveryId);
      await engine.deliver(testUserId, deliveryId, otp!, "k6-" + deliveryId);

      // Check earnings ledger
      const earnings = await store.listEarnings(testUserId);
      const payoutLine = earnings.find((e) => e.deliveryId === deliveryId && e.kind === "DELIVERY_PAYOUT");
      expect(payoutLine).toBeDefined();
      expect(payoutLine!.amountPaise).toBeGreaterThanOrEqual(3500);
    });
  });
});
