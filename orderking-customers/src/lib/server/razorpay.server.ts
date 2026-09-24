import crypto from "node:crypto";
import { createServerFn } from "@tanstack/react-start";

export type RazorpayOrderRequest = {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type RazorpayOrderResponse = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  isMock: boolean;
};

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  return {
    keyId: keyId || "rzp_test_placeholder",
    keySecret: keySecret || "placeholder_secret",
    webhookSecret: webhookSecret || "placeholder_webhook",
    hasCredentials: !!(keyId && keySecret),
  };
}

/**
 * Creates a Razorpay Order for online UPI/Card payment.
 * Automatically falls back to zero-crash test mode if keys are not set.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: RazorpayOrderRequest) => data)
  .handler(async ({ data }: { data: RazorpayOrderRequest }): Promise<RazorpayOrderResponse> => {
    const config = getRazorpayConfig();

    if (!config.hasCredentials) {
      throw new Error("Razorpay credentials missing. Payment creation BLOCKED (Fail-Closed Enforcement).");
    }

    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: data.amountPaise,
        currency: data.currency || "INR",
        receipt: data.receipt,
        notes: data.notes || {},
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Razorpay order creation failed (${response.status}): ${err}`);
    }

    const resData = (await response.json()) as { id: string; amount: number; currency: string };
    return {
      orderId: resData.id,
      amountPaise: resData.amount,
      currency: resData.currency,
      keyId: config.keyId,
      isMock: false,
    };
  });

/**
 * Verifies Razorpay payment signature from client checkout modal.
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const config = getRazorpayConfig();
  if (!config.hasCredentials) {
    throw new Error("Razorpay credentials missing. Signature verification REJECTED (Fail-Closed Enforcement).");
  }

  const generatedSignature = crypto
    .createHmac("sha256", config.keySecret)
    .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === params.razorpaySignature;
}

/**
 * Verifies Razorpay Webhook signature sent in headers.
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const config = getRazorpayConfig();
  if (!config.hasCredentials) {
    throw new Error("Razorpay credentials missing. Webhook signature REJECTED (Fail-Closed Enforcement).");
  }

  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}
