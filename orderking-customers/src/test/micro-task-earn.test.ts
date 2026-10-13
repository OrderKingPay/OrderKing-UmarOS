import { describe, it, expect } from "vitest";
import {
  MicroTaskEngine,
  microTaskEngine,
  TASK_DEFINITIONS,
  quoteCrownPromotionalCredits,
  quoteEligibleFoodDiscount,
} from "../lib/earn/micro-tasks.ts";

describe("Crown Promotional Credits & Fail-Closed Micro-Task Security Engine", () => {
  const testCustomerId = "cust_test_alpha_01";

  describe("1. Task Definitions & Honest Availability", () => {
    it("marks all illustrative community tasks as NOT_OPEN with no unbacked cash promises", () => {
      expect(TASK_DEFINITIONS.REST_PHOTO_VERIFICATION.availability).toBe("NOT_OPEN");
      expect(TASK_DEFINITIONS.REST_PHOTO_VERIFICATION.evidenceType).toBe("photo_url");

      expect(TASK_DEFINITIONS.MENU_ITEM_REVIEW.availability).toBe("NOT_OPEN");
      expect(TASK_DEFINITIONS.MENU_ITEM_REVIEW.evidenceType).toBe("review_text");

      expect(TASK_DEFINITIONS.COMMUNITY_REFERRAL.availability).toBe("NOT_OPEN");
      expect(TASK_DEFINITIONS.COMMUNITY_REFERRAL.evidenceType).toBe("referral_code");

      expect(TASK_DEFINITIONS.SURVEY.availability).toBe("NOT_OPEN");
      expect(TASK_DEFINITIONS.SURVEY.evidenceType).toBe("survey_answers");
    });
  });

  describe("2. Founder-Margin-Protected Promotional Credit Quotes", () => {
    it("rejects promotional credits when commission is not verified settled", () => {
      const quote = quoteCrownPromotionalCredits({
        verifiedSettled: false,
        settledCommissionPaise: 10000,
        providerFeePaise: 500,
        taxPaise: 1800,
        refundReservePaise: 500,
        serviceCostPaise: 1000,
        founderRetainedMinimumPaise: 2000,
      });
      expect(quote.eligibleForConsideration).toBe(false);
      expect(quote.maxPromotionalCreditPaise).toBe(0);
    });

    it("caps promotional credits by rewardShareBps and preserves founder retained minimum", () => {
      // Net = 10000 - 500 - 1500 - 500 - 1500 = 6000 paise
      // Founder reserve = 2000 paise -> distributable excess = 4000 paise
      // 15% of 6000 = 900 paise
      const quote = quoteCrownPromotionalCredits({
        verifiedSettled: true,
        settledCommissionPaise: 10000,
        providerFeePaise: 500,
        taxPaise: 1500,
        refundReservePaise: 500,
        serviceCostPaise: 1500,
        founderRetainedMinimumPaise: 2000,
        rewardShareBps: 1500,
      });
      expect(quote.eligibleForConsideration).toBe(true);
      expect(quote.maxPromotionalCreditPaise).toBe(900);
      expect(quote.founderContributionAfterCreditPaise).toBe(5100);
    });

    it("rejects rewardShareBps above 20% (2000 bps)", () => {
      expect(() =>
        quoteCrownPromotionalCredits({
          verifiedSettled: true,
          settledCommissionPaise: 10000,
          providerFeePaise: 0,
          taxPaise: 0,
          refundReservePaise: 0,
          serviceCostPaise: 0,
          founderRetainedMinimumPaise: 1000,
          rewardShareBps: 2500,
        })
      ).toThrow(/Maximum is 20%/);
    });
  });

  describe("3. Eligible Food Order Discount Enforcement", () => {
    it("returns 0 discount for ineligible orders or when contribution is below founder minimum", () => {
      expect(
        quoteEligibleFoodDiscount({
          eligibleOrder: false,
          verifiedPostedCreditPaise: 2000,
          unredeemedCreditPaise: 2000,
          payableFoodSubtotalPaise: 25000,
          confirmedOrderContributionPaise: 5000,
          founderRetainedMinimumPaise: 2000,
        })
      ).toBe(0);

      expect(
        quoteEligibleFoodDiscount({
          eligibleOrder: true,
          verifiedPostedCreditPaise: 2000,
          unredeemedCreditPaise: 2000,
          payableFoodSubtotalPaise: 25000,
          confirmedOrderContributionPaise: 1500,
          founderRetainedMinimumPaise: 2000,
        })
      ).toBe(0);
    });

    it("caps food discount at the lowest of posted credit, unredeemed credit, subtotal, and excess contribution", () => {
      const discount = quoteEligibleFoodDiscount({
        eligibleOrder: true,
        verifiedPostedCreditPaise: 3000,
        unredeemedCreditPaise: 2500,
        payableFoodSubtotalPaise: 20000,
        confirmedOrderContributionPaise: 4000,
        founderRetainedMinimumPaise: 2200, // max excess = 1800
      });
      expect(discount).toBe(1800);
    });
  });

  describe("4. Legacy MicroTaskEngine Fail-Closed Invariants", () => {
    it("prevents client-side self-approval, unbacked wallet balances, and automatic cash payouts", () => {
      const engine = new MicroTaskEngine();
      expect(engine.getWalletBalance(testCustomerId)).toEqual({
        balancePaise: 0,
        balanceRupees: 0,
      });
      expect(engine.getCustomerLedger(testCustomerId)).toEqual([]);
      expect(engine.canClaimTask(testCustomerId, "SURVEY").allowed).toBe(false);
      expect(() => engine.claimTask()).toThrow();
      expect(() => engine.submitTaskEvidence()).toThrow();
      expect(() => engine.verifyTask()).toThrow(/Client-controlled task approval is forbidden/);
      expect(() => engine.payoutTask()).toThrow(/Unbacked payouts are disabled/);
      expect(() => microTaskEngine.completeAndPayoutMicroTask()).toThrow(
        /Automatic cash rewards are disabled/
      );
    });
  });
});
