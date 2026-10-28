/**
 * 👑 WhatsApp Status Viral Bounty Loop & Anti-Fraud Verification Suite (Silent Bypass 9)
 *
 * Specialist: Banking Payouts & RazorpayX Specialist (f1ad9aac)
 * Entity: Order King (GSTIN: 18AFXPH9838M1Z9), Assam - 788710
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { WhatsAppStatusBountyEngine } from "./whatsapp-status-bounty-engine.ts";

describe("👑 Silent Bypass 9: WhatsApp Status Viral Bounty Engine", () => {
  beforeEach(() => {
    WhatsAppStatusBountyEngine.resetTestLedger();
  });

  describe("1. Legitimate Viral Sharing & ₹20 Bounty Disbursement", () => {
    it("successfully issues ₹20 (2,000 paise) credit and generates tracking deep link", async () => {
      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_karimganj_001",
        orderId: "ord_live_88491",
        dispatchJobId: "dsp_live_88491",
        ipAddress: "103.211.14.50",
        townName: "Karimganj",
        orderTotalPaise: 35000, // ₹350 order
        orderStatus: "OUT_FOR_DELIVERY",
      });

      assert.equal(res.success, true);
      assert.equal(res.bountyAmountPaise, 2000);
      assert.equal(res.bountyAmountInr, 20);
      assert.ok(res.transactionId?.startsWith("txn_bounty_wa_"));
      assert.ok(res.trackingDeepLink.includes("/tracking/dsp_live_88491"));
      assert.ok(res.statusShareUrl.startsWith("https://api.whatsapp.com/send?text="));
      assert.ok(decodeURIComponent(res.statusShareUrl).includes("Tracking my live hot food order on OrderKing"));
      assert.equal(res.antiFraudMetrics?.ipDailyCount, 1);
      assert.equal(res.antiFraudMetrics?.userDailyCount, 1);
    });

    it("respects dynamic commercial dial bounty overrides (e.g., ₹25.00)", async () => {
      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty(
        {
          userId: "usr_karimganj_002",
          orderId: "ord_live_99214",
          ipAddress: "103.211.14.51",
          orderTotalPaise: 25000,
          orderStatus: "PREPARING",
        },
        { bountyAmountInr: 25 }
      );

      assert.equal(res.success, true);
      assert.equal(res.bountyAmountPaise, 2500);
      assert.equal(res.bountyAmountInr, 25);
    });
  });

  describe("2. Anti-Fraud & Sybil Defense (IP Velocity Limiting)", () => {
    it("strictly halts fail-closed when IP exceeds 3 claims per 24 hours", async () => {
      const commonIp = "103.211.14.77";

      // 1st claim
      const res1 = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_ip_01",
        orderId: "ord_ip_01",
        ipAddress: commonIp,
        orderTotalPaise: 20000,
        orderStatus: "DELIVERED",
      });
      assert.equal(res1.success, true);

      // 2nd claim
      const res2 = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_ip_02",
        orderId: "ord_ip_02",
        ipAddress: commonIp,
        orderTotalPaise: 20000,
        orderStatus: "DELIVERED",
      });
      assert.equal(res2.success, true);

      // 3rd claim
      const res3 = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_ip_03",
        orderId: "ord_ip_03",
        ipAddress: commonIp,
        orderTotalPaise: 20000,
        orderStatus: "DELIVERED",
      });
      assert.equal(res3.success, true);

      // 4th claim (from same IP - emulator or click-farm attack)
      const res4 = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_ip_04",
        orderId: "ord_ip_04",
        ipAddress: commonIp,
        orderTotalPaise: 20000,
        orderStatus: "DELIVERED",
      });

      assert.equal(res4.success, false);
      assert.equal(res4.rejectionReason, "REJECTED_IP_VELOCITY_EXCEEDED");
      assert.equal(res4.bountyAmountPaise, 0);
      assert.equal(res4.antiFraudMetrics?.ipDailyCount, 3);
    });
  });

  describe("3. Order Idempotency & Duplicate Defense", () => {
    it("strictly rejects multiple bounty claims on the same order", async () => {
      const orderId = "ord_unique_772";

      const firstClaim = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_double_claim",
        orderId,
        ipAddress: "103.211.14.90",
        orderTotalPaise: 25000,
        orderStatus: "OUT_FOR_DELIVERY",
      });
      assert.equal(firstClaim.success, true);

      // Second attempt on same order ID
      const secondClaim = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_double_claim",
        orderId,
        ipAddress: "103.211.14.90",
        orderTotalPaise: 25000,
        orderStatus: "OUT_FOR_DELIVERY",
      });

      assert.equal(secondClaim.success, false);
      assert.equal(secondClaim.rejectionReason, "REJECTED_ORDER_ALREADY_CLAIMED");
      assert.equal(secondClaim.bountyAmountPaise, 0);
    });
  });

  describe("4. User Daily Cap Defense", () => {
    it("limits a single user to a maximum of 5 bounty claims (₹100) per 24 hours", async () => {
      const userId = "usr_power_sharer";

      for (let i = 1; i <= 5; i++) {
        const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
          userId,
          orderId: `ord_power_${i}`,
          ipAddress: `103.211.14.${i + 10}`,
          orderTotalPaise: 15000,
          orderStatus: "DELIVERED",
        });
        assert.equal(res.success, true);
      }

      // 6th claim attempt
      const res6 = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId,
        orderId: "ord_power_6",
        ipAddress: "103.211.14.99",
        orderTotalPaise: 15000,
        orderStatus: "DELIVERED",
      });

      assert.equal(res6.success, false);
      assert.equal(res6.rejectionReason, "REJECTED_USER_DAILY_LIMIT_EXCEEDED");
      assert.equal(res6.bountyAmountPaise, 0);
      assert.equal(res6.antiFraudMetrics?.userDailyCount, 5);
    });
  });

  describe("5. Margin Leakage & Order State Guards", () => {
    it("rejects bounty for orders below ₹100 threshold", async () => {
      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_micro_order",
        orderId: "ord_micro_10",
        ipAddress: "103.211.14.101",
        orderTotalPaise: 4900, // ₹49 (below ₹100 floor)
        orderStatus: "DELIVERED",
      });

      assert.equal(res.success, false);
      assert.equal(res.rejectionReason, "REJECTED_BELOW_MINIMUM_ORDER_THRESHOLD");
    });

    it("rejects bounty for cancelled or refunded orders", async () => {
      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_cancelled",
        orderId: "ord_cancelled_99",
        ipAddress: "103.211.14.102",
        orderTotalPaise: 30000,
        orderStatus: "CANCELLED",
      });

      assert.equal(res.success, false);
      assert.equal(res.rejectionReason, "REJECTED_INVALID_ORDER_STATE");
    });

    it("rejects bounty if campaign dial is turned off", async () => {
      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty(
        {
          userId: "usr_dial_off",
          orderId: "ord_dial_off_1",
          ipAddress: "103.211.14.103",
          orderTotalPaise: 30000,
          orderStatus: "OUT_FOR_DELIVERY",
        },
        { campaignActive: false }
      );

      assert.equal(res.success, false);
      assert.equal(res.rejectionReason, "REJECTED_CAMPAIGN_INACTIVE");
    });

    it("fails closed when marketing reserve pool is depleted", async () => {
      WhatsAppStatusBountyEngine.setMarketingReserveBalance(0); // Zero balance in promotional pool

      const res = await WhatsAppStatusBountyEngine.claimWhatsAppStatusOrderBounty({
        userId: "usr_depleted",
        orderId: "ord_depleted_1",
        ipAddress: "103.211.14.104",
        orderTotalPaise: 30000,
        orderStatus: "OUT_FOR_DELIVERY",
      });

      assert.equal(res.success, false);
      assert.equal(res.rejectionReason, "REJECTED_PROMOTION_BUDGET_EXHAUSTED");
    });
  });
});
