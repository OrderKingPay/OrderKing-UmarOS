import { describe, it, expect, beforeEach } from "vitest";
import { RiderEngine } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";
import {
  evaluateRiderEligibilityAndScore,
  evaluateMultiOrderBatching,
  MULTI_ORDER_BATCH_CONSTRAINTS,
  type EligibleRider,
  type EligibilityInput,
  type BatchOrderProfile,
} from "../lib/rider/dispatch.ts";
import { RiderError, type DispatchOffer } from "../lib/rider/types.ts";

describe("Smart Proximity Dispatch Scoring & Multi-Order Batching Engine", () => {
  describe("1. Smart Proximity Dispatch Scoring (40% Proximity, 35% Acceptance, 25% Device Health)", () => {
    const baseRider: EligibleRider = {
      riderId: "rider-101",
      userId: "usr-101",
      status: "ONLINE",
      kycStatus: "VERIFIED",
      preferredZones: ["Guwahati Central"],
      lastPoint: { lat: 26.1445, lng: 91.7362 }, // Directly at pickup
      vehicleType: "MOTORCYCLE",
      historicalAcceptanceRate: 100, // 100%
      historicalCompletionRate: 98,
      averageRating: 4.9,
      pocketBalancePaise: 0,
      batteryLevel: 100, // 100%
    };

    it("calculates statutory allocation score with exact 40/35/25 weighting on ideal rider", () => {
      const input: EligibilityInput = {
        rider: { ...baseRider, batteryLevel: 100, historicalAcceptanceRate: 100 },
        dataMode: "LIVE",
        hasActiveDelivery: false,
        hasOpenOffer: false,
        pickup: { lat: 26.1445, lng: 91.7362 }, // 0 km distance
        restaurantArea: "Guwahati Central",
        maxRadiusKm: 5,
      };

      const result = evaluateRiderEligibilityAndScore(input);
      expect(result.eligible).toBe(true);

      // At 0 km: proximityScore = 100
      expect(result.proximityScore).toBe(100);
      // Acceptance rate: 100%
      expect(result.acceptanceRateScore).toBe(100);
      // Battery: 100% -> deviceHealthScore = 100
      expect(result.deviceHealthScore).toBe(100);

      // Total Allocation Score: (100 * 0.40) + (100 * 0.35) + (100 * 0.25) = 40 + 35 + 25 = 100
      expect(result.allocationScore).toBe(100);
      expect(result.score).toBe(100);
    });

    it("verifies mathematical precision across varying proximity, acceptance, and battery levels", () => {
      // Rider is 2.5km away with maxRadius 5km:
      // proximityScore = 100 - (2.5 / 5.0)^2 * 100 = 100 - 0.25 * 100 = 75
      // Acceptance rate: 80%
      // Battery level: 65% -> deviceHealthScore = 80 + ((65-50)/30)*15 = 87.5
      const input: EligibilityInput = {
        rider: {
          ...baseRider,
          lastPoint: { lat: 26.1445, lng: 91.7612 }, // ~2.5km away
          historicalAcceptanceRate: 80,
          batteryLevel: 65,
        },
        dataMode: "LIVE",
        hasActiveDelivery: false,
        hasOpenOffer: false,
        pickup: { lat: 26.1445, lng: 91.7362 },
        restaurantArea: "Guwahati Central",
        maxRadiusKm: 5,
      };

      const result = evaluateRiderEligibilityAndScore(input);
      expect(result.eligible).toBe(true);
      expect(result.proximityScore).toBeGreaterThanOrEqual(70);
      expect(result.proximityScore).toBeLessThanOrEqual(80);
      expect(result.acceptanceRateScore).toBe(80);
      expect(result.deviceHealthScore).toBe(87.5);

      const expectedManual = (result.proximityScore * 0.40) + (80 * 0.35) + (87.5 * 0.25);
      expect(Math.abs(result.allocationScore - expectedManual)).toBeLessThan(0.01);
    });

    it("disqualifies rider with critically low battery (<10%) when not charging", () => {
      const input: EligibilityInput = {
        rider: {
          ...baseRider,
          batteryLevel: 8,
          deviceHealth: { batteryLevel: 8, isCharging: false },
        },
        dataMode: "LIVE",
        hasActiveDelivery: false,
        hasOpenOffer: false,
        pickup: { lat: 26.1445, lng: 91.7362 },
        restaurantArea: "Guwahati Central",
        maxRadiusKm: 5,
      };

      const result = evaluateRiderEligibilityAndScore(input);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain("battery critically low");
      expect(result.deviceHealthScore).toBe(0);
    });

    it("allows rider with low battery if actively charging", () => {
      const input: EligibilityInput = {
        rider: {
          ...baseRider,
          batteryLevel: 8,
          deviceHealth: { batteryLevel: 8, isCharging: true },
        },
        dataMode: "LIVE",
        hasActiveDelivery: false,
        hasOpenOffer: false,
        pickup: { lat: 26.1445, lng: 91.7362 },
        restaurantArea: "Guwahati Central",
        maxRadiusKm: 5,
      };

      const result = evaluateRiderEligibilityAndScore(input);
      expect(result.eligible).toBe(true);
      expect(result.deviceHealthScore).toBeGreaterThan(0);
    });
  });

  describe("2. Multi-Order Batching Evaluation Geometry", () => {
    // Restaurant 1 in Paltan Bazaar, Drop 1 in Panbazar (~1.2 km direct trip)
    const order1: BatchOrderProfile = {
      orderId: "ord-1",
      orderCode: "OK-101",
      pickupLocation: { lat: 26.1800, lng: 91.7500 },
      dropLocation: { lat: 26.1880, lng: 91.7450 },
    };

    it("accepts multi-order batch when kitchens are within 800m and detour is <1.5km", () => {
      // Restaurant 2 is 400m from Restaurant 1 (lat +0.003, lng 0)
      // Drop 2 is near Panbazar / Dighalipukhuri (350m from Drop 1)
      const order2: BatchOrderProfile = {
        orderId: "ord-2",
        orderCode: "OK-102",
        pickupLocation: { lat: 26.1830, lng: 91.7500 },
        dropLocation: { lat: 26.1900, lng: 91.7460 },
      };

      const batch = evaluateMultiOrderBatching(order1, order2);
      expect(batch.canBatch).toBe(true);
      expect(batch.pickupDistanceMeters).toBeLessThanOrEqual(MULTI_ORDER_BATCH_CONSTRAINTS.maxKitchenPickupDistanceMeters);
      expect(batch.detourDistanceKm).toBeLessThan(MULTI_ORDER_BATCH_CONSTRAINTS.maxCorridorDetourKm);
      expect(batch.identicalCorridor).toBe(true);
    });

    it("rejects batching if pickup kitchens are farther than 800m apart", () => {
      // Restaurant 2 is 1.8km away in Fancy Bazaar
      const orderFarKitchen: BatchOrderProfile = {
        orderId: "ord-3",
        orderCode: "OK-103",
        pickupLocation: { lat: 26.1700, lng: 91.7350 },
        dropLocation: { lat: 26.1880, lng: 91.7450 },
      };

      const batch = evaluateMultiOrderBatching(order1, orderFarKitchen);
      expect(batch.canBatch).toBe(false);
      expect(batch.reason).toContain("Pickup kitchens are");
      expect(batch.reason).toContain("must be within 800m");
      expect(batch.pickupDistanceMeters).toBeGreaterThan(800);
    });

    it("rejects batching if customer drop-offs have a detour >= 1.5km", () => {
      // Restaurant 2 is right next door (100m away), but Drop 2 is in Khanapara (8km away in opposite direction)
      const orderFarDrop: BatchOrderProfile = {
        orderId: "ord-4",
        orderCode: "OK-104",
        pickupLocation: { lat: 26.1808, lng: 91.7505 },
        dropLocation: { lat: 26.1200, lng: 91.8100 },
      };

      const batch = evaluateMultiOrderBatching(order1, orderFarDrop);
      expect(batch.canBatch).toBe(false);
      expect(batch.reason).toContain("detour is");
      expect(batch.reason).toContain("must be <1.5km detour");
      expect(batch.detourDistanceKm).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe("3. End-to-End Multi-Order Batching in RiderEngine Lifecycle", () => {
    let store: MemoryStore;
    let engine: RiderEngine;
    const userId = "batched-courier-1";

    beforeEach(async () => {
      store = new MemoryStore();
      engine = new RiderEngine(store);
      await engine.ensureRider({ id: userId, name: "Pranjal Deka", email: "pranjal@orderking.fleet" });
      await engine.systemSetKyc("ADMIN", userId, "VERIFIED");
      await engine.setStatus(userId, "ONLINE", true);
    });

    function makeOffer(id: string, code: string, pickup: { lat: number; lng: number }, drop: { lat: number; lng: number }): DispatchOffer {
      const riderId = store.ridersByUser.get(userId) ?? "rider-1";
      return {
        id,
        orderCode: code,
        riderId,
        restaurant: {
          id: `rst-${code}`,
          name: `Kitchen ${code}`,
          area: "Central Hub",
          address: "G.S. Road",
          location: pickup,
          phoneMasked: "•••• 1122",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: `Customer ${code}`,
          area: "Ulubari",
          address: "B.K. Kakati Road",
          contactMasked: "•••• 3344",
          contactAllowed: true,
          instructions: null,
        },
        pickupLocation: pickup,
        dropLocation: drop,
        dropArea: "Ulubari",
        approxDistanceKm: 2.5,
        estimatedTravelKm: 2.5,
        estimatedTotalRouteKm: 2.5,
        expectedPayoutPaise: 4500, // ₹45.00
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
        dataMode: "LIVE",
      };
    }

    it("allows rider to accept 2 concurrent orders when batching criteria are met", async () => {
      const pickup1 = { lat: 26.1600, lng: 91.7500 };
      const drop1 = { lat: 26.1700, lng: 91.7550 };

      // Offer 1
      const offer1 = makeOffer("off-1", "OK-1", pickup1, drop1);
      await store.insertOffer(offer1, userId);

      // Rider accepts Order 1
      const res1 = await engine.respondOffer(userId, "off-1", "ACCEPT", undefined, "idem-acc-1");
      expect(res1.delivery?.state).toBe("ACCEPTED");
      expect(res1.delivery?.isBatched).toBe(false);

      // Rider status is now BUSY with 1 active delivery
      let activeDeliveries = await store.getActiveDeliveriesForRider(res1.delivery!.riderId);
      expect(activeDeliveries).toHaveLength(1);

      // Offer 2: Kitchen is 350m away, drop is 400m from drop 1 (identical corridor)
      const pickup2 = { lat: 26.1625, lng: 91.7515 };
      const drop2 = { lat: 26.1720, lng: 91.7570 };
      const offer2 = makeOffer("off-2", "OK-2", pickup2, drop2);
      await store.insertOffer(offer2, userId);

      // Rider accepts Order 2 -> Multi-Order Batching successfully activates!
      const res2 = await engine.respondOffer(userId, "off-2", "ACCEPT", undefined, "idem-acc-2");
      expect(res2.delivery?.state).toBe("ACCEPTED");
      expect(res2.delivery?.isBatched).toBe(true);
      expect(res2.offer.isBatched).toBe(true);

      // Both orders are now concurrently active!
      activeDeliveries = await store.getActiveDeliveriesForRider(res1.delivery!.riderId);
      expect(activeDeliveries).toHaveLength(2);

      // Primary order was updated with batch group association
      const updatedOrder1 = await store.getDeliveryById(res1.delivery!.id);
      expect(updatedOrder1?.isBatched).toBe(true);
      expect(updatedOrder1?.batchGroupId).toBe(res2.delivery?.batchGroupId);
      expect(updatedOrder1?.batchedWithDeliveryId).toBe(res2.delivery?.id);

      // Check home view reflects both batched orders
      const home = await engine.home(userId);
      expect(home.isBatchedActive).toBe(true);
      expect(home.activeDeliveries).toHaveLength(2);
    });

    it("rejects 2nd order if pickup kitchens are >800m apart", async () => {
      const pickup1 = { lat: 26.1600, lng: 91.7500 };
      const drop1 = { lat: 26.1700, lng: 91.7550 };
      const offer1 = makeOffer("off-10", "OK-10", pickup1, drop1);
      await store.insertOffer(offer1, userId);
      await engine.respondOffer(userId, "off-10", "ACCEPT", undefined, "idem-acc-10");

      // Offer 2 has pickup 2.2km away
      const pickupFar = { lat: 26.1400, lng: 91.7400 };
      const offerFar = makeOffer("off-11", "OK-11", pickupFar, drop1);
      await store.insertOffer(offerFar, userId);

      await expect(
        engine.respondOffer(userId, "off-11", "ACCEPT", undefined, "idem-acc-11")
      ).rejects.toThrow(/Pickup kitchens are.*must be within 800m/);
    });

    it("strictly prevents rider from accepting a 3rd concurrent order (max 2 concurrent orders)", async () => {
      const p1 = { lat: 26.1600, lng: 91.7500 };
      const d1 = { lat: 26.1700, lng: 91.7550 };
      const p2 = { lat: 26.1620, lng: 91.7510 };
      const d2 = { lat: 26.1710, lng: 91.7560 };
      const p3 = { lat: 26.1610, lng: 91.7505 };
      const d3 = { lat: 26.1705, lng: 91.7555 };

      const o1 = makeOffer("o-1", "OK-A", p1, d1);
      const o2 = makeOffer("o-2", "OK-B", p2, d2);
      const o3 = makeOffer("o-3", "OK-C", p3, d3);

      await store.insertOffer(o1, userId);
      await store.insertOffer(o2, userId);
      await store.insertOffer(o3, userId);

      await engine.respondOffer(userId, "o-1", "ACCEPT", undefined, "id-1");
      await engine.respondOffer(userId, "o-2", "ACCEPT", undefined, "id-2");

      // Attempting 3rd concurrent order must throw 409
      await expect(
        engine.respondOffer(userId, "o-3", "ACCEPT", undefined, "id-3")
      ).rejects.toThrow(/Maximum concurrent orders \(2\) reached/);
    });
  });
});
