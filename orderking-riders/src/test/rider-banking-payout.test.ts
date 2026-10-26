import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RiderEngine, todayRange } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";
import { executeRiderRazorpayXPayout, isRiderBankingLive } from "../lib/rider/banking.ts";
import { DEFAULT_CONFIG } from "../lib/rider/config.ts";
import { computeNextDailySettlementIst, computeNextSettlementWindowIst } from "../lib/rider/money.ts";
import { founderCommandDials } from "../lib/rider/founder-dials.ts";

describe("OrderKing Rider RazorpayX Banking & T+1 Instant Payout Suite", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "rider-payout-user-1";
  let origKeyId: string | undefined;
  let origKeySecret: string | undefined;

  beforeEach(async () => {
    origKeyId = process.env.RAZORPAYX_KEY_ID;
    origKeySecret = process.env.RAZORPAYX_KEY_SECRET;
    process.env.RAZORPAYX_KEY_ID = "rzp_test_payout_key";
    process.env.RAZORPAYX_KEY_SECRET = "rzp_test_payout_secret";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: "pout_test_rzpx_123",
          entity: "payout",
          fund_account_id: "fa_test_456",
          amount: 2500,
          currency: "INR",
          status: "processing",
          purpose: "payout",
          utr: "RZPXUTR9876543210",
          mode: "UPI",
          reference_id: "REF-TEST-123",
        }),
      }),
    );

    store = new MemoryStore();
    engine = new RiderEngine(store);

    await engine.ensureRider({ id: testUserId, name: "Suresh Courier", email: "suresh@rider.in" });
    await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (origKeyId !== undefined) {
      process.env.RAZORPAYX_KEY_ID = origKeyId;
    } else {
      delete process.env.RAZORPAYX_KEY_ID;
    }
    if (origKeySecret !== undefined) {
      process.env.RAZORPAYX_KEY_SECRET = origKeySecret;
    } else {
      delete process.env.RAZORPAYX_KEY_SECRET;
    }
  });

  it("verifies platform default payout configuration is T+1 Daily", () => {
    expect(DEFAULT_CONFIG.payoutFrequency).toBe("daily");
    expect(DEFAULT_CONFIG.payoutCycleDay).toBe("Daily (T+1)");
  });

  it("rejects instant payout request if rider has not provided UPI VPA", async () => {
    // Rider has no payoutUpi set
    await expect(engine.requestInstantPayout(testUserId, "idem-key-1")).rejects.toThrow(
      "Please add a verified UPI VPA",
    );
  });

  it("rejects instant payout request if rider has zero or negative balance", async () => {
    await engine.saveProfile(testUserId, { payoutUpi: "suresh@oksbi" });

    await expect(engine.requestInstantPayout(testUserId, "idem-key-2")).rejects.toThrow(
      "No payable balance available",
    );
  });

  it("dispatches live/simulated RazorpayX payout when balance and UPI are present", async () => {
    await engine.saveProfile(testUserId, { payoutUpi: "suresh@oksbi" });

    // Credit delivery earnings
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-7788",
      customerName: "Priya",
    });

    const initialEarnings = await engine.earnings(testUserId, todayRange());
    expect(initialEarnings.totals.netPayable).toBe(2500);

    const result = await engine.requestInstantPayout(testUserId, "idem-key-payout-success");

    expect(result.success).toBe(true);
    expect(result.amountPaise).toBe(2500);
    expect(result.payoutUpi).toBe("suresh@oksbi");
    expect(result.reference).toBeTruthy();

    // Verify balance is deducted to 0 in ledger
    const postEarnings = await engine.earnings(testUserId, todayRange());
    expect(postEarnings.totals.netPayable).toBe(0);

    // Verify settlement record is inserted
    const settlements = await engine.settlements(testUserId);
    expect(settlements.length).toBeGreaterThan(0);
    const payoutSettlement = settlements.find((s) => s.amountPaise === 2500);
    expect(payoutSettlement).toBeDefined();

    // Verify notification is sent to rider
    const notifications = await engine.notifications(testUserId);
    const payoutNotif = notifications.find((n) => n.kind === "PAYOUT");
    expect(payoutNotif).toBeDefined();
    expect(payoutNotif?.title).toContain("Instant UPI Withdrawal");
  });

  it("enforces strict idempotency on instant payout requests", async () => {
    await engine.saveProfile(testUserId, { payoutUpi: "suresh@oksbi" });

    // Credit ₹25
    await engine.creditReferralCommission(testUserId, {
      type: "FIRST_ORDER_BONUS",
      orderCode: "OK-8899",
      customerName: "Amit",
    });

    const idemKey = "idem-id-strict-test-1";

    const res1 = await engine.requestInstantPayout(testUserId, idemKey);
    const res2 = await engine.requestInstantPayout(testUserId, idemKey);

    // Idempotent duplicate returns same response
    expect(res1.reference).toBe(res2.reference);
    expect(res1.amountPaise).toBe(res2.amountPaise);

    // Balance should only be deducted once
    const postEarnings = await engine.earnings(testUserId, todayRange());
    expect(postEarnings.totals.netPayable).toBe(0);
  });

  it("handles live RazorpayX payout HTTP execution with UPI mode", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "pout_test_rzpx_123",
        entity: "payout",
        fund_account_id: "fa_test_456",
        amount: 50000,
        currency: "INR",
        status: "processing",
        purpose: "payout",
        utr: "RZPXUTR9876543210",
        mode: "UPI",
        reference_id: "REF-TEST-123",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    // Temporarily set test env vars
    const prevKeyId = process.env.RAZORPAYX_KEY_ID;
    const prevKeySecret = process.env.RAZORPAYX_KEY_SECRET;
    process.env.RAZORPAYX_KEY_ID = "rzp_test_payout_id";
    process.env.RAZORPAYX_KEY_SECRET = "rzp_test_payout_secret";

    try {
      const res = await executeRiderRazorpayXPayout({
        riderId: "RIDER-1",
        riderName: "Suresh Courier",
        amountPaise: 50000,
        vpa: "suresh@okhdfcbank",
        referenceId: "REF-TEST-123",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("processing");
      expect(res.payoutId).toBe("pout_test_rzpx_123");
      expect(res.utr).toBe("RZPXUTR9876543210");
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.razorpay.com/v1/payouts");
      expect(options.method).toBe("POST");
      const parsedBody = JSON.parse(options.body);
      expect(parsedBody.amount).toBe(50000);
      expect(parsedBody.mode).toBe("UPI");
      expect(parsedBody.fund_account.vpa.address).toBe("suresh@okhdfcbank");
    } finally {
      if (prevKeyId) process.env.RAZORPAYX_KEY_ID = prevKeyId;
      else delete process.env.RAZORPAYX_KEY_ID;
      if (prevKeySecret) process.env.RAZORPAYX_KEY_SECRET = prevKeySecret;
      else delete process.env.RAZORPAYX_KEY_SECRET;
    }
  });

  it("enforces fail-closed gate when RazorpayX gateway credentials are missing", async () => {
    delete process.env.RAZORPAYX_KEY_ID;
    delete process.env.RAZORPAYX_KEY_SECRET;
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    await expect(
      executeRiderRazorpayXPayout({
        riderId: "RIDER-1",
        riderName: "Suresh Courier",
        amountPaise: 50000,
        vpa: "suresh@okhdfcbank",
        referenceId: "REF-TEST-FAILCLOSED",
      }),
    ).rejects.toThrow("RazorpayX banking payout gateway credentials are not configured");
  });

  it("calculates next-day daily settlement schedule with 10:00 AM window", () => {
    // Test reference at 22:00 IST (10:00 PM - night shift active)
    const testDate = new Date("2026-10-24T16:30:00Z"); // 22:00 IST
    const dailyWindow = computeNextDailySettlementIst(testDate);

    expect(dailyWindow.timeIst).toContain("10:00 AM");
    expect(dailyWindow.scheduleDescription).toContain("Next-Day Daily Settlement");
    expect(dailyWindow.cycleCutoffDescription).toContain("23:59:59 IST midnight cutoff");
    expect(dailyWindow.hoursRemaining).toBeGreaterThanOrEqual(1);

    const universal = computeNextSettlementWindowIst("daily", testDate);
    expect(universal.timeIst).toContain("10:00 AM");
  });

  it("computes founder dials daily cycle period and statutory 1% TDS accurately", () => {
    const cycle = founderCommandDials.getDailyCyclePeriod(new Date("2026-10-24T12:00:00Z"));
    expect(cycle.frequency).toBe("DAILY");
    expect(cycle.cycleId).toContain("cycle_daily_2026-10-24");

    const statement = founderCommandDials.computeWeeklyRiderSettlement(
      {
        riderId: "rider-daily-1",
        riderName: "Imran Khan",
        payoutUpiOrBank: "imran@paytm",
        deliveriesCount: 14,
        basePayPaise: 49000, // ₹490
        distancePayPaise: 24000, // ₹240
        surgeIncentivesPaise: 5000, // ₹50
        milestoneBonusPaise: 10000, // ₹100
        waitTimePaise: 3000, // ₹30
        codCashCollectedPaise: 20000, // ₹200 COD collected
      },
      cycle,
    );

    // Gross: 49000 + 24000 + 5000 + 10000 + 3000 = 91000 paise (₹910.00)
    expect(statement.earningsBreakdown.grossEarningsPaise).toBe(91000);
    // 1% Section 194-O TDS: 910 paise (₹9.10)
    expect(statement.deductions.tdsSection194OPaise).toBe(910);
    // Deductions: 20000 COD + 910 TDS = 20910 paise
    expect(statement.deductions.netDeductionsPaise).toBe(20910);
    // Net disbursement: 91000 - 20910 = 70090 paise (₹700.90)
    expect(statement.netDisbursementPaise).toBe(70090);
    expect(statement.disbursementRail).toBe("NPCI_UPI");
    expect(statement.immutableLedgerHash).toBeTruthy();
  });
});
