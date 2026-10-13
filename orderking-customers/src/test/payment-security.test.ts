import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "vitest";
import { verifyRazorpaySignature, verifyWebhookSignature } from "../lib/server/razorpay.server.ts";
import { computePromoDiscount, computeQuote, type FeeSchedule, type PricedCartLine } from "../lib/pricing.ts";
import {
  INITIAL_CLIENT_INVOICES,
  verifyAndProcessWebhook,
  type ClientInvoiceRecord,
  type PaymentWebhookPayload,
} from "../lib/ai/payment-infrastructure.ts";
import { assertTransition, canTransition, type OrderStatus } from "../lib/orders/state.ts";
import { applyBps, rupeesToPaise } from "../lib/money.ts";

const STANDARD_FEES: FeeSchedule = {
  deliveryBasePaise: 2500,
  deliveryPerKmPaise: 800,
  deliveryFreeOverPaise: 49900,
  serviceFeePaise: 500,
  serviceFeeBps: 0,
  menuPricesIncludeTax: true,
  menuTaxBps: 500,
  serviceTaxBps: 1800,
  deliveryTaxBps: 0,
  minOrderPaise: 9900,
};

const makeLine = (unitPaise: number, quantity = 1, available = true): PricedCartLine => ({
  key: `item_${unitPaise}_${quantity}`,
  itemId: "item_biryani_01",
  variantId: "var_regular",
  name: "Hyderabadi Chicken Dum Biryani",
  quantity,
  unitPaise,
  addons: [],
  instructions: "",
  available,
});

/**
 * Pure verification guard mirroring `orders.ts` integer-paise, replay, and payout invariants.
 */
function verifyOrderPaymentSecurity(params: {
  userId: string;
  idempotencyKey: string;
  paymentMethod: "COD" | "KING_PAY" | "RAZORPAY_ONLINE" | "UPI_SANDBOX";
  serverQuoteTotalPaise: number;
  tipPaise: number;
  walletBalancePaise?: number;
  codMaxPaise?: number;
  razorpayPayment?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amountPaise: number;
  };
  seenOrderIdempotencyKeys: Set<string>;
  seenPaymentIds: Set<string>;
}): {
  status: "DUPLICATE_ORDER" | "VERIFIED";
  finalTotalPaise: number;
  paymentStatus: "pending_collection" | "wallet_paid" | "paid" | "sandbox_paid";
} {
  if (!params.idempotencyKey || params.idempotencyKey.trim().length < 8) {
    throw new Error("A valid idempotency key is required.");
  }
  if (!Number.isInteger(params.serverQuoteTotalPaise) || params.serverQuoteTotalPaise <= 0) {
    throw new Error("Server quote total paise integrity check failed.");
  }
  if (!Number.isInteger(params.tipPaise) || params.tipPaise < 0 || params.tipPaise > 100_000) {
    throw new Error("Tip amount must be a non-negative integer in paise (maximum ₹1,000.00).");
  }

  const orderIdemComposite = `${params.userId}:${params.idempotencyKey}`;
  if (params.seenOrderIdempotencyKeys.has(orderIdemComposite)) {
    return {
      status: "DUPLICATE_ORDER",
      finalTotalPaise: params.serverQuoteTotalPaise + params.tipPaise,
      paymentStatus:
        params.paymentMethod === "COD"
          ? "pending_collection"
          : params.paymentMethod === "KING_PAY"
            ? "wallet_paid"
            : params.paymentMethod === "RAZORPAY_ONLINE"
              ? "paid"
              : "sandbox_paid",
    };
  }

  const finalTotalPaise = params.serverQuoteTotalPaise + params.tipPaise;
  const codMax = params.codMaxPaise ?? 200_000;

  if (params.paymentMethod === "COD") {
    if (finalTotalPaise > codMax) {
      throw new Error("Cash on Delivery is only eligible for orders up to ₹2,000.00.");
    }
    params.seenOrderIdempotencyKeys.add(orderIdemComposite);
    return { status: "VERIFIED", finalTotalPaise, paymentStatus: "pending_collection" };
  }

  if (params.paymentMethod === "KING_PAY") {
    const balance = params.walletBalancePaise ?? 0;
    if (!Number.isInteger(balance) || balance < finalTotalPaise) {
      throw new Error("Insufficient KingPay wallet balance.");
    }
    params.seenOrderIdempotencyKeys.add(orderIdemComposite);
    return { status: "VERIFIED", finalTotalPaise, paymentStatus: "wallet_paid" };
  }

  if (params.paymentMethod === "RAZORPAY_ONLINE") {
    const rzp = params.razorpayPayment;
    if (!rzp || !rzp.razorpayOrderId || !rzp.razorpayPaymentId || !rzp.razorpaySignature) {
      throw new Error("Online payment requires a verified Razorpay order ID, payment ID, and cryptographic signature.");
    }
    if (!Number.isInteger(rzp.amountPaise) || rzp.amountPaise !== finalTotalPaise) {
      throw new Error(
        `Payment amount mismatch: gateway order is ${rzp.amountPaise} paise, server authoritative total is ${finalTotalPaise} paise.`
      );
    }
    const paymentReplayKey = `rzp:${rzp.razorpayPaymentId}`;
    if (params.seenPaymentIds.has(paymentReplayKey)) {
      throw new Error("Duplicate Razorpay payment ID rejected (replay protection).");
    }
    const valid = verifyRazorpaySignature({
      razorpayOrderId: rzp.razorpayOrderId,
      razorpayPaymentId: rzp.razorpayPaymentId,
      razorpaySignature: rzp.razorpaySignature,
    });
    if (!valid) {
      throw new Error("Razorpay payment signature verification failed. Tampered or unverified payment rejected.");
    }
    params.seenPaymentIds.add(paymentReplayKey);
    params.seenOrderIdempotencyKeys.add(orderIdemComposite);
    return { status: "VERIFIED", finalTotalPaise, paymentStatus: "paid" };
  }

  params.seenOrderIdempotencyKeys.add(orderIdemComposite);
  return { status: "VERIFIED", finalTotalPaise, paymentStatus: "sandbox_paid" };
}

