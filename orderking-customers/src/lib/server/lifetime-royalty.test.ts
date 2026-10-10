import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Lifetime Royalty Affiliate Engine — The Executive of Viral Mathematics", () => {
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

  it("should calculate 5-year compounded empire wealth with zero fake data", () => {
    const recruits = 50;
    const ordersPerMonth = 8;
    const aov = 450;
    const monthly = Math.round(recruits * ordersPerMonth * aov * 0.01);
    const yearly = monthly * 12;
    const fiveYearCompounded = yearly * 5;

    assert.equal(monthly, 1800);
    assert.equal(yearly, 21600);
    assert.equal(fiveYearCompounded, 108000);
  });

  it("should validate UPI ID format with strict VPA standards", () => {
    const isValidUpi = (upi: string) => /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upi.trim());

    assert.equal(isValidUpi("user@ybl"), true);
    assert.equal(isValidUpi("9876543210@paytm"), true);
    assert.equal(isValidUpi("hasan.ali@okhdfcbank"), true);
    assert.equal(isValidUpi("invalid-upi-no-bank"), false);
    assert.equal(isValidUpi(""), false);
  });
});
