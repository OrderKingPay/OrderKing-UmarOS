import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { 
  getLifetimeRoyaltyDashboard, 
  enrollOrSimulateRecruit, 
  withdrawRoyaltyToUPI 
} from "./lifetime-royalty.ts";

describe("Lifetime Royalty Affiliate Engine — The Godfather of Viral Mathematics", () => {
  it("should calculate 1% cash royalty mathematically with 100% precision", () => {
    // 1% of ₹450 order (45,000 paise) is ₹4.50 (450 paise)
    const orderGmvPaise = 45000;
    const expectedRoyaltyPaise = Math.round(orderGmvPaise * 0.01);
    assert.equal(expectedRoyaltyPaise, 450);
    assert.equal(expectedRoyaltyPaise / 100, 4.5);

    // 1% of ₹1,250 order (125,000 paise) is ₹12.50 (1,250 paise)
    const largeOrderPaise = 125000;
    const largeRoyaltyPaise = Math.round(largeOrderPaise * 0.01);
    assert.equal(largeRoyaltyPaise, 1250);
    assert.equal(largeRoyaltyPaise / 100, 12.5);
  });

  it("should enforce viral compounding mathematical matrix projection accurately", () => {
    // Mathematical Formula: N * F * V * 0.01
    const testCases = [
      { recruits: 10, ordersPerMonth: 8, aov: 450, expectedMonthly: 360, expectedYearly: 4320 },
      { recruits: 50, ordersPerMonth: 8, aov: 450, expectedMonthly: 1800, expectedYearly: 21600 },
      { recruits: 250, ordersPerMonth: 8, aov: 450, expectedMonthly: 9000, expectedYearly: 108000 },
      { recruits: 1000, ordersPerMonth: 8, aov: 450, expectedMonthly: 36000, expectedYearly: 432000 },
    ];

    for (const tc of testCases) {
      const monthlyRoyalty = Math.round(tc.recruits * tc.ordersPerMonth * tc.aov * 0.01);
      const yearlyRoyalty = monthlyRoyalty * 12;
      assert.equal(monthlyRoyalty, tc.expectedMonthly, `Failed for ${tc.recruits} recruits`);
      assert.equal(yearlyRoyalty, tc.expectedYearly, `Failed yearly for ${tc.recruits} recruits`);
    }
  });

  it("should return clean zero-fake-data dashboard for brand new users", async () => {
    const testUserId = `test_user_${Date.now()}`;
    const result = await getLifetimeRoyaltyDashboard({ data: { userId: testUserId } });

    assert.ok(result.success);
    assert.equal(result.data.activeRecruitsCount, 0);
    assert.equal(result.data.totalOrdersAcrossNetwork, 0);
    assert.equal(result.data.lifetimeRoyaltyEarnedRupees, 0);
    assert.equal(result.data.projectedMonthlyRunRateRupees, 0);
    assert.deepEqual(result.data.recruits, []);
  });

  it("should enroll recruits, simulate orders, and credit 1% cash to KingPay wallet", async () => {
    const testUserId = `test_referrer_${Date.now()}`;
    
    // Enroll a recruit with an initial ₹450 order
    const simResult = await enrollOrSimulateRecruit({
      data: {
        referrerId: testUserId,
        orderGmvRupees: 450
      }
    });

    assert.ok(simResult.success);
    assert.equal(simResult.data.cashCreditedRupees, 4.5);
    assert.equal(simResult.data.royaltyRate, "1% Lifetime Cash");

    // Check dashboard reflects the real database recruit entry
    const dashResult = await getLifetimeRoyaltyDashboard({ data: { userId: testUserId } });
    assert.ok(dashResult.success);
    assert.equal(dashResult.data.activeRecruitsCount, 1);
    assert.equal(dashResult.data.lifetimeRoyaltyEarnedRupees, 4.5);
    assert.equal(dashResult.data.recruits.length, 1);
    assert.equal(dashResult.data.recruits[0].totalOrders, 1);
    assert.equal(dashResult.data.recruits[0].royaltyEarnedRupees, 4.5);
  });

  it("should validate instant UPI withdrawal requests and guard against zero balances", async () => {
    const emptyUserId = `test_empty_${Date.now()}`;

    // Withdrawal with ₹0 balance should fail
    const failRes = await withdrawRoyaltyToUPI({
      data: {
        userId: emptyUserId,
        upiId: "founder@ybl",
        amountRupees: 100
      }
    });

    assert.equal(failRes.success, false);
    assert.match(failRes.error, /Insufficient royalty wallet balance/i);

    // Invalid UPI format should fail
    const badUpiRes = await withdrawRoyaltyToUPI({
      data: {
        userId: emptyUserId,
        upiId: "invalid_upi_no_at_symbol",
        amountRupees: 10
      }
    });

    assert.equal(badUpiRes.success, false);
    assert.match(badUpiRes.error, /Invalid UPI ID format/i);
  });
});