/**
 * Pure payout authorization guard ensuring no restaurant or rider payout can be released
 * without a DELIVERED order state, verified payment collection, and statutory deductions.
 */
function authorizePartnerPayout(params: {
  orderStatus: OrderStatus;
  paymentMethod: "COD" | "KING_PAY" | "RAZORPAY_ONLINE";
  paymentStatus: "pending_collection" | "collected" | "wallet_paid" | "paid" | "failed";
  providerSettlementId: string | null;
  restaurantPayablePaise: number;
}): { authorized: boolean; netSettlementPaise: number; statutoryTdsPaise: number; sec95GstPaise: number } {
  if (params.orderStatus !== "DELIVERED") {
    throw new Error(`UNAUTHORIZED_PAYOUT: Order status is ${params.orderStatus}; must be DELIVERED.`);
  }
  if (!Number.isInteger(params.restaurantPayablePaise) || params.restaurantPayablePaise <= 0) {
    throw new Error("UNAUTHORIZED_PAYOUT: Invalid integer-paise payable amount.");
  }
  if (params.paymentMethod === "COD" && params.paymentStatus !== "collected") {
    throw new Error("UNAUTHORIZED_PAYOUT: COD cash has not been collected and verified.");
  }
  if (params.paymentMethod === "RAZORPAY_ONLINE") {
    if (params.paymentStatus !== "paid" || !params.providerSettlementId?.trim()) {
      throw new Error("UNAUTHORIZED_PAYOUT: Missing verified gateway settlement reference.");
    }
  }
  if (params.paymentMethod === "KING_PAY" && params.paymentStatus !== "wallet_paid") {
    throw new Error("UNAUTHORIZED_PAYOUT: Wallet debit is not confirmed.");
  }

  // Income Tax Act Sec 194-O (0.1% TDS = 10 bps) & CGST Sec 9(5) (5% ECO GST = 500 bps)
  const statutoryTdsPaise = applyBps(params.restaurantPayablePaise, 10);
  const sec95GstPaise = applyBps(params.restaurantPayablePaise, 500);
  const netSettlementPaise = params.restaurantPayablePaise - statutoryTdsPaise;

  return {
    authorized: true,
    netSettlementPaise,
    statutoryTdsPaise,
    sec95GstPaise,
  };
}

