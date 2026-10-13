import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay.server.ts";

describe("Razorpay signature verification", () => {
  it("accepts a valid checkout signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    const signature = createHmac("sha256", "test-secret").update("order_1|pay_1").digest("hex");
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature }), true);
  });

  it("rejects a tampered checkout signature", () => {
    process.env.RAZORPAY_KEY_SECRET = "test-secret";
    assert.equal(verifyCheckoutSignature({ orderId: "order_1", paymentId: "pay_1", signature: "0".repeat(64) }), false);
  });

  it("accepts the exact raw webhook body signature", () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "webhook-secret";
    const body = JSON.stringify({ id: "evt_1", event: "payment.captured" });
    const signature = createHmac("sha256", "webhook-secret").update(body).digest("hex");
    assert.equal(verifyWebhookSignature(body, signature), true);
    assert.equal(verifyWebhookSignature(body + " ", signature), false);
  });
});

describe("Timing-safe Webhook Signature Verifiers (crypto-webhook)", async () => {
  const { verifyRazorpayWebhook, verifyStripeWebhook, verifyPayoneerWebhook } = await import("./crypto-webhook.ts");

  it("verifyRazorpayWebhook accepts genuine signature and throws on tampered signature", () => {
    const payload = JSON.stringify({ event: "payment.captured", amount: 50000 });
    const secret = "rzp_secret_xyz";
    const sig = createHmac("sha256", secret).update(payload).digest("hex");
    
    assert.equal(verifyRazorpayWebhook(payload, sig, secret), true);
    assert.throws(() => verifyRazorpayWebhook(payload, sig + "bad", secret), /Invalid Razorpay webhook signature/);
    assert.throws(() => verifyRazorpayWebhook(payload, "0".repeat(64), secret), /Invalid Razorpay webhook signature/);
  });

  it("verifyStripeWebhook accepts valid v1 signature with timestamp and rejects tampered", () => {
    const payload = JSON.stringify({ id: "evt_123", type: "payment_intent.succeeded" });
    const secret = "whsec_stripe_test";
    const t = Math.floor(Date.now() / 1000).toString();
    const sig = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
    const header = `t=${t},v1=${sig}`;

    assert.equal(verifyStripeWebhook(payload, header, secret), true);
    assert.throws(() => verifyStripeWebhook(payload, `t=${t},v1=${"f".repeat(64)}`, secret), /Invalid Stripe webhook signature/);
  });

  it("verifyPayoneerWebhook accepts genuine signature and rejects forged ones", () => {
    const payload = JSON.stringify({ payment_id: "pay_1", status: "COMPLETED" });
    const secret = "payoneer_secret";
    const sig = createHmac("sha256", secret).update(payload).digest("hex");

    assert.equal(verifyPayoneerWebhook(payload, sig, secret), true);
    assert.throws(() => verifyPayoneerWebhook(payload, "bad_sig", secret), /Invalid Payoneer webhook signature/);
  });
});
