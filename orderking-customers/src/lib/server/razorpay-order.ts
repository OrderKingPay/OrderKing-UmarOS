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
      isSandbox: false,
    };
  });
