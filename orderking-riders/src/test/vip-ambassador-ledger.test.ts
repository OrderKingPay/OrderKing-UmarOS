import { describe, it, expect, beforeEach } from "vitest";
import { RiderEngine, todayRange } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";

describe("OrderKing VIP Ambassador Pass & Courier Wallet Ledger Integration", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "ambassador-courier-user-1";
  const testRiderId = "FLEET-VIP-786";

  beforeEach(async () => {
    store = new MemoryStore();
    engine = new RiderEngine(store);

    await engine.ensureRider({ id: testUserId, name: "Imtiaz Khan", email: "imtiaz@orderking.partner" });
    await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
    await engine.setStatus(testUserId, "ONLINE", true);
  });

  it("credits ₹25 instant cash bonus upon customer first order to courier wallet ledger", async () => {
    const line = await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-1001",
      customerName: "Rahul Sharma",
    });

    expect(line.kind).toBe("REFERRAL_COMMISSION");
    expect(line.amountPaise).toBe(2500); // ₹25.00
    expect(line.note).toContain("Ambassador Instant Cash Bonus");
    expect(line.note).toContain("₹25");
    expect(line.note).toContain("Rahul Sharma");

    // Verify it is directly present in the ledger
    const earnings = await engine.earnings(testUserId, todayRange());
    expect(earnings.totals.referral).toBe(2500);
    expect(earnings.totals.netPayable).toBe(2500);
    expect(earnings.lines).toHaveLength(1);
    expect(earnings.lines[0]?.kind).toBe("REFERRAL_COMMISSION");
  });

  it("credits 1% lifetime micro-royalty on customer repeat orders to courier wallet ledger", async () => {
    // 1st order bonus
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-1001",
      customerName: "Rahul Sharma",
    });

    // 2nd repeat order of ₹800 (80,000 paise) -> 1% is ₹8.00 (800 paise)
    const royaltyLine = await engine.creditReferralCommission(testUserId, {
      type: "LIFETIME_ROYALTY",
      orderCode: "OK-1082",
      customerName: "Rahul Sharma",
      orderTotalPaise: 80000,
    });

    expect(royaltyLine.kind).toBe("REFERRAL_COMMISSION");
    expect(royaltyLine.amountPaise).toBe(800); // ₹8.00
    expect(royaltyLine.note).toContain("Lifetime Micro-Royalty: 1%");

    // Check aggregated ledger totals
    const earnings = await engine.earnings(testUserId, todayRange());
    expect(earnings.totals.referral).toBe(3300); // ₹25 + ₹8 = ₹33 (3300 paise)
    expect(earnings.totals.netPayable).toBe(3300);
  });

  it("calculates ambassador stats breakdown correctly", async () => {
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-2001",
      customerName: "Priya Das",
    });
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-2002",
      customerName: "Anand Verma",
    });
    await engine.creditReferralCommission(testUserId, {
      type: "LIFETIME_ROYALTY",
      orderCode: "OK-2050",
      customerName: "Priya Das",
      orderTotalPaise: 60000, // 1% = ₹6.00 (600 paise)
    });

    const stats = await engine.getAmbassadorStats(testUserId);
    expect(stats.totalCustomersReferred).toBeGreaterThanOrEqual(2);
    expect(stats.firstOrderBonusCount).toBe(2);
    expect(stats.firstOrderBonusPaise).toBe(5000); // 2 * ₹25 = ₹50.00
    expect(stats.royaltyCount).toBe(1);
    expect(stats.royaltyPaise).toBe(600); // ₹6.00
    expect(stats.totalEarnedPaise).toBe(5600); // ₹56.00
    expect(stats.recentReferrals.length).toBe(3);
  });

  it("ensures strict absence of competitor trademarks across notes and ledger items", async () => {
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-3001",
    });
    await engine.creditReferralCommission(testUserId, {
      type: "LIFETIME_ROYALTY",
      orderCode: "OK-3002",
      orderTotalPaise: 75000,
    });

    const earnings = await engine.earnings(testUserId, todayRange());
    for (const line of earnings.lines) {
      expect(line.note.toLowerCase()).not.toContain("zomato");
      expect(line.note.toLowerCase()).not.toContain("swiggy");
    }
  });
});
