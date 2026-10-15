import { describe, it, expect, beforeEach } from "vitest";
import {
  calculatePocketBalance,
  getCoolingOffInfo,
  calculateCancellationPenalty,
  parseDisciplineNotes,
  serializeDisciplineNotes,
} from "../lib/rider/discipline";
import {
  assertPlausiblePing,
  VEHICLE_SPEED_LIMITS_KMH,
} from "../lib/rider/gps";
import { RiderEngine, todayRange } from "../lib/rider/engine";
import { MemoryStore } from "../lib/rider/memory-store";
import {
  RiderError,
  type DispatchOffer,
  type GeoPoint,
  type LocationPing,
  type RiderDisciplineConfig,
  type Delivery,
} from "../lib/rider/types";

describe("Rider Discipline & Floating Cash (COD Pocket Balance)", () => {
  const defaultConfig: RiderDisciplineConfig = {
    enabled: true,
    floatingCashLimitInr: 2000,
    cancellationPenaltyBeforePickupInr: 25,
    cancellationPenaltyPostPickupType: "FULL_ORDER",
    cancellationPenaltyPostPickupCustomInr: 150,
    coolingOffConsecutiveRejections: 3,
    coolingOffAcceptanceRateThresholdPct: 70,
    coolingOffDurationMinutes: 15,
    upiDepositVpa: "orderking.fleet@okhdfcbank",
  };

  describe("calculatePocketBalance", () => {
    it("allows COD orders when pocket balance is below the ₹2,000 threshold", () => {
      // Rider collected ₹800, reconciled ₹0 -> Balance = ₹800
      const status = calculatePocketBalance(80000, 0, 2000, true);
      expect(status.collectedPaise).toBe(80000);
      expect(status.reconciledPaise).toBe(0);
      expect(status.pocketBalancePaise).toBe(80000);
      expect(status.limitPaise).toBe(200000);
      expect(status.canAcceptCod).toBe(true);
      expect(status.isCodBlocked).toBe(false);
      expect(status.utilizationPct).toBe(40);
    });

    it("blocks COD orders when pocket balance meets or exceeds the threshold", () => {
      // Rider collected ₹2,000, reconciled ₹0 -> Balance = ₹2,000 (100% cap)
      const exactCap = calculatePocketBalance(200000, 0, 2000, true);
      expect(exactCap.canAcceptCod).toBe(false);
      expect(exactCap.isCodBlocked).toBe(true);
      expect(exactCap.utilizationPct).toBe(100);

      // Rider collected ₹2,500, reconciled ₹0 -> Balance = ₹2,500 (>100%)
      const overCap = calculatePocketBalance(250000, 0, 2000, true);
      expect(overCap.canAcceptCod).toBe(false);
      expect(overCap.isCodBlocked).toBe(true);
      expect(overCap.utilizationPct).toBe(100);
    });

    it("unblocks COD orders immediately upon UPI / gateway floating cash deposit", () => {
      // Initial: ₹2,400 collected, 0 reconciled -> blocked
      const beforeDeposit = calculatePocketBalance(240000, 0, 2000, true);
      expect(beforeDeposit.isCodBlocked).toBe(true);

      // Deposit ₹2,000 via UPI QR / Razorpay gateway -> reconciled = ₹2,000, balance = ₹400
      const afterDeposit = calculatePocketBalance(240000, 200000, 2000, true);
      expect(afterDeposit.pocketBalancePaise).toBe(40000);
      expect(afterDeposit.canAcceptCod).toBe(true);
      expect(afterDeposit.isCodBlocked).toBe(false);
      expect(afterDeposit.utilizationPct).toBe(20);
    });

    it("bypasses COD block when disciplineEnabled is false (admin override)", () => {
      const bypassed = calculatePocketBalance(300000, 0, 2000, false);
      expect(bypassed.isCodBlocked).toBe(false);
      expect(bypassed.canAcceptCod).toBe(true);
    });

    it("blocks COD order when incoming COD amount pushes balance over ₹2,000 threshold (Lookahead Check)", () => {
      // Current pocket balance = ₹1,800 (180,000 paise), limit = ₹2,000 (200,000 paise)
      // Incoming COD offer = ₹300 (30,000 paise) -> Projected = ₹2,100 (> ₹2,000 limit)
      const lookaheadBlocked = calculatePocketBalance(180000, 0, 2000, true, 30000);
      expect(lookaheadBlocked.pocketBalancePaise).toBe(180000);
      expect(lookaheadBlocked.limitPaise).toBe(200000);
      expect(lookaheadBlocked.canAcceptCod).toBe(false);
      expect(lookaheadBlocked.isCodBlocked).toBe(true);
    });

    it("allows COD order when incoming COD amount keeps balance within ₹2,000 threshold (Lookahead Check)", () => {
      // Current balance = ₹1,800, incoming COD = ₹200 -> Projected = ₹2,000 (exact threshold, not strictly greater)
      const exactFit = calculatePocketBalance(180000, 0, 2000, true, 20000);
      expect(exactFit.pocketBalancePaise).toBe(180000);
      expect(exactFit.canAcceptCod).toBe(true);
      expect(exactFit.isCodBlocked).toBe(false);

      // Current balance = ₹1,400, incoming COD = ₹300 -> Projected = ₹1,700 (< ₹2,000 limit)
      const withinLimit = calculatePocketBalance(140000, 0, 2000, true, 30000);
      expect(withinLimit.canAcceptCod).toBe(true);
      expect(withinLimit.isCodBlocked).toBe(false);
    });

    it("bypasses lookahead COD block when disciplineEnabled is false", () => {
      const bypassed = calculatePocketBalance(180000, 0, 2000, false, 50000);
      expect(bypassed.isCodBlocked).toBe(false);
      expect(bypassed.canAcceptCod).toBe(true);
    });
  });

  describe("getCoolingOffInfo", () => {
    it("returns inactive when coolingOffUntil is null or empty", () => {
      const info = getCoolingOffInfo(null, null);
      expect(info.isActive).toBe(false);
      expect(info.secondsRemaining).toBe(0);
    });

    it("returns inactive when cooling-off time has already passed", () => {
      const pastTime = new Date(Date.now() - 60000).toISOString();
      const info = getCoolingOffInfo(pastTime, "Consecutive rejections", Date.now());
      expect(info.isActive).toBe(false);
      expect(info.secondsRemaining).toBe(0);
    });

    it("returns active with remaining seconds when cooling-off is currently in effect", () => {
      const now = 1700000000000;
      const futureTime = new Date(now + 15 * 60 * 1000).toISOString(); // 15 minutes ahead
      const info = getCoolingOffInfo(futureTime, "3 consecutive order rejections", now);
      expect(info.isActive).toBe(true);
      expect(info.secondsRemaining).toBe(900);
      expect(info.reason).toBe("3 consecutive order rejections");
    });
  });

  describe("calculateCancellationPenalty", () => {
    it("applies configurable pre-pickup cancellation penalty (₹25–₹50)", () => {
      const penalty = calculateCancellationPenalty(
        "ARRIVED_AT_RESTAURANT",
        25000,
        4500,
        defaultConfig,
        false
      );

      expect(penalty.isPostPickup).toBe(false);
      expect(penalty.requiresAuditHold).toBe(false);
      expect(penalty.penaltyPaise).toBe(2500); // ₹25 = 2500 paise
      expect(penalty.label).toContain("Pre-pickup cancellation penalty");
    });

    it("applies full order deduction when order is cancelled post-pickup without proof", () => {
      const codAmountPaise = 32000; // ₹320
      const expectedPayoutPaise = 4200; // ₹42
      const penalty = calculateCancellationPenalty(
        "OUT_FOR_DELIVERY",
        codAmountPaise,
        expectedPayoutPaise,
        defaultConfig,
        false
      );

      expect(penalty.isPostPickup).toBe(true);
      expect(penalty.requiresAuditHold).toBe(true);
      // Math.max(32000, 15000) + 4200 = 36200 paise (₹362.00)
      expect(penalty.penaltyPaise).toBe(36200);
      expect(penalty.label).toContain("Post-pickup cancellation without proof");
    });

    it("waives penalty and holds for audit if post-pickup cancellation has verified proof", () => {
      const penalty = calculateCancellationPenalty(
        "OUT_FOR_DELIVERY",
        32000,
        4200,
        defaultConfig,
        true // Verified emergency proof
      );

      expect(penalty.isPostPickup).toBe(true);
      expect(penalty.requiresAuditHold).toBe(true);
      expect(penalty.penaltyPaise).toBe(0); // Waived
      expect(penalty.label).toContain("Penalty Waived");
    });

    it("returns zero penalty for terminal or unassigned states", () => {
      const penalty = calculateCancellationPenalty(
        "DELIVERED",
        32000,
        4200,
        defaultConfig,
        false
      );
      expect(penalty.penaltyPaise).toBe(0);
      expect(penalty.isPostPickup).toBe(false);
      expect(penalty.requiresAuditHold).toBe(false);
    });
  });

  describe("parseDisciplineNotes & serializeDisciplineNotes", () => {
    it("serializes and parses discipline state while preserving human notes", () => {
      const originalHumanNotes = "Prefers evening shifts in HSR Layout.";
      const state = {
        consecutiveDeclines: 2,
        coolingOffUntil: "2026-10-15T05:00:00.000Z",
        coolingOffReason: "Declined 2 rush orders",
      };

      const serialized = serializeDisciplineNotes(originalHumanNotes, state);
      expect(serialized).toContain(originalHumanNotes);
      expect(serialized).toContain("[DISCIPLINE:");

      const parsed = parseDisciplineNotes(serialized);
      expect(parsed.cleanNotes).toBe(originalHumanNotes);
      expect(parsed.state.consecutiveDeclines).toBe(2);
      expect(parsed.state.coolingOffUntil).toBe("2026-10-15T05:00:00.000Z");
      expect(parsed.state.coolingOffReason).toBe("Declined 2 rush orders");
    });

    it("gracefully falls back when notes do not contain discipline tags", () => {
      const parsed = parseDisciplineNotes("Just a regular rider note.");
      expect(parsed.cleanNotes).toBe("Just a regular rider note.");
      expect(parsed.state.consecutiveDeclines).toBe(0);
      expect(parsed.state.coolingOffUntil).toBeNull();
    });
  });

  describe("Vehicle Speed Limits & GPS Plausibility (gps.ts:assertPlausiblePing)", () => {
    const origin: GeoPoint = { lat: 12.9716, lng: 77.5946 };
    const baseTime = Date.now();
    const nowIso = new Date(baseTime).toISOString();
    const oneHourLater = new Date(baseTime + 3_600_000).toISOString();

    const prevPing: LocationPing = {
      id: "ping-prev",
      riderId: "rider-speed-1",
      deliveryId: null,
      point: origin,
      accuracyM: 5,
      at: nowIso,
    };

    it("exports vehicle velocity limits: 80 km/h MOTORCYCLE/SCOOTER, 30 km/h BICYCLE, 15 km/h WALKING", () => {
      expect(VEHICLE_SPEED_LIMITS_KMH.MOTORCYCLE).toBe(80);
      expect(VEHICLE_SPEED_LIMITS_KMH.SCOOTER).toBe(80);
      expect(VEHICLE_SPEED_LIMITS_KMH.BICYCLE).toBe(30);
      expect(VEHICLE_SPEED_LIMITS_KMH.WALKING).toBe(15);
    });

    it("enforces MOTORCYCLE speed limit (80 km/h cap)", () => {
      // 60 km jump in 1 hour (~60 km/h) -> passes
      const point60km: GeoPoint = { lat: origin.lat + 0.54, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point60km, oneHourLater, "MOTORCYCLE")).not.toThrow();

      // 95 km jump in 1 hour (~95 km/h) -> exceeds 80 km/h cap -> throws FAKE_GPS
      const point95km: GeoPoint = { lat: origin.lat + 0.86, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point95km, oneHourLater, "MOTORCYCLE")).toThrow(RiderError);
      try {
        assertPlausiblePing(prevPing, point95km, oneHourLater, "MOTORCYCLE");
      } catch (e) {
        expect((e as RiderError).code).toBe("FAKE_GPS");
        expect((e as RiderError).message).toContain("MOTORCYCLE");
      }
    });

    it("enforces SCOOTER speed limit (80 km/h cap)", () => {
      const point60km: GeoPoint = { lat: origin.lat + 0.54, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point60km, oneHourLater, "SCOOTER")).not.toThrow();

      const point90km: GeoPoint = { lat: origin.lat + 0.81, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point90km, oneHourLater, "SCOOTER")).toThrow(RiderError);
    });

    it("enforces BICYCLE speed limit (30 km/h cap)", () => {
      // 20 km jump in 1 hour (~20 km/h) -> passes
      const point20km: GeoPoint = { lat: origin.lat + 0.18, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point20km, oneHourLater, "BICYCLE")).not.toThrow();

      // 40 km jump in 1 hour (~40 km/h) -> exceeds 30 km/h cap -> throws FAKE_GPS
      const point40km: GeoPoint = { lat: origin.lat + 0.36, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point40km, oneHourLater, "BICYCLE")).toThrow(RiderError);
      try {
        assertPlausiblePing(prevPing, point40km, oneHourLater, "BICYCLE");
      } catch (e) {
        expect((e as RiderError).code).toBe("FAKE_GPS");
        expect((e as RiderError).message).toContain("BICYCLE");
      }
    });

    it("enforces WALKING speed limit (15 km/h cap)", () => {
      // 10 km jump in 1 hour (~10 km/h) -> passes
      const point10km: GeoPoint = { lat: origin.lat + 0.09, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point10km, oneHourLater, "WALKING")).not.toThrow();

      // 20 km jump in 1 hour (~20 km/h) -> exceeds 15 km/h cap -> throws FAKE_GPS
      const point20km: GeoPoint = { lat: origin.lat + 0.18, lng: origin.lng };
      expect(() => assertPlausiblePing(prevPing, point20km, oneHourLater, "WALKING")).toThrow(RiderError);
      try {
        assertPlausiblePing(prevPing, point20km, oneHourLater, "WALKING");
      } catch (e) {
        expect((e as RiderError).code).toBe("FAKE_GPS");
        expect((e as RiderError).message).toContain("WALKING");
      }
    });

    it("rejects instant teleportation with elapsed time <= 0 and distance > 50m", () => {
      const teleportPoint: GeoPoint = { lat: origin.lat + 0.01, lng: origin.lng }; // ~1.1 km
      expect(() => assertPlausiblePing(prevPing, teleportPoint, nowIso, "MOTORCYCLE")).toThrow(RiderError);
    });
  });

  describe("RiderEngine Anti-Fraud & Discipline Hardening", () => {
    let store: MemoryStore;
    let engine: RiderEngine;
    const testUserId = "fraud-test-user-01";

    beforeEach(async () => {
      store = new MemoryStore();
      engine = new RiderEngine(store);
      await engine.ensureRider({
        id: testUserId,
        name: "Discipline Partner",
        email: "partner@orderking.in",
      });
      await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
      await engine.setStatus(testUserId, "ONLINE", true);
    });

    function createMockOffer(overrides: Partial<DispatchOffer> = {}): DispatchOffer {
      const riderId = store.ridersByUser.get(testUserId) ?? "rider-1";
      return {
        id: "offer-" + Math.random().toString(36).slice(2, 8),
        orderCode: "ORD-DISC-100",
        riderId,
        restaurant: {
          id: "rest-1",
          name: "Biryani Blues",
          area: "Indiranagar",
          address: "100ft Rd",
          location: { lat: 12.9716, lng: 77.5946 },
          phoneMasked: "•••• 9876",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Customer VIP",
          area: "Koramangala",
          address: "123 5th Block",
          contactMasked: "•••• 1234",
          contactAllowed: true,
          instructions: "Leave at door",
        },
        pickupLocation: { lat: 12.9716, lng: 77.5946 },
        dropLocation: { lat: 12.9352, lng: 77.6245 },
        dropArea: "Koramangala",
        approxDistanceKm: 4.5,
        estimatedTravelKm: 4.5,
        estimatedTotalRouteKm: 4.5,
        expectedPayoutPaise: 4500,
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        status: "OPEN",
        createdAt: new Date().toISOString(),
        dataMode: "SIMULATED",
        ...overrides,
      };
    }

    describe("1. COD Floating Cash Lookahead Gate (engine.respondOffer)", () => {
      it("blocks accepting COD offer when (pocketBalancePaise + incomingCodAmountPaise) > ₹2,000 threshold", async () => {
        const riderId = store.ridersByUser.get(testUserId)!;

        // Simulate rider already holding ₹1,800 (180,000 paise) in floating cash
        const pastDelivery: Delivery = {
          id: "del-cod-past",
          offerId: "off-past",
          riderId,
          userId: testUserId,
          orderCode: "ORD-PAST-01",
          orderId: "ord-p1",
          state: "DELIVERED",
          restaurant: {
            id: "r1",
            name: "R1",
            area: "A1",
            address: "Addr",
            location: { lat: 12.97, lng: 77.59 },
            phoneMasked: "•••",
            specialPickupInstructions: null,
            preparationStatus: "READY",
          },
          customer: {
            displayName: "C1",
            area: "A1",
            address: "Addr",
            contactMasked: "•••",
            contactAllowed: true,
            instructions: null,
          },
          pickupLocation: { lat: 12.97, lng: 77.59 },
          dropLocation: { lat: 12.93, lng: 77.62 },
          packageCount: 1,
          expectedPayoutPaise: 4000,
          cod: true,
          codAmountPaise: 180000,
          pickupVerification: "ORDER_CODE",
          pickupCode: "1234",
          otpRequired: true,
          arrivedRestaurantAt: null,
          expectedReadyAt: null,
          pickedUpAt: null,
          arrivedCustomerAt: null,
          deliveredAt: new Date().toISOString(),
          waitStartedAt: null,
          contactAttempts: 0,
          cancelReason: null,
          failReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataMode: "SIMULATED",
        };
        await store.insertDelivery(pastDelivery);
        await store.saveCash(
          {
            deliveryId: pastDelivery.id,
            riderId,
            expectedPaise: 180000,
            collectedPaise: 180000,
            state: "COLLECTED",
            exceptionReason: null,
            updatedAt: new Date().toISOString(),
          },
          testUserId
        );

        // Verify current balance is ₹1,800
        const currentPocket = await engine.getPocketBalance(testUserId);
        expect(currentPocket.pocketBalancePaise).toBe(180000);
        expect(currentPocket.isCodBlocked).toBe(false);

        // New COD offer with ₹300 incoming cash -> 180,000 + 30,000 = 210,000 paise (> ₹2,000 cap)
        const incomingOffer = createMockOffer({
          cod: true,
          codAmountPaise: 30000,
        });
        await store.insertOffer(incomingOffer, testUserId);

        // Attempt to accept -> must be blocked with FLOATING_CASH_LIMIT_EXCEEDED (403)
        await expect(
          engine.respondOffer(testUserId, incomingOffer.id, "ACCEPT", undefined, "key-acc-overcap")
        ).rejects.toThrow(RiderError);

        try {
          await engine.respondOffer(testUserId, incomingOffer.id, "ACCEPT", undefined, "key-acc-overcap-2");
        } catch (err) {
          expect(err).toBeInstanceOf(RiderError);
          expect((err as RiderError).code).toBe("FLOATING_CASH_LIMIT_EXCEEDED");
          expect((err as RiderError).status).toBe(403);
          expect((err as RiderError).message).toContain("Floating cash pocket balance");
        }
      });

      it("allows accepting COD offer when (pocketBalancePaise + incomingCodAmountPaise) <= ₹2,000 threshold", async () => {
        const riderId = store.ridersByUser.get(testUserId)!;

        // Rider holds ₹1,800 in floating cash
        const pastDelivery: Delivery = {
          id: "del-cod-past-2",
          offerId: "off-past-2",
          riderId,
          userId: testUserId,
          orderCode: "ORD-PAST-02",
          orderId: "ord-p2",
          state: "DELIVERED",
          restaurant: {
            id: "r1",
            name: "R1",
            area: "A1",
            address: "Addr",
            location: { lat: 12.97, lng: 77.59 },
            phoneMasked: "•••",
            specialPickupInstructions: null,
            preparationStatus: "READY",
          },
          customer: {
            displayName: "C1",
            area: "A1",
            address: "Addr",
            contactMasked: "•••",
            contactAllowed: true,
            instructions: null,
          },
          pickupLocation: { lat: 12.97, lng: 77.59 },
          dropLocation: { lat: 12.93, lng: 77.62 },
          packageCount: 1,
          expectedPayoutPaise: 4000,
          cod: true,
          codAmountPaise: 180000,
          pickupVerification: "ORDER_CODE",
          pickupCode: "1234",
          otpRequired: true,
          arrivedRestaurantAt: null,
          expectedReadyAt: null,
          pickedUpAt: null,
          arrivedCustomerAt: null,
          deliveredAt: new Date().toISOString(),
          waitStartedAt: null,
          contactAttempts: 0,
          cancelReason: null,
          failReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataMode: "SIMULATED",
        };
        await store.insertDelivery(pastDelivery);
        await store.saveCash(
          {
            deliveryId: pastDelivery.id,
            riderId,
            expectedPaise: 180000,
            collectedPaise: 180000,
            state: "COLLECTED",
            exceptionReason: null,
            updatedAt: new Date().toISOString(),
          },
          testUserId
        );

        // New COD offer with ₹150 incoming cash -> 180,000 + 15,000 = 195,000 paise (<= ₹2,000 cap)
        const withinCapOffer = createMockOffer({
          cod: true,
          codAmountPaise: 15000,
        });
        await store.insertOffer(withinCapOffer, testUserId);

        const result = await engine.respondOffer(testUserId, withinCapOffer.id, "ACCEPT", undefined, "key-acc-fit");
        expect(result.decision).toBe("ACCEPT");
        expect(result.delivery).toBeTruthy();
        expect(result.delivery?.state).toBe("ACCEPTED");
      });

      it("allows non-COD orders without being affected by floating cash balance", async () => {
        // High floating cash does not block prepaid (online) deliveries
        const nonCodOffer = createMockOffer({
          cod: false,
          codAmountPaise: 0,
        });
        await store.insertOffer(nonCodOffer, testUserId);

        const result = await engine.respondOffer(testUserId, nonCodOffer.id, "ACCEPT", undefined, "key-acc-prepaid");
        expect(result.decision).toBe("ACCEPT");
        expect(result.delivery).toBeTruthy();
      });
    });

    describe("2. Handover Drop-off Geofence Gate (engine.deliver)", () => {
      let activeDeliveryId: string;
      let correctOtp: string;
      const dropPoint: GeoPoint = { lat: 12.9352, lng: 77.6245 };

      beforeEach(async () => {
        const offer = createMockOffer({ dropLocation: dropPoint });
        await store.insertOffer(offer, testUserId);
        const { delivery } = await engine.respondOffer(testUserId, offer.id, "ACCEPT", undefined, "key-acc-" + offer.id);
        activeDeliveryId = delivery!.id;

        // Progress delivery through lifecycle to ARRIVED_AT_CUSTOMER
        await engine.arriving(testUserId, activeDeliveryId, "k-arr-" + activeDeliveryId);
        await engine.arriveRestaurant(testUserId, activeDeliveryId, "k-arr-rest-" + activeDeliveryId);
        await engine.pickup(
          testUserId,
          activeDeliveryId,
          { method: "ORDER_CODE", code: delivery!.pickupCode },
          "k-pick-" + activeDeliveryId
        );
        await engine.startDelivery(testUserId, activeDeliveryId, "k-start-" + activeDeliveryId);
        await engine.arriveCustomer(testUserId, activeDeliveryId, "k-arrcust-" + activeDeliveryId);

        const otp = await engine.otpForSimulation(testUserId, activeDeliveryId);
        expect(otp).toBeTruthy();
        correctOtp = otp!;
      });

      it("blocks delivery completion when rider's latest GPS ping is outside 250m geofence", async () => {
        // Ping rider location in Indiranagar (~4.5 km away from Koramangala drop location)
        const farPoint: GeoPoint = { lat: 12.9716, lng: 77.5946 };
        await engine.pingLocation(testUserId, farPoint, activeDeliveryId, 5);

        // Attempting to deliver must throw OUT_OF_GEOFENCE
        await expect(
          engine.deliver(testUserId, activeDeliveryId, correctOtp, "k-del-far")
        ).rejects.toThrow(RiderError);

        try {
          await engine.deliver(testUserId, activeDeliveryId, correctOtp, "k-del-far-2");
        } catch (err) {
          expect(err).toBeInstanceOf(RiderError);
          expect((err as RiderError).code).toBe("OUT_OF_GEOFENCE");
          expect((err as RiderError).message).toContain("within 250m");
        }
      });

      it("allows delivery completion when rider's latest GPS ping is within 250m geofence", async () => {
        // Ping rider location within 50 meters of dropLocation
        // lat delta ~0.0004 is approx 44 meters
        const nearPoint: GeoPoint = { lat: dropPoint.lat + 0.0004, lng: dropPoint.lng };
        await engine.pingLocation(testUserId, nearPoint, activeDeliveryId, 5);

        const delivered = await engine.deliver(testUserId, activeDeliveryId, correctOtp, "k-del-near");
        expect(delivered.state).toBe("DELIVERED");
        expect(delivered.deliveredAt).toBeTruthy();
      });
    });

    describe("3. Active Shift Acceptance Rate Scoping (todayRange in engine.handleOfferDecline)", () => {
      it("scopes acceptance rate calculation to today's shift window and freezes rider when rate drops below 70%", async () => {
        const riderId = store.ridersByUser.get(testUserId)!;

        // Configure rejections limit to 10 so rejections count alone does NOT freeze the rider,
        // isolating the acceptance rate freeze trigger (floor: 70%, min 5 offers)
        const cfg = await store.getConfig();
        cfg.discipline = {
          ...defaultConfig,
          coolingOffConsecutiveRejections: 10,
          coolingOffAcceptanceRateThresholdPct: 70,
        };
        await store.saveConfig(cfg);

        // Insert 10 historical deliveries from YESTERDAY (25 hours ago)
        const yesterdayIso = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
        for (let i = 0; i < 10; i++) {
          const histDelivery: Delivery = {
            id: `del-hist-${i}`,
            offerId: `off-hist-${i}`,
            riderId,
            userId: testUserId,
            orderCode: `ORD-HIST-${i}`,
            orderId: `ord-hist-${i}`,
            state: "DELIVERED",
            restaurant: {
              id: "r1",
              name: "R1",
              area: "A1",
              address: "Addr",
              location: { lat: 12.97, lng: 77.59 },
              phoneMasked: "•••",
              specialPickupInstructions: null,
              preparationStatus: "READY",
            },
            customer: {
              displayName: "C1",
              area: "A1",
              address: "Addr",
              contactMasked: "•••",
              contactAllowed: true,
              instructions: null,
            },
            pickupLocation: { lat: 12.97, lng: 77.59 },
            dropLocation: { lat: 12.93, lng: 77.62 },
            packageCount: 1,
            expectedPayoutPaise: 4000,
            cod: false,
            codAmountPaise: 0,
            pickupVerification: "ORDER_CODE",
            pickupCode: "1234",
            otpRequired: true,
            arrivedRestaurantAt: null,
            expectedReadyAt: null,
            pickedUpAt: null,
            arrivedCustomerAt: null,
            deliveredAt: yesterdayIso,
            waitStartedAt: null,
            contactAttempts: 0,
            cancelReason: null,
            failReason: null,
            createdAt: yesterdayIso,
            updatedAt: yesterdayIso,
            dataMode: "SIMULATED",
          };
          await store.insertDelivery(histDelivery);
        }

        // Rider has 1 delivery accepted TODAY
        const todayDelivery: Delivery = {
          id: "del-today-1",
          offerId: "off-today-1",
          riderId,
          userId: testUserId,
          orderCode: "ORD-TODAY-01",
          orderId: "ord-t1",
          state: "DELIVERED",
          restaurant: {
            id: "r1",
            name: "R1",
            area: "A1",
            address: "Addr",
            location: { lat: 12.97, lng: 77.59 },
            phoneMasked: "•••",
            specialPickupInstructions: null,
            preparationStatus: "READY",
          },
          customer: {
            displayName: "C1",
            area: "A1",
            address: "Addr",
            contactMasked: "•••",
            contactAllowed: true,
            instructions: null,
          },
          pickupLocation: { lat: 12.97, lng: 77.59 },
          dropLocation: { lat: 12.93, lng: 77.62 },
          packageCount: 1,
          expectedPayoutPaise: 4000,
          cod: false,
          codAmountPaise: 0,
          pickupVerification: "ORDER_CODE",
          pickupCode: "1234",
          otpRequired: true,
          arrivedRestaurantAt: null,
          expectedReadyAt: null,
          pickedUpAt: null,
          arrivedCustomerAt: null,
          deliveredAt: new Date().toISOString(),
          waitStartedAt: null,
          contactAttempts: 0,
          cancelReason: null,
          failReason: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dataMode: "SIMULATED",
        };
        await store.insertDelivery(todayDelivery);

        // Verify listDeliveriesForUser with todayRange only returns 1 delivery (today)
        const deliveriesToday = await store.listDeliveriesForUser(testUserId, todayRange());
        expect(deliveriesToday.length).toBe(1);

        // Now decline 4 offers today in succession
        // Total offered today = 1 accepted + 4 declines = 5 offers
        // Acceptance rate today = (1 / 5) * 100 = 20% < 70% threshold!
        // (Note: If yesterday's 10 deliveries were counted, total = 11 accepted / 15 offered = 73% >= 70% and wouldn't freeze)
        for (let i = 1; i <= 4; i++) {
          const offer = createMockOffer({ id: `offer-shift-dec-${i}` });
          await store.insertOffer(offer, testUserId);
          await engine.respondOffer(testUserId, offer.id, "DECLINE", "Shift test decline", `k-dec-${i}`);
        }

        // Rider must now be OFFLINE in cooling-off freeze due to today's active shift acceptance rate breach
        const rider = await store.getRiderByUserId(testUserId);
        expect(rider?.status).toBe("OFFLINE");
        expect(rider?.coolingOffUntil).toBeTruthy();
        expect(rider?.coolingOffReason).toContain("Acceptance rate fell to 20%");
      });
    });

    describe("4. Offer Expiry Tracking (engine.expireOffers)", () => {
      it("increments consecutive declines when offers expire and triggers cooling-off after 3 ignored offers", async () => {
        const rider = (await store.getRiderByUserId(testUserId))!;
        expect(rider.consecutiveDeclines ?? 0).toBe(0);

        // Expired Offer 1
        const offer1 = createMockOffer({
          id: "off-exp-1",
          expiresAt: new Date(Date.now() - 5000).toISOString(), // expired in past
        });
        await store.insertOffer(offer1, testUserId);

        await engine.expireOffers(rider);
        const riderAfter1 = (await store.getRiderByUserId(testUserId))!;
        expect(riderAfter1.consecutiveDeclines).toBe(1);
        expect(riderAfter1.status).toBe("ONLINE");

        // Expired Offer 2
        const offer2 = createMockOffer({
          id: "off-exp-2",
          expiresAt: new Date(Date.now() - 5000).toISOString(),
        });
        await store.insertOffer(offer2, testUserId);

        await engine.expireOffers(riderAfter1);
        const riderAfter2 = (await store.getRiderByUserId(testUserId))!;
        expect(riderAfter2.consecutiveDeclines).toBe(2);
        expect(riderAfter2.status).toBe("ONLINE");

        // Expired Offer 3 -> reaches 3 consecutive rejections limit -> triggers cooling-off!
        const offer3 = createMockOffer({
          id: "off-exp-3",
          expiresAt: new Date(Date.now() - 5000).toISOString(),
        });
        await store.insertOffer(offer3, testUserId);

        await engine.expireOffers(riderAfter2);
        const riderAfter3 = (await store.getRiderByUserId(testUserId))!;
        expect(riderAfter3.status).toBe("OFFLINE");
        expect(riderAfter3.coolingOffUntil).toBeTruthy();
        expect(riderAfter3.coolingOffReason).toContain("3 consecutive order rejections");

        // Verify cooling-off info recognizes the active freeze
        const cooling = getCoolingOffInfo(riderAfter3.coolingOffUntil, riderAfter3.coolingOffReason);
        expect(cooling.isActive).toBe(true);
        expect(cooling.secondsRemaining).toBeGreaterThan(0);
      });
    });
  });
});
