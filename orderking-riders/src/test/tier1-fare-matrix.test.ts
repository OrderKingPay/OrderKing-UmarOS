import { describe, it, expect } from "vitest";
import {
  paise,
  toPaise,
  fromPaise,
  formatPaise,
  assertNonNegativePaise,
  sumPaise,
  safeAdd,
  safeSubtract,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  MIN_DISTANCE_RATE_PER_KM_PAISE,
  MAX_DISTANCE_RATE_PER_KM_PAISE,
  SLAB_1_MAX_KM,
  SLAB_2_MAX_KM,
  SLAB_3_MAX_KM,
  SLAB_2_RATE_PER_KM_PAISE,
  SLAB_3_RATE_PER_KM_PAISE,
  SLAB_4_RATE_PER_KM_PAISE,
  LDO_THRESHOLD_KM,
  LDO_RETURN_BONUS_PAISE,
  PROGRESSIVE_DISTANCE_SLABS,
  calculateProgressiveDistancePay,
  CITY_TIER_PAY_CONFIGS,
  getBasePay,
  calculateDistancePay,
  calculateRestaurantWaitPay,
  calculateRestaurantWaitPayPaise,
  calculateWaitTimeMinutes,
  MAX_BILLABLE_WAIT_MINUTES,
  MAX_WAIT_PAY_PAISE,
  STACKED_PICKUP_FEE_PERCENTAGE,
  STACKED_DROP_FEE_PERCENTAGE,
  calculateStackedOrderPay,
  calculateStackedOrderPayPaise,
  getTier1WeeklyCycle,
  TIER1_PAYOUT_SETTLEMENT_DAY,
  TIER1_PAYOUT_SETTLEMENT_HOUR_UTC,
  TIER1_PAYOUT_SETTLEMENT_HOUR_IST,
  TIER1_PAYOUT_SETTLEMENT_TIME_IST,
  TIER1_PAYOUT_SETTLEMENT_SCHEDULE,
  calculateSurgePay,
  calculateCustomerTipPassThrough,
  calculateTier1AlgorithmicPayout,
  calculateRiderPayout,
  enforcePayoutFloor,
  RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  MIN_RAIN_SURGE_BONUS_PAISE,
  MAX_RAIN_SURGE_BONUS_PAISE,
  DEFAULT_RAIN_SURGE_BONUS_PAISE,
} from "../lib/rider/money.ts";
import {
  calculateDailyMilestoneProgress,
  calculateMultiDayTouchpointProgress,
  calculateCompositeSurge,
  STANDARD_DAILY_MILESTONES,
  TIER1_FULL_DAILY_MILESTONES,
  getWeeklyMarathonCycle,
} from "../lib/rider/gig-engine.ts";
import type { DynamicPricingConfig, PlatformConfig, ProgressiveDistanceSlabs } from "../lib/rider/types.ts";

