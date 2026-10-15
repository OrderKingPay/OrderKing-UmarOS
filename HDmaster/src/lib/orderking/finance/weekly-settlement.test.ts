import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  getWeeklyCycle,
  getExpressDailyCycle,
  calculateRestaurantWeeklySettlement,
  calculateRestaurantDualCycleSettlement,
  calculateRiderWeeklySettlement,
} from "./weekly-settlement.ts";

describe("Tier-1 Legacy Market Leader Dual Settlement Cycle & Statutory Formula", () => {
  test("generates Monday to Sunday cycle with Wednesday payout for Standard Cycle", () => {
    // Wednesday 2026-09-16 reference date
    const cycle = getWeeklyCycle(new Date("2026-09-16T12:00:00Z"));
    assert.ok(cycle.cycleId.includes("cycle_"));
    assert.ok(cycle.startDate);
    assert.ok(cycle.endDate);
    assert.ok(cycle.payoutDate);
    // Payout date is exactly 3 days after Sunday (Wednesday)
    const end = new Date(cycle.endDate);
    const payout = new Date(cycle.payoutDate);
    const diffDays = Math.round((payout.getTime() - end.getTime()) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 3);
  });

  test("generates Express Daily Cycle (T+1) for yesterday's orders", () => {
    const ref = new Date("2026-10-15T10:00:00Z");
    const cycle = getExpressDailyCycle(ref);
    assert.ok(cycle.cycleId.includes("cycle_express_"));
    assert.equal(cycle.earlyLiquidityFeeBps, 50); // 0.5% fee
    assert.ok(cycle.startDate);
    assert.ok(cycle.payoutDate);
  });

  test("calculates restaurant statement with statutory GST, TCS, TDS, and Section 9(5)", () => {
    const cycle = getWeeklyCycle();
    // 50,000 INR food sales (5,000,000 paise), 2,000 INR restaurant discount (200,000 paise)
    const result = calculateRestaurantWeeklySettlement({
      restaurantId: "rest_1",
      restaurantName: "Biryani House",
      cycle,
      deliveredOrdersCount: 120,
      grossSalesPaise: 5_000_000,
      restaurantDiscountsPaise: 200_000,
      packagingChargesPaise: 50_000,
      platformReimbursementsPaise: 30_000,
      commissionBps: 1200, // 12%
      pgFeeBps: 180,       // 1.8%
    });

    // Net food sales = 50,000 - 2,000 = 48,000 INR (4,800,000 paise)
    assert.equal(result.netFoodSalesPaise, 4_800_000);
    // Commission = 12% of 4,800,000 = 576,000 paise (5,760 INR)
    assert.equal(result.platformCommissionPaise, 576_000);
    // GST on commission = 18% of 576,000 = 103,680 paise (1,036.80 INR)
    assert.equal(result.gstOnCommissionPaise, 103_680);
    // TCS 1% on net food = 48,000 paise (480 INR)
    assert.equal(result.tcsDeductionPaise, 48_000);
    // TDS 1% on net food = 48,000 paise (480 INR)
    assert.equal(result.tdsDeductionPaise, 48_000);
    // Section 9(5) 5% GST = 240,000 paise (2,400 INR) remitted by OrderKing
    assert.equal(result.sec9_5FoodGstPaise, 240_000);
    // Net payable must be positive and less than gross sales
    assert.ok(result.netPayablePaise > 0);
    assert.ok(result.netPayablePaise < result.grossSalesPaise);
  });

  test("calculates Express Daily settlement deducting nominal 0.5% early liquidity fee + 18% GST", () => {
    const standard = calculateRestaurantDualCycleSettlement({
      restaurantId: "rest_1",
      restaurantName: "Biryani House",
      cycleType: "STANDARD_WEEKLY",
      deliveredOrdersCount: 20,
      grossSalesPaise: 1_000_000, // 10,000 INR
      restaurantDiscountsPaise: 50_000,
      packagingChargesPaise: 10_000,
      commissionBps: 1500, // 15%
    });

    const express = calculateRestaurantDualCycleSettlement({
      restaurantId: "rest_1",
      restaurantName: "Biryani House",
      cycleType: "EXPRESS_DAILY",
      deliveredOrdersCount: 20,
      grossSalesPaise: 1_000_000,
      restaurantDiscountsPaise: 50_000,
      packagingChargesPaise: 10_000,
      commissionBps: 1500,
    });

    assert.equal(standard.cycleType, "STANDARD_WEEKLY");
    assert.equal(express.cycleType, "EXPRESS_DAILY");
    // Standard has 0 early liquidity fee
    assert.equal(standard.expressLiquidityFeePaise ?? 0, 0);
    // Express has 0.5% early liquidity fee
    assert.ok((express.expressLiquidityFeePaise ?? 0) > 0);
    assert.ok((express.gstOnExpressLiquidityFeePaise ?? 0) > 0);
    // Express net payout is standard minus liquidity fee and GST
    const feeDiff = (express.expressLiquidityFeePaise ?? 0) + (express.gstOnExpressLiquidityFeePaise ?? 0);
    assert.equal(express.netPayablePaise, standard.netPayablePaise - feeDiff);
  });

  test("calculates rider statement subtracting cash collected", () => {
    const cycle = getWeeklyCycle();
    const result = calculateRiderWeeklySettlement({
      riderId: "rider_1",
      riderName: "Rahul Das",
      cycle,
      deliveriesCompleted: 45,
      basePayPaise: 180_000,       // 1,800 INR base
      distancePayPaise: 90_000,     // 900 INR distance
      surgeIncentivesPaise: 30_000, // 300 INR surge
      milestoneBonusPaise: 50_000,  // 500 INR bonus
      cashCollectedPaise: 200_000,  // 2,000 INR COD cash collected
    });

    // Gross = 1800 + 900 + 300 + 500 = 3500 INR (350,000 paise)
    assert.equal(result.grossEarningsPaise, 350_000);
    // Net disbursement = 350,000 - 200,000 = 150,000 paise (1,500 INR paid out)
    assert.equal(result.netDisbursementPaise, 150_000);
    assert.equal(result.payoutStatus, "PENDING");
  });
});