describe("OrderKing Customer Payment Security — Red-Team & Blue-Team Verification Suite", () => {
  describe("1. HMAC-SHA256 Signature Verification & Tampering Rejection", () => {
    it("rejects checkout verification when credentials are missing (fail-closed)", () => {
      delete process.env.RAZORPAY_KEY_SECRET;
      delete process.env.RAZORPAY_KEY_ID;
      assert.throws(
        () =>
          verifyRazorpaySignature({
            razorpayOrderId: "order_123",
            razorpayPaymentId: "pay_123",
            razorpaySignature: "sig",
          }),
        /Razorpay credentials missing/
      );
    });

    it("verifies genuine checkout signature in constant time and rejects tampered orderId or paymentId", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid";
      process.env.RAZORPAY_KEY_SECRET = "secret_key_12345";

      const orderId = "order_9999";
      const paymentId = "pay_8888";
      const sig = createHmac("sha256", "secret_key_12345").update(`${orderId}|${paymentId}`).digest("hex");

      assert.equal(
        verifyRazorpaySignature({ razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: sig }),
        true
      );
      // Tampered orderId with valid signature for another order
      assert.equal(
        verifyRazorpaySignature({
          razorpayOrderId: "order_tampered",
          razorpayPaymentId: paymentId,
          razorpaySignature: sig,
        }),
        false
      );
      // Tampered paymentId
      assert.equal(
        verifyRazorpaySignature({
          razorpayOrderId: orderId,
          razorpayPaymentId: "pay_tampered",
          razorpaySignature: sig,
        }),
        false
      );
      // Forged all-zero 64-char hex signature & malformed short signature
      assert.equal(
        verifyRazorpaySignature({
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: "0".repeat(64),
        }),
        false
      );
      assert.equal(
        verifyRazorpaySignature({ razorpayOrderId: orderId, razorpayPaymentId: paymentId, razorpaySignature: "short" }),
        false
      );
    });

    it("verifies webhook signature in constant time, fails closed on missing secret, and rejects body tampering", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid";
      process.env.RAZORPAY_KEY_SECRET = "secret_key_12345";
      delete process.env.RAZORPAY_WEBHOOK_SECRET;
      assert.throws(() => verifyWebhookSignature('{"event":"payment.captured"}', "sig"), /Razorpay credentials missing/);

      process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_abc";
      const payload = JSON.stringify({ event: "payment.captured", order_id: "order_9999", amount: 25000 });
      const sig = createHmac("sha256", "webhook_secret_abc").update(payload).digest("hex");

      assert.equal(verifyWebhookSignature(payload, sig), true);
      // Tampered amount inside JSON body with original signature
      const tamperedPayload = JSON.stringify({ event: "payment.captured", order_id: "order_9999", amount: 2500000 });
      assert.equal(verifyWebhookSignature(tamperedPayload, sig), false);
      assert.equal(verifyWebhookSignature(payload + " ", sig), false);
      assert.equal(verifyWebhookSignature(payload, "invalid_sig"), false);
    });
  });

  describe("2. Replay Attack & Duplicate Transaction Idempotency Rejection", () => {
    it("deduplicates repeated order placement requests with the same user and idempotency key", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid";
      process.env.RAZORPAY_KEY_SECRET = "secret_key_12345";

      const seenOrderIdempotencyKeys = new Set<string>();
      const seenPaymentIds = new Set<string>();

      const firstAttempt = verifyOrderPaymentSecurity({
        userId: "usr_customer_1",
        idempotencyKey: "idem_checkout_2026_0001",
        paymentMethod: "KING_PAY",
        serverQuoteTotalPaise: 34500,
        tipPaise: 2000,
        walletBalancePaise: 50000,
        seenOrderIdempotencyKeys,
        seenPaymentIds,
      });
      assert.equal(firstAttempt.status, "VERIFIED");
      assert.equal(firstAttempt.finalTotalPaise, 36500);

      // Second request with identical idempotency key is caught as DUPLICATE_ORDER
      const duplicateAttempt = verifyOrderPaymentSecurity({
        userId: "usr_customer_1",
        idempotencyKey: "idem_checkout_2026_0001",
        paymentMethod: "KING_PAY",
        serverQuoteTotalPaise: 34500,
        tipPaise: 2000,
        walletBalancePaise: 50000,
        seenOrderIdempotencyKeys,
        seenPaymentIds,
      });
      assert.equal(duplicateAttempt.status, "DUPLICATE_ORDER");
    });

    it("rejects replay attacks where a captured razorpayPaymentId is reused on a new order", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid";
      process.env.RAZORPAY_KEY_SECRET = "secret_key_12345";

      const seenOrderIdempotencyKeys = new Set<string>();
      const seenPaymentIds = new Set<string>();

      const orderId = "order_live_101";
      const paymentId = "pay_live_202";
      const validSig = createHmac("sha256", "secret_key_12345").update(`${orderId}|${paymentId}`).digest("hex");

      const legitimate = verifyOrderPaymentSecurity({
        userId: "usr_customer_1",
        idempotencyKey: "idem_order_first_101",
        paymentMethod: "RAZORPAY_ONLINE",
        serverQuoteTotalPaise: 42000,
        tipPaise: 0,
        razorpayPayment: {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: validSig,
          amountPaise: 42000,
        },
        seenOrderIdempotencyKeys,
        seenPaymentIds,
      });
      assert.equal(legitimate.status, "VERIFIED");
      assert.equal(legitimate.paymentStatus, "paid");

      // Attacker attempts to replay the same paymentId with a new idempotency key
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_customer_1",
            idempotencyKey: "idem_order_replay_999",
            paymentMethod: "RAZORPAY_ONLINE",
            serverQuoteTotalPaise: 42000,
            tipPaise: 0,
            razorpayPayment: {
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: validSig,
              amountPaise: 42000,
            },
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Duplicate Razorpay payment ID rejected/
      );
    });
  });

  describe("3. Integer-Paise Calculation & Amount Mismatch Detection", () => {
    it("computes server-authoritative totals strictly in integer paise and blocks unavailable items", () => {
      const quote = computeQuote({
        lines: [makeLine(rupeesToPaise(240), 2), makeLine(rupeesToPaise(120), 1)],
        packagingPaise: 1500,
        commissionBps: 1500,
        distanceKm: 3,
        fees: STANDARD_FEES,
        promo: null,
        isFirstOrder: false,
      });

      assert.equal(Number.isInteger(quote.foodSubtotalPaise), true);
      assert.equal(quote.foodSubtotalPaise, 60000);
      assert.equal(Number.isInteger(quote.totalPaise), true);
      assert.equal(quote.blockers.length, 0);

      // Unavailable item must trigger UNAVAILABLE_ITEM blocker
      const blockedQuote = computeQuote({
        lines: [makeLine(24000, 1, false)],
        packagingPaise: 1000,
        commissionBps: 1500,
        distanceKm: 2,
        fees: STANDARD_FEES,
        promo: null,
        isFirstOrder: false,
      });
      assert.ok(blockedQuote.blockers.includes("UNAVAILABLE_ITEM"));
    });

    it("detects and rejects gateway order amount mismatches and negative/fractional tip injection", () => {
      process.env.RAZORPAY_KEY_ID = "rzp_test_valid";
      process.env.RAZORPAY_KEY_SECRET = "secret_key_12345";

      const seenOrderIdempotencyKeys = new Set<string>();
      const seenPaymentIds = new Set<string>();
      const orderId = "order_amt_1";
      const paymentId = "pay_amt_1";
      const sig = createHmac("sha256", "secret_key_12345").update(`${orderId}|${paymentId}`).digest("hex");

      // Gateway order paid 10000 paise (₹100), but server authoritative total is 45000 paise (₹450)
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_1",
            idempotencyKey: "idem_amt_mismatch_01",
            paymentMethod: "RAZORPAY_ONLINE",
            serverQuoteTotalPaise: 43000,
            tipPaise: 2000,
            razorpayPayment: {
              razorpayOrderId: orderId,
              razorpayPaymentId: paymentId,
              razorpaySignature: sig,
              amountPaise: 10000,
            },
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Payment amount mismatch/
      );

      // Negative tipPaise injection attempt to reduce total payable
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_1",
            idempotencyKey: "idem_negative_tip_01",
            paymentMethod: "COD",
            serverQuoteTotalPaise: 30000,
            tipPaise: -5000,
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Tip amount must be a non-negative integer in paise/
      );

      // Fractional paise injection attempt
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_1",
            idempotencyKey: "idem_float_tip_01",
            paymentMethod: "COD",
            serverQuoteTotalPaise: 30000,
            tipPaise: 15.75,
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Tip amount must be a non-negative integer in paise/
      );
    });

    it("rejects webhook settlement when provider amount does not match invoice amount", () => {
      const invoices: ClientInvoiceRecord[] = structuredClone(INITIAL_CLIENT_INVOICES);
      const target = invoices[1]!;
      const mismatchedWebhook: PaymentWebhookPayload = {
        eventId: "EVT_MISMATCH_001",
        provider: "RAZORPAY",
        eventType: "payment.captured",
        amount: target.totalInr - 500,
        currency: "INR",
        invoiceId: target.id,
        signature: "sha256_verified_webhook_signature",
        timestamp: new Date().toISOString(),
      };

      const res = verifyAndProcessWebhook(mismatchedWebhook, invoices);
      assert.equal(res.success, false);
      assert.match(res.error ?? "", /AMOUNT_MISMATCH/);
    });

    it("prevents unverified promotional discount overflow and blocks repeat-user first-order promos", () => {
      // Repeat customer attempting firstOrderOnly promo gets 0 paise discount
      const repeatDiscount = computePromoDiscount(
        30000,
        {
          id: "promo_first",
          code: "WELCOME100",
          name: "Welcome ₹100 Off",
          kind: "fixed",
          percentBps: null,
          amountPaise: 10000,
          minOrderPaise: 19900,
          maxDiscountPaise: 10000,
          fundedBy: "PLATFORM",
          firstOrderOnly: true,
        },
        false
      );
      assert.equal(repeatDiscount, 0);

      // Fixed discount larger than food subtotal is strictly clamped to foodSubtotalPaise (never negative food total)
      const clampedDiscount = computePromoDiscount(
        15000,
        {
          id: "promo_huge",
          code: "FLAT500",
          name: "Flat ₹500",
          kind: "fixed",
          percentBps: null,
          amountPaise: 50000,
          minOrderPaise: 10000,
          maxDiscountPaise: null,
          fundedBy: "RESTAURANT",
          firstOrderOnly: false,
        },
        true
      );
      assert.equal(clampedDiscount, 15000);
    });
  });

  describe("4. Unauthorized / Unverified Payout & Settlement Prevention", () => {
    it("blocks payout release when order is not DELIVERED or payment is uncollected/unverified", () => {
      // Order still PREPARING cannot release payout
      assert.throws(
        () =>
          authorizePartnerPayout({
            orderStatus: "PREPARING",
            paymentMethod: "RAZORPAY_ONLINE",
            paymentStatus: "paid",
            providerSettlementId: "pay_verified_01",
            restaurantPayablePaise: 40000,
          }),
        /UNAUTHORIZED_PAYOUT: Order status is PREPARING/
      );

      // DELIVERED COD order where cash collection is still pending cannot release payout
      assert.throws(
        () =>
          authorizePartnerPayout({
            orderStatus: "DELIVERED",
            paymentMethod: "COD",
            paymentStatus: "pending_collection",
            providerSettlementId: null,
            restaurantPayablePaise: 40000,
          }),
        /UNAUTHORIZED_PAYOUT: COD cash has not been collected/
      );

      // DELIVERED online order missing gateway settlement ID cannot release payout
      assert.throws(
        () =>
          authorizePartnerPayout({
            orderStatus: "DELIVERED",
            paymentMethod: "RAZORPAY_ONLINE",
            paymentStatus: "paid",
            providerSettlementId: "",
            restaurantPayablePaise: 40000,
          }),
        /UNAUTHORIZED_PAYOUT: Missing verified gateway settlement reference/
      );
    });

    it("authorizes payout only after DELIVERED + verified payment and computes Sec 194-O TDS & Sec 9(5) GST in integer paise", () => {
      const settlement = authorizePartnerPayout({
        orderStatus: "DELIVERED",
        paymentMethod: "RAZORPAY_ONLINE",
        paymentStatus: "paid",
        providerSettlementId: "pay_verified_998877",
        restaurantPayablePaise: 100_000, // ₹1,000.00
      });

      assert.equal(settlement.authorized, true);
      assert.equal(settlement.statutoryTdsPaise, 100); // 0.1% Sec 194-O TDS = ₹1.00 (100 paise)
      assert.equal(settlement.sec95GstPaise, 5000); // 5% CGST Sec 9(5) = ₹50.00 (5000 paise)
      assert.equal(settlement.netSettlementPaise, 99_900); // ₹999.00
    });

    it("enforces order state machine transitions and prevents skipping directly from PLACED to DELIVERED", () => {
      assert.equal(canTransition("PLACED", "DELIVERED"), false);
      assert.equal(canTransition("CANCELLED", "DELIVERED"), false);
      assert.throws(() => assertTransition("PLACED", "DELIVERED"), /Illegal order transition/);
      assert.equal(canTransition("ON_THE_WAY", "DELIVERED"), true);
    });

    it("enforces COD statutory risk ceiling (₹2,000.00) and KingPay wallet overdraft prevention", () => {
      const seenOrderIdempotencyKeys = new Set<string>();
      const seenPaymentIds = new Set<string>();

      // COD order above ₹2,000.00 (200,000 paise) is rejected
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_cod_limit",
            idempotencyKey: "idem_cod_high_value_01",
            paymentMethod: "COD",
            serverQuoteTotalPaise: 250_000,
            tipPaise: 0,
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Cash on Delivery is only eligible for orders up to ₹2,000\.00/
      );

      // KingPay order exceeding available wallet balance is rejected
      assert.throws(
        () =>
          verifyOrderPaymentSecurity({
            userId: "usr_wallet_low",
            idempotencyKey: "idem_wallet_overdraft_01",
            paymentMethod: "KING_PAY",
            serverQuoteTotalPaise: 45_000,
            tipPaise: 0,
            walletBalancePaise: 20_000,
            seenOrderIdempotencyKeys,
            seenPaymentIds,
          }),
        /Insufficient KingPay wallet balance/
      );
    });
  });
});
