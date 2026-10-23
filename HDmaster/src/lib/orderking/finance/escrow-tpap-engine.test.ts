import { describe, it, expect, beforeEach } from "vitest";
import { canRunDbMutationTests } from "../testing/isolated-db-test-gate";
import {
  EscrowTpapEngine,
  MilestoneEscrowEngine,
  MockBankingPartnerDriver,
  RazorpayXRouteDriver,
  type SubAccountParams,
  type CreateMilestoneParams,
} from "./escrow-tpap-engine.ts";
import { canonicalLedger } from "./canonical-ledger.ts";

describe.skipIf(!canRunDbMutationTests())("Fintech Escrow & TPAP Architecture (Council Domains 3 & 7) — requires isolated DB", () => {
  let mockDriver: MockBankingPartnerDriver;
  let escrowEngine: EscrowTpapEngine;
  let milestoneEngine: MilestoneEscrowEngine;

  beforeEach(() => {
    mockDriver = new MockBankingPartnerDriver();
    escrowEngine = new EscrowTpapEngine(mockDriver);
    milestoneEngine = new MilestoneEscrowEngine(escrowEngine);
  });

  describe("Section 10A PSSA Legal Escrow & Banking Partner Drivers", () => {
    it("creates merchant sub-account with active nodal settlement capability", async () => {
      const merchant: SubAccountParams = {
        entityId: "rest_royaldining_101",
        entityType: "MERCHANT",
        name: "Royal Dining Pvt Ltd",
        email: "accounts@royaldining.com",
        phone: "9876543210",
        bankAccountOrVpa: "royaldining@icici",
        panNumber: "ABCDE1234F",
        gstin: "29ABCDE1234F1Z5",
      };

      const result = await mockDriver.createSubAccount(merchant);
      expect(result.subAccountId).toBeDefined();
      expect(result.status).toBe("ACTIVE");
      expect(result.settlementAccount).toBe("royaldining@icici");
      expect(result.provider).toBe("MOCK_ESCROW");
    });

    it("RazorpayX Route driver initializes and provides correct provider type", () => {
      const rzpDriver = new RazorpayXRouteDriver();
      expect(rzpDriver.providerType).toBe("RAZORPAYX_ROUTE");
    });

    it("locks order payment in nodal escrow with double-entry ledger balance", async () => {
      const orderId = `ord_test_${Date.now()}`;
      const amountPaise = 50000; // ₹500.00

      const { escrowResult, ledgerTx } = await escrowEngine.lockOrderPaymentToEscrow({
        orderId,
        clientId: "cust_9921",
        amountPaise,
        idempotencyKey: `idemp-lock-${orderId}`,
      });

      expect(escrowResult.status).toBe("ESCROW_LOCKED");
      expect(escrowResult.amountPaise).toBe(amountPaise);
      expect(escrowResult.escrowReference).toContain(orderId);

      // Verify double-entry ledger transaction
      expect(ledgerTx.eventType).toBe("ESCROW_PAYMENT_LOCKED");
      expect(ledgerTx.totalAmountPaise).toBe(amountPaise);

      let totalDebit = 0;
      let totalCredit = 0;
      for (const entry of ledgerTx.entries) {
        if (entry.direction === "DEBIT") totalDebit += entry.amountPaise;
        if (entry.direction === "CREDIT") totalCredit += entry.amountPaise;
      }
      expect(totalDebit).toBe(totalCredit);
      expect(totalDebit).toBe(amountPaise);
    });

    it("executes multi-party route split transfer with statutory tax compliance", async () => {
      const orderId = `ord_split_${Date.now()}`;
      const totalAmountPaise = 100000; // ₹1,000.00
      const netFoodPaise = 80000;      // ₹800.00
      const platformFeePaise = 10000;  // ₹100.00
      const riderFeePaise = 8200;      // ₹82.00
      const gstPaise = 1800;           // ₹18.00 (18% on platform fee)

      const { escrowResult } = await escrowEngine.lockOrderPaymentToEscrow({
        orderId,
        clientId: "cust_5521",
        amountPaise: totalAmountPaise,
        idempotencyKey: `idemp-pre-${orderId}`,
      });

      const { splitResult, ledgerTx } = await escrowEngine.settleOrderEscrow({
        orderId,
        escrowReference: escrowResult.escrowReference,
        totalAmountPaise,
        restaurantId: "rest_cafe_001",
        restaurantSubAccountId: "sub_cafe_001",
        netFoodPaise,
        platformFeePaise,
        riderFeePaise,
        riderId: "rider_rajesh_99",
        gstPaise,
        idempotencyKey: `idemp-split-${orderId}`,
      });

      expect(splitResult.status).toBe("SPLIT_COMPLETED");
      expect(splitResult.merchantAmountPaise).toBe(netFoodPaise);
      expect(splitResult.merchantPayoutUtr).toBeDefined();

      // Verify double entry: Escrow debited, all parties credited
      let debits = 0;
      let credits = 0;
      for (const e of ledgerTx.entries) {
        if (e.direction === "DEBIT") debits += e.amountPaise;
        if (e.direction === "CREDIT") credits += e.amountPaise;
      }
      expect(debits).toBe(credits);
      expect(debits).toBe(totalAmountPaise);
    });

    it("rejects split payout when components do not match total escrow amount", async () => {
      await expect(
        escrowEngine.settleOrderEscrow({
          orderId: "ord_mismatch",
          escrowReference: "esc_ref_1",
          totalAmountPaise: 10000,
          restaurantId: "rest_1",
          restaurantSubAccountId: "sub_1",
          netFoodPaise: 7000,
          platformFeePaise: 1000,
          riderFeePaise: 1000,
          gstPaise: 500, // Sum = 9500 != 10000
          idempotencyKey: "mismatch_key",
        })
      ).rejects.toThrow("mismatch");
    });
  });

  describe("Tutor & Hyperlocal Jobs Milestone Escrow Engine", () => {
    const validParams: CreateMilestoneParams = {
      jobId: "JOB-MATH-001",
      title: "Class 12 Calculus Masterclass (10 Sessions)",
      category: "TUTORING",
      clientId: "parent_sharma_99",
      freelancerId: "tutor_dr_anand",
      freelancerPayoutUpi: "anand.math@okaxis",
      amountPaise: 200000, // ₹2,000.00
      platformFeeBps: 500,  // 5% platform fee
      idempotencyKey: `idemp-mls-${Date.now()}`,
    };

    it("creates milestone in FUNDED_IN_ESCROW state and generates 6-digit OTP", async () => {
      const { milestone, plaintextOtp, ledgerTx } = await milestoneEngine.createJobMilestone(validParams);

      expect(milestone.milestoneId.startsWith("mls-")).toBe(true);
      expect(milestone.state).toBe("FUNDED_IN_ESCROW");
      expect(milestone.amountPaise).toBe(200000);

      // Math verification: 5% fee on ₹2,000 = ₹100 (10000 paise)
      expect(milestone.platformFeePaise).toBe(10000);
      // 18% GST on ₹100 = ₹18 (1800 paise)
      expect(milestone.gstOnFeePaise).toBe(1800);
      // Net payout = 200000 - 10000 - 1800 = 188200 paise (₹1,882.00)
      expect(milestone.netPayoutPaise).toBe(188200);

      // Verify OTP is 6 numeric digits
      expect(plaintextOtp).toMatch(/^\d{6}$/);

      // Verify OTP is stored securely hashed (not raw)
      expect(milestone.otpHash).toBeDefined();
      expect(milestone.otpHash).not.toBe(plaintextOtp);
      expect(milestone.otpHash.length).toBe(64); // SHA-256 length

      // Verify double-entry ledger transaction
      expect(ledgerTx.totalAmountPaise).toBe(200000);
    });

    it("rejects milestone creation with negative or zero amounts", async () => {
      await expect(
        milestoneEngine.createJobMilestone({ ...validParams, amountPaise: -500 })
      ).rejects.toThrow("positive");

      await expect(
        milestoneEngine.createJobMilestone({ ...validParams, amountPaise: 0 })
      ).rejects.toThrow("positive");
    });

    it("rejects milestone creation with invalid beneficiary UPI ID", async () => {
      await expect(
        milestoneEngine.createJobMilestone({ ...validParams, freelancerPayoutUpi: "invalid_upi_id" })
      ).rejects.toThrow("Invalid beneficiary payout UPI ID");
    });

    it("allows assigned freelancer to mark milestone as DELIVERED_PENDING_CONFIRMATION", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-del-${Date.now()}`,
      });

      const updated = milestoneEngine.markMilestoneDelivered(milestone.milestoneId, milestone.freelancerId);
      expect(updated.state).toBe("DELIVERED_PENDING_CONFIRMATION");
      expect(updated.freelancerDelivered).toBe(true);
    });

    it("blocks unauthorized user from marking delivery", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-unauth-${Date.now()}`,
      });

      expect(() =>
        milestoneEngine.markMilestoneDelivered(milestone.milestoneId, "wrong_hacker_id")
      ).toThrow("Unauthorized");
    });

    it("1-TAP OTP RELEASE: releases funds automatically upon valid 6-digit OTP verification", async () => {
      const { milestone, plaintextOtp } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-otp-${Date.now()}`,
      });

      // Freelancer marks delivery
      milestoneEngine.markMilestoneDelivered(milestone.milestoneId, milestone.freelancerId);

      // Client verifies via 1-Tap OTP
      const { milestone: released, releaseResult, ledgerTx } = await milestoneEngine.verifyAndRelease1TapOTP({
        milestoneId: milestone.milestoneId,
        otp: plaintextOtp,
        idempotencyKey: `idemp-rel-${milestone.milestoneId}`,
      });

      expect(released.state).toBe("RELEASED_TO_TUTOR");
      expect(released.clientConfirmed).toBe(true);
      expect(released.payoutUtr).toBeDefined();
      expect(releaseResult.status).toBe("DISBURSED");
      expect(releaseResult.amountReleasedPaise).toBe(188200);

      // Double-entry validation on payout release
      let debits = 0;
      let credits = 0;
      for (const e of ledgerTx.entries) {
        if (e.direction === "DEBIT") debits += e.amountPaise;
        if (e.direction === "CREDIT") credits += e.amountPaise;
      }
      expect(debits).toBe(credits);
      expect(debits).toBe(200000);
    });

    it("1-TAP OTP RELEASE: rejects wrong OTP and protects client funds in escrow", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-wrong-${Date.now()}`,
      });

      await expect(
        milestoneEngine.verifyAndRelease1TapOTP({
          milestoneId: milestone.milestoneId,
          otp: "000000", // Incorrect OTP
          idempotencyKey: "wrong_otp_key",
        })
      ).rejects.toThrow("Invalid 6-digit OTP");

      // Verify funds remain safely locked in escrow
      const fresh = milestoneEngine.getMilestone(milestone.milestoneId);
      expect(fresh?.state).toBe("FUNDED_IN_ESCROW");
    });

    it("1-TAP OTP RELEASE: prevents double-release of an already paid milestone", async () => {
      const { milestone, plaintextOtp } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-dbl-${Date.now()}`,
      });

      await milestoneEngine.verifyAndRelease1TapOTP({
        milestoneId: milestone.milestoneId,
        otp: plaintextOtp,
        idempotencyKey: "first_release",
      });

      await expect(
        milestoneEngine.verifyAndRelease1TapOTP({
          milestoneId: milestone.milestoneId,
          otp: plaintextOtp,
          idempotencyKey: "second_release",
        })
      ).rejects.toThrow("already been released");
    });

    it("Dual Direct Release: client directly confirms and releases funds without OTP", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-direct-${Date.now()}`,
      });

      const { milestone: released, releaseResult } = await milestoneEngine.confirmAndReleaseDirect({
        milestoneId: milestone.milestoneId,
        clientId: milestone.clientId,
        idempotencyKey: `direct-confirm-${milestone.milestoneId}`,
      });

      expect(released.state).toBe("RELEASED_TO_TUTOR");
      expect(released.clientConfirmed).toBe(true);
      expect(releaseResult.amountReleasedPaise).toBe(188200);
    });

    it("blocks non-client from direct release", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-fraud-direct-${Date.now()}`,
      });

      await expect(
        milestoneEngine.confirmAndReleaseDirect({
          milestoneId: milestone.milestoneId,
          clientId: "imposter_user",
          idempotencyKey: "fraud_key",
        })
      ).rejects.toThrow("Unauthorized");
    });

    it("Dispute Flow: freezes milestone and prevents release while disputed", async () => {
      const { milestone, plaintextOtp } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-disp-${Date.now()}`,
      });

      milestoneEngine.raiseDispute({
        milestoneId: milestone.milestoneId,
        raisedBy: milestone.clientId,
        reason: "Tutor did not attend scheduled session",
      });

      const disputed = milestoneEngine.getMilestone(milestone.milestoneId);
      expect(disputed?.state).toBe("DISPUTED_LOCKED");

      // Attempted OTP release is blocked
      await expect(
        milestoneEngine.verifyAndRelease1TapOTP({
          milestoneId: milestone.milestoneId,
          otp: plaintextOtp,
          idempotencyKey: "blocked_release",
        })
      ).rejects.toThrow("frozen under active dispute");
    });

    it("Refund Flow: resolves dispute by issuing full nodal refund to client", async () => {
      const { milestone } = await milestoneEngine.createJobMilestone({
        ...validParams,
        idempotencyKey: `idemp-ref-${Date.now()}`,
      });

      milestoneEngine.raiseDispute({
        milestoneId: milestone.milestoneId,
        raisedBy: milestone.clientId,
        reason: "Mutual cancellation",
      });

      const { milestone: refunded, refundResult, ledgerTx } = await milestoneEngine.resolveDisputeAndRefund({
        milestoneId: milestone.milestoneId,
        reason: "Class cancelled by mutual consent",
        idempotencyKey: `refund-${milestone.milestoneId}`,
      });

      expect(refunded.state).toBe("REFUNDED_TO_CLIENT");
      expect(refundResult.status).toBe("REFUNDED");
      expect(refundResult.amountRefundedPaise).toBe(200000);

      // Verify double-entry refund transaction
      let debits = 0;
      let credits = 0;
      for (const e of ledgerTx.entries) {
        if (e.direction === "DEBIT") debits += e.amountPaise;
        if (e.direction === "CREDIT") credits += e.amountPaise;
      }
      expect(debits).toBe(credits);
      expect(debits).toBe(200000);
      expect(ledgerTx.eventType).toBe("MILESTONE_ESCROW_REFUNDED");
    });
  });

  describe("Zero Simulated Balances & Authentic Canonical Ledger Integration", () => {
    it("KingPay wallet balance strictly returns 0 for a brand new user (No Fake ₹5,000)", async () => {
      const newUserId = `fresh_user_${Date.now()}`;
      const balance = await canonicalLedger.getKingPayWalletBalancePaise(newUserId);
      expect(balance).toBe(0);
    });

    it("records top-up and reflects authentic balance strictly from ledger rows", async () => {
      const userId = `sovereign_user_${Date.now()}`;
      const topUpPaise = 150000; // ₹1,500.00

      const tx = await canonicalLedger.recordKingPayWalletTopUp({
        userId,
        amountPaise: topUpPaise,
        idempotencyKey: `topup-${userId}`,
        memo: "Bank deposit via UPI",
      });

      expect(tx.eventType).toBe("KINGPAY_WALLET_TOPUP");
      expect(tx.totalAmountPaise).toBe(topUpPaise);

      // Check balance is computed directly from ledger
      const balance = await canonicalLedger.getKingPayWalletBalancePaise(userId);
      expect(balance).toBe(topUpPaise);
    });

    it("rejects wallet payment when authentic balance is insufficient", async () => {
      const userId = `broke_user_${Date.now()}`;
      await expect(
        canonicalLedger.recordKingPayPayment({
          userId,
          recipientId: "merchant_pizza",
          amountPaise: 50000,
          idempotencyKey: `pay-${userId}`,
        })
      ).rejects.toThrow("Insufficient authentic wallet balance");
    });

    it("executes authentic wallet payment with double-entry debit and credit", async () => {
      const userId = `paying_user_${Date.now()}`;
      const merchantId = "rest_dosa_plaza";

      // Top-up ₹2,000
      await canonicalLedger.recordKingPayWalletTopUp({
        userId,
        amountPaise: 200000,
        idempotencyKey: `topup-${userId}`,
      });

      // Pay ₹750
      const paymentTx = await canonicalLedger.recordKingPayPayment({
        userId,
        recipientId: merchantId,
        amountPaise: 75000,
        idempotencyKey: `pay-${userId}-1`,
        memo: "Dosa & Filter Coffee",
      });

      expect(paymentTx.totalAmountPaise).toBe(75000);

      // Remaining balance = 200000 - 75000 = 125000 paise (₹1,250.00)
      const remainingBalance = await canonicalLedger.getKingPayWalletBalancePaise(userId);
      expect(remainingBalance).toBe(125000);
    });
  });
});
