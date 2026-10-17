import { describe, it, expect, beforeEach } from "vitest";
import {
  createEmergencyDistressPayload,
  type EmergencyDistressPayload,
} from "../components/rider/rider-emergency-sos";
import {
  calculateTier1MilestoneBonus,
  TIER1_DAILY_MILESTONE_SLABS,
} from "../lib/rider/gig-engine";
import {
  calculateCancellationPenalty,
  isJustifiedOperationalReason,
  JUSTIFIED_OPERATIONAL_REASONS,
} from "../lib/rider/discipline";
import { RiderEngine } from "../lib/rider/engine";
import { MemoryStore } from "../lib/rider/memory-store";
import type { Delivery, RiderDisciplineConfig } from "../lib/rider/types";

describe("Supreme Tier-1 Rider Superpowers & Fleet Safety Test Suite", () => {
  const defaultDisciplineConfig: RiderDisciplineConfig = {
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

  // =========================================================================
  // 1. SOS Safety Emergency Panic Shield & Distress Payload Tests
  // =========================================================================
  describe("1. SOS Safety Emergency Panic Shield", () => {
    it("generates a standard emergency distress payload with unique incident ID and 112 dialer", () => {
      const payload = createEmergencyDistressPayload({
        lat: 26.14451,
        lng: 91.73623,
        accuracyM: 4,
        audioBeaconActive: false,
        deliveryId: "del_test_99",
        riderName: "Rahul Sharma",
        riderPhone: "+919876543210",
      });

      expect(payload.incidentId).toMatch(/^SOS-\d+$/);
      expect(payload.kind).toBe("EMERGENCY_CALL");
      expect(payload.lat).toBe(26.14451);
      expect(payload.lng).toBe(91.73623);
      expect(payload.accuracyM).toBe(4);
      expect(payload.audioBeaconActive).toBe(false);
      expect(payload.deliveryId).toBe("del_test_99");
      expect(payload.riderName).toBe("Rahul Sharma");
      expect(payload.riderPhone).toBe("+919876543210");
      expect(payload.dialerTarget).toBe("112");
      expect(payload.helplineTarget).toBe("18001000");
    });

    it("generates valid Google Maps, WhatsApp, and SMS beacon URLs with coordinate encoding", () => {
      const payload = createEmergencyDistressPayload({
        incidentId: "SOS-123456",
        lat: 26.15,
        lng: 91.75,
        audioBeaconActive: false,
        deliveryId: "del_100",
        riderName: "Vikram Das",
      });

      expect(payload.googleMapsUrl).toBe("https://www.google.com/maps?q=26.15000,91.75000");
      expect(payload.whatsappDistressUrl).toContain("https://wa.me/?text=");
      expect(payload.whatsappDistressUrl).toContain(encodeURIComponent("SOS-123456"));
      expect(payload.whatsappDistressUrl).toContain(encodeURIComponent(payload.googleMapsUrl));
      expect(payload.smsDistressUrl).toContain("sms:?body=");
      expect(payload.distressMessage).toContain("Vikram Das");
      expect(payload.safetyDeskNote).toContain("EMERGENCY SOS 112 DISPATCH TRIGGERED (SOS-123456)");
    });

    it("handles audio recording safety beacon toggle flag in distress payload", () => {
      // Audio beacon inactive
      const inactivePayload = createEmergencyDistressPayload({
        lat: 26.14,
        lng: 91.73,
        audioBeaconActive: false,
      });
      expect(inactivePayload.audioBeaconActive).toBe(false);
      expect(inactivePayload.distressMessage).not.toContain("[Audio Beacon ACTIVE]");
      expect(inactivePayload.safetyDeskNote).toContain("Audio: OFF");

      // Audio beacon active
      const activePayload = createEmergencyDistressPayload({
        lat: 26.14,
        lng: 91.73,
        audioBeaconActive: true,
      });
      expect(activePayload.audioBeaconActive).toBe(true);
      expect(activePayload.distressMessage).toContain("[Audio Beacon ACTIVE]");
      expect(activePayload.safetyDeskNote).toContain("Audio: RECORDING");
    });

    it("falls back gracefully when optional parameters are omitted", () => {
      const minimalPayload = createEmergencyDistressPayload({
        lat: 0,
        lng: 0,
      });

      expect(minimalPayload.incidentId).toBeDefined();
      expect(minimalPayload.dialerTarget).toBe("112");
      expect(minimalPayload.helplineTarget).toBe("18001000");
      expect(minimalPayload.accuracyM).toBe(5);
      expect(minimalPayload.deliveryId).toBeNull();
    });
  });

  // =========================================================================
  // 2. Daily Delivery Milestones & Incentive Tracker Tests
  // =========================================================================
  describe("2. Daily Delivery Milestones & Incentive Tracker", () => {
    it("defines authentic Tier-1 Leader milestone slabs: 5 orders = ₹50, 10 orders = ₹150, 15 orders = ₹275", () => {
      expect(TIER1_DAILY_MILESTONE_SLABS).toHaveLength(3);
      expect(TIER1_DAILY_MILESTONE_SLABS[0]).toEqual({
        orders: 5,
        bonusPaise: 5000,
        bonusRupees: 50,
        label: "+₹50",
      });
      expect(TIER1_DAILY_MILESTONE_SLABS[1]).toEqual({
        orders: 10,
        bonusPaise: 15000,
        bonusRupees: 150,
        label: "+₹150",
      });
      expect(TIER1_DAILY_MILESTONE_SLABS[2]).toEqual({
        orders: 15,
        bonusPaise: 27500,
        bonusRupees: 275,
        label: "+₹275",
      });
    });

    it("calculates progress at 0 completed orders with Star 10-order target headline", () => {
      const res = calculateTier1MilestoneBonus(0);
      expect(res.completedOrders).toBe(0);
      expect(res.bonusPaise).toBe(0);
      expect(res.bonusRupees).toBe(0);
      expect(res.targetOrders).toBe(10);
      expect(res.targetBonusRupees).toBe(150);
      expect(res.remainingOrders).toBe(10);
      expect(res.progressPct).toBe(0);
      expect(res.headline).toBe("Today's Target: Complete 10 orders to earn ₹150 Milestone Bonus 🎯");
      expect(res.slabs.every((s) => !s.isUnlocked)).toBe(true);
    });

    it("calculates progress at Slab 1 boundary (5 completed orders = +₹50)", () => {
      const res = calculateTier1MilestoneBonus(5);
      expect(res.completedOrders).toBe(5);
      expect(res.bonusPaise).toBe(5000);
      expect(res.bonusRupees).toBe(50);
      expect(res.targetOrders).toBe(10);
      expect(res.remainingOrders).toBe(5);
      expect(res.progressPct).toBe(50); // 5/10 orders
      expect(res.headline).toBe("Today's Target: Complete 10 orders to earn ₹150 Milestone Bonus 🎯");
      expect(res.slabs[0].isUnlocked).toBe(true); // 5 orders unlocked
      expect(res.slabs[1].isUnlocked).toBe(false);
      expect(res.slabs[2].isUnlocked).toBe(false);
    });

    it("verifies exact prompt requirement: 6/10 orders completed gives 60% progress and +₹50 bonus", () => {
      const res = calculateTier1MilestoneBonus(6);
      expect(res.completedOrders).toBe(6);
      expect(res.targetOrders).toBe(10);
      expect(res.progressPct).toBe(60); // 6/10 = 60%
      expect(res.remainingOrders).toBe(4);
      expect(res.bonusPaise).toBe(5000);
      expect(res.bonusRupees).toBe(50);
      expect(res.headline).toBe("Today's Target: Complete 10 orders to earn ₹150 Milestone Bonus 🎯");
    });

    it("advances target to 15 orders (+₹275) upon completing 10 orders (Slab 2 boundary)", () => {
      const res = calculateTier1MilestoneBonus(10);
      expect(res.completedOrders).toBe(10);
      expect(res.bonusPaise).toBe(15000);
      expect(res.bonusRupees).toBe(150);
      expect(res.targetOrders).toBe(15);
      expect(res.targetBonusRupees).toBe(275);
      expect(res.remainingOrders).toBe(5); // 15 - 10
      expect(res.progressPct).toBe(67); // 10/15 ~ 67%
      expect(res.headline).toBe("Today's Target: Complete 15 orders to earn ₹275 Milestone Bonus 🎯");
      expect(res.slabs[0].isUnlocked).toBe(true);
      expect(res.slabs[1].isUnlocked).toBe(true);
      expect(res.slabs[2].isUnlocked).toBe(false);
    });

    it("unlocks maximum slab (+₹275) and caps progress at 100% on 15 completed orders (Slab 3 boundary)", () => {
      const res = calculateTier1MilestoneBonus(15);
      expect(res.completedOrders).toBe(15);
      expect(res.bonusPaise).toBe(27500);
      expect(res.bonusRupees).toBe(275);
      expect(res.targetOrders).toBe(15);
      expect(res.remainingOrders).toBe(0);
      expect(res.progressPct).toBe(100);
      expect(res.headline).toBe("All Daily Milestone Targets Completed! 🏆");
      expect(res.slabs.every((s) => s.isUnlocked)).toBe(true);
    });

    it("maintains 100% progress and caps bonus at ₹275 for over-achieving couriers (e.g. 20 orders)", () => {
      const res = calculateTier1MilestoneBonus(20);
      expect(res.completedOrders).toBe(20);
      expect(res.bonusPaise).toBe(27500);
      expect(res.bonusRupees).toBe(275);
      expect(res.progressPct).toBe(100);
      expect(res.remainingOrders).toBe(0);
    });

    it("computes real-time addition to daily earnings accurately", () => {
      const baseDailyEarningsPaise = 42000; // ₹420 base + distance pay
      const completed = 10; // Unlocked ₹150 (15,000 paise) milestone bonus

      const milestone = calculateTier1MilestoneBonus(completed);
      const totalEarningsWithBonusPaise = baseDailyEarningsPaise + milestone.bonusPaise;

      expect(milestone.bonusPaise).toBe(15000);
      expect(totalEarningsWithBonusPaise).toBe(57000); // ₹570.00
      expect(totalEarningsWithBonusPaise / 100).toBe(570);
    });

    it("safely handles negative or invalid order inputs without runtime errors", () => {
      const negativeRes = calculateTier1MilestoneBonus(-5);
      expect(negativeRes.completedOrders).toBe(0);
      expect(negativeRes.progressPct).toBe(0);
      expect(negativeRes.bonusPaise).toBe(0);

      const nanRes = calculateTier1MilestoneBonus(NaN as unknown as number);
      expect(nanRes.completedOrders).toBe(0);
      expect(nanRes.progressPct).toBe(0);
    });
  });

  // =========================================================================
  // 3. Order Rejection / Reassignment with Justified Operational Reasons
  // =========================================================================
  describe("3. Order Rejection / Reassignment with Justified Operational Reasons", () => {
    it("contains all 4 dignified, realistic operational reasons", () => {
      expect(JUSTIFIED_OPERATIONAL_REASONS).toContain("Bike Breakdown / Tyre Puncture 🛵");
      expect(JUSTIFIED_OPERATIONAL_REASONS).toContain("Personal Emergency / Unwell 🏥");
      expect(JUSTIFIED_OPERATIONAL_REASONS).toContain("Restaurant Distance Excessive (>5 km) 📍");
      expect(JUSTIFIED_OPERATIONAL_REASONS).toContain("Heavy Rain / Waterlogging on Route 🌧️");
      expect(JUSTIFIED_OPERATIONAL_REASONS).toHaveLength(4);
    });

    it("validates justified operational reasons with emojis, lowercase, and variations", () => {
      expect(isJustifiedOperationalReason("Bike Breakdown / Tyre Puncture 🛵")).toBe(true);
      expect(isJustifiedOperationalReason("bike breakdown / tyre puncture")).toBe(true);
      expect(isJustifiedOperationalReason("bike breakdown")).toBe(true);
      expect(isJustifiedOperationalReason("tyre puncture")).toBe(true);

      expect(isJustifiedOperationalReason("Personal Emergency / Unwell 🏥")).toBe(true);
      expect(isJustifiedOperationalReason("personal emergency")).toBe(true);
      expect(isJustifiedOperationalReason("unwell")).toBe(true);

      expect(isJustifiedOperationalReason("Restaurant Distance Excessive (>5 km) 📍")).toBe(true);
      expect(isJustifiedOperationalReason("restaurant distance excessive")).toBe(true);

      expect(isJustifiedOperationalReason("Heavy Rain / Waterlogging on Route 🌧️")).toBe(true);
      expect(isJustifiedOperationalReason("heavy rain")).toBe(true);
      expect(isJustifiedOperationalReason("waterlogging on route")).toBe(true);
    });

    it("rejects non-operational or frivolous reasons", () => {
      expect(isJustifiedOperationalReason("lazy today")).toBe(false);
      expect(isJustifiedOperationalReason("don't feel like driving")).toBe(false);
      expect(isJustifiedOperationalReason("want to sleep")).toBe(false);
      expect(isJustifiedOperationalReason("")).toBe(false);
      expect(isJustifiedOperationalReason(null)).toBe(false);
    });

    it("waives cancellation penalty (₹0) when pre-pickup cancellation uses a justified operational reason", () => {
      const prePickupStates = [
        "ACCEPTED",
        "ARRIVING_AT_RESTAURANT",
        "ARRIVED_AT_RESTAURANT",
        "RESTAURANT_NOT_READY",
      ] as const;

      for (const state of prePickupStates) {
        // Justified reason 1: Bike breakdown
        const res1 = calculateCancellationPenalty(
          state,
          0,
          5000,
          defaultDisciplineConfig,
          false,
          "Bike Breakdown / Tyre Puncture 🛵",
        );
        expect(res1.penaltyPaise).toBe(0);
        expect(res1.isJustifiedReassignment).toBe(true);
        expect(res1.label).toContain("Pre-pickup operational reassignment");

        // Justified reason 2: Personal emergency
        const res2 = calculateCancellationPenalty(
          state,
          0,
          5000,
          defaultDisciplineConfig,
          false,
          "Personal Emergency / Unwell 🏥",
        );
        expect(res2.penaltyPaise).toBe(0);
        expect(res2.isJustifiedReassignment).toBe(true);

        // Justified reason 3: Excessive restaurant distance
        const res3 = calculateCancellationPenalty(
          state,
          0,
          5000,
          defaultDisciplineConfig,
          false,
          "Restaurant Distance Excessive (>5 km) 📍",
        );
        expect(res3.penaltyPaise).toBe(0);
        expect(res3.isJustifiedReassignment).toBe(true);

        // Justified reason 4: Heavy rain / waterlogging
        const res4 = calculateCancellationPenalty(
          state,
          0,
          5000,
          defaultDisciplineConfig,
          false,
          "Heavy Rain / Waterlogging on Route 🌧️",
        );
        expect(res4.penaltyPaise).toBe(0);
        expect(res4.isJustifiedReassignment).toBe(true);
      }
    });

    it("applies standard discipline deduction (₹25) when pre-pickup cancellation has an unjustified reason", () => {
      const res = calculateCancellationPenalty(
        "ACCEPTED",
        0,
        5000,
        defaultDisciplineConfig,
        false,
        "other",
      );
      expect(res.penaltyPaise).toBe(2500); // ₹25 in paise
      expect(res.isJustifiedReassignment).toBe(false);
      expect(res.label).toContain("Pre-pickup cancellation penalty");
    });

    it("enforces full liability penalty when cancelled post-pickup without proof", () => {
      const res = calculateCancellationPenalty(
        "ON_THE_WAY",
        35000, // ₹350 COD
        6000,  // ₹60 payout
        defaultDisciplineConfig,
        false, // no proof
        "Bike Breakdown / Tyre Puncture 🛵", // reason alone cannot excuse post-pickup food loss without audit proof
      );
      expect(res.penaltyPaise).toBe(41000); // 35000 + 6000
      expect(res.isPostPickup).toBe(true);
      expect(res.requiresAuditHold).toBe(true);
    });

    it("waives penalty post-pickup if verified accident/breakdown emergency proof is provided", () => {
      const res = calculateCancellationPenalty(
        "ON_THE_WAY",
        35000,
        6000,
        defaultDisciplineConfig,
        true, // hasVerifiedProof
        "Bike Breakdown / Tyre Puncture 🛵",
      );
      expect(res.penaltyPaise).toBe(0);
      expect(res.requiresAuditHold).toBe(true);
      expect(res.label).toContain("Penalty Waived");
    });
  });

  // =========================================================================
  // 4. End-to-End RiderEngine State Transition & Reassignment Tests
  // =========================================================================
  describe("4. End-to-End RiderEngine State Transition & Operational Reassignment", () => {
    let store: MemoryStore;
    let engine: RiderEngine;
    const userId = "user_rider_tier1_1";

    beforeEach(async () => {
      store = new MemoryStore();
      engine = new RiderEngine(store);
      await engine.ensureRider({
        id: userId,
        name: "Pranab Gogoi",
        email: "pranab@orderking.in",
      });
      await engine.systemSetKyc("ADMIN", userId, "VERIFIED");
      await engine.setStatus(userId, "ONLINE", true);
    });

    function createTestDelivery(partial: Partial<Delivery> & Pick<Delivery, "id" | "userId" | "riderId">): Delivery {
      const now = new Date().toISOString();
      return {
        offerId: "offer_test_1",
        orderId: partial.id,
        orderCode: "OK-9999",
        state: "ACCEPTED",
        packageCount: 1,
        cod: false,
        codAmountPaise: 0,
        pickupVerification: "ORDER_CODE",
        pickupCode: "1234",
        otpRequired: true,
        expectedPayoutPaise: 5000,
        dataMode: "SIMULATED",
        pickupLocation: { lat: 26.14, lng: 91.73 },
        dropLocation: { lat: 26.16, lng: 91.75 },
        arrivedRestaurantAt: null,
        expectedReadyAt: null,
        pickedUpAt: null,
        arrivedCustomerAt: null,
        deliveredAt: null,
        waitStartedAt: null,
        contactAttempts: 0,
        cancelReason: null,
        failReason: null,
        createdAt: now,
        updatedAt: now,
        restaurant: {
          id: "rest_1",
          name: "Guwahati Biryani House",
          area: "Paltan Bazaar",
          address: "GS Road",
          location: { lat: 26.14, lng: 91.73 },
          phoneMasked: "+91XXXXX1234",
          preparationStatus: "READY",
          specialPickupInstructions: null,
        },
        customer: {
          displayName: "Kabir Roy",
          area: "Ulubari",
          address: "Flat 4A",
          contactMasked: "+91XXXXX5678",
          contactAllowed: true,
          instructions: null,
        },
        ...partial,
        id: partial.id,
        userId: partial.userId,
        riderId: partial.riderId,
      };
    }

    it("reassigns pre-pickup order cleanly with zero penalty upon bike breakdown", async () => {
      const rider = await store.getRiderByUserId(userId);
      expect(rider).not.toBeNull();

      // Seed a delivery in ACCEPTED state
      const deliveryId = "del_reassign_101";
      const delivery = createTestDelivery({
        id: deliveryId,
        orderId: deliveryId,
        orderCode: "OK-7701",
        userId,
        riderId: rider!.id,
        state: "ACCEPTED",
        packageCount: 1,
        cod: false,
        codAmountPaise: 0,
        pickupVerification: "ORDER_CODE",
        pickupCode: "4321",
        otpRequired: true,
        expectedPayoutPaise: 5500,
        dataMode: "SIMULATED",
        pickupLocation: { lat: 26.14, lng: 91.73 },
        dropLocation: { lat: 26.16, lng: 91.75 },
        restaurant: {
          id: "rest_1",
          name: "Guwahati Biryani House",
          area: "Paltan Bazaar",
          address: "GS Road",
          location: { lat: 26.14, lng: 91.73 },
          phoneMasked: "+91XXXXX1234",
          preparationStatus: "READY",
          specialPickupInstructions: null,
        },
        customer: {
          displayName: "Kabir Roy",
          area: "Ulubari",
          address: "Flat 4A",
          contactMasked: "+91XXXXX5678",
          contactAllowed: true,
          instructions: null,
        },
      });
      await store.insertDelivery(delivery);

      // Rider cancels before pickup with justified reason: Bike Breakdown
      const cancelled = await engine.cancelDelivery(
        userId,
        deliveryId,
        "Bike Breakdown / Tyre Puncture 🛵",
        true,
        "idem_cancel_breakdown",
      );

      // Verify clean transition to RIDER_CANCELLED
      expect(cancelled.state).toBe("RIDER_CANCELLED");
      expect(cancelled.cancelReason).toBe("bike breakdown / tyre puncture 🛵");

      // Verify ZERO penalty deduction was inserted into earnings
      const earnings = await store.listEarnings(userId);
      const deductions = earnings.filter((e) => e.kind === "DEDUCTION");
      expect(deductions).toHaveLength(0);

      // Verify OPERATIONAL_REASSIGNMENT signal was recorded for fleet dispatch
      const signals = store.signals;
      const reassignSignal = signals.find((s) => s.kind === "OPERATIONAL_REASSIGNMENT");
      expect(reassignSignal).toBeDefined();
      expect(reassignSignal?.detail).toContain("reassigned to nearest available partner");
      expect(reassignSignal?.detail).toContain("Zero Penalty Applied");

      // Verify gentle notification was generated for rider
      const notifications = await store.listNotifications(userId);
      const reassignNotif = notifications.find((n) => n.title.includes("Trip Reassigned Gracefully"));
      expect(reassignNotif).toBeDefined();
      expect(reassignNotif?.body).toContain("No penalty was deducted");
    });

    it("penalizes pre-pickup cancellation when reason is generic or unjustified", async () => {
      const rider = await store.getRiderByUserId(userId);
      const deliveryId = "del_penalized_102";
      const delivery = createTestDelivery({
        id: deliveryId,
        orderId: deliveryId,
        orderCode: "OK-8802",
        userId,
        riderId: rider!.id,
        state: "ACCEPTED",
        packageCount: 1,
        cod: false,
        codAmountPaise: 0,
        pickupVerification: "ORDER_CODE",
        pickupCode: "5678",
        otpRequired: true,
        expectedPayoutPaise: 4000,
        dataMode: "SIMULATED",
        pickupLocation: { lat: 26.14, lng: 91.73 },
        dropLocation: { lat: 26.16, lng: 91.75 },
        restaurant: {
          id: "rest_2",
          name: "Chai Point",
          area: "Christian Basti",
          address: "GS Road",
          location: { lat: 26.14, lng: 91.73 },
          phoneMasked: "+91XXXXX1234",
          preparationStatus: "READY",
          specialPickupInstructions: null,
        },
        customer: {
          displayName: "Sunil Paul",
          area: "Ganeshguri",
          address: "House 12",
          contactMasked: "+91XXXXX5678",
          contactAllowed: true,
          instructions: null,
        },
      });
      await store.insertDelivery(delivery);

      // Rider cancels with unjustified reason
      const cancelled = await engine.cancelDelivery(
        userId,
        deliveryId,
        "other",
        true,
        "idem_cancel_unjustified",
      );

      expect(cancelled.state).toBe("RIDER_CANCELLED");

      // Verify standard ₹25 penalty was deducted
      const earnings = await store.listEarnings(userId);
      const deductions = earnings.filter((e) => e.kind === "DEDUCTION");
      expect(deductions).toHaveLength(1);
      expect(deductions[0].amountPaise).toBe(-2500); // -₹25.00
    });
  });
});
