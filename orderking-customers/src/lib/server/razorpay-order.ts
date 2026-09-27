// Re-export createRazorpayOrder server function for client-side RPC invocation.
// The actual implementation stays in razorpay.server.ts (server-only).
// TanStack Start createServerFn() is designed to be called from client code,
// but the import must NOT come from a .server.ts file directly.

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
  isSandbox: boolean;
};

/**
 * Creates a Razorpay Order for online UPI/Card payment.
 * This is the client-callable RPC bridge. The handler runs server-side only.
 */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .validator((data: RazorpayOrderRequest) => data)
  .handler(async ({ data }: { data: RazorpayOrderRequest }): Promise<RazorpayOrderResponse> => {
    // Dynamic import keeps node:crypto out of client bundle
    const { getRazorpayConfig } = await import("./razorpay.server");

    const config = getRazorpayConfig();

    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
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
      isSandbox: false,
    };
  });


export type VerifyRazorpayPaymentRequest = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  expectedAmountPaise: number;
};

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .validator((data: VerifyRazorpayPaymentRequest) => data)
  .handler(async ({ data }) => {
    const { getRazorpayConfig, verifyRazorpaySignature } = await import("./razorpay.server");
    const config = getRazorpayConfig();

    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
      throw new Error("Razorpay credentials missing. Payment verification BLOCKED.");
    }

    if (!data.razorpayOrderId || !data.razorpayPaymentId || !data.razorpaySignature) {
      throw new Error("Incomplete Razorpay payment verification data.");
    }

    const signatureValid = verifyRazorpaySignature(data);
    if (!signatureValid) throw new Error("Razorpay signature verification failed.");

    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(data.razorpayPaymentId)}`,
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown Razorpay error");
      throw new Error(`Razorpay payment lookup failed (${response.status}): ${errorText}`);
    }

    const payment = (await response.json()) as {
      id?: string;
      order_id?: string;
      status?: string;
      amount?: number;
      currency?: string;
    };

    if (payment.id !== data.razorpayPaymentId) {
      throw new Error("Razorpay payment identity mismatch.");
    }
    if (payment.order_id !== data.razorpayOrderId) {
      throw new Error("Razorpay order identity mismatch.");
    }
    if (payment.status !== "captured") {
      throw new Error(`Razorpay payment is not captured (status: ${payment.status ?? "unknown"}).`);
    }
    if (Number(payment.amount) !== Number(data.expectedAmountPaise)) {
      throw new Error("Razorpay captured amount does not match the order total.");
    }
    if (payment.currency !== "INR") {
      throw new Error("Unexpected Razorpay payment currency.");
    }

    return {
      verified: true as const,
      razorpayOrderId: data.razorpayOrderId,
      razorpayPaymentId: data.razorpayPaymentId,
      amountPaise: Number(payment.amount),
      currency: payment.currency,
    };
  });
