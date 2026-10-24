import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RiderEngine, todayRange } from "../lib/rider/engine.ts";
import { MemoryStore } from "../lib/rider/memory-store.ts";
import { executeRiderRazorpayXPayout, isRiderBankingLive } from "../lib/rider/banking.ts";
import { DEFAULT_CONFIG } from "../lib/rider/config.ts";

describe("OrderKing Rider RazorpayX Banking & T+1 Instant Payout Suite", () => {
  let store: MemoryStore;
  let engine: RiderEngine;
  const testUserId = "rider-payout-user-1";

  beforeEach(async () => {
    store = new MemoryStore();
    engine = new RiderEngine(store);

    await engine.ensureRider({ id: testUserId, name: "Suresh Courier", email: "suresh@rider.in" });
    await engine.systemSetKyc("ADMIN", testUserId, "VERIFIED");
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
});
