import { describe, it, expect, beforeEach } from "vitest";
import {
  FleetSafetyEngine,
  computePowerProfile,
  generateDynamicDeliveryQr,
  verifyDynamicDeliveryQr,
  verifyDoorstepDelivery,
  triggerSosSafetyDialer,
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
});
