import test from "node:test";
import assert from "node:assert";
import { calculateRiderWeeklySettlement, getDailyTPlus1Cycle } from "./weekly-settlement.ts";
import { DEFAULT_SETTINGS } from "../types.ts";

test("Rider Settlement & Evening Radius Integrity", async (t) => {
  await t.test("verifies contracted evening delivery radius is strictly 7.5 km for accelerated trip turnaround", () => {
    assert.strictEqual(DEFAULT_SETTINGS.eveningModeRadiusKm, 7.5);
    assert.strictEqual(DEFAULT_SETTINGS.eveningModeStartHour, 18);
    assert.strictEqual(DEFAULT_SETTINGS.nightModeStartHour, 23);
    assert.ok(DEFAULT_SETTINGS.dayModeRadiusKm >= 12.0);
    assert.ok(DEFAULT_SETTINGS.nightModeRadiusKm <= 4.0);
  });

  await t.test("accurately calculates rider trip delivery earnings with distance pay, surge, and COD deduction", () => {
    const cycle = getDailyTPlus1Cycle(new Date("2026-10-25T20:00:00Z"));
    
    // Rider completes 12 trips within the 7.5 km evening radius:
    // Base pay: 12 * ₹25 (2500 paise) = 30000 paise (₹300.00)
    // Distance pay: 60 km * ₹5/km (500 paise) = 30000 paise (₹300.00)
    // Evening peak surge: ₹150.00 (15000 paise)
    // Milestone bonus: ₹100.00 (10000 paise)
    // Cash collected (COD in hand): ₹350.00 (35000 paise)
    const settlement = calculateRiderWeeklySettlement({
      riderId: "rider_karimganj_007",
      riderName: "Ahmed Alom",
      upiOrBankMasked: "ahmed@okaxis",
      cycle: {
        cycleId: cycle.cycleId,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        payoutDate: cycle.payoutDate,
        status: "OPEN",
      },
      deliveriesCompleted: 12,
      basePayPaise: 30000,
      totalDistanceKm: 60,
      surgeIncentivesPaise: 15000,
      milestoneBonusPaise: 10000,
      cashCollectedPaise: 35000,
    });

    // Gross earnings = 30000 + 30000 + 15000 + 10000 = 85000 paise (₹850.00)
    assert.strictEqual(settlement.grossEarningsPaise, 85000);
    assert.strictEqual(settlement.basePayPaise, 30000);
    assert.strictEqual(settlement.distancePayPaise, 30000);
    assert.strictEqual(settlement.surgeIncentivesPaise, 15000);
    assert.strictEqual(settlement.milestoneBonusPaise, 10000);

    // Cash collected = 35000 paise (₹350.00)
    assert.strictEqual(settlement.cashCollectedPaise, 35000);

    // Net disbursement = 85000 - 35000 = 50000 paise (₹500.00)
    assert.strictEqual(settlement.netDisbursementPaise, 50000);
    assert.strictEqual(Number.isInteger(settlement.netDisbursementPaise), true);
    assert.strictEqual(settlement.deliveriesCompleted, 12);
    assert.strictEqual(settlement.payoutStatus, "PENDING");
  });

  await t.test("enforces zero wage deduction when rider collects zero COD cash", () => {
    const cycle = getDailyTPlus1Cycle(new Date("2026-10-25T20:00:00Z"));
    
    const settlement = calculateRiderWeeklySettlement({
      riderId: "rider_upi_only",
      riderName: "Bikash Paul",
      upiOrBankMasked: "9876543210@ybl",
      cycle: {
        cycleId: cycle.cycleId,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        payoutDate: cycle.payoutDate,
        status: "OPEN",
      },
      deliveriesCompleted: 8,
      basePayPaise: 20000,
      distancePayPaise: 18000,
      surgeIncentivesPaise: 5000,
      milestoneBonusPaise: 0,
      cashCollectedPaise: 0,
    });

    assert.strictEqual(settlement.grossEarningsPaise, 43000);
    assert.strictEqual(settlement.cashCollectedPaise, 0);
    assert.strictEqual(settlement.netDisbursementPaise, 43000);
  });
});
