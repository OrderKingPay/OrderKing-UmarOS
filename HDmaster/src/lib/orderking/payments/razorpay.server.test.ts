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
