import { describe, it, expect, beforeEach } from "vitest";
import {
  FleetSafetyEngine,
  computePowerProfile,
  generateDynamicDeliveryQr,
  verifyDynamicDeliveryQr,
  verifyDoorstepDelivery,
  triggerSosSafetyDialer,
  getDynamicShiftRadius,
  DYNAMIC_SHIFT_RADII,
  evaluateThreatZoneRisk,
  REGISTERED_THREAT_ZONES,
  buildTwoWheelerNavigationLinks,
  STANDARD_GPS_INTERVAL_MS,
  LOW_BATTERY_GPS_INTERVAL_MS,
  LOW_BATTERY_THRESHOLD,
  STATUTORY_SAFETY_HELPLINES,
} from "../lib/fleet/fleet-safety-engine";

describe("Sovereign Fleet Safety & Doorstep Handover Engine", () => {
  // ─────────────────────────────────────────────────────────────
  // 1. LOW BATTERY MODE & ADAPTIVE GPS PING INTERVAL (<20%)
  // ─────────────────────────────────────────────────────────────
  describe("1. Low Battery Mode & Adaptive GPS Cadence", () => {
    it("maintains 3s high-accuracy GPS cadence and full animations when battery >= 20%", () => {
      const normalProfile = computePowerProfile({ level: 0.85, charging: false });
      expect(normalProfile.isLowBattery).toBe(false);
      expect(normalProfile.gpsIntervalMs).toBe(STANDARD_GPS_INTERVAL_MS);
      expect(normalProfile.gpsIntervalMs).toBe(3000);
      expect(normalProfile.disableNonEssentialAnimations).toBe(false);
      expect(normalProfile.powerSaveMode).toBe(false);
      expect(normalProfile.batteryLevelPercent).toBe(85);

      // Boundary condition: exactly 20% (0.20)
      const boundaryProfile = computePowerProfile({ level: 0.20, charging: false });
      expect(boundaryProfile.isLowBattery).toBe(false);
      expect(boundaryProfile.gpsIntervalMs).toBe(3000);
      expect(boundaryProfile.disableNonEssentialAnimations).toBe(false);
    });

    it("automatically drops GPS ping frequency from 3s to 10s when battery < 20%", () => {
      // 19% battery
      const lowProfile19 = computePowerProfile({ level: 0.19, charging: false });
      expect(lowProfile19.isLowBattery).toBe(true);
      expect(lowProfile19.gpsIntervalMs).toBe(LOW_BATTERY_GPS_INTERVAL_MS);
      expect(lowProfile19.gpsIntervalMs).toBe(10000);
      expect(lowProfile19.disableNonEssentialAnimations).toBe(true);
      expect(lowProfile19.powerSaveMode).toBe(true);
      expect(lowProfile19.batteryLevelPercent).toBe(19);

      // Critical 8% battery
      const criticalProfile = computePowerProfile({ level: 0.08, charging: false });
      expect(criticalProfile.isLowBattery).toBe(true);
      expect(criticalProfile.gpsIntervalMs).toBe(10000);
      expect(criticalProfile.disableNonEssentialAnimations).toBe(true);
    });

    it("restores standard 3s GPS cadence when device is plugged into charger even below 20%", () => {
      // 15% battery but plugged into motorcycle / power bank USB charger
      const chargingProfile = computePowerProfile({ level: 0.15, charging: true });
      expect(chargingProfile.isLowBattery).toBe(false);
      expect(chargingProfile.gpsIntervalMs).toBe(STANDARD_GPS_INTERVAL_MS);
      expect(chargingProfile.gpsIntervalMs).toBe(3000);
      expect(chargingProfile.disableNonEssentialAnimations).toBe(false);
    });

    it("updates singleton engine state dynamically as battery discharges and charges", () => {
      const engine = FleetSafetyEngine.getInstance();

      // Rider starts shift with 100% battery
      engine.updateBatteryStatus({ level: 1.0, charging: false });
      expect(engine.getGpsPingIntervalMs()).toBe(3000);
      expect(engine.shouldDisableAnimations()).toBe(false);

      // Rider reaches end of shift with 14% battery
      engine.updateBatteryStatus({ level: 0.14, charging: false });
      expect(engine.getGpsPingIntervalMs()).toBe(10000);
      expect(engine.shouldDisableAnimations()).toBe(true);
      expect(engine.getPowerProfile().isLowBattery).toBe(true);

      // Rider plugs into bike USB charger
      engine.updateBatteryStatus({ level: 0.14, charging: true });
      expect(engine.getGpsPingIntervalMs()).toBe(3000);
      expect(engine.shouldDisableAnimations()).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. DOORSTEP DELIVERY 4-DIGIT OTP VERIFICATION
  // ─────────────────────────────────────────────────────────────
  describe("2. Doorstep Delivery 4-Digit OTP Verification", () => {
    it("successfully verifies delivery with exact 4-digit customer handover PIN", () => {
      const res = verifyDoorstepDelivery({
        orderId: "ord_delhi_9921",
        enteredOtp: "7421",
        expectedOtp: "7421",
      });

      expect(res.success).toBe(true);
      expect(res.method).toBe("OTP");
      expect(res.orderId).toBe("ord_delhi_9921");
      expect(res.verifiedAt).toBeDefined();
      expect(res.error).toBeUndefined();
    });

    it("rejects mismatched OTP and preserves order state", () => {
      const res = verifyDoorstepDelivery({
        orderId: "ord_delhi_9921",
        enteredOtp: "9999",
        expectedOtp: "7421",
      });

      expect(res.success).toBe(false);
      expect(res.method).toBe("OTP");
      expect(res.error).toContain("INCORRECT_OTP");
    });

    it("rejects non-4-digit OTP entries (too short or letters)", () => {
      const shortRes = verifyDoorstepDelivery({
        orderId: "ord_delhi_9921",
        enteredOtp: "74",
        expectedOtp: "7421",
      });
      expect(shortRes.success).toBe(false);
      expect(shortRes.error).toContain("OTP must be exactly 4 numeric digits");

      const alphaRes = verifyDoorstepDelivery({
        orderId: "ord_delhi_9921",
        enteredOtp: "ABCD",
        expectedOtp: "7421",
      });
      expect(alphaRes.success).toBe(false);
      expect(alphaRes.error).toContain("OTP must be exactly 4 numeric digits");
    });

    it("verifies OTP via timing-safe cryptographic salt and SHA-256 hash", () => {
      const salt = "a1b2c3d4e5f6";
      const { createHash } = require("node:crypto");
      const expectedHash = createHash("sha256").update(`${salt}:5892`).digest("hex");

      const res = verifyDoorstepDelivery({
        orderId: "ord_crypto_881",
        enteredOtp: "5892",
        expectedOtp: "5892",
        expectedSalt: salt,
        expectedHash,
      });

      expect(res.success).toBe(true);
      expect(res.method).toBe("OTP");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. DYNAMIC CUSTOMER QR CODE SCAN VERIFICATION
  // ─────────────────────────────────────────────────────────────
  describe("3. Dynamic Customer QR Code Verification", () => {
    it("generates and verifies valid dynamic QR code scan payload", () => {
      const orderId = "ord_mumbai_3321";
      const otp = "8194";
      const now = Date.now();

      const qrPayload = generateDynamicDeliveryQr(orderId, otp, now);
      expect(qrPayload).toContain("ORDERKING_DOORSTEP_QR");
      expect(qrPayload).toContain(orderId);

      const res = verifyDoorstepDelivery({
        orderId,
        qrPayload,
        expectedOtp: otp,
      });

      expect(res.success).toBe(true);
      expect(res.method).toBe("QR");
      expect(res.orderId).toBe(orderId);
    });

    it("rejects expired dynamic QR code (> 5 minutes)", () => {
      const orderId = "ord_mumbai_3321";
      const otp = "8194";
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;

      const expiredQrPayload = generateDynamicDeliveryQr(orderId, otp, sixMinutesAgo);

      const res = verifyDoorstepDelivery({
        orderId,
        qrPayload: expiredQrPayload,
        expectedOtp: otp,
      });

      expect(res.success).toBe(false);
      expect(res.method).toBe("QR");
      expect(res.error).toContain("QR_EXPIRED");
    });

    it("rejects dynamic QR code belonging to a different order", () => {
      const qrPayload = generateDynamicDeliveryQr("ord_other_restaurant", "8194");

      const res = verifyDoorstepDelivery({
        orderId: "ord_mumbai_3321",
        qrPayload,
        expectedOtp: "8194",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("ORDER_MISMATCH");
    });

    it("rejects tampered or forged QR payload signatures", () => {
      const forgedPayload = JSON.stringify({
        prefix: "ORDERKING_DOORSTEP_QR",
        version: 1,
        orderId: "ord_mumbai_3321",
        otp: "8194",
        timestamp: Date.now(),
        signature: "forged_bogus_signature_123",
      });

      const res = verifyDoorstepDelivery({
        orderId: "ord_mumbai_3321",
        qrPayload: forgedPayload,
        expectedOtp: "8194",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("TAMPERED_QR");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. 1-TAP SOS SAFETY DIALER (112 / AMBULANCE / FLEET DESK)
  // ─────────────────────────────────────────────────────────────
  describe("4. 1-Tap SOS Safety Dialer Bridge", () => {
    it("connects direct telephone dialer to National Emergency 112", () => {
      const res = triggerSosSafetyDialer("112", {
        lat: 28.6315,
        lng: 77.2167,
        deliveryId: "del_8832",
        riderId: "rider_vikram",
      });

      expect(res.targetNumber).toBe("112");
      expect(res.telUri).toBe("tel:112");
      expect(res.incidentId).toMatch(/^SOS-\d{6}$/);
      expect(res.lat).toBe(28.6315);
      expect(res.lng).toBe(77.2167);
      expect(res.deliveryId).toBe("del_8832");
      expect(res.googleMapsPinUrl).toContain("28.63150,77.21670");
      expect(res.offlineLogged).toBe(true);
    });

    it("connects direct telephone dialer to Ambulance (108)", () => {
      const res = triggerSosSafetyDialer("108", {
        lat: 19.0760,
        lng: 72.8777,
      });

      expect(res.targetNumber).toBe("108");
      expect(res.telUri).toBe("tel:108");
      expect(res.distressSummary).toContain("Ambulance");
    });

    it("connects direct telephone dialer to Police (100)", () => {
      const res = triggerSosSafetyDialer("100", {
        lat: 12.9716,
        lng: 77.5946,
      });

      expect(res.targetNumber).toBe("100");
      expect(res.telUri).toBe("tel:100");
      expect(res.distressSummary).toContain("Police");
    });

    it("connects direct bridge to OrderKing 24x7 Fleet Safety Helpline (18001000)", () => {
      const res = triggerSosSafetyDialer("FLEET", {
        lat: 26.1445,
        lng: 91.7362,
        deliveryId: "del_guwahati_44",
      });

      expect(res.targetNumber).toBe("18001000");
      expect(res.telUri).toBe("tel:18001000");
      expect(res.distressSummary).toContain("OrderKing 24x7 Fleet Command Desk");
    });

    it("logs triggered SOS emergencies in the FleetSafetyEngine singleton audit ledger", () => {
      const engine = FleetSafetyEngine.getInstance();
      const initialCount = engine.getIncidentLog().length;

      engine.triggerSos("112", {
        lat: 28.6315,
        lng: 77.2167,
        deliveryId: "del_audit_test",
      });

      const updatedLog = engine.getIncidentLog();
      expect(updatedLog.length).toBe(initialCount + 1);
      expect(updatedLog[0]!.targetNumber).toBe("112");
      expect(updatedLog[0]!.deliveryId).toBe("del_audit_test");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. DYNAMIC TIME-OF-DAY SHIFT RADII (DAY: 12km / EVE: 7.5km / LATE-NIGHT: 3.5km)
  // ─────────────────────────────────────────────────────────────
  describe("5. Dynamic Time-of-Day Shift Radius Controls", () => {
    it("enforces 12.0km max radius for Day Shift (06:00 - 19:00)", () => {
      // 06:00 Morning boundary
      const morningRule = getDynamicShiftRadius(6);
      expect(morningRule.shift).toBe("DAY");
      expect(morningRule.maxRadiusKm).toBe(12.0);
      expect(morningRule.maxRadiusKm).toBe(DYNAMIC_SHIFT_RADII.DAY.maxRadiusKm);

      // 12:00 Midday
      const middayRule = getDynamicShiftRadius(12);
      expect(middayRule.shift).toBe("DAY");
      expect(middayRule.maxRadiusKm).toBe(12.0);

      // 18:59 Late afternoon
      const lateAfternoon = new Date("2026-10-27T18:59:00");
      const afternoonRule = getDynamicShiftRadius(lateAfternoon);
      expect(afternoonRule.shift).toBe("DAY");
      expect(afternoonRule.maxRadiusKm).toBe(12.0);
    });

    it("enforces 7.5km max radius for Evening Peak Shift (19:00 - 23:00) to mitigate traffic & fatigue", () => {
      // 19:00 Evening start
      const eveRule19 = getDynamicShiftRadius(19);
      expect(eveRule19.shift).toBe("EVENING");
      expect(eveRule19.maxRadiusKm).toBe(7.5);
      expect(eveRule19.maxRadiusKm).toBe(DYNAMIC_SHIFT_RADII.EVENING.maxRadiusKm);

      // 21:30 Dinner rush
      const dinnerRush = new Date("2026-10-27T21:30:00");
      const eveRuleDinner = getDynamicShiftRadius(dinnerRush);
      expect(eveRuleDinner.shift).toBe("EVENING");
      expect(eveRuleDinner.maxRadiusKm).toBe(7.5);

      // 22:59 Last evening minute
      const lateEve = new Date("2026-10-27T22:59:59");
      const eveRuleLate = getDynamicShiftRadius(lateEve);
      expect(eveRuleLate.shift).toBe("EVENING");
      expect(eveRuleLate.maxRadiusKm).toBe(7.5);
    });

    it("enforces 3.5km strict max perimeter for Late-Night Shift (23:00 - 06:00) against fatigue and attacks", () => {
      // 23:00 Nocturnal start
      const nightRule23 = getDynamicShiftRadius(23);
      expect(nightRule23.shift).toBe("LATE_NIGHT");
      expect(nightRule23.maxRadiusKm).toBe(3.5);
      expect(nightRule23.maxRadiusKm).toBe(DYNAMIC_SHIFT_RADII.LATE_NIGHT.maxRadiusKm);

      // 02:00 Midnight graveyard shift
      const midnightDate = new Date("2026-10-27T02:00:00");
      const midnightRule = getDynamicShiftRadius(midnightDate);
      expect(midnightRule.shift).toBe("LATE_NIGHT");
      expect(midnightRule.maxRadiusKm).toBe(3.5);

      // 05:59 Pre-dawn boundary
      const preDawnDate = new Date("2026-10-27T05:59:59");
      const preDawnRule = getDynamicShiftRadius(preDawnDate);
      expect(preDawnRule.shift).toBe("LATE_NIGHT");
      expect(preDawnRule.maxRadiusKm).toBe(3.5);
    });

    it("interfaces through the FleetSafetyEngine singleton getShiftRadius method", () => {
      const engine = FleetSafetyEngine.getInstance();
      const dayRule = engine.getShiftRadius(14);
      expect(dayRule.shift).toBe("DAY");
      expect(dayRule.maxRadiusKm).toBe(12.0);

      const nightRule = engine.getShiftRadius(1);
      expect(nightRule.shift).toBe("LATE_NIGHT");
      expect(nightRule.maxRadiusKm).toBe(3.5);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. THREAT-ZONE EXCLUSION & ANTI-ROBBERY COD LOCKOUT
  // ─────────────────────────────────────────────────────────────
  describe("6. Threat-Zone Hazard Exclusion & Anti-Robbery Lockout", () => {
    it("strictly blocks order dispatch when customer destination is inside a CRITICAL hazard zone", () => {
      // Epicenter of Isolated Outer Ring Road Cut (CRITICAL zone: radius 1500m)
      const criticalPoint = { lat: 28.7041, lng: 77.1025 };
      const evalResult = evaluateThreatZoneRisk(criticalPoint);

      expect(evalResult.isThreatZone).toBe(true);
      expect(evalResult.orderBlocked).toBe(true);
      expect(evalResult.codLocked).toBe(true);
      expect(evalResult.policyEnforced).toBe("BLOCK_ORDER");
      expect(evalResult.zone?.id).toBe("TZ_UNLIT_HIGHWAY_CORRIDOR");
      expect(evalResult.distanceToCenterMeters).toBeLessThanOrEqual(50);
      expect(evalResult.rationale).toContain("Threat Zone Triggered");
    });

    it("locks COD (Online Prepaid Only) when customer destination is inside a HIGH-risk dispute zone", () => {
      // Near center of Industrial Canal Border Pocket (HIGH risk zone: radius 1200m)
      const highRiskPoint = { lat: 19.1136, lng: 72.8697 };
      const evalResult = evaluateThreatZoneRisk(highRiskPoint);

      expect(evalResult.isThreatZone).toBe(true);
      expect(evalResult.orderBlocked).toBe(false); // Order not blocked, but COD prohibited
      expect(evalResult.codLocked).toBe(true);
      expect(evalResult.policyEnforced).toBe("LOCK_COD_ONLINE_ONLY");
      expect(evalResult.zone?.id).toBe("TZ_HIGH_DISPUTE_SLUM_POCKET");
      expect(evalResult.rationale).toContain("Mandatory prepaid online payment");
    });

    it("permits standard dispatch and allows COD when destination is in a safe residential area", () => {
      // Safe point: Connaught Place, New Delhi (far from highway threat zone)
      const safePoint = { lat: 28.6315, lng: 77.2167 };
      const evalResult = evaluateThreatZoneRisk(safePoint);

      expect(evalResult.isThreatZone).toBe(false);
      expect(evalResult.orderBlocked).toBe(false);
      expect(evalResult.codLocked).toBe(false);
      expect(evalResult.policyEnforced).toBe("SAFE");
      expect(evalResult.zone).toBeNull();
      expect(evalResult.rationale).toContain("clear of registered threat hazard zones");
    });

    it("evaluates custom threat zones passed into the evaluator", () => {
      const customZones = [
        {
          id: "CUSTOM_FLOOD_AREA",
          name: "Monsoon Riverbank Submersion",
          center: { lat: 26.1445, lng: 91.7362 },
          radiusMeters: 500,
          riskLevel: "CRITICAL" as const,
          policy: "BLOCK_ORDER" as const,
          reason: "Active flash flood inundation",
        },
      ];

      const floodedDest = { lat: 26.1447, lng: 91.7364 }; // ~30m from custom center
      const evalResult = evaluateThreatZoneRisk(floodedDest, customZones);

      expect(evalResult.isThreatZone).toBe(true);
      expect(evalResult.orderBlocked).toBe(true);
      expect(evalResult.zone?.id).toBe("CUSTOM_FLOOD_AREA");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. NATIVE TWO-WHEELER GOOGLE MAPS NAVIGATION DEEP LINKS
  // ─────────────────────────────────────────────────────────────
  describe("7. Native Two-Wheeler Google Maps Deep Links (mode=b)", () => {
    it("generates exact android intent URI with mode=b for native motorcycle/scooter turn-by-turn", () => {
      const destination = { lat: 28.6315, lng: 77.2167 };
      const links = buildTwoWheelerNavigationLinks(destination, "Connaught Place Hub");

      // Mandatory intent scheme: google.navigation:q=lat,lng&mode=b
      expect(links.androidIntentUri).toBe("google.navigation:q=28.6315,77.2167&mode=b");

      // Geo URI with two-wheeler mode
      expect(links.geoUri).toContain("geo:28.6315,77.2167");
      expect(links.geoUri).toContain("mode=b");

      // Web fallback with two-wheeler travel mode
      expect(links.webUrl).toContain("https://www.google.com/maps/dir/");
      expect(links.webUrl).toContain("destination=28.6315,77.2167");
      expect(links.webUrl).toContain("travelmode=two-wheeler");
    });

    it("handles zero or null coordinates safely with zero drift", () => {
      const links = buildTwoWheelerNavigationLinks(null);
      expect(links.androidIntentUri).toBe("google.navigation:q=0,0&mode=b");
      expect(links.webUrl).toContain("destination=0,0");
    });
  });
});
