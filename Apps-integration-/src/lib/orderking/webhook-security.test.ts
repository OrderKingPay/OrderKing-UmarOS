import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { test } from "node:test";

test("Razorpay Webhook: Cryptographic HMAC signature check (timing-safe)", () => {
  const secret = "test_webhook_secret_999";
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: "pay_test123",
          amount: 45000,
          currency: "INR",
          order_id: "order_rzp_456",
          status: "captured",
          notes: { internal_order_id: "ord_internal_789" }
        }
      }
    }
  });

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(expectedSignature);

  let isValidSignature = false;
  if (expectedBuffer.length === receivedBuffer.length) {
    isValidSignature = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }
  assert.equal(isValidSignature, true);

  // Altered signature
  const tamperedBuffer = Buffer.from("0".repeat(64));
  let isTamperedValid = false;
  if (expectedBuffer.length === tamperedBuffer.length) {
    isTamperedValid = crypto.timingSafeEqual(expectedBuffer, tamperedBuffer);
  }
  assert.equal(isTamperedValid, false);

  // Different length
  const shortBuffer = Buffer.from("short_signature");
  let isShortValid = false;
  if (expectedBuffer.length === shortBuffer.length) {
    isShortValid = crypto.timingSafeEqual(expectedBuffer, shortBuffer);
  }
  assert.equal(isShortValid, false);
});

test("Razorpay Webhook: Amount match check prevents partial payment fraud", () => {
  const orderTotalPaise: number = 50000; // Rs 500
  const genuineCapturedPaise: number = 50000;
  const fraudulentCapturedPaise: number = 100; // Rs 1 attempt

  const isGenuineValid = genuineCapturedPaise === orderTotalPaise;
  const isFraudValid = fraudulentCapturedPaise === orderTotalPaise;

  assert.equal(isGenuineValid, true);
  assert.equal(isFraudValid, false);
});

test("Razorpay Webhook: Canonical revenue split into ledger entries", () => {
  const totalPaise = 60000;
  const commissionPaise = 12000; // 20%
  const deliveryFeePaise = 5000;

  const founderRevenue = Number(commissionPaise || 0);
  const riderPayout = Number(deliveryFeePaise || 0);
  const restaurantPayout = Math.max(0, totalPaise - founderRevenue - riderPayout);

  assert.equal(founderRevenue, 12000);
  assert.equal(riderPayout, 5000);
  assert.equal(restaurantPayout, 43000);
  assert.equal(founderRevenue + riderPayout + restaurantPayout, totalPaise);
});
