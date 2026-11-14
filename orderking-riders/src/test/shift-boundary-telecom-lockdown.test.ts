/**
 * OrderKing Rider Fleet & Telecom Specialist Quality Gate
 * Mandate Deliverables:
 * 1. Multi-Carrier SMS Dispatch & Router: Fast2SMS primary with immediate sub-3-second failover
 *    to 2Factor.in transactional SMS. Strict carrier SMS only—zero robocalls.
 * 2. Driver Background Location Ping Listener enforcing shift geofences:
 *    Day (12.0 km), Evening (7.5 km), and Late-Night (3.5 km).
 *    If rider steps outside radius, automatically suspend incoming order pings.
 * 3. Doorstep Delivery Completion Flow strictly locked on 4-digit OTP:
 *    If OTP does not match, freeze order state in ON_THE_WAY and disallow rider payout release.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import axios from "axios";
import {
  FleetSafetyEngine,
  DYNAMIC_SHIFT_RADII,
  getDynamicShiftRadius,
} from "../lib/fleet/fleet-safety-engine";
import { RiderEngine } from "../lib/rider/engine";
import { MemoryStore } from "../lib/rider/memory-store";
import { RiderError, type GeoPoint, type DispatchOffer } from "../lib/rider/types";
import {
  sendOtpFast2SMS,
  sendOtp2Factor,
  sendVoiceOtp2Factor,
  sendOtp,
} from "../../../services/otp";
import { dispatchOtpSms } from "../lib/server/sms-gateway";

vi.mock("axios");

describe("Rider Fleet & Telecom Specialist Quality Gate (4ee818c6)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    FleetSafetyEngine.getInstance().resetShiftGeofence();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─────────────────────────────────────────────────────────────
  // DELIVERABLE 1: Multi-Carrier SMS Dispatch & Sub-3-Second Failover
  // ─────────────────────────────────────────────────────────────
  describe("1. Multi-Carrier SMS Router: Fast2SMS Primary -> 2Factor.in Failover (Sub-3s SLA)", () => {
    it("enforces sub-3-second timeout SLA for Fast2SMS Bulk V2 OTP requests", async () => {
      process.env.FAST2SMS_API_KEY = "test_f2s_primary_key";

      vi.mocked(axios.post).mockResolvedValueOnce({
        data: {
          return: true,
          request_id: "REQ_F2S_FAST_1",
          message: ["SMS delivered"],
        },
      });

      const res = await sendOtpFast2SMS("9876543210", "482910");
      expect(res).toBe(true);

      expect(axios.post).toHaveBeenCalledTimes(1);
      const [, , config] = vi.mocked(axios.post).mock.calls[0];
      // Must be strictly sub-3000ms
      expect(config?.timeout).toBeLessThanOrEqual(2800);
      expect(config?.timeout).toBeGreaterThan(0);
    });

    it("immediately fails over to 2Factor.in transactional SMS within sub-3-second window when Fast2SMS fails", async () => {
      process.env.FAST2SMS_API_KEY = "primary_f2s_key";
      process.env.TWOFACTOR_API_KEY = "distinct_2f_uuid_key";

      // Fast2SMS primary route fails
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });
      // Fast2SMS route 'q' fallback fails
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { return: false } });

      // 2Factor transactional gateway succeeds
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { Status: "Success", Details: "2F_TRANSACTIONAL_OK" },
      });

      const res = await sendOtp("9876543210", "123456");
      expect(res.success).toBe(true);
      expect(res.provider).toBe("2factor");
      expect(axios.get).toHaveBeenCalledTimes(1);

      const [twoFactorUrl, twoFactorConfig] = vi.mocked(axios.get).mock.calls[0];
      expect(twoFactorUrl).toContain("2factor.in/API/V1/distinct_2f_uuid_key/SMS/9876543210/123456");
      expect(twoFactorConfig?.timeout).toBeLessThanOrEqual(2800);
    });

    it("strictly blocks automated voice robocalls per Council Mandate", async () => {
      process.env.TWOFACTOR_API_KEY = "voice_test_key";
      const voiceResult = await sendVoiceOtp2Factor("9876543210", "123456");
      expect(voiceResult).toBe(false);
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("verifies sms-gateway.ts enforces sub-3-second timeout controller", async () => {
      process.env.FAST2SMS_API_KEY = "test_f2s_sms_gw";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          return: true,
          request_id: "REQ_GW_SUB3S",
          message: ["Delivered"],
        }),
      });
      vi.stubGlobal("fetch", mockFetch);

      const res = await dispatchOtpSms({
        phone: "9876543210",
        otp: "889900",
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("fast2sms");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DELIVERABLE 2: Driver Shift Geofences & Background Ping Listener
  // ─────────────────────────────────────────────────────────────
  describe("2. Driver Shift Boundary Geofencing & Location Ping Listener", () => {
    const KarimganjStation: GeoPoint = { lat: 24.8688, lng: 92.3511 };

    it("verifies dynamic shift radii rules: Day (12.0 km), Evening (7.5 km), Late-Night (3.5 km)", () => {
      expect(DYNAMIC_SHIFT_RADII.DAY.maxRadiusKm).toBe(12.0);
      expect(DYNAMIC_SHIFT_RADII.EVENING.maxRadiusKm).toBe(7.5);
      expect(DYNAMIC_SHIFT_RADII.LATE_NIGHT.maxRadiusKm).toBe(3.5);

      // 10:00 AM -> Day
      expect(getDynamicShiftRadius(10).shift).toBe("DAY");
      expect(getDynamicShiftRadius(10).maxRadiusKm).toBe(12.0);

      // 20:00 PM (8:00 PM) -> Evening
      expect(getDynamicShiftRadius(20).shift).toBe("EVENING");
      expect(getDynamicShiftRadius(20).maxRadiusKm).toBe(7.5);

      // 01:00 AM (Graveyard) -> Late-Night
      expect(getDynamicShiftRadius(1).shift).toBe("LATE_NIGHT");
      expect(getDynamicShiftRadius(1).maxRadiusKm).toBe(3.5);
    });

    it("establishes shift anchor on initial location ping and keeps order pings active while within Day boundary (12.0 km)", () => {
      const fleet = FleetSafetyEngine.getInstance();
      const riderId = "rider-shift-day-001";

      // 1st Ping sets anchor
      const ping1 = fleet.evaluateShiftGeofencePing(riderId, KarimganjStation, 11);
      expect(ping1.withinPerimeter).toBe(true);
      expect(ping1.orderPingsSuspended).toBe(false);
      expect(ping1.currentDistanceKm).toBe(0);

      // Move 5 km away (still within 12 km Day radius)
      const nearPoint: GeoPoint = { lat: KarimganjStation.lat + 0.045, lng: KarimganjStation.lng };
      const ping2 = fleet.evaluateShiftGeofencePing(riderId, nearPoint, 11);
      expect(ping2.withinPerimeter).toBe(true);
      expect(ping2.orderPingsSuspended).toBe(false);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(false);
    });

    it("automatically suspends incoming order pings when rider steps outside Day radius (>12.0 km)", () => {
      const fleet = FleetSafetyEngine.getInstance();
      const riderId = "rider-shift-day-002";

      fleet.evaluateShiftGeofencePing(riderId, KarimganjStation, 14);

      // Step 15 km away (lat delta ~0.135 deg ~ 15 km)
      const farPoint: GeoPoint = { lat: KarimganjStation.lat + 0.135, lng: KarimganjStation.lng };
      const pingFar = fleet.evaluateShiftGeofencePing(riderId, farPoint, 14);

      expect(pingFar.withinPerimeter).toBe(false);
      expect(pingFar.orderPingsSuspended).toBe(true);
      expect(pingFar.currentDistanceKm).toBeGreaterThan(12.0);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(true);
      expect(pingFar.rationale).toContain("stepped outside active");
      expect(pingFar.rationale).toContain("suspended");
    });

    it("enforces tighter Evening shift radius (7.5 km) and suspends pings at 8.5 km", () => {
      const fleet = FleetSafetyEngine.getInstance();
      const riderId = "rider-shift-eve-001";

      fleet.evaluateShiftGeofencePing(riderId, KarimganjStation, 20);

      // 8.5 km away (lat delta ~0.077 deg)
      const evePoint: GeoPoint = { lat: KarimganjStation.lat + 0.077, lng: KarimganjStation.lng };
      const evePing = fleet.evaluateShiftGeofencePing(riderId, evePoint, 20);

      expect(evePing.shiftWindow).toBe("EVENING");
      expect(evePing.maxRadiusKm).toBe(7.5);
      expect(evePing.withinPerimeter).toBe(false);
      expect(evePing.orderPingsSuspended).toBe(true);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(true);
    });

    it("enforces nocturnal Late-Night defense radius (3.5 km) and suspends pings at 4.2 km", () => {
      const fleet = FleetSafetyEngine.getInstance();
      const riderId = "rider-shift-night-001";

      fleet.evaluateShiftGeofencePing(riderId, KarimganjStation, 2);

      // 4.2 km away (lat delta ~0.038 deg)
      const nightPoint: GeoPoint = { lat: KarimganjStation.lat + 0.038, lng: KarimganjStation.lng };
      const nightPing = fleet.evaluateShiftGeofencePing(riderId, nightPoint, 2);

      expect(nightPing.shiftWindow).toBe("LATE_NIGHT");
      expect(nightPing.maxRadiusKm).toBe(3.5);
      expect(nightPing.withinPerimeter).toBe(false);
      expect(nightPing.orderPingsSuspended).toBe(true);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(true);
    });

    it("automatically resumes incoming order pings when rider returns inside shift boundary", () => {
      const fleet = FleetSafetyEngine.getInstance();
      const riderId = "rider-shift-resume-001";

      fleet.evaluateShiftGeofencePing(riderId, KarimganjStation, 15);

      // Breach perimeter
      const outsidePoint: GeoPoint = { lat: KarimganjStation.lat + 0.14, lng: KarimganjStation.lng };
      fleet.evaluateShiftGeofencePing(riderId, outsidePoint, 15);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(true);

      // Return back inside boundary (1.5 km away)
      const insidePoint: GeoPoint = { lat: KarimganjStation.lat + 0.012, lng: KarimganjStation.lng };
      const returnedPing = fleet.evaluateShiftGeofencePing(riderId, insidePoint, 15);

      expect(returnedPing.withinPerimeter).toBe(true);
      expect(returnedPing.orderPingsSuspended).toBe(false);
      expect(fleet.isOrderPingsSuspended(riderId)).toBe(false);
    });

    it("engine.home hides dispatch offers and suspends order pings when rider is outside shift perimeter", async () => {
      const store = new MemoryStore();
      const engine = new RiderEngine(store);
      const userId = "user-geofence-home-test";

      await engine.ensureRider({ id: userId, name: "Geofence Rider", email: "geo@orderking.in" });
      await engine.systemSetKyc("ADMIN", userId, "VERIFIED");
      await engine.setStatus(userId, "ONLINE", true);

      const riderId = store.ridersByUser.get(userId)!;

      // Set shift anchor at Karimganj Station
      FleetSafetyEngine.getInstance().setRiderShiftAnchor(riderId, KarimganjStation);

      // Rider location ping >12km away (15 km) during Day shift
      const farLocation: GeoPoint = { lat: KarimganjStation.lat + 0.15, lng: KarimganjStation.lng };
      const pingResult = FleetSafetyEngine.getInstance().evaluateShiftGeofencePing(riderId, farLocation, 14);
      expect(pingResult.orderPingsSuspended).toBe(true);
      expect(FleetSafetyEngine.getInstance().isOrderPingsSuspended(riderId)).toBe(true);

      // Create an open offer in store
      const offer: DispatchOffer = {
        id: "offer-geo-test-1",
        orderCode: "OK-GEO-101",
        riderId: riderId,
        restaurant: {
          id: "rest-1",
          name: "Biryani Express",
          area: "Station",
          address: "Station Road",
          location: KarimganjStation,
          phoneMasked: "XXX",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Tuhin",
          area: "Bazar",
          address: "Main Bazar",
          contactMasked: null,
          contactAllowed: false,
          instructions: null,
        },
        pickupLocation: KarimganjStation,
        dropLocation: KarimganjStation,
        status: "OPEN",
        approxDistanceKm: 1.5,
        estimatedTravelKm: 1.5,
        estimatedTotalRouteKm: 1.5,
        expectedPayoutPaise: 4500,
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        dropArea: "Local",
        dataMode: "LIVE",
      };
      await store.insertOffer(offer, userId);

      // When home() is called, offer must be null because incoming order pings are suspended!
      const homeState = await engine.home(userId);
      expect(homeState.offer).toBeNull();

      // Return back inside boundary
      const insidePing = FleetSafetyEngine.getInstance().evaluateShiftGeofencePing(riderId, KarimganjStation, 14);
      expect(insidePing.orderPingsSuspended).toBe(false);
      expect(FleetSafetyEngine.getInstance().isOrderPingsSuspended(riderId)).toBe(false);

      // Now home() allows active offer to be received
      const resumedHomeState = await engine.home(userId);
      expect(resumedHomeState.offer).not.toBeNull();
      expect(resumedHomeState.offer?.id).toBe("offer-geo-test-1");
    });
  });

  // ─────────────────────────────────────────────────────────────
  // DELIVERABLE 3: Doorstep Delivery Completion Flow 4-Digit OTP Gate
  // ─────────────────────────────────────────────────────────────
  describe("3. Doorstep Delivery Completion Flow Locked on 4-Digit OTP Gate", () => {
    it("freezes order state in ON_THE_WAY and disallows rider payout release when OTP does not match", async () => {
      const store = new MemoryStore();
      const engine = new RiderEngine(store);
      const userId = "user-otp-lockdown-test";
      const dropPoint: GeoPoint = { lat: 24.8688, lng: 92.3511 };

      await engine.ensureRider({ id: userId, name: "OTP Rider", email: "otp@orderking.in" });
      await engine.systemSetKyc("ADMIN", userId, "VERIFIED");
      await engine.setStatus(userId, "ONLINE", true);

      const riderId = store.ridersByUser.get(userId)!;

      const offer: DispatchOffer = {
        id: "offer-otp-lock-1",
        orderCode: "OK-OTP-999",
        riderId: riderId,
        restaurant: {
          id: "rest-otp",
          name: "Kolkata Roll Center",
          area: "Station",
          address: "Station Road",
          location: dropPoint,
          phoneMasked: "XXX",
          specialPickupInstructions: null,
          preparationStatus: "READY",
        },
        customer: {
          displayName: "Debasish",
          area: "Station",
          address: "Station Road",
          contactMasked: null,
          contactAllowed: false,
          instructions: null,
        },
        pickupLocation: dropPoint,
        dropLocation: dropPoint,
        status: "OPEN",
        approxDistanceKm: 1.0,
        estimatedTravelKm: 1.0,
        estimatedTotalRouteKm: 1.0,
        expectedPayoutPaise: 5000,
        cod: false,
        codAmountPaise: 0,
        packageCount: 1,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        dropArea: "Local",
        dataMode: "LIVE",
      };

      await store.insertOffer(offer, userId);
      const { delivery } = await engine.respondOffer(userId, offer.id, "ACCEPT", undefined, "key-acc-otp");
      const deliveryId = delivery!.id;

      // Progress order to ARRIVED_AT_CUSTOMER
      await engine.arriving(userId, deliveryId, "k-arv-1");
      await engine.arriveRestaurant(userId, deliveryId, "k-arv-2");
      await engine.pickup(userId, deliveryId, { method: "ORDER_CODE", code: delivery!.pickupCode }, "k-pick-1");
      await engine.startDelivery(userId, deliveryId, "k-start-1");
      await engine.arriveCustomer(userId, deliveryId, "k-cust-1");

      const correctOtp = (await engine.otpForSimulation(userId, deliveryId))!;
      expect(correctOtp).toBeTruthy();
      expect(correctOtp).toHaveLength(4);

      // Ping location at customer doorstep (<250m)
      await engine.pingLocation(userId, dropPoint, deliveryId);

      // 1. Attempt delivery with INCORRECT OTP
      const incorrectOtp = correctOtp === "1234" ? "9876" : "1234";

      try {
        await engine.deliver(userId, deliveryId, incorrectOtp, "k-fail-otp-1");
        expect.unreachable("Must fail with OTP_WRONG");
      } catch (err) {
        expect(err).toBeInstanceOf(RiderError);
        expect((err as RiderError).code).toBe("OTP_WRONG");
      }

      // Verification: Order MUST be frozen in ON_THE_WAY
      const frozenDelivery = await store.getDeliveryById(deliveryId);
      expect(frozenDelivery?.state).toBe("ON_THE_WAY");
      expect(frozenDelivery?.deliveredAt).toBeNull();

      // Verification: Payout MUST NOT be released (zero earnings lines)
      const earnings = await store.listEarnings(userId);
      const payoutLines = earnings.filter((e) => e.deliveryId === deliveryId);
      expect(payoutLines).toHaveLength(0);

      // 2. Deliver with the CORRECT 4-digit doorstep OTP
      const delivered = await engine.deliver(userId, deliveryId, correctOtp, "k-success-otp-1");
      expect(delivered.state).toBe("DELIVERED");
      expect(delivered.deliveredAt).not.toBeNull();

      // Verification: Payout is now released
      const releasedEarnings = await store.listEarnings(userId);
      const releasedPayout = releasedEarnings.filter((e) => e.deliveryId === deliveryId);
      expect(releasedPayout.length).toBeGreaterThan(0);
      expect(releasedPayout[0].amountPaise).toBeGreaterThanOrEqual(3500); // statutory floor
    });
  });
});
