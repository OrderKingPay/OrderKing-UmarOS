import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  CANCELLATION_PENALTY_CONFIG,
  calculateMerchantCancellationPenalty,
  KPT_PENALTY_CONFIG,
  calculateKptDelayPenalty,
  CHARGEBACK_CONFIG,
  calculateCustomerDisputeChargeback,
  CIRCUIT_BREAKER_CONFIG,
  kitchenCircuitBreaker,
} from "./penalties.ts";
import { computeRestaurantPayable } from "./money.ts";

describe("merchant behavioral penalty system & operational circuit breaker", () => {
  beforeEach(() => {
    kitchenCircuitBreaker.resetAll();
  });

  describe("1. Merchant-Initiated Order Cancellation", () => {
    it("debits 100% order food value or fixed tier (₹150 to ₹500) from merchant ledger", () => {
      // Order 1: Small order (₹100 food = 10,000 paise). Tier 1 standard penalty is ₹150 (15,000 paise).
      // Max policy debits ₹150 (fixed tier).
      const resSmall = calculateMerchantCancellationPenalty({
        orderId: "ord_cancel_01",
        restaurantId: "rest_01",
        foodValuePaise: 10000,
        tier: "TIER_1_STANDARD",
      });
      assert.equal(resSmall.fixedTierPaise, 15000); // ₹150
      assert.equal(resSmall.penaltyDebitedPaise, 15000); // Max(10000, 15000) = 15000
      assert.equal(resSmall.reasonCode, "MERCHANT_CANCELLATION_PENALTY");

      // Order 2: Large order (₹650 food = 65,000 paise). Tier 1 fixed tier is ₹150.
      // Max policy debits 100% food value (₹650 = 65,000 paise).
      const resLarge = calculateMerchantCancellationPenalty({
        orderId: "ord_cancel_02",
        restaurantId: "rest_01",
        foodValuePaise: 65000,
        tier: "TIER_1_STANDARD",
      });
      assert.equal(resLarge.fixedTierPaise, 15000);
      assert.equal(resLarge.penaltyDebitedPaise, 65000); // 100% food value

      // Order 3: Peak tier (₹300 fixed)
      const resPeak = calculateMerchantCancellationPenalty({
        orderId: "ord_cancel_03",
        restaurantId: "rest_01",
        foodValuePaise: 20000,
        tier: "TIER_2_PEAK",
      });
      assert.equal(resPeak.fixedTierPaise, 30000); // ₹300
      assert.equal(resPeak.penaltyDebitedPaise, 30000);

      // Order 4: Chronic tier (₹500 fixed)
      const resChronic = calculateMerchantCancellationPenalty({
        orderId: "ord_cancel_04",
        restaurantId: "rest_01",
        foodValuePaise: 40000,
        tier: "TIER_3_CHRONIC",
      });
      assert.equal(resChronic.fixedTierPaise, 50000); // ₹500
      assert.equal(resChronic.penaltyDebitedPaise, 50000);
    });

    it("enforces fixed tier range bounds between ₹150 and ₹500 (15,000 to 50,000 paise)", () => {
      assert.equal(CANCELLATION_PENALTY_CONFIG.MIN_FIXED_TIER_PAISE, 15000);
      assert.equal(CANCELLATION_PENALTY_CONFIG.MAX_FIXED_TIER_PAISE, 50000);

      // Custom fixed tier within bounds
      const resCustom = calculateMerchantCancellationPenalty({
        orderId: "ord_custom_01",
        restaurantId: "rest_01",
        foodValuePaise: 10000,
        customFixedTierPaise: 25000, // ₹250
      });
      assert.equal(resCustom.penaltyDebitedPaise, 25000);

      // Out of bounds (< ₹150 or > ₹500) must throw
      assert.throws(
        () =>
          calculateMerchantCancellationPenalty({
            orderId: "ord_err_1",
            restaurantId: "rest_01",
            foodValuePaise: 10000,
            customFixedTierPaise: 10000, // ₹100 < ₹150
          }),
        /Fixed tier penalty must be between/
      );

      assert.throws(
        () =>
          calculateMerchantCancellationPenalty({
            orderId: "ord_err_2",
            restaurantId: "rest_01",
            foodValuePaise: 10000,
            customFixedTierPaise: 60000, // ₹600 > ₹500
          }),
        /Fixed tier penalty must be between/
      );
    });

    it("integrates cancellation debit directly with merchant settlement ledger", () => {
      const penalty = calculateMerchantCancellationPenalty({
        orderId: "ord_settle_01",
        restaurantId: "rest_01",
        foodValuePaise: 25000, // ₹250
        tier: "TIER_1_STANDARD", // ₹150 fixed
      });

      // Merchant receives settlement calculation with cancellation penalty debited
      const s = computeRestaurantPayable({
        foodValuePaise: 50000,
        packingPaise: 0,
        restaurantDiscountPaise: 0,
        platformFundedDiscountPaise: 0,
        commissionBps: 2800,
        penaltiesPaise: penalty.penaltyDebitedPaise, // ₹250 (25000 paise) debited
      });

      assert.equal(s.penaltiesPaise, 25000);
      // Commission 28% = 14000, GST on comm = 2520, TCS = 250, TDS = 50
      // Normal deductions = 16820. With penalty: 16820 + 25000 = 41820
      assert.equal(s.totalDeductionsPaise, 41820);
      assert.equal(s.restaurantPayablePaise, 50000 - 41820); // 8180 paise
    });
  });

  describe("2. Kitchen Prep Time (KPT) Delay Penalty", () => {
    it("waives delay penalty when preparation delay is within the 10-minute grace buffer", () => {
      assert.equal(KPT_PENALTY_CONFIG.GRACE_PERIOD_MINUTES, 10);
      assert.equal(KPT_PENALTY_CONFIG.PENALTY_PER_MINUTE_PAISE, 500); // ₹5/min

      // Promised: 20 min, Actual: 28 min -> Delay = 8 min (<= 10 min grace)
      const res = calculateKptDelayPenalty({
        orderId: "ord_kpt_01",
        restaurantId: "rest_01",
        promisedKptMinutes: 20,
        actualPrepMinutes: 28,
      });

      assert.equal(res.delayMinutes, 8);
      assert.equal(res.billableDelayMinutes, 0);
      assert.equal(res.penaltyDebitedPaise, 0);
      assert.equal(res.riderCompensationPaise, 0);
      assert.equal(res.isPenaltyApplicable, false);
    });

    it("charges ₹5/min (500 paise/min) for excess delay beyond 10 minutes to compensate waiting rider", () => {
      // Promised: 20 min, Actual: 45 min -> Delay = 25 min (> 10 min grace).
      // Excess delay = 25 - 10 = 15 minutes.
      // Penalty: 15 min × 500 paise/min = 7,500 paise (₹75.00).
      const res = calculateKptDelayPenalty({
        orderId: "ord_kpt_02",
        restaurantId: "rest_01",
        promisedKptMinutes: 20,
        actualPrepMinutes: 45,
      });

      assert.equal(res.delayMinutes, 25);
      assert.equal(res.graceBufferMinutes, 10);
      assert.equal(res.billableDelayMinutes, 15);
      assert.equal(res.ratePerMinutePaise, 500);
      assert.equal(res.penaltyDebitedPaise, 7500); // ₹75.00
      assert.equal(res.riderCompensationPaise, 7500); // 100% routed to rider
      assert.equal(res.compensationTarget, "WAITING_RIDER");
      assert.equal(res.reasonCode, "KPT_DELAY_PENALTY");
    });
  });

  describe("3. Customer Quality & Missing Item Chargebacks", () => {
    it("holds dispute debit when customer complaint is pending review or unverified", () => {
      const resUnverified = calculateCustomerDisputeChargeback({
        disputeId: "disp_01",
        orderId: "ord_01",
        restaurantId: "rest_01",
        category: "MISSING_ITEM",
        itemValuePaise: 35000, // ₹350 item
        isVerifiedWithProof: false,
      });

      assert.equal(resUnverified.isVerifiedWithProof, false);
      assert.equal(resUnverified.isDebited, false);
      assert.equal(resUnverified.totalDebitedPaise, 0);
      assert.equal(resUnverified.disputeHandlingFeePaise, 0);
    });

    it("debits 100% item value + ₹50 dispute handling fee when complaint is verified with proof", () => {
      assert.equal(CHARGEBACK_CONFIG.DISPUTE_HANDLING_FEE_PAISE, 5000); // ₹50.00

      // Customer ordered Biryani (₹350.00 = 35000 paise). Item missing, verified with unboxing video/photo.
      const resVerified = calculateCustomerDisputeChargeback({
        disputeId: "disp_02",
        orderId: "ord_02",
        restaurantId: "rest_01",
        category: "MISSING_ITEM",
        itemValuePaise: 35000,
        isVerifiedWithProof: true,
        proofDocumentUrls: ["https://cdn.orderking.in/disputes/disp_02_proof.jpg"],
      });

      assert.equal(resVerified.isVerifiedWithProof, true);
      assert.equal(resVerified.isDebited, true);
      assert.equal(resVerified.itemValuePaise, 35000); // 100% item value
      assert.equal(resVerified.disputeHandlingFeePaise, 5000); // ₹50 handling fee
      assert.equal(resVerified.totalDebitedPaise, 40000); // ₹400.00 total debit
      assert.equal(resVerified.reasonCode, "MISSING_ITEM_CHARGEBACK");

      // Spoiled food quality complaint verified with photo
      const resQuality = calculateCustomerDisputeChargeback({
        disputeId: "disp_03",
        orderId: "ord_03",
        restaurantId: "rest_01",
        category: "QUALITY_SPOILED",
        itemValuePaise: 20000, // ₹200.00
        isVerifiedWithProof: true,
      });
      assert.equal(resQuality.totalDebitedPaise, 25000); // ₹200 item + ₹50 fee = ₹250
      assert.equal(resQuality.reasonCode, "CUSTOMER_QUALITY_CHARGEBACK");
    });
  });

  describe("4. Auto-Pause Circuit Breaker (Missed Orders & 60s Ring Timeout)", () => {
    it("keeps kitchen online on 1 or 2 missed orders", () => {
      assert.equal(CIRCUIT_BREAKER_CONFIG.RING_TIMEOUT_SECONDS, 60);
      assert.equal(CIRCUIT_BREAKER_CONFIG.CONSECUTIVE_MISSED_THRESHOLD, 3);

      const r1 = kitchenCircuitBreaker.registerMissedOrder("rest_cb_01", "ord_m_1", 60);
      assert.equal(r1.circuitTripped, false);
      assert.equal(r1.state.consecutiveMissedCount, 1);
      assert.equal(r1.state.kitchenStatus, "ONLINE");

      const r2 = kitchenCircuitBreaker.registerMissedOrder("rest_cb_01", "ord_m_2", 60);
      assert.equal(r2.circuitTripped, false);
      assert.equal(r2.state.consecutiveMissedCount, 2);
      assert.equal(r2.state.kitchenStatus, "ONLINE");
    });

    it("automatically triggers circuit breaker and pauses kitchen on 3 consecutive missed orders", () => {
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_02", "ord_m_1", 60);
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_02", "ord_m_2", 60);
      const r3 = kitchenCircuitBreaker.registerMissedOrder("rest_cb_02", "ord_m_3", 60);

      assert.equal(r3.circuitTripped, true);
      assert.equal(r3.state.consecutiveMissedCount, 3);
      assert.equal(r3.state.isCircuitBroken, true);
      assert.equal(r3.state.kitchenStatus, "TEMPORARILY_OFFLINE_BUSY");
      assert.ok(r3.alertMessage?.includes("CIRCUIT BREAKER TRIGGERED"));
    });

    it("resets consecutive counter to 0 when an order is accepted before 3rd timeout", () => {
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_03", "ord_m_1", 60);
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_03", "ord_m_2", 60);

      // Kitchen accepts 3rd incoming order
      const stateAfterAccept = kitchenCircuitBreaker.recordOrderAccepted("rest_cb_03");
      assert.equal(stateAfterAccept.consecutiveMissedCount, 0);
      assert.equal(stateAfterAccept.isCircuitBroken, false);
      assert.equal(stateAfterAccept.kitchenStatus, "ONLINE");
    });

    it("allows explicit kitchen resumption after circuit breaker trip", () => {
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_04", "ord_m_1", 60);
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_04", "ord_m_2", 60);
      kitchenCircuitBreaker.registerMissedOrder("rest_cb_04", "ord_m_3", 60);

      // Status is paused
      const statusPaused = kitchenCircuitBreaker.getStatus("rest_cb_04");
      assert.equal(statusPaused.isCircuitBroken, true);
      assert.equal(statusPaused.kitchenStatus, "TEMPORARILY_OFFLINE_BUSY");

      // Merchant taps Resume Kitchen
      const resumed = kitchenCircuitBreaker.resumeKitchen("rest_cb_04");
      assert.equal(resumed.isCircuitBroken, false);
      assert.equal(resumed.consecutiveMissedCount, 0);
      assert.equal(resumed.kitchenStatus, "ONLINE");
    });
  });
});
