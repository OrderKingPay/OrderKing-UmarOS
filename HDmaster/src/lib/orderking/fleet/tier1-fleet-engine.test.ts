import { describe, expect, it } from "vitest";
import {
  ZomatoFleetEngine,
  DEFAULT_FLEET_CONFIG,
  calculateHaversineDistanceMeters,
} from "./tier1-fleet-engine";

describe("Supreme Rider Fleet Operations & Autonomous Dispatch Engine (OrderKing Core)", () => {
  // ==========================================================================
  // 1. INITIALIZATION & UMAROS UNIVERSAL CUSTOMIZATION
  // ==========================================================================
  describe("UmarOS Universal Customization & Dials", () => {
    it("initializes with authentic Tier-1 operational defaults", () => {
      const engine = new ZomatoFleetEngine();
      const config = engine.getConfig();

      // COD Limits
      expect(config.codSafety.cashInHandLimitPaise).toBe(150000); // ₹1,500 limit
      expect(config.codSafety.softWarningThresholdPct).toBe(80); // 80% soft warning (₹1,200)

      // Batching
      expect(config.batching.batchPickupDiscountPct).toBe(35); // 35% pickup discount
      expect(config.batching.maxPickupDistanceMeters).toBe(500); // 500m co-located pickup
      expect(config.batching.maxDropDistanceMeters).toBe(2000); // 2.0 km adjacent drop
      expect(config.batching.preserveDropIncentives).toBe(true); // Drop incentives preserved

      // Exception Handling
      expect(config.exceptions.kitchenDelayGraceMinutes).toBe(7); // > 7 mins delay trigger
      expect(config.exceptions.slaDeliveryBreachGraceMinutes).toBe(15); // > 15 mins delay trigger
      expect(config.exceptions.slaBreachWalletCreditPaise).toBe(5000); // ₹50.00 wallet credit

      // Tiers
      expect(config.tiers.gold.minAcceptanceRatePct).toBe(90);
      expect(config.tiers.gold.minCompletionRatePct).toBe(95);
      expect(config.tiers.gold.minOnTimeDeliveryRatePct).toBe(92);
      expect(config.tiers.gold.priorityDispatchMultiplier).toBe(1.3);
    });

    it("allows dynamic real-time tuning of all thresholds from UmarOS without restart", () => {
      const engine = new ZomatoFleetEngine();

      // UmarOS founder tunes COD limit to ₹2,000, 2nd base discount to 40%, and delay credit to ₹75
      engine.updateConfig({
        codSafety: {
          ...DEFAULT_FLEET_CONFIG.codSafety,
          cashInHandLimitPaise: 200000, // ₹2,000
          softWarningThresholdPct: 75, // 75% = ₹1,500
        },
        batching: {
          ...DEFAULT_FLEET_CONFIG.batching,
          batchPickupDiscountPct: 40,
        },
        exceptions: {
          ...DEFAULT_FLEET_CONFIG.exceptions,
          slaBreachWalletCreditPaise: 7500, // ₹75.00
        },
      });

      const updated = engine.getConfig();
      expect(updated.codSafety.cashInHandLimitPaise).toBe(200000);
      expect(updated.codSafety.softWarningThresholdPct).toBe(75);
      expect(updated.batching.batchPickupDiscountPct).toBe(40);
      expect(updated.exceptions.slaBreachWalletCreditPaise).toBe(7500);

      // Verify UmarOS dial exports reflect updated values
      const exports = engine.exportForUmarOS();
      expect(exports.dials.find((d) => d.key === "codSafety.cashInHandLimitPaise")?.currentValue).toBe(2000);
      expect(exports.dials.find((d) => d.key === "batching.batchPickupDiscountPct")?.currentValue).toBe(40);
    });
  });

  // ==========================================================================
  // 2. AUTONOMOUS DISPATCH PRE-ALLOCATION (0 IDLE MINUTES TARGET)
  // ==========================================================================
  describe("Autonomous Dispatch Pre-Allocation & KPT Synchronization", () => {
    const engine = new ZomatoFleetEngine();

    it("computes exact notification timing to achieve 0 idle minutes for approaching rider", () => {
      const baseTime = new Date("2026-10-16T12:00:00.000Z");
      // Kitchen takes 20 minutes prep. Rider is 6 minutes away.
      // Target food ready: 12:20:00. Target rider arrival: 12:20:00.
      // Optimal dispatch time: 12:20:00 - 6 mins = 12:14:00 (14 mins after order confirmed).
      const plan = engine.calculateDispatchPreAllocation({
        orderId: "ord_101",
        orderConfirmedAt: baseTime.toISOString(),
        predictedKptMinutes: 20.0,
        riderEtaMinutes: 6.0,
        currentTime: baseTime.toISOString(), // Evaluated at order confirmation (12:00:00)
      });

      expect(plan.foodReadyTimestamp).toBe(new Date("2026-10-16T12:20:00.000Z").toISOString());
      expect(plan.targetRiderArrivalTimestamp).toBe(new Date("2026-10-16T12:20:00.000Z").toISOString());
      expect(plan.optimalDispatchTimestamp).toBe(new Date("2026-10-16T12:14:00.000Z").toISOString());
      expect(plan.minutesUntilDispatch).toBe(14.0);
      expect(plan.status).toBe("HOLD_FOR_KITCHEN_PROGRESS");
      expect(plan.expectedRiderIdleMinutes).toBe(0); // 0 idle minutes!
    });

    it("triggers DISPATCH_IMMEDIATELY when rider ETA matches remaining prep time", () => {
      const orderConfirmedAt = new Date("2026-10-16T12:00:00.000Z");
      const currentTime = new Date("2026-10-16T12:13:30.000Z"); // 13.5 mins later

      // Kitchen prep is 18 mins. Rider is 5 mins away.
      // Optimal dispatch: 18 - 5 = 13 mins. Current time is 13.5 mins (lead <= 2 min threshold).
      const plan = engine.calculateDispatchPreAllocation({
        orderId: "ord_102",
        orderConfirmedAt: orderConfirmedAt.toISOString(),
        predictedKptMinutes: 18.0,
        riderEtaMinutes: 5.0,
        currentTime: currentTime.toISOString(),
      });

      expect(plan.status).toBe("DISPATCH_IMMEDIATELY");
      expect(plan.minutesUntilDispatch).toBeLessThanOrEqual(2.0);
      expect(plan.dispatchLog).toContain("Paging rider immediately");
    });
  });

  // ==========================================================================
  // 3. MULTI-ORDER BATCHING LOGIC
  // ==========================================================================
  describe("Multi-Order Batching Logic & Rider Incentive Preservation", () => {
    const engine = new ZomatoFleetEngine();

    // Standard restaurant & drop coordinates in urban corridor
    const restaurantA = { latitude: 12.9352, longitude: 77.6245 }; // Koramangala Hub
    const restaurantB = { latitude: 12.9360, longitude: 77.6255 }; // 140 meters away (Co-located!)
    const restaurantFar = { latitude: 12.9716, longitude: 77.5946 }; // 5.2 km away

    const drop1 = { latitude: 12.942, longitude: 77.631 };
    const drop2Adjacent = { latitude: 12.945, longitude: 77.634 }; // 450 meters from drop 1
    const dropFar = { latitude: 12.985, longitude: 77.675 }; // 6.5 km from drop 1

    it("successfully batches co-located pickups with adjacent drops and applies 35% discount on 2nd base while preserving drop incentives", () => {
      const now = new Date("2026-10-16T13:00:00.000Z");

      const order1 = {
        id: "ord_batch_1",
        restaurantId: "rest_cafe_delhi",
        pickupLocation: restaurantA,
        dropoffLocation: drop1,
        readyTimeExpected: new Date(now.getTime() + 10 * 60000).toISOString(),
        cargoWeightKg: 2.5,
        lastMileDistanceKm: 2.0,
      };

      const order2 = {
        id: "ord_batch_2",
        restaurantId: "rest_cafe_delhi", // Same restaurant
        pickupLocation: restaurantA,
        dropoffLocation: drop2Adjacent, // 450m from drop 1 (Adjacent!)
        readyTimeExpected: new Date(now.getTime() + 14 * 60000).toISOString(), // 4 min delta
        cargoWeightKg: 3.0,
        lastMileDistanceKm: 2.4,
      };

      const result = engine.evaluateOrderBatching(order1, order2);

      expect(result.isBatchable).toBe(true);
      expect(result.rejectionReasons).toHaveLength(0);
      expect(result.pricing).toBeDefined();

      const p = result.pricing!;

      // Order 1: 100% Base Pay (₹20.00 = 2000 paise) + Last-Mile Pay + Full Drop Incentive (₹15.00)
      expect(p.order1.basePayPaise).toBe(2000);
      expect(p.order1.basePayDiscountPaise).toBe(0);
      expect(p.order1.dropIncentivePaise).toBe(1500); // Preserved!
      expect(p.order1.lastMilePayPaise).toBe(1400); // 2.0 km * ₹7.00/km = ₹14.00

      // Order 2: 35% Pickup Discount on Base Pay (₹20.00 - 35% = ₹13.00)
      expect(p.order2.basePayDiscountPaise).toBe(700); // ₹7.00 discount (35% of ₹20)
      expect(p.order2.basePayPaise).toBe(1300); // ₹13.00 base pay
      // Crucial: Rider drop incentive on 2nd order is 100% PRESERVED!
      expect(p.order2.dropIncentivePaise).toBe(1500); // ₹15.00 Preserved!
      expect(p.order2.lastMilePayPaise).toBe(1680); // 2.4 km * ₹7.00 = ₹16.80

      // Platform economic benefit & rider total
      expect(p.platformBaseDiscountPaise).toBe(700); // ₹7.00 margin saved by platform
      expect(p.platformBaseDiscountRupees).toBe(7.0);
      expect(p.totalRiderPayoutPaise).toBe(p.order1.totalOrderPayoutPaise + p.order2.totalOrderPayoutPaise);
      expect(p.explanation).toContain("35% pickup discount applied");
      expect(p.explanation).toContain("100% PRESERVED");
    });

    it("rejects batching when pickup locations are beyond co-location limit", () => {
      const now = new Date();
      const order1 = {
        id: "ord_far_pick_1",
        restaurantId: "rest_1",
        pickupLocation: restaurantA,
        dropoffLocation: drop1,
        readyTimeExpected: now.toISOString(),
        lastMileDistanceKm: 2.0,
      };

      const order2 = {
        id: "ord_far_pick_2",
        restaurantId: "rest_2",
        pickupLocation: restaurantFar, // 5.2 km away
        dropoffLocation: drop2Adjacent,
        readyTimeExpected: now.toISOString(),
        lastMileDistanceKm: 2.0,
      };

      const result = engine.evaluateOrderBatching(order1, order2);
      expect(result.isBatchable).toBe(false);
      expect(result.rejectionReasons.some((r) => r.includes("co-location limit"))).toBe(true);
    });

    it("rejects batching when drop locations are not adjacent (> 2.0 km apart)", () => {
      const now = new Date();
      const order1 = {
        id: "ord_drop_1",
        restaurantId: "rest_1",
        pickupLocation: restaurantA,
        dropoffLocation: drop1,
        readyTimeExpected: now.toISOString(),
        lastMileDistanceKm: 2.0,
      };

      const order2 = {
        id: "ord_drop_2",
        restaurantId: "rest_1",
        pickupLocation: restaurantA,
        dropoffLocation: dropFar, // 6.5 km from drop 1
        readyTimeExpected: now.toISOString(),
        lastMileDistanceKm: 7.0,
      };

      const result = engine.evaluateOrderBatching(order1, order2);
      expect(result.isBatchable).toBe(false);
      expect(result.rejectionReasons.some((r) => r.includes("adjacency threshold"))).toBe(true);
    });

    it("rejects batching when food readiness gap exceeds 10 minutes", () => {
      const now = new Date("2026-10-16T14:00:00.000Z");
      const order1 = {
        id: "ord_time_1",
        restaurantId: "rest_1",
        pickupLocation: restaurantA,
        dropoffLocation: drop1,
        readyTimeExpected: new Date(now.getTime() + 5 * 60000).toISOString(), // 5 mins
        lastMileDistanceKm: 2.0,
      };

      const order2 = {
        id: "ord_time_2",
        restaurantId: "rest_1",
        pickupLocation: restaurantA,
        dropoffLocation: drop2Adjacent,
        readyTimeExpected: new Date(now.getTime() + 25 * 60000).toISOString(), // 25 mins (20 min gap!)
        lastMileDistanceKm: 2.0,
      };

      const result = engine.evaluateOrderBatching(order1, order2);
      expect(result.isBatchable).toBe(false);
      expect(result.rejectionReasons.some((r) => r.includes("maximum allowed batch delta"))).toBe(true);
    });
  });

  // ==========================================================================
  // 4. COD FLOATING CASH SAFETY LOCK
  // ==========================================================================
  describe("COD Floating Cash Safety Lock & Settlement Rail", () => {
    const engine = new ZomatoFleetEngine();

    it("allows COD orders normally when cash-in-hand is low (< ₹1,200)", () => {
      const evalStatus = engine.evaluateCodSafetyLock({
        riderId: "rider_401",
        currentCashInHandPaise: 65000, // ₹650.00
      });

      expect(evalStatus.lockStatus).toBe("UNLOCKED");
      expect(evalStatus.canAcceptCodOrders).toBe(true);
      expect(evalStatus.canAcceptPrepaidOrders).toBe(true);
      expect(evalStatus.actionRequired).toBe("NONE");
    });

    it("triggers automated UPI deposit prompt at ₹1,200 (80% soft warning threshold)", () => {
      const evalStatus = engine.evaluateCodSafetyLock({
        riderId: "rider_402",
        currentCashInHandPaise: 125000, // ₹1,250.00 (> ₹1,200 soft threshold)
      });

      expect(evalStatus.lockStatus).toBe("DEPOSIT_PROMPT_TRIGGERED");
      expect(evalStatus.actionRequired).toBe("TRIGGER_DEPOSIT_PROMPT");
      expect(evalStatus.canAcceptCodOrders).toBe(true); // Still allowed if incoming order won't breach ₹1,500
      expect(evalStatus.settlementLink).toContain("upi://pay");
      expect(evalStatus.promptMessage).toContain("83.3% of ₹1500.00 limit");
    });

    it("rejects an incoming COD order if it would push cash-in-hand past ₹1,500", () => {
      const evalStatus = engine.evaluateCodSafetyLock({
        riderId: "rider_403",
        currentCashInHandPaise: 130000, // ₹1,300.00
        incomingOrder: {
          orderId: "ord_cod_99",
          isCod: true,
          codAmountPaise: 35000, // ₹350.00 (Projected = ₹1,650 > ₹1,500 limit!)
        },
      });

      expect(evalStatus.canAcceptIncomingOrder).toBe(false);
      expect(evalStatus.rejectionReason).toContain("would breach ₹1500.00 limit");
    });

    it("enforces strict COD lock at ₹1,500 (100%), allowing ONLY prepaid orders until settled", () => {
      const evalStatus = engine.evaluateCodSafetyLock({
        riderId: "rider_404",
        currentCashInHandPaise: 152000, // ₹1,520.00 (>= ₹1,500 hard lock)
        incomingOrder: {
          orderId: "ord_cod_100",
          isCod: true,
          codAmountPaise: 20000,
        },
      });

      expect(evalStatus.lockStatus).toBe("COD_LOCKED");
      expect(evalStatus.canAcceptCodOrders).toBe(false); // COD strictly blocked!
      expect(evalStatus.canAcceptPrepaidOrders).toBe(true); // Prepaid orders STILL ALLOWED!
      expect(evalStatus.canAcceptIncomingOrder).toBe(false);
      expect(evalStatus.actionRequired).toBe("MANDATORY_UPI_DEPOSIT");
      expect(evalStatus.promptMessage).toContain("SAFETY LOCK ACTIVE");
    });

    it("settles rider cash via Razorpay/UPI payout rail and automatically lifts COD lock", () => {
      const previousCash = 160000; // ₹1,600 (Locked)
      const depositAmount = 120000; // Rider remits ₹1,200 via UPI QR code

      const receipt = engine.settleRiderCash("rider_404", previousCash, depositAmount, "RAZORPAY_UPI");

      expect(receipt.previousCashPaise).toBe(160000);
      expect(receipt.depositedAmountPaise).toBe(120000);
      expect(receipt.newCashInHandPaise).toBe(40000); // Remaining cash: ₹400
      expect(receipt.newCashInHandRupees).toBe(400);
      expect(receipt.isUnlocked).toBe(true);
      expect(receipt.newLockStatus).toBe("UNLOCKED");
    });
  });

  // ==========================================================================
  // 5. AUTONOMOUS EXCEPTION HANDLING (EMPLOYEE-LESS)
  // ==========================================================================
  describe("Autonomous Employee-less Exception Handling", () => {
    const engine = new ZomatoFleetEngine();

    it("triggers automated outbound AI voice IVR call to restaurant kitchen manager when prep exceeds promise time by >7 mins", () => {
      const exception = engine.evaluateAutonomousExceptions({
        orderId: "ord_kitchen_delay",
        restaurantId: "rest_biryani_zone",
        restaurantManagerPhone: "+919876543210",
        elapsedOrderMinutes: 28,
        quotedDeliveryMinutes: 35,
        kitchenPrepElapsedMinutes: 24, // 24 mins elapsed
        kitchenQuotedPrepMinutes: 15, // Quoted 15 mins -> 9 mins late (> 7 min grace!)
        foodReadyMarked: false,
        riderAssigned: true,
      });

      expect(exception.actionRequired).toBe("AI_VOICE_IVR_CALL");
      expect(exception.severity).toBe("P0_CRITICAL");
      expect(exception.payload.phoneNumber).toBe("+919876543210");
      expect(exception.payload.ivrScript).toContain("exceeded promised time by 9 minutes");
      expect(exception.payload.ivrScript).toContain("Press 1 when packed");
      expect(exception.payload.ivrLanguage).toBe("hi-IN,en-IN");
    });

    it("does not trigger voice alert if kitchen is within the 7-minute grace tolerance", () => {
      const exception = engine.evaluateAutonomousExceptions({
        orderId: "ord_kitchen_normal",
        restaurantId: "rest_biryani_zone",
        restaurantManagerPhone: "+919876543210",
        elapsedOrderMinutes: 18,
        quotedDeliveryMinutes: 35,
        kitchenPrepElapsedMinutes: 19, // 19 mins elapsed
        kitchenQuotedPrepMinutes: 15, // 4 mins late (within 7 min grace)
        foodReadyMarked: false,
        riderAssigned: true,
      });

      expect(exception.actionRequired).toBe("NONE");
    });

    it("automatically credits customer KingPay wallet with ₹50 and generates notification when delivery is delayed >15 mins beyond quoted ETA", () => {
      const exception = engine.evaluateAutonomousExceptions({
        orderId: "ord_sla_breach",
        restaurantId: "rest_punjabi_tadka",
        restaurantManagerPhone: "+919876543210",
        customerPhone: "+919988776655",
        elapsedOrderMinutes: 52, // 52 mins elapsed
        quotedDeliveryMinutes: 35, // Quoted 35 mins -> 17 mins late (> 15 min breach threshold!)
        kitchenPrepElapsedMinutes: 20,
        kitchenQuotedPrepMinutes: 15,
        foodReadyMarked: true,
        riderAssigned: true,
      });

      expect(exception.actionRequired).toBe("AUTO_COMPENSATE_CUSTOMER");
      expect(exception.severity).toBe("P0_CRITICAL");
      expect(exception.payload.walletCreditPaise).toBe(5000); // ₹50.00
      expect(exception.payload.walletCreditRupees).toBe(50.0);
      expect(exception.payload.customerNotification).toContain("₹50.00 has been credited instantly to your KingPay Wallet");
    });

    it("triggers stationary alert when rider is stopped for >8 mins during active transit to customer", () => {
      const exception = engine.evaluateAutonomousExceptions({
        orderId: "ord_rider_stuck",
        restaurantId: "rest_punjabi_tadka",
        restaurantManagerPhone: "+919876543210",
        elapsedOrderMinutes: 30,
        quotedDeliveryMinutes: 40,
        kitchenPrepElapsedMinutes: 15,
        kitchenQuotedPrepMinutes: 15,
        foodReadyMarked: true,
        riderAssigned: true,
        riderCurrentStatus: "TRANSIT_TO_CUSTOMER",
        riderStationaryMinutes: 9, // Stationary for 9 mins (> 8 min threshold)
      });

      expect(exception.actionRequired).toBe("RIDER_STATIONARY_WARNING");
      expect(exception.severity).toBe("WARNING");
    });
  });

  // ==========================================================================
  // 6. RIDER TIER GAMIFICATION & WEEKLY MILESTONES
  // ==========================================================================
  describe("Rider Tier Gamification & Weekly Milestone Bonuses", () => {
    const engine = new ZomatoFleetEngine();

    it("qualifies rider for Gold Tier when Acceptance Rate >90%, Completion Rate >95%, and On-Time >92%", () => {
      const evaluation = engine.evaluateRiderTier({
        riderId: "rider_gold_01",
        acceptanceRatePct: 92.5, // > 90%
        completionRatePct: 96.0, // > 95%
        onTimeDeliveryRatePct: 93.4, // > 92%
        weeklyCompletedOrders: 42,
      });

      expect(evaluation.tier).toBe("GOLD");
      expect(evaluation.priorityDispatchMultiplier).toBe(1.3); // 30% dispatch priority boost
      expect(evaluation.surgeBonusMultiplier).toBe(1.25);
    });

    it("qualifies rider for Diamond Tier when metrics reach apex standards (>=95% AR, >=98% CR, >=95% OTD)", () => {
      const evaluation = engine.evaluateRiderTier({
        riderId: "rider_diamond_01",
        acceptanceRatePct: 97.0,
        completionRatePct: 99.1,
        onTimeDeliveryRatePct: 96.5,
        weeklyCompletedOrders: 80,
      });

      expect(evaluation.tier).toBe("DIAMOND");
      expect(evaluation.priorityDispatchMultiplier).toBe(1.5); // 50% priority dispatch boost
    });

    it("awards ₹1,200 weekly milestone bonus upon reaching 50 completed orders", () => {
      const evaluation = engine.evaluateRiderTier({
        riderId: "rider_milestone_01",
        acceptanceRatePct: 91.0,
        completionRatePct: 95.5,
        onTimeDeliveryRatePct: 92.5,
        weeklyCompletedOrders: 54, // 54 orders completed!
      });

      expect(evaluation.tier).toBe("GOLD");

      const bonuses = evaluation.weeklyMilestoneBonusAwarded;
      // Reached 30 orders milestone (₹500) + 50 orders milestone (₹1,200) = ₹1,700 total bonus!
      expect(bonuses.achievedMilestones.some((m) => m.targetOrders === 50 && m.bonusPaise === 120000)).toBe(true);
      expect(bonuses.totalBonusPaise).toBeGreaterThanOrEqual(120000); // At least ₹1,200
      expect(bonuses.totalBonusRupees).toBe(1700); // ₹500 + ₹1,200 = ₹1,700
    });

    it("calculates gap metrics required to reach next tier", () => {
      const evaluation = engine.evaluateRiderTier({
        riderId: "rider_silver_01",
        acceptanceRatePct: 86.0, // Silver
        completionRatePct: 91.0,
        onTimeDeliveryRatePct: 89.0,
        weeklyCompletedOrders: 20,
      });

      expect(evaluation.tier).toBe("SILVER");
      expect(evaluation.nextTierRequirements).toBeDefined();
      expect(evaluation.nextTierRequirements?.nextTier).toBe("GOLD");
      // Gap to Gold (90% AR, 95% CR, 92% OTD):
      expect(evaluation.nextTierRequirements?.gapAcceptanceRate).toBe(4.0); // 90 - 86 = 4.0%
      expect(evaluation.nextTierRequirements?.gapCompletionRate).toBe(4.0); // 95 - 91 = 4.0%
      expect(evaluation.nextTierRequirements?.gapOnTimeDeliveryRate).toBe(3.0); // 92 - 89 = 3.0%
    });
  });

  // ==========================================================================
  // 7. MATHEMATICAL GEOMETRY & HAVERSINE VERIFICATION
  // ==========================================================================
  describe("Mathematical Haversine Verification", () => {
    it("computes accurate distance in meters between urban points", () => {
      // Bangalore MG Road to Brigade Road junction (~500m)
      const p1 = { latitude: 12.9738, longitude: 77.6094 };
      const p2 = { latitude: 12.9715, longitude: 77.6068 };

      const dist = calculateHaversineDistanceMeters(p1, p2);
      expect(dist).toBeGreaterThan(350);
      expect(dist).toBeLessThan(450);
    });
  });
});
