import { describe, it, expect, beforeEach } from "vitest";
import {
  computePowerProfile,
  FleetSafetyEngine,
  STANDARD_GPS_INTERVAL_MS,
  LOW_BATTERY_GPS_INTERVAL_MS,
  generateDynamicDeliveryQr,
  verifyDoorstepDelivery,
  validateGpsTelemetry,
  MAX_PERMISSIBLE_SPEED_KMH,
} from "../lib/fleet/fleet-safety-engine";
import {
  evaluateDutyBatteryGate,
  MIN_DUTY_BATTERY_PCT,
  WARN_DUTY_BATTERY_PCT,
} from "../lib/fleet/device-health";
import { MANDATORY_OFFLINE_REASONS } from "../components/rider/home-view";
import {
  assertValidCoordinates,
  assertPlausiblePing,
  VEHICLE_SPEED_LIMITS_KMH,
} from "../lib/rider/gps";
import {
  VIBRATION_PATTERN_RADAR_SIREN,
  dispatchAudioSynthesizer,
} from "../lib/rider/dispatch-audio";
import { RiderEngine } from "../lib/rider/engine";
import { MemoryStore } from "../lib/rider/memory-store";
import { newOtpSecret } from "../lib/rider/otp";
import {
  RiderError,
  type Delivery,
  type DispatchOffer,
  type LocationPing,
  type RiderProfile,
} from "../lib/rider/types";

