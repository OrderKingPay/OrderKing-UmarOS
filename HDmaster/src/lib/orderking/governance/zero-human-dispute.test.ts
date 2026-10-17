import { describe, it, expect } from "vitest";
import {
  ZeroHumanDisputeMatrix,
  type DisputeClaimInput,
} from "./zero-human-dispute";

describe("Zero-Human Dispute & Refund Matrix", () => {
  describe("Photo Proof & Structured Reason Validation", () => {
    it("rejects claim immediately if photo proof is missing or invalid", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      const claimNoPhoto: DisputeClaimInput = {
        orderId: "ord_101",
        customerId: "cust_1",
        orderAmountPaise: 25000, // ₹250
        claimAmountPaise: 15000, // ₹150
        reason: "MISSING_ITEM",
        photoProofUrl: "", // Missing
      };

      const result = matrix.submitClaim(claimNoPhoto);
      expect(result.status).toBe("REJECTED_MISSING_PROOF");
      expect(result.autoRefundApproved).toBe(false);
      expect(result.refundedAmountPaise).toBe(0);
      expect(result.message).toContain("Photo proof is mandatory");
      expect(result.zeroHumanResolved).toBe(true);
    });

    it("accepts valid structured reasons (missing item, spilled gravy, broken tamper seal) with photo proof", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      matrix.registerCustomer("cust_v1", 20);

      const claimGravy: DisputeClaimInput = {
        orderId: "ord_gravy",
        customerId: "cust_v1",
        orderAmountPaise: 24000,
        claimAmountPaise: 24000,
        reason: "SPILLED_GRAVY",
        photoProofUrl: "https://cdn.orderking.io/proofs/spilled-dal-gravy-101.jpg",
      };

      const result = matrix.submitClaim(claimGravy);
      expect(result.status).toBe("AUTO_APPROVED");
      expect(result.autoRefundApproved).toBe(true);
      expect(result.refundedAmountPaise).toBe(24000);

      const claimSeal: DisputeClaimInput = {
        orderId: "ord_seal",
        customerId: "cust_v1",
        orderAmountPaise: 18000,
        claimAmountPaise: 18000,
        reason: "BROKEN_TAMPER_SEAL",
        photoProofUrl: "https://cdn.orderking.io/proofs/broken-tamper-seal-102.jpg",
      };

      const resultSeal = matrix.submitClaim(claimSeal);
      expect(resultSeal.status).toBe("AUTO_APPROVED");
      expect(resultSeal.autoRefundApproved).toBe(true);
    });
  });

  describe("Instant Auto-Refund (< ₹300 into KingPay Wallet in < 30 seconds)", () => {
    it("automatically approves valid claim < ₹300 into KingPay wallet in < 30 seconds with zero human staff", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      matrix.registerCustomer("cust_quick", 30, 5000); // Has 30 lifetime orders, 5000 paise (₹50) initial wallet balance

      const claim: DisputeClaimInput = {
        orderId: "ord_small_220",
        customerId: "cust_quick",
        orderAmountPaise: 22000, // ₹220 < ₹300 threshold
        claimAmountPaise: 22000,
        reason: "MISSING_ITEM",
        photoProofUrl: "https://cdn.orderking.io/proofs/missing-biryani.jpg",
        itemsAffected: [
          { itemId: "itm_1", itemName: "Paneer Biryani", quantity: 1, pricePaise: 22000 },
        ],
      };

      const startMs = Date.now();
      const result = matrix.submitClaim(claim);
      const latencyMs = Date.now() - startMs;

      // 1. Status and resolution
      expect(result.status).toBe("AUTO_APPROVED");
      expect(result.autoRefundApproved).toBe(true);
      expect(result.zeroHumanResolved).toBe(true);
      expect(result.refundedAmountPaise).toBe(22000); // Full ₹220 refunded

      // 2. SLA check (< 30 seconds)
      expect(latencyMs).toBeLessThan(30000);
      expect(result.processingTimeMs).toBeLessThan(30000);

      // 3. KingPay wallet credit
      expect(result.walletTransaction).toBeDefined();
      expect(result.walletTransaction?.wallet).toBe("KINGPAY");
      expect(result.walletTransaction?.type).toBe("REFUND_CREDIT");
      expect(result.walletTransaction?.amountPaise).toBe(22000);
      expect(result.walletTransaction?.status).toBe("SUCCESS");

      // Verify wallet balance updated: 5000 (initial) + 22000 (refund) = 27000 paise
      expect(matrix.getWalletBalance("cust_quick")).toBe(27000);
      expect(result.walletTransaction?.balanceAfterPaise).toBe(27000);
    });
  });

  describe("Fraud Pattern Detector (Frequency & Lifetime Claims Matrix)", () => {
    it("quarantines claims for manual review if customer has > 2 claims in 7 days", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      const customerId = "cust_freq_abuser";
      matrix.registerCustomer(customerId, 50); // 50 lifetime orders

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      // Claim 1: 5 days ago (Valid, approved)
      const claim1 = matrix.submitClaim({
        orderId: "ord_1",
        customerId,
        orderAmountPaise: 15000,
        claimAmountPaise: 15000,
        reason: "MISSING_ITEM",
        photoProofUrl: "https://cdn.orderking.io/proofs/1.jpg",
        submittedAt: now - 5 * dayMs,
      });
      expect(claim1.status).toBe("AUTO_APPROVED");

      // Claim 2: 3 days ago (Valid, approved)
      const claim2 = matrix.submitClaim({
        orderId: "ord_2",
        customerId,
        orderAmountPaise: 12000,
        claimAmountPaise: 12000,
        reason: "SPILLED_GRAVY",
        photoProofUrl: "https://cdn.orderking.io/proofs/2.jpg",
        submittedAt: now - 3 * dayMs,
      });
      expect(claim2.status).toBe("AUTO_APPROVED");

      // Claim 3: 1 day ago (Now has 2 claims in 7 days)
      const claim3 = matrix.submitClaim({
        orderId: "ord_3",
        customerId,
        orderAmountPaise: 18000,
        claimAmountPaise: 18000,
        reason: "BROKEN_TAMPER_SEAL",
        photoProofUrl: "https://cdn.orderking.io/proofs/3.jpg",
        submittedAt: now - 1 * dayMs,
      });
      // 2 claims allowed; 3rd claim makes 7-day count = 2 at check time -> still <= 2
      expect(claim3.status).toBe("AUTO_APPROVED");

      // Claim 4: today (Now has 3 claims in last 7 days -> > 2 limit exceeded!)
      const claim4 = matrix.submitClaim({
        orderId: "ord_4",
        customerId,
        orderAmountPaise: 14000,
        claimAmountPaise: 14000,
        reason: "MISSING_ITEM",
        photoProofUrl: "https://cdn.orderking.io/proofs/4.jpg",
        submittedAt: now,
      });

      // Claim 4 should trigger manual review quarantine!
      expect(claim4.status).toBe("QUARANTINED_FOR_REVIEW");
      expect(claim4.autoRefundApproved).toBe(false);
      expect(claim4.quarantineReasons?.some((r) => r.includes("CLAIM_FREQUENCY_EXCEEDED"))).toBe(true);
      expect(claim4.quarantineId).toBeDefined();
    });

    it("quarantines claims if lifetime claim ratio exceeds 15% of lifetime orders", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      const customerId = "cust_high_ratio";
      // Customer has only 10 lifetime orders
      matrix.registerCustomer(customerId, 10);

      // 1st claim: 1 / 10 = 10% <= 15% (allowed)
      const claim1 = matrix.submitClaim({
        orderId: "ord_ratio_1",
        customerId,
        orderAmountPaise: 12000,
        claimAmountPaise: 12000,
        reason: "MISSING_ITEM",
        photoProofUrl: "https://cdn.orderking.io/proofs/r1.jpg",
      });
      expect(claim1.status).toBe("AUTO_APPROVED");

      // 2nd claim: total claims becomes 2. 2 / 10 = 20% > 15% threshold!
      const claim2 = matrix.submitClaim({
        orderId: "ord_ratio_2",
        customerId,
        orderAmountPaise: 14000,
        claimAmountPaise: 14000,
        reason: "SPILLED_GRAVY",
        photoProofUrl: "https://cdn.orderking.io/proofs/r2.jpg",
      });

      expect(claim2.status).toBe("QUARANTINED_FOR_REVIEW");
      expect(claim2.autoRefundApproved).toBe(false);
      expect(claim2.quarantineReasons?.some((r) => r.includes("LIFETIME_CLAIM_RATIO_EXCEEDED"))).toBe(true);
    });

    it("quarantines high-value orders (>= ₹300) for secondary governance review", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      const customerId = "cust_vip";
      matrix.registerCustomer(customerId, 50);

      // Order value ₹450 = 45,000 paise (>= 30,000 paise threshold)
      const highValueClaim = matrix.submitClaim({
        orderId: "ord_high_450",
        customerId,
        orderAmountPaise: 45000,
        claimAmountPaise: 45000,
        reason: "BROKEN_TAMPER_SEAL",
        photoProofUrl: "https://cdn.orderking.io/proofs/tampered-box.jpg",
      });

      expect(highValueClaim.status).toBe("QUARANTINED_FOR_REVIEW");
      expect(highValueClaim.autoRefundApproved).toBe(false);
      expect(
        highValueClaim.quarantineReasons?.some((r) =>
          r.includes("ORDER_VALUE_EXCEEDS_AUTO_REFUND_LIMIT")
        )
      ).toBe(true);
    });
  });

  describe("Governance Audit Trail & Zero Human Operation", () => {
    it("maintains persistent audit records of all dispute transactions", () => {
      const matrix = new ZeroHumanDisputeMatrix();
      matrix.registerCustomer("cust_audit", 25);

      matrix.submitClaim({
        orderId: "ord_a1",
        customerId: "cust_audit",
        orderAmountPaise: 19000,
        claimAmountPaise: 19000,
        reason: "MISSING_ITEM",
        photoProofUrl: "https://cdn.orderking.io/proofs/audit.jpg",
      });

      const logs = matrix.getAuditLog();
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe("INSTANT_AUTO_REFUND_PROCESSED");
      expect(logs[0].metadata.customerId).toBe("cust_audit");
    });
  });
});
