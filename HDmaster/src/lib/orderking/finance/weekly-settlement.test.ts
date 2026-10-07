import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  getWeeklyCycle,
  calculateRestaurantWeeklySettlement,
  calculateRiderWeeklySettlement,
} from "./weekly-settlement.ts";

describe("Zomato Weekly Settlement Cycle & Formula", () => {
  test("generates Monday to Sunday cycle with Wednesday payout", () => {
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

  test("calculates restaurant statement with statutory GST, TCS, and TDS", () => {
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
    // Net payable must be positive and less than gross sales
    assert.ok(result.netPayablePaise > 0);
    assert.ok(result.netPayablePaise < result.grossSalesPaise);
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