describe("Tier-1 Fare Matrix & Algorithmic Payout Specialist Suite (Team Z1)", () => {
  describe("1. Base Pay (Pickup Fee + Drop Fee) by City Tier (Tier 1/2/3)", () => {
    it("Tier 1 Metros: ₹20 Pickup + ₹15 Drop = ₹35 Base Pay (3,500 paise)", () => {
      const tier1 = getBasePay("TIER_1");
      expect(tier1.pickupFeePaise).toBe(2000); // ₹20
      expect(tier1.dropFeePaise).toBe(1500); // ₹15
      expect(tier1.basePayPaise).toBe(3500); // ₹35
      expect(tier1.pickupFeePaise + tier1.dropFeePaise).toBe(tier1.basePayPaise);
      expect(tier1.floorPaise).toBe(3500);
      expect(tier1.ratePerKmPaise).toBe(1200); // ₹12/km
      expect(tier1.baseDistanceKm).toBe(2);
    });

    it("Tier 2 Growth Cities: ₹18 Pickup + ₹12 Drop = ₹30 Base Pay (3,000 paise)", () => {
      const tier2 = getBasePay("TIER_2");
      expect(tier2.pickupFeePaise).toBe(1800); // ₹18
      expect(tier2.dropFeePaise).toBe(1200); // ₹12
      expect(tier2.basePayPaise).toBe(3000); // ₹30
      expect(tier2.floorPaise).toBe(3000);
      expect(tier2.ratePerKmPaise).toBe(1100); // ₹11/km
    });

    it("Tier 3 Emerging Towns: ₹15 Pickup + ₹10 Drop = ₹25 Base Pay (2,500 paise)", () => {
      const tier3 = getBasePay("TIER_3");
      expect(tier3.pickupFeePaise).toBe(1500); // ₹15
      expect(tier3.dropFeePaise).toBe(1000); // ₹10
      expect(tier3.basePayPaise).toBe(2500); // ₹25
      expect(tier3.floorPaise).toBe(2500);
      expect(tier3.ratePerKmPaise).toBe(1000); // ₹10/km
    });

    it("defaults to Tier 1 when no tier specified", () => {
      const def = getBasePay();
      expect(def.tier).toBe("TIER_1");
      expect(def.basePayPaise).toBe(3500);
    });
  });

  describe("2. Progressive Distance Slabs (Slab 1: 0-2km ₹0, Slab 2: 2-5km ₹12/km, Slab 3: 5-8km ₹14/km, Slab 4: >8km ₹16/km + ₹20 LDO Bonus)", () => {
    it("confirms statutory progressive slab constants and thresholds", () => {
      expect(SLAB_1_MAX_KM).toBe(2.0);
      expect(SLAB_2_MAX_KM).toBe(5.0);
      expect(SLAB_3_MAX_KM).toBe(8.0);
      expect(SLAB_2_RATE_PER_KM_PAISE).toBe(1200); // ₹12.00/km
      expect(SLAB_3_RATE_PER_KM_PAISE).toBe(1400); // ₹14.00/km
      expect(SLAB_4_RATE_PER_KM_PAISE).toBe(1600); // ₹16.00/km
      expect(LDO_THRESHOLD_KM).toBe(8.0);
      expect(LDO_RETURN_BONUS_PAISE).toBe(2000); // ₹20.00 (2,000 paise) flat return bonus

      expect(PROGRESSIVE_DISTANCE_SLABS.SLAB_1.ratePerKmPaise).toBe(0);
      expect(PROGRESSIVE_DISTANCE_SLABS.SLAB_2.ratePerKmPaise).toBe(1200);
      expect(PROGRESSIVE_DISTANCE_SLABS.SLAB_3.ratePerKmPaise).toBe(1400);
      expect(PROGRESSIVE_DISTANCE_SLABS.SLAB_4.ratePerKmPaise).toBe(1600);
    });

    it("Slab 1 (0.0 to 2.0 km): Included in Base Pay (₹0 extra distance pay)", () => {
      const d0 = calculateProgressiveDistancePay(0);
      expect(d0.totalDistancePayPaise).toBe(0);
      expect(d0.slab1Km).toBe(0);

      const d15 = calculateProgressiveDistancePay(1.5);
      expect(d15.slab1Km).toBe(1.5);
      expect(d15.slab1PayPaise).toBe(0);
      expect(d15.totalDistancePayPaise).toBe(0);

      const d20 = calculateProgressiveDistancePay(2.0);
      expect(d20.slab1Km).toBe(2.0);
      expect(d20.slab1PayPaise).toBe(0);
      expect(d20.totalDistancePayPaise).toBe(0);
      expect(d20.isLdo).toBe(false);
    });

    it("Slab 2 (2.0 to 5.0 km): ₹12.00/km (1,200 paise/km)", () => {
      // 3.0 km -> 1.0 km in Slab 2 * 1200 paise = 1,200 paise (₹12.00)
      const d3 = calculateProgressiveDistancePay(3.0);
      expect(d3.slab1Km).toBe(2.0);
      expect(d3.slab2Km).toBe(1.0);
      expect(d3.slab2PayPaise).toBe(1200);
      expect(d3.slab3Km).toBe(0);
      expect(d3.slab4Km).toBe(0);
      expect(d3.totalDistancePayPaise).toBe(1200);

      // 4.5 km -> 2.5 km in Slab 2 * 1200 paise = 3,000 paise (₹30.00)
      const d45 = calculateProgressiveDistancePay(4.5);
      expect(d45.slab2Km).toBe(2.5);
      expect(d45.slab2PayPaise).toBe(3000);
      expect(d45.totalDistancePayPaise).toBe(3000);

      // 5.0 km -> full 3.0 km in Slab 2 * 1200 paise = 3,600 paise (₹36.00)
      const d5 = calculateProgressiveDistancePay(5.0);
      expect(d5.slab2Km).toBe(3.0);
      expect(d5.slab2PayPaise).toBe(3600);
      expect(d5.slab3Km).toBe(0);
      expect(d5.totalDistancePayPaise).toBe(3600);
      expect(d5.isLdo).toBe(false);
    });

    it("Slab 3 (5.0 to 8.0 km): ₹14.00/km (1,400 paise/km)", () => {
      // 6.5 km -> 3.0 km in Slab 2 (3,600 paise) + 1.5 km in Slab 3 (2,100 paise) = 5,700 paise (₹57.00)
      const d65 = calculateProgressiveDistancePay(6.5);
      expect(d65.slab2Km).toBe(3.0);
      expect(d65.slab2PayPaise).toBe(3600);
      expect(d65.slab3Km).toBe(1.5);
      expect(d65.slab3PayPaise).toBe(2100); // 1.5 * 1400 = 2100
      expect(d65.slab4Km).toBe(0);
      expect(d65.isLdo).toBe(false);
      expect(d65.totalDistancePayPaise).toBe(5700);

      // 7.0 km -> 3.0 km Slab 2 (3,600) + 2.0 km Slab 3 (2,800) = 6,400 paise (₹64.00)
      const d7 = calculateProgressiveDistancePay(7.0);
      expect(d7.slab2PayPaise).toBe(3600);
      expect(d7.slab3PayPaise).toBe(2800);
      expect(d7.totalDistancePayPaise).toBe(6400);

      // 8.0 km -> full 3.0 km Slab 2 (3,600) + full 3.0 km Slab 3 (4,200) = 7,800 paise (₹78.00)
      // Exactly 8.0 km is not > 8.0 km, so LDO bonus does not apply yet
      const d8 = calculateProgressiveDistancePay(8.0);
      expect(d8.slab2PayPaise).toBe(3600);
      expect(d8.slab3PayPaise).toBe(4200);
      expect(d8.slab4Km).toBe(0);
      expect(d8.isLdo).toBe(false);
      expect(d8.ldoBonusPaise).toBe(0);
      expect(d8.totalDistancePayPaise).toBe(7800);
    });

    it("Slab 4 (> 8.0 km - Long Distance Order / LDO): ₹16.00/km (1,600 paise/km) + ₹20.00 flat LDO return bonus", () => {
      // 10.0 km ->
      // Slab 2: 3.0 km * 1200 = 3,600 paise
      // Slab 3: 3.0 km * 1400 = 4,200 paise
      // Slab 4: 2.0 km * 1600 = 3,200 paise
      // LDO Bonus: ₹20.00 = 2,000 paise
      // Total Distance Pay = 3,600 + 4,200 + 3,200 + 2,000 = 13,000 paise (₹130.00)
      const d10 = calculateProgressiveDistancePay(10.0);
      expect(d10.slab2PayPaise).toBe(3600);
      expect(d10.slab3PayPaise).toBe(4200);
      expect(d10.slab4Km).toBe(2.0);
      expect(d10.slab4PayPaise).toBe(3200);
      expect(d10.isLdo).toBe(true);
      expect(d10.ldoBonusPaise).toBe(2000);
      expect(d10.totalDistancePayPaise).toBe(13000);

      // 12.0 km ->
      // Slab 2 (3600) + Slab 3 (4200) + Slab 4: 4.0 km * 1600 (6400) + LDO Bonus (2000) = 16,200 paise (₹162.00)
      const d12 = calculateProgressiveDistancePay(12.0);
      expect(d12.slab4Km).toBe(4.0);
      expect(d12.slab4PayPaise).toBe(6400);
      expect(d12.isLdo).toBe(true);
      expect(d12.ldoBonusPaise).toBe(2000);
      expect(d12.totalDistancePayPaise).toBe(16200);
    });

    it("integrates progressive distance pay with calculateRiderPayout when option is enabled", () => {
      // With progressive slabs enabled:
      // 10.0 km -> Base ₹35 (3,500 paise) + 13,000 paise distance pay = 16,500 paise (₹165.00)
      expect(calculateRiderPayout(10.0, { useProgressiveSlabs: true })).toBe(16500);
      expect(calculateRiderPayout(10.0, undefined, undefined, true)).toBe(16500);

      // 3.0 km with progressive: Base 3500 + 1200 = 4,700 paise
      expect(calculateRiderPayout(3.0, { useProgressiveSlabs: true })).toBe(4700);

      // 5.0 km with progressive: Base 3500 + 3600 = 7,100 paise
      expect(calculateRiderPayout(5.0, { useProgressiveSlabs: true })).toBe(7100);

      // Preserves legacy flat rate default for statutory backwards compatibility
      expect(calculateRiderPayout(10.0)).toBe(13100);
    });
  });

  describe("3. Stacked / Multi-Package Order Pay: 60% Tier Pickup Fee + 100% Tier Drop Fee", () => {
    it("confirms 60% pickup and 100% drop fee policy percentages", () => {
      expect(STACKED_PICKUP_FEE_PERCENTAGE).toBe(60);
      expect(STACKED_DROP_FEE_PERCENTAGE).toBe(100);
    });

    it("Tier 1 Metros: 60% of ₹20 (1200 paise) + 100% of ₹15 (1500 paise) = ₹27.00 (2,700 paise) per secondary order", () => {
      const stackedT1 = calculateStackedOrderPay(1, "TIER_1");
      expect(stackedT1.tierPickupFeePaise).toBe(2000);
      expect(stackedT1.tierDropFeePaise).toBe(1500);
      expect(stackedT1.stackedPickupFeePaise).toBe(1200); // 60% of 2000
      expect(stackedT1.stackedDropFeePaise).toBe(1500); // 100% of 1500
      expect(stackedT1.payPerSecondaryOrderPaise).toBe(2700);
      expect(stackedT1.totalStackedOrderPayPaise).toBe(2700);
      expect(calculateStackedOrderPayPaise(1, "TIER_1")).toBe(2700);
    });

    it("Tier 2 Growth Cities: 60% of ₹18 (1080 paise) + 100% of ₹12 (1200 paise) = ₹22.80 (2,280 paise) per secondary order", () => {
      const stackedT2 = calculateStackedOrderPay(1, "TIER_2");
      expect(stackedT2.stackedPickupFeePaise).toBe(1080); // 60% of 1800
      expect(stackedT2.stackedDropFeePaise).toBe(1200); // 100% of 1200
      expect(stackedT2.payPerSecondaryOrderPaise).toBe(2280);
      expect(stackedT2.totalStackedOrderPayPaise).toBe(2280);
      expect(calculateStackedOrderPayPaise(1, "TIER_2")).toBe(2280);
    });

    it("Tier 3 Emerging Towns: 60% of ₹15 (900 paise) + 100% of ₹10 (1000 paise) = ₹19.00 (1,900 paise) per secondary order", () => {
      const stackedT3 = calculateStackedOrderPay(1, "TIER_3");
      expect(stackedT3.stackedPickupFeePaise).toBe(900); // 60% of 1500
      expect(stackedT3.stackedDropFeePaise).toBe(1000); // 100% of 1000
      expect(stackedT3.payPerSecondaryOrderPaise).toBe(1900);
      expect(stackedT3.totalStackedOrderPayPaise).toBe(1900);
      expect(calculateStackedOrderPayPaise(1, "TIER_3")).toBe(1900);
    });

    it("multiplies correctly for batches with multiple secondary orders", () => {
      // 3 secondary orders in Tier 1 -> 3 * 2,700 = 8,100 paise (₹81.00)
      const triple = calculateStackedOrderPay(3, "TIER_1");
      expect(triple.secondaryOrderCount).toBe(3);
      expect(triple.totalStackedOrderPayPaise).toBe(8100);

      // 0 secondary orders -> 0 paise
      expect(calculateStackedOrderPay(0, "TIER_1").totalStackedOrderPayPaise).toBe(0);
      expect(calculateStackedOrderPay(-1, "TIER_1").totalStackedOrderPayPaise).toBe(0);
    });
  });

  describe("4. Restaurant Wait-Time Pay: EXACTLY ₹1/minute with MAX_BILLABLE_WAIT_MINUTES = 30 Safety Cap", () => {
    it("confirms 6-minute grace period, ₹1/min rate, and 30-minute safety cap constants", () => {
      expect(RESTAURANT_WAIT_GRACE_PERIOD_MINUTES).toBe(6);
      expect(RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE).toBe(100); // 100 paise = ₹1.00
      expect(MAX_BILLABLE_WAIT_MINUTES).toBe(30);
      expect(MAX_WAIT_PAY_PAISE).toBe(3000); // ₹30.00 (3,000 paise)
    });

    it("pays 0 during the initial 6-minute grace period", () => {
      expect(calculateRestaurantWaitPayPaise(0)).toBe(0);
      expect(calculateRestaurantWaitPayPaise(3)).toBe(0);
      expect(calculateRestaurantWaitPayPaise(5)).toBe(0);
      expect(calculateRestaurantWaitPayPaise(6)).toBe(0);
    });

    it("pays EXACTLY ₹1/min (100 paise) for uncapped wait times", () => {
      // 7 mins: 1 min billable -> 100 paise (₹1)
      const w7 = calculateRestaurantWaitPay(7);
      expect(w7.billableWaitMinutes).toBe(1);
      expect(w7.isCapped).toBe(false);
      expect(w7.waitPayPaise).toBe(100);

      // 10 mins: 4 mins billable -> 400 paise (₹4)
      const w10 = calculateRestaurantWaitPay(10);
      expect(w10.billableWaitMinutes).toBe(4);
      expect(w10.isCapped).toBe(false);
      expect(w10.waitPayPaise).toBe(400);

      // 16 mins: 10 mins billable -> 1000 paise (₹10)
      const w16 = calculateRestaurantWaitPay(16);
      expect(w16.billableWaitMinutes).toBe(10);
      expect(w16.isCapped).toBe(false);
      expect(w16.waitPayPaise).toBe(1000);

      // 36 mins: 30 mins billable -> exactly 3000 paise (₹30) at boundary
      const w36 = calculateRestaurantWaitPay(36);
      expect(w36.billableWaitMinutes).toBe(30);
      expect(w36.isCapped).toBe(false);
      expect(w36.waitPayPaise).toBe(3000);
    });

    it("enforces safety cap at MAX_BILLABLE_WAIT_MINUTES = 30 (cap at ₹30.00 / 3,000 paise) to eliminate runaway liability", () => {
      // 45 mins wait: 45 - 6 = 39 raw billable mins -> capped at 30 mins (3,000 paise)
      const w45 = calculateRestaurantWaitPay(45);
      expect(w45.totalWaitMinutes).toBe(45);
      expect(w45.rawBillableWaitMinutes).toBe(39);
      expect(w45.billableWaitMinutes).toBe(30);
      expect(w45.isCapped).toBe(true);
      expect(w45.waitPayPaise).toBe(3000); // Strictly capped at ₹30.00
      expect(calculateRestaurantWaitPayPaise(45)).toBe(3000);

      // 90 mins wait: 90 - 6 = 84 raw billable mins -> capped at 30 mins (3,000 paise)
      const w90 = calculateRestaurantWaitPay(90);
      expect(w90.billableWaitMinutes).toBe(30);
      expect(w90.isCapped).toBe(true);
      expect(w90.waitPayPaise).toBe(3000);
      expect(calculateRestaurantWaitPayPaise(90)).toBe(3000);

      // 180 mins runaway wait: still capped at 30 mins
      expect(calculateRestaurantWaitPayPaise(180)).toBe(3000);
    });

    it("calculates wait time correctly from timestamps and applies safety cap", () => {
      const arrived = "2026-10-14T19:00:00.000Z";
      const pickedUp = "2026-10-14T19:16:00.000Z"; // 16 minutes later
      const waitMins = calculateWaitTimeMinutes(arrived, pickedUp);
      expect(waitMins).toBe(16);

      const waitPay = calculateRestaurantWaitPayPaise(waitMins);
      expect(waitPay).toBe(1000); // 16 - 6 = 10 mins * 100 paise = ₹10
    });
  });

  describe("5. Tier-1 Weekly Payout Cycle (Mon 00:00:00 - Sun 23:59:59 with Automated Wednesday Afternoon Settlement)", () => {
    it("confirms Wednesday settlement day and hour constants", () => {
      expect(TIER1_PAYOUT_SETTLEMENT_DAY).toBe("WEDNESDAY");
      expect(TIER1_PAYOUT_SETTLEMENT_HOUR_UTC).toBe(15); // 3:00 PM UTC
      expect(TIER1_PAYOUT_SETTLEMENT_HOUR_IST).toBe(14); // 2:00 PM IST
      expect(TIER1_PAYOUT_SETTLEMENT_TIME_IST).toBe("14:00");
      expect(TIER1_PAYOUT_SETTLEMENT_SCHEDULE).toBe("Wednesday 2:00 PM IST");
    });

    it("correctly identifies cycle window and payout date for mid-week date (Wednesday)", () => {
      // 2026-10-14 is a Wednesday
      const cycle = getTier1WeeklyCycle("2026-10-14T12:00:00.000Z");

      // Cycle Start: Monday 2026-10-12 00:00:00.000Z
      expect(cycle.cycleStart.getUTCDay()).toBe(1); // Monday
      expect(cycle.cycleStart.toISOString()).toBe("2026-10-12T00:00:00.000Z");

      // Cycle End: Sunday 2026-10-18 23:59:59.999Z
      expect(cycle.cycleEnd.getUTCDay()).toBe(0); // Sunday
      expect(cycle.cycleEnd.toISOString()).toBe("2026-10-18T23:59:59.999Z");

      // Payout Date: Following Wednesday 2026-10-21 15:00:00.000Z (afternoon settlement)
      expect(cycle.payoutDate.getUTCDay()).toBe(3); // Wednesday
      expect(cycle.payoutDate.toISOString()).toBe("2026-10-21T15:00:00.000Z");
      expect(cycle.formattedCycle).toBe("2026-10-12 to 2026-10-18");
      expect(cycle.settlementDay).toBe("WEDNESDAY");
      expect(cycle.settlementTimeIst).toBe("14:00 IST (2:00 PM IST)");
      expect(cycle.settlementSchedule).toBe("Wednesday 2:00 PM IST");
    });

    it("correctly places Sunday orders in the concluding week cycle", () => {
      // Sunday 2026-10-18 at 22:30 UTC
      const cycle = getTier1WeeklyCycle("2026-10-18T22:30:00.000Z");
      expect(cycle.cycleStart.toISOString()).toBe("2026-10-12T00:00:00.000Z");
      expect(cycle.cycleEnd.toISOString()).toBe("2026-10-18T23:59:59.999Z");
      expect(cycle.payoutDate.toISOString()).toBe("2026-10-21T15:00:00.000Z");
    });

    it("correctly rolls over to new cycle on Monday morning", () => {
      // Monday 2026-10-19 at 08:00 UTC
      const cycle = getTier1WeeklyCycle("2026-10-19T08:00:00.000Z");
      expect(cycle.cycleStart.toISOString()).toBe("2026-10-19T00:00:00.000Z");
      expect(cycle.cycleEnd.toISOString()).toBe("2026-10-25T23:59:59.999Z");
      expect(cycle.payoutDate.toISOString()).toBe("2026-10-28T15:00:00.000Z");
    });

    it("integrates seamlessly with gig-engine getWeeklyMarathonCycle", () => {
      const marathonCycle = getWeeklyMarathonCycle("2026-10-14T12:00:00.000Z");
      expect(marathonCycle.cycleStartIso).toBe("2026-10-12T00:00:00.000Z");
      expect(marathonCycle.payoutDateIso).toBe("2026-10-21T15:00:00.000Z");
    });
  });

  describe("6. Rain Surge & Peak Hour Pay: Dynamic Multiplier (₹10 - ₹45 Surge Bonus)", () => {
    it("applies dynamic peak hour multiplier to base & distance pay", () => {
      // Base + Distance = ₹50 (5,000 paise). Multiplier = 1.3x -> +₹15 (1,500 paise)
      const surge = calculateSurgePay({
        baseAndDistancePaise: 5000,
        peakMultiplier: 1.3,
        isRainSurge: false,
      });
      expect(surge.peakMultiplierBoostPaise).toBe(1500);
      expect(surge.rainSurgeBonusPaise).toBe(0);
      expect(surge.totalSurgePaise).toBe(1500);
    });

    it("applies rain surge bonus within ₹10 - ₹45 range", () => {
      // Default rain surge = ₹25 (2,500 paise)
      const defRain = calculateSurgePay({
        baseAndDistancePaise: 4000,
        isRainSurge: true,
      });
      expect(defRain.rainSurgeBonusPaise).toBe(DEFAULT_RAIN_SURGE_BONUS_PAISE); // 2500 paise
      expect(defRain.totalSurgePaise).toBe(2500);

      // Custom ₹35 rain surge
      const customRain = calculateSurgePay({
        baseAndDistancePaise: 4000,
        isRainSurge: true,
        rainSurgeBonusPaise: 3500,
      });
      expect(customRain.rainSurgeBonusPaise).toBe(3500);

      // Combined peak multiplier 1.25x + ₹30 rain surge
      const combo = calculateSurgePay({
        baseAndDistancePaise: 4000,
        peakMultiplier: 1.25,
        isRainSurge: true,
        rainSurgeBonusPaise: 3000,
      });
      expect(combo.peakMultiplierBoostPaise).toBe(1000); // 4000 * 0.25 = 1000
      expect(combo.rainSurgeBonusPaise).toBe(3000);
      expect(combo.totalSurgePaise).toBe(4000); // 1000 + 3000 = 4000 paise
    });

    it("clamps rain surge bonus between MIN (₹10) and MAX (₹45)", () => {
      expect(MIN_RAIN_SURGE_BONUS_PAISE).toBe(1000);
      expect(MAX_RAIN_SURGE_BONUS_PAISE).toBe(4500);

      const tooLow = calculateSurgePay({
        baseAndDistancePaise: 3500,
        isRainSurge: true,
        rainSurgeBonusPaise: 500,
      });
      expect(tooLow.rainSurgeBonusPaise).toBe(1000); // clamped to ₹10

      const tooHigh = calculateSurgePay({
        baseAndDistancePaise: 3500,
        isRainSurge: true,
        rainSurgeBonusPaise: 8000,
      });
      expect(tooHigh.rainSurgeBonusPaise).toBe(4500); // clamped to ₹45
    });
  });

  describe("7. Customer Tips: 100% Direct Pass-Through with Zero Platform Deductions", () => {
    it("passes through 100% of customer tips with zero deductions", () => {
      const tip1 = calculateCustomerTipPassThrough(3000); // ₹30
      expect(tip1.grossTipPaise).toBe(3000);
      expect(tip1.platformDeductionPaise).toBe(0);
      expect(tip1.netTipPassThroughPaise).toBe(3000);
      expect(tip1.passThroughPercentage).toBe(100);

      const tip2 = calculateCustomerTipPassThrough(10000); // ₹100
      expect(tip2.netTipPassThroughPaise).toBe(10000);
      expect(tip2.platformDeductionPaise).toBe(0);
    });

    it("handles zero and negative tips safely", () => {
      expect(calculateCustomerTipPassThrough(0).netTipPassThroughPaise).toBe(0);
      expect(calculateCustomerTipPassThrough(-500).netTipPassThroughPaise).toBe(0);
    });
  });

  describe("8. Daily Milestones & Multi-Day Touchpoint Targets", () => {
    it("evaluates Tier-1 daily milestones ladder (4, 8, 12, 16, 20 orders)", () => {
      expect(STANDARD_DAILY_MILESTONES).toHaveLength(4);
      expect(TIER1_FULL_DAILY_MILESTONES).toHaveLength(5);
      expect(TIER1_FULL_DAILY_MILESTONES[4]).toEqual({ orders: 20, bonusPaise: 60000, label: "₹600" });

      const p20 = calculateDailyMilestoneProgress(20, TIER1_FULL_DAILY_MILESTONES);
      expect(p20.unlockedBonusPaise).toBe(60000); // ₹600
      expect(p20.nextMilestone).toBeNull();
      expect(p20.progressPct).toBe(100);
    });

    it("evaluates 3-day Weekend Sprint touchpoint targets (25, 40, 60 orders)", () => {
      const sprint = calculateMultiDayTouchpointProgress(42, "WEEKEND_3_DAY");
      expect(sprint.cadence).toBe("WEEKEND_3_DAY");
      expect(sprint.unlockedBonusPaise).toBe(100000); // ₹1,000 for 40 orders
      expect(sprint.activeTarget?.requiredOrders).toBe(60);
      expect(sprint.remainingToNext).toBe(18);
    });

    it("evaluates 7-day Weekly Marathon touchpoint targets (50, 80, 110 orders)", () => {
      const marathon = calculateMultiDayTouchpointProgress(85, "WEEKLY_7_DAY");
      expect(marathon.cadence).toBe("WEEKLY_7_DAY");
      expect(marathon.unlockedBonusPaise).toBe(240000); // ₹2,400 for 80 orders
      expect(marathon.activeTarget?.requiredOrders).toBe(110);
      expect(marathon.remainingToNext).toBe(25);
    });
  });

  describe("9. Master Tier-1 Algorithmic Payout Integration & Integer Paise Arithmetic", () => {
    it("calculates complex scenario with 100% precision in integer paise (Progressive Slabs + Stacked Standard)", () => {
      // Scenario:
      // City: Tier 1 Metro (Bangalore)
      // Route: 4.5 km (Slab 2: 2.5 km * ₹12 = 3000 paise)
      // Kitchen Wait: 16 minutes (10 billable mins after 6m grace = 1000 paise)
      // Weather: Heavy Rain (+₹30 rain surge = 3000 paise)
      // Hour: Peak dinner (1.20x multiplier -> 6500 * 0.20 = 1300 paise boost)
      // Tip: ₹50 from generous customer (5000 paise direct pass-through)
      // Packages: 2 packages -> 1 secondary order (60% pickup ₹12 + 100% drop ₹15 = ₹27 / 2700 paise)
      const payout = calculateTier1AlgorithmicPayout({
        distanceKm: 4.5,
        cityTier: "TIER_1",
        waitMinutes: 16,
        isRainSurge: true,
        rainSurgeBonusPaise: 3000, // ₹30
        peakMultiplier: 1.20,
        customerTipPaise: 5000, // ₹50
        packageCount: 2,
      });

      // 1. Base Pay
      expect(payout.pickupFeePaise).toBe(2000); // ₹20
      expect(payout.dropFeePaise).toBe(1500); // ₹15
      expect(payout.basePayPaise).toBe(3500); // ₹35

      // 2. Distance Pay: 4.5 km in Slab 2 -> 2.5 km * ₹12 = 3,000 paise (₹30)
      expect(payout.billableExtraKm).toBe(2.5);
      expect(payout.distancePayPaise).toBe(3000);
      expect(payout.baseAndDistancePaise).toBe(6500); // ₹65
      expect(payout.isLdo).toBe(false);

      // 3. Wait Pay: 16 - 6 = 10 billable mins * ₹1 = ₹10 (1,000 paise)
      expect(payout.billableWaitMinutes).toBe(10);
      expect(payout.waitTimePayPaise).toBe(1000);
      expect(payout.isWaitCapped).toBe(false);

      // 4. Surge:
      // Peak boost: 6500 * 0.20 = 1300 paise
      // Rain bonus: 3000 paise
      // Total surge = 4300 paise
      expect(payout.peakMultiplierBoostPaise).toBe(1300);
      expect(payout.rainSurgeBonusPaise).toBe(3000);
      expect(payout.totalSurgePaise).toBe(4300);

      // 5. Stacked / Multi-Package Order Pay:
      // 1 secondary order: 60% of ₹20 (1200) + 100% of ₹15 (1500) = 2,700 paise (₹27.00)
      expect(payout.secondaryOrderCount).toBe(1);
      expect(payout.stackedOrderPayPaise).toBe(2700);
      expect(payout.multiPackageBonusPaise).toBe(2700);

      // 6. Subtotal before tip:
      // Base & Distance (6500) + Wait (1000) + Surge (4300) + Stacked (2700) = 14,500 paise (₹145.00)
      expect(payout.subtotalBeforeTipPaise).toBe(14500);

      // 7. Tip: 5000 paise (100% pass-through)
      expect(payout.customerTipPaise).toBe(5000);

      // 8. Total Payout = 14500 + 5000 = 19,500 paise (₹195.00)
      expect(payout.totalPayoutPaise).toBe(19500);

      // Assert all components are strictly integers (no floating currency drift)
      const numericFields = [
        payout.pickupFeePaise,
        payout.dropFeePaise,
        payout.basePayPaise,
        payout.distancePayPaise,
        payout.waitTimePayPaise,
        payout.totalSurgePaise,
        payout.stackedOrderPayPaise,
        payout.customerTipPaise,
        payout.totalPayoutPaise,
      ];
      for (const val of numericFields) {
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it("calculates Long Distance Order (LDO > 8.0 km) with Wait Safety Cap (45 mins) and Triple Stack", () => {
      // Scenario:
      // City: Tier 1 Metro
      // Route: 10.0 km (LDO order)
      // - Slab 1 (0-2km): 0
      // - Slab 2 (2-5km): 3.0 * 1200 = 3600 paise
      // - Slab 3 (5-8km): 3.0 * 1400 = 4200 paise
      // - Slab 4 (>8km): 2.0 * 1600 = 3200 paise
      // - LDO Return Bonus: 2000 paise
      // Total Distance Pay: 13,000 paise (₹130.00)
      // Kitchen Wait: 45 minutes -> 39 mins raw -> capped at 30 mins = 3,000 paise (₹30.00)
      // Packages: 3 packages -> 2 secondary orders -> 2 * 2700 = 5,400 paise (₹54.00)
      // Base Pay: 3,500 paise
      // Subtotal before tip: 3500 + 13000 + 3000 + 5400 = 24,900 paise (₹249.00)
      // Tip: ₹40 (4000 paise)
      // Total Payout: 28,900 paise (₹289.00)
      const ldoPayout = calculateTier1AlgorithmicPayout({
        distanceKm: 10.0,
        cityTier: "TIER_1",
        waitMinutes: 45,
        packageCount: 3,
        customerTipPaise: 4000,
      });

      expect(ldoPayout.isLdo).toBe(true);
      expect(ldoPayout.ldoBonusPaise).toBe(2000);
      expect(ldoPayout.distancePayPaise).toBe(13000);

      expect(ldoPayout.isWaitCapped).toBe(true);
      expect(ldoPayout.billableWaitMinutes).toBe(30);
      expect(ldoPayout.waitTimePayPaise).toBe(3000);

      expect(ldoPayout.secondaryOrderCount).toBe(2);
      expect(ldoPayout.stackedOrderPayPaise).toBe(5400);

      expect(ldoPayout.subtotalBeforeTipPaise).toBe(24900);
      expect(ldoPayout.totalPayoutPaise).toBe(28900);
    });

    it("guarantees statutory ₹35 floor even when route is short (0.5 km) with 0 wait and 0 tip", () => {
      const payout = calculateTier1AlgorithmicPayout({
        distanceKm: 0.5,
        cityTier: "TIER_1",
        waitMinutes: 2,
      });
      expect(payout.basePayPaise).toBe(3500);
      expect(payout.distancePayPaise).toBe(0);
      expect(payout.waitTimePayPaise).toBe(0);
      expect(payout.totalPayoutPaise).toBe(3500); // Floor strictly enforced
    });

    it("maintains 100% backwards compatibility for legacy calculateRiderPayout", () => {
      expect(calculateRiderPayout(0)).toBe(3500);
      expect(calculateRiderPayout(2.0)).toBe(3500);
      expect(calculateRiderPayout(3.0)).toBe(4700);
      expect(calculateRiderPayout(4.5)).toBe(6500);
      expect(calculateRiderPayout(5.0)).toBe(7100);
      expect(calculateRiderPayout(10.0)).toBe(13100);
    });

    it("formats paise currency beautifully with Indian comma grouping", () => {
      expect(formatPaise(3500)).toBe("₹35.00");
      expect(formatPaise(17300)).toBe("₹173.00");
      expect(formatPaise(125000)).toBe("₹1,250.00");
    });
  });

  describe("10. Dynamic Central Pricing Ingestion & Algorithmic Knobs (HDmaster UmarOS Parity)", () => {
    it("honors dynamic tier base floor and pickup/drop fee overrides in getBasePay", () => {
      const dynamicConfig: Partial<DynamicPricingConfig> = {
        tier1BaseFloorPaise: 4000,
        tier2BaseFloorPaise: 3300,
        tier3BaseFloorPaise: 2700,
        pickupFeePaise: 2200,
        dropFeePaise: 1800,
        defaultRatePerKmPaise: 1300,
      };

      const tier1 = getBasePay("TIER_1", dynamicConfig);
      expect(tier1.pickupFeePaise).toBe(2200);
      expect(tier1.dropFeePaise).toBe(1800);
      expect(tier1.basePayPaise).toBe(4000);
      expect(tier1.floorPaise).toBe(4000);
      expect(tier1.ratePerKmPaise).toBe(1300);

      const tier2 = getBasePay("TIER_2", dynamicConfig);
      expect(tier2.floorPaise).toBe(3300);

      const tier3 = getBasePay("TIER_3", dynamicConfig);
      expect(tier3.floorPaise).toBe(2700);
    });

    it("honors dynamic progressive distance slabs and LDO bonus in calculateDistancePay", () => {
      const dynamicSlabs: ProgressiveDistanceSlabs = {
        slab1RatePerKmPaise: 1300,
        slab2RatePerKmPaise: 1500,
        slab3RatePerKmPaise: 1800,
        ldoBonusPaise: 2500,
      };

      // 10.0 km route:
      // Slab 1 (0-2km): 0
      // Slab 2 (2-5km): 3.0 * 1300 = 3900 paise
      // Slab 3 (5-8km): 3.0 * 1500 = 4500 paise
      // Slab 4 (>8km): 2.0 * 1800 = 3600 paise
      // LDO Bonus: 2500 paise
      // Total: 3900 + 4500 + 3600 + 2500 = 14500 paise
      const pay = calculateDistancePay(10.0, undefined, undefined, dynamicSlabs);
      expect(pay.totalDistanceKm).toBe(10.0);
      expect(pay.billableExtraKm).toBe(8.0);
      expect(pay.distancePayPaise).toBe(14500);
      expect(pay.ldoBonusPaise).toBe(2500);
    });

    it("honors dynamic wait grace, wait rate, and wait cap in calculateRestaurantWaitPayPaise", () => {
      // 25 mins total wait with 5m grace, ₹1.20/min (120 paise), capped at ₹18.00 (1800 paise)
      // Billable mins: 25 - 5 = 20 mins.
      // Raw: 20 * 120 = 2400 paise -> capped at 1800 paise.
      const waitPay = calculateRestaurantWaitPayPaise(25, 5, 120, 30, 1800);
      expect(waitPay).toBe(1800);

      // Without exceeding cap: 10 mins wait -> 5 billable mins * 120 = 600 paise
      const belowCapPay = calculateRestaurantWaitPayPaise(10, 5, 120, 30, 1800);
      expect(belowCapPay).toBe(600);
    });

    it("honors dynamic pricing configuration end-to-end in calculateTier1AlgorithmicPayout", () => {
      const dynamicConfig: DynamicPricingConfig = {
        cityTier: "TIER_1",
        tier1BaseFloorPaise: 4000,
        tier2BaseFloorPaise: 3300,
        tier3BaseFloorPaise: 2700,
        pickupFeePaise: 2200,
        dropFeePaise: 1800,
        defaultRatePerKmPaise: 1300,
        waitGraceMinutes: 5,
        waitRatePerMinPaise: 150,
        waitCapPaise: 2000,
        distanceSlabs: {
          slab1RatePerKmPaise: 1300,
          slab2RatePerKmPaise: 1500,
          slab3RatePerKmPaise: 1800,
          ldoBonusPaise: 2500,
        },
        floatingCashLimitInr: 2000,
        coolingOffDurationMinutes: 15,
        payoutCycleDay: "Wednesday",
        kingAiAutonomousResolution: true,
      };

      const payout = calculateTier1AlgorithmicPayout({
        distanceKm: 10.0,
        cityTier: "TIER_1",
        waitMinutes: 20,
        dynamicConfig,
      });

      // Base: 2200 + 1800 = 4000 paise
      expect(payout.basePayPaise).toBe(4000);
      expect(payout.floorPaise).toBe(4000);

      // Distance: 3900 + 4500 + 3600 + 2500 = 14500 paise
      expect(payout.distancePayPaise).toBe(14500);
      expect(payout.ldoBonusPaise).toBe(2500);
      expect(payout.isLdo).toBe(true);

      // Wait: (20 - 5) * 150 = 2250 -> capped at 2000 paise
      expect(payout.waitTimePayPaise).toBe(2000);
      expect(payout.isWaitCapped).toBe(true);

      // Total: 4000 + 14500 + 2000 = 20500 paise (₹205.00)
      expect(payout.subtotalBeforeTipPaise).toBe(20500);
      expect(payout.totalPayoutPaise).toBe(20500);
    });

    it("seamlessly unwraps PlatformConfig objects with nested pricing across all payout calculation methods", () => {
      const dynamicConfig: DynamicPricingConfig = {
        cityTier: "TIER_1",
        tier1BaseFloorPaise: 4200,
        tier2BaseFloorPaise: 3500,
        tier3BaseFloorPaise: 2800,
        pickupFeePaise: 2400,
        dropFeePaise: 1800,
        defaultRatePerKmPaise: 1350,
        waitGraceMinutes: 5,
        waitRatePerMinPaise: 120,
        waitCapPaise: 2400,
        distanceSlabs: {
          slab1RatePerKmPaise: 1250,
          slab2RatePerKmPaise: 1450,
          slab3RatePerKmPaise: 1700,
          ldoBonusPaise: 2200,
        },
        floatingCashLimitInr: 2500,
        coolingOffDurationMinutes: 20,
        payoutCycleDay: "Wednesday",
        kingAiAutonomousResolution: true,
      };

      const platformSettings = {
        pricing: dynamicConfig,
      } as PlatformConfig;

      // 1. getBasePay seamlessly extracts from PlatformConfig
      const basePay = getBasePay("TIER_1", platformSettings);
      expect(basePay.pickupFeePaise).toBe(2400);
      expect(basePay.dropFeePaise).toBe(1800);
      expect(basePay.basePayPaise).toBe(4200);
      expect(basePay.floorPaise).toBe(4200);
      expect(basePay.ratePerKmPaise).toBe(1350);

      // 2. calculateDistancePay seamlessly extracts from PlatformConfig (2nd param or 4th param)
      const distFromConfig = calculateDistancePay(10.0, platformSettings);
      expect(distFromConfig.distancePayPaise).toBe(
        3.0 * 1250 + 3.0 * 1450 + 2.0 * 1700 + 2200 // 3750 + 4350 + 3400 + 2200 = 13700
      );
      expect(distFromConfig.ldoBonusPaise).toBe(2200);

      // 3. calculateRestaurantWaitPayPaise seamlessly extracts from PlatformConfig
      const waitFromConfig = calculateRestaurantWaitPayPaise(25, platformSettings);
      // (25 - 5) * 120 = 2400 (matches cap exactly)
      expect(waitFromConfig).toBe(2400);

      const waitCapped = calculateRestaurantWaitPayPaise(35, platformSettings);
      // (35 - 5) * 120 = 3600 -> capped at 2400
      expect(waitCapped).toBe(2400);

      // 4. calculateTier1AlgorithmicPayout seamlessly handles PlatformConfig
      const fullPayout = calculateTier1AlgorithmicPayout({
        distanceKm: 10.0,
        cityTier: "TIER_1",
        waitMinutes: 25,
        dynamicConfig: platformSettings,
      });
      // Base: 4200, Distance: 13700, Wait: 2400
      expect(fullPayout.basePayPaise).toBe(4200);
      expect(fullPayout.distancePayPaise).toBe(13700);
      expect(fullPayout.waitTimePayPaise).toBe(2400);
      expect(fullPayout.totalPayoutPaise).toBe(4200 + 13700 + 2400); // 20300 paise
    });

    it("seamlessly handles ProgressiveDistanceConfig key conventions (slab2, slab3, slab4)", () => {
      const progConfig = {
        slab2RatePerKmPaise: 1250,
        slab3RatePerKmPaise: 1450,
        slab4RatePerKmPaise: 1700,
        ldoBonusPaise: 2200,
      };

      const distPay = calculateDistancePay(10.0, undefined, undefined, progConfig);
      // Slab 1 (0-2km): 0
      // Slab 2 (2-5km): 3.0 * 1250 = 3750 paise
      // Slab 3 (5-8km): 3.0 * 1450 = 4350 paise
      // Slab 4 (>8km): 2.0 * 1700 = 3400 paise
      // LDO Bonus: 2200 paise
      // Total: 3750 + 4350 + 3400 + 2200 = 13700 paise
      expect(distPay.distancePayPaise).toBe(13700);
      expect(distPay.ldoBonusPaise).toBe(2200);
    });
  });
});