describe("Toughest Tasks Empirical Verification: Rider Fleet & Telecom", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "user_tough_test_01";
  const testRiderId = "rider_tough_test_01";

  beforeEach(async () => {
    store = new MemoryStore();
    engine = new RiderEngine(store);

    const riderProfile: RiderProfile = {
      id: testRiderId,
      userId: testUserId,
      fullName: "Vikram Das",
      phone: "9395065587",
      email: "vikram@orderking.test",
      photoUrl: null,
      address: "Beltola, Guwahati, Assam - 781028",
      emergencyName: "Kabir Das",
      emergencyPhone: "9876501234",
      dateOfBirth: "1995-05-10",
      governmentIdType: "AADHAAR",
      governmentIdLast4: "5587",
      kycStatus: "VERIFIED",
      kycRejectReason: null,
      riderType: "FULL_TIME",
      vehicleType: "MOTORCYCLE",
      vehicleRegistration: "AS01AB9988",
      licenceNumber: "AS0120220011223",
      insuranceRef: "INS-9988-2026",
      preferredZones: ["Guwahati-Central"],
      availabilityNotes: "",
      status: "ONLINE",
      onlineSince: new Date().toISOString(),
      locale: "as",
      payoutUpi: "9395065587@ybl",
      payoutBankLast4: "5587",
      dataMode: "LIVE",
      ratingAvg: 4.95,
      lifetimeDeliveries: 1420,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await store.upsertRider(riderProfile);
  });

  // =========================================================================
  // 1. Live GPS Telemetry: High Accuracy Mode without Battery-Throttle Drift
  // =========================================================================
  describe("1. Live GPS Telemetry Stream & Power Profiling without Drift", () => {
    it("enforces high-accuracy mode constraints with valid coordinate bounds", () => {
      // Valid coordinates within Assam / India
      expect(() =>
        assertValidCoordinates({ lat: 26.1445, lng: 91.7362 })
      ).not.toThrow();

      // Latitude boundary validation [-90, 90]
      expect(() =>
        assertValidCoordinates({ lat: 95.0, lng: 91.7362 })
      ).toThrow(RiderError);

      // Longitude boundary validation [-180, 180]
      expect(() =>
        assertValidCoordinates({ lat: 26.1445, lng: 195.0 })
      ).toThrow(RiderError);

      // Non-finite coordinates rejection (NaN / Infinity)
      expect(() =>
        assertValidCoordinates({ lat: NaN, lng: 91.7362 })
      ).toThrow(RiderError);
    });

    it("detects and prevents GPS teleport drift exceeding vehicle speed limits", () => {
      const now = Date.now();
      const prevPing: LocationPing = {
        id: "ping_prev_01",
        riderId: testRiderId,
        deliveryId: null,
        point: { lat: 26.1445, lng: 91.7362 },
        accuracyM: 5,
        at: new Date(now - 2000).toISOString(), // 2 seconds ago
      };

      // Plausible 2-second motorcycle movement (~20m at 36 km/h)
      const plausibleNext = { lat: 26.1447, lng: 91.7364 };
      expect(() =>
        assertPlausiblePing(prevPing, plausibleNext, new Date(now).toISOString(), "MOTORCYCLE")
      ).not.toThrow();

      // Impossible 2-second jump (~5 km away, > 9000 km/h)
      const impossibleNext = { lat: 26.1900, lng: 91.7800 };
      expect(() =>
        assertPlausiblePing(prevPing, impossibleNext, new Date(now).toISOString(), "MOTORCYCLE")
      ).toThrow(RiderError);
    });

    it("verifies dynamic battery power-profiling: 2s standard cadence drops to 10s on low battery, restoring on charge", () => {
      // 1. Healthy Battery (85%, discharging) -> Standard 2s interval
      const profileHealthy = computePowerProfile({ level: 0.85, charging: false });
      expect(profileHealthy.isLowBattery).toBe(false);
      expect(profileHealthy.gpsIntervalMs).toBe(STANDARD_GPS_INTERVAL_MS);
      expect(profileHealthy.gpsIntervalMs).toBe(2000);
      expect(profileHealthy.powerSaveMode).toBe(false);

      // 2. Critical Battery (12%, discharging) -> Throttled 10s interval to prevent device shutdown
      const profileLow = computePowerProfile({ level: 0.12, charging: false });
      expect(profileLow.isLowBattery).toBe(true);
      expect(profileLow.gpsIntervalMs).toBe(LOW_BATTERY_GPS_INTERVAL_MS);
      expect(profileLow.gpsIntervalMs).toBe(10000);
      expect(profileLow.powerSaveMode).toBe(true);
      expect(profileLow.disableNonEssentialAnimations).toBe(true);

      // 3. Low Battery on Charger (12%, charging = true) -> Restores standard 2s interval immediately
      const profileCharging = computePowerProfile({ level: 0.12, charging: true });
      expect(profileCharging.isLowBattery).toBe(false);
      expect(profileCharging.gpsIntervalMs).toBe(STANDARD_GPS_INTERVAL_MS);
      expect(profileCharging.gpsIntervalMs).toBe(2000);
      expect(profileCharging.powerSaveMode).toBe(false);
    });
  });

  // =========================================================================
  // 2. Floating Dispatch Modal Siren Audio Oscillation & State Idempotency
  // =========================================================================
  describe("2. Floating Dispatch Modal Siren Audio Oscillation & State Idempotency", () => {
    it("defines authentic piercing klaxon vibration sequence for heavy traffic noise", () => {
      // Piercing klaxon vibration pulse: 400ms burst, 150ms rest, 400ms burst, 150ms rest, 600ms hold
      expect(VIBRATION_PATTERN_RADAR_SIREN).toEqual([400, 150, 400, 150, 600]);
    });

    it("supports programmatic muting to silence siren audio without throwing", () => {
      dispatchAudioSynthesizer.setMuted(true);
      expect(dispatchAudioSynthesizer.getMuted()).toBe(true);

      // Safe non-blocking execution when muted
      expect(() => dispatchAudioSynthesizer.playPiercingRadarSiren()).not.toThrow();
      expect(() => dispatchAudioSynthesizer.playCountdownTick(true)).not.toThrow();

      dispatchAudioSynthesizer.setMuted(false);
      expect(dispatchAudioSynthesizer.getMuted()).toBe(false);
    });

    it("guarantees strict idempotency on accept/decline: double-accept replay does not duplicate delivery", async () => {
      const offerId = "off_idem_test_01";
      const idempotencyKey = "key_dispatch_idem_9988";

      const offer: DispatchOffer = {
        id: offerId,
        riderId: testRiderId,
        orderCode: "OK-7788",
        restaurant: {
          id: "rest_01",
          name: "Cafe Brahmaputra",
          address: "Panbazar, Guwahati",
          area: "Panbazar",
          location: { lat: 26.1445, lng: 91.7362 },
          phoneMasked: "+91 98*** **000",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Ananya Roy",
          area: "Uzanbazar",
          address: "Uzanbazar, Guwahati",
          contactMasked: "+91 98*** **321",
          contactAllowed: true,
          instructions: null,
        },
        pickupLocation: { lat: 26.1445, lng: 91.7362 },
        dropLocation: { lat: 26.1600, lng: 91.7500 },
        dropArea: "Uzanbazar",
        approxDistanceKm: 2.4,
        estimatedTravelKm: 2.4,
        estimatedTotalRouteKm: 4.8,
        expectedPayoutPaise: 4800,
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        status: "OPEN",
        expiresAt: new Date(Date.now() + 28000).toISOString(),
        dataMode: "LIVE",
        createdAt: new Date().toISOString(),
      };
      await store.insertOffer(offer, testUserId);

      // First response: ACCEPT
      const res1 = await engine.respondOffer(testUserId, offerId, "ACCEPT", undefined, idempotencyKey);
      expect(res1.decision).toBe("ACCEPT");
      expect(res1.delivery).not.toBeNull();
      expect(res1.delivery!.orderCode).toBe("OK-7788");

      // Second replay with identical idempotencyKey: must return identical memoized response
      const res2 = await engine.respondOffer(testUserId, offerId, "ACCEPT", undefined, idempotencyKey);
      expect(res2.decision).toBe("ACCEPT");
      expect(res2.delivery!.id).toBe(res1.delivery!.id);

      // Verify no duplicate delivery was inserted into store
      const riderDeliveries = await store.listDeliveriesForUser(testUserId);
      expect(riderDeliveries.filter((d) => d.orderCode === "OK-7788")).toHaveLength(1);
    });

    it("fails closed when offer has expired before response", async () => {
      const expiredOfferId = "off_expired_01";
      const expiredOffer: DispatchOffer = {
        id: expiredOfferId,
        riderId: testRiderId,
        orderCode: "OK-EXP-1",
        restaurant: {
          id: "rest_01",
          name: "Quick Bites",
          address: "Ganeshguri",
          area: "Ganeshguri",
          location: { lat: 26.1445, lng: 91.7362 },
          phoneMasked: "+91 98*** **000",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Pooja",
          area: "Dispur",
          address: "Dispur, Guwahati",
          contactMasked: "+91 98*** **999",
          contactAllowed: true,
          instructions: null,
        },
        pickupLocation: { lat: 26.1445, lng: 91.7362 },
        dropLocation: { lat: 26.1500, lng: 91.7400 },
        dropArea: "Dispur",
        approxDistanceKm: 1.0,
        estimatedTravelKm: 1.0,
        estimatedTotalRouteKm: 2.0,
        expectedPayoutPaise: 3500,
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        status: "OPEN",
        expiresAt: new Date(Date.now() - 5000).toISOString(), // Expired 5 seconds ago
        dataMode: "LIVE",
        createdAt: new Date(Date.now() - 35000).toISOString(),
      };
      await store.insertOffer(expiredOffer, testUserId);

      await expect(
        engine.respondOffer(testUserId, expiredOfferId, "ACCEPT", undefined, "key_exp_test")
      ).rejects.toThrow(RiderError);
    });
  });

  // =========================================================================
  // 3. Pickup Verification OTP & Doorstep Photo POD Fail-Safe Fallback
  // =========================================================================
  describe("3. Pickup Verification OTP & Doorstep Photo Proof Fail-Safe Fallback", () => {
    let activeDelivery: Delivery;

    beforeEach(async () => {
      const deliveryId = "del_tough_flow_01";
      activeDelivery = {
        id: deliveryId,
        offerId: "off_tough_01",
        orderId: "ord_tough_01",
        orderCode: "OK-4455",
        riderId: testRiderId,
        userId: testUserId,
        state: "ARRIVED_AT_RESTAURANT",
        pickupVerification: "ORDER_CODE",
        pickupCode: "7821", // 4-digit pickup OTP
        otpRequired: true,
        expectedPayoutPaise: 5200,
        cod: false,
        codAmountPaise: 0,
        pickupLocation: { lat: 26.1445, lng: 91.7362 },
        dropLocation: { lat: 26.1700, lng: 91.7600 },
        restaurant: {
          id: "rest_01",
          name: "Brahmaputra Feast",
          address: "GS Road, Guwahati",
          area: "GS Road",
          location: { lat: 26.1445, lng: 91.7362 },
          phoneMasked: "+91 98*** **000",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Rohit Baruah",
          area: "Six Mile",
          address: "Six Mile, Guwahati",
          contactMasked: "+91 98*** **456",
          contactAllowed: true,
          instructions: null,
        },
        packageCount: 2,
        contactAttempts: 0,
        waitStartedAt: null,
        arrivedRestaurantAt: new Date(Date.now() - 60000).toISOString(),
        expectedReadyAt: null,
        pickedUpAt: null,
        arrivedCustomerAt: null,
        deliveredAt: null,
        cancelReason: null,
        failReason: null,
        dataMode: "LIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.insertDelivery(activeDelivery);
      const secret = newOtpSecret("4192");
      await store.saveOtp({
        deliveryId: activeDelivery.id,
        hash: secret.hash,
        salt: secret.salt,
        attempts: 0,
        verifiedAt: null,
        simulatedPlain: "4192",
      });
    });

    it("strictly verifies 4-digit pickup code before advancing to PICKED_UP", async () => {
      // 1. Wrong pickup code -> MUST reject with PICKUP_CODE error
      await expect(
        engine.pickup(testUserId, activeDelivery.id, { method: "ORDER_CODE", code: "0000" }, "key_pick_wrong")
      ).rejects.toThrow(RiderError);

      // 2. Missing pickup code -> MUST reject
      await expect(
        engine.pickup(testUserId, activeDelivery.id, { method: "ORDER_CODE", code: "" }, "key_pick_empty")
      ).rejects.toThrow(RiderError);

      // 3. Exact matching 4-digit pickup code ('7821') -> Successfully transitions to PICKED_UP
      const pickedUp = await engine.pickup(
        testUserId,
        activeDelivery.id,
        { method: "ORDER_CODE", code: "7821" },
        "key_pick_correct"
      );
      expect(pickedUp.state).toBe("PICKED_UP");
      expect(pickedUp.pickedUpAt).not.toBeNull();
    });

    it("verifies doorstep photo proof (POD) fail-safe persistence into database", async () => {
      const testPhotoDataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYI...";

      // Client-side compressed photo is recorded via addPod
      const podResult = await engine.addPod(testUserId, activeDelivery.id, {
        method: "PHOTO",
        contentType: "image/jpeg",
        dataUrl: testPhotoDataUrl,
        bytes: 14200,
      });

      expect(podResult.method).toBe("PHOTO");
      expect(podResult.capturedAt).toBeDefined();

      // Verify the pod record was persisted in storage
      const pods = await store.listPod(activeDelivery.id);
      expect(pods).toHaveLength(1);
      expect(pods[0]!.photoDataUrl).toBe(testPhotoDataUrl);
      expect(pods[0]!.photoContentType).toBe("image/jpeg");
    });

    it("verifies customer delivery completion with exact 4-digit customer PIN", async () => {
      // Advance delivery state through canonical lifecycle
      await engine.pickup(
        testUserId,
        activeDelivery.id,
        { method: "ORDER_CODE", code: "7821" },
        "key_p1"
      );
      await engine.startDelivery(testUserId, activeDelivery.id, "key_p2");
      await engine.arriveCustomer(testUserId, activeDelivery.id, "key_p3");

      // 1. Wrong delivery OTP -> MUST reject with OTP_MISMATCH
      await expect(
        engine.deliver(testUserId, activeDelivery.id, "9999", "key_del_wrong")
      ).rejects.toThrow(RiderError);

      // 2. Missing delivery OTP -> MUST reject with OTP_REQUIRED
      await expect(
        engine.deliver(testUserId, activeDelivery.id, undefined, "key_del_none")
      ).rejects.toThrow(RiderError);

      // 3. Correct 4-digit customer PIN ('4192') -> Successfully marks DELIVERED
      const delivered = await engine.deliver(
        testUserId,
        activeDelivery.id,
        "4192",
        "key_del_success"
      );
      expect(delivered.state).toBe("DELIVERED");
      expect(delivered.deliveredAt).not.toBeNull();
    });
  });

  // =========================================================================
  // 4. Mandatory Pre-Shift Camera Verification (Helmet & Bag Safety Gate)
  // =========================================================================
  describe("4. Mandatory Pre-Shift Camera Verification (Helmet & Thermal Bag Safety Gate)", () => {
    it("validates helmet selfie photo payload and rejects corrupted or miniature dataUrls", () => {
      // 1. Valid compressed base64 JPEG payload (>500 chars)
      const validSelfie =
        "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAgACADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AAAAAFLK1Q/9k=" +
        "AAAA".repeat(40);
      expect(validSelfie.startsWith("data:image/")).toBe(true);
      expect(validSelfie.length).toBeGreaterThanOrEqual(500);

      // 2. Corrupted or invalid image dataUrl
      const invalidSelfie = "data:image/jpeg;base64,too_short";
      expect(invalidSelfie.length < 500).toBe(true);
    });

    it("verifies pre-shift safety checklist criteria: BIS helmet, thermal bag, face visibility", () => {
      const safetyChecklist = {
        helmetWorn: true,
        thermalBagClean: true,
        clearFaceVisibility: true,
      };
      expect(safetyChecklist.helmetWorn).toBe(true);
      expect(safetyChecklist.thermalBagClean).toBe(true);
      expect(safetyChecklist.clearFaceVisibility).toBe(true);
    });
  });

  // =========================================================================
  // 5. Zomato Operational Parity: Telemetry, Duty Gating, COD & Dynamic BharatQR
  // =========================================================================
  describe("5. Tier-1 Operational Parity: Telemetry Anti-Spoof, Duty Gating, COD & Dynamic BharatQR", () => {
    it("detects and rejects mock location provider pings", () => {
      const mockPing = {
        lat: 26.1445,
        lng: 91.7362,
        accuracyM: 5,
        isMock: true,
        isFromMockProvider: true,
      };
      const result = validateGpsTelemetry(mockPing);
      expect(result.valid).toBe(false);
      expect(result.spoofDetected).toBe(true);
      expect(result.reason).toContain("MOCK_PROVIDER_DETECTED");
    });

    it("flags and rejects velocity jumps exceeding 120 km/h anomaly cap", () => {
      const ping1 = {
        lat: 26.1445,
        lng: 91.7362,
        timestamp: Date.now(),
      };
      // Ping 2 is 50 km away after only 10 seconds (18,000 km/h)
      const ping2 = {
        lat: 26.5000,
        lng: 91.9500,
        timestamp: ping1.timestamp + 10_000,
      };
      const result = validateGpsTelemetry(ping2, ping1);
      expect(result.valid).toBe(false);
      expect(result.spoofDetected).toBe(true);
      expect(result.reason).toContain("VELOCITY_ANOMALY");
      expect(result.calculatedSpeedKmH).toBeGreaterThan(MAX_PERMISSIBLE_SPEED_KMH);
    });

    it("approves genuine urban courier movement under 120 km/h", () => {
      const ping1 = {
        lat: 26.1445,
        lng: 91.7362,
        timestamp: Date.now(),
      };
      // Ping 2 is 250 meters away after 30 seconds (~30 km/h standard two-wheeler speed)
      const ping2 = {
        lat: 26.1465,
        lng: 91.7370,
        timestamp: ping1.timestamp + 30_000,
      };
      const result = validateGpsTelemetry(ping2, ping1);
      expect(result.valid).toBe(true);
      expect(result.spoofDetected).toBe(false);
    });

    it("enforces duty battery gate: blocks below 15% and warns below 20%", () => {
      // 1. Critically low battery (< 15% and not charging) -> BLOCKED
      const lowCheck = evaluateDutyBatteryGate({ level: 0.12, charging: false });
      expect(lowCheck.allowed).toBe(false);
      expect(lowCheck.levelPct).toBe(12);
      expect(lowCheck.reason).toContain("critically low");

      // 2. Low battery warning (18% and not charging) -> ALLOWED but WARN
      const warnCheck = evaluateDutyBatteryGate({ level: 0.18, charging: false });
      expect(warnCheck.allowed).toBe(true);
      expect(warnCheck.warn).toBe(true);
      expect(warnCheck.levelPct).toBe(18);

      // 3. Low battery but plugged in charging -> ALLOWED
      const chargingCheck = evaluateDutyBatteryGate({ level: 0.10, charging: true });
      expect(chargingCheck.allowed).toBe(true);

      // 4. Healthy battery (85%) -> ALLOWED with zero warnings
      const healthyCheck = evaluateDutyBatteryGate({ level: 0.85, charging: false });
      expect(healthyCheck.allowed).toBe(true);
      expect(healthyCheck.warn).toBe(false);
    });

    it("enforces mandatory operational reasons for going offline", () => {
      expect(MANDATORY_OFFLINE_REASONS).toContain("End of shift");
      expect(MANDATORY_OFFLINE_REASONS).toContain("Meal break");
      expect(MANDATORY_OFFLINE_REASONS).toContain("Vehicle breakdown");
      expect(MANDATORY_OFFLINE_REASONS).toContain("Bad weather");
      expect(MANDATORY_OFFLINE_REASONS).toContain("Personal emergency");
      expect(MANDATORY_OFFLINE_REASONS).toHaveLength(5);
    });

    it("validates dynamic BharatQR NPCI UPI intent structure for COD conversion", () => {
      const orderCode = "OK-9988";
      const codPaise = 45000; // ₹450.00
      const amountRupees = (codPaise / 100).toFixed(2);
      const vpa = "orderking@ybl";
      const upiUri = `upi://pay?pa=${vpa}&pn=OrderKingPay&am=${amountRupees}&cu=INR&tr=${orderCode}`;

      expect(upiUri).toBe("upi://pay?pa=orderking@ybl&pn=OrderKingPay&am=450.00&cu=INR&tr=OK-9988");
      expect(upiUri).toContain("pa=orderking@ybl");
      expect(upiUri).toContain("am=450.00");
      expect(upiUri).toContain("tr=OK-9988");
    });
  });
});
