
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
  purpose?: "KINGPAY_WALLET_TOPUP" | "FOOD_ORDER";
  userId?: string;
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
  .// @ts-ignore
  inputValidator((data: RazorpayOrderRequest) => data)
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
        notes: {
          ...(data.notes || {}),
          ...(data.purpose ? { purpose: data.purpose } : {}),
          ...(data.userId ? { orderking_user_id: data.userId } : {}),
        },
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


export type RazorpayFoodVerification = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  currency: string;
};

export const verifyRazorpayFoodPayment = createServerFn({ method: "POST" })
  .// @ts-ignore
  inputValidator((data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => data)
  .handler(async ({ data, context }: any): Promise<RazorpayFoodVerification> => {
    const { getRazorpayConfig } = await import("./razorpay.server");
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keySecret) {
      throw new Error("Razorpay credentials missing. Verification blocked.");
    }

    const crypto = await import("node:crypto");
    const generated = crypto
      .createHmac("sha256", config.keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");
    const given = String(data.razorpaySignature).trim();
    if (given.length !== generated.length ||
        !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(generated))) {
      throw new Error("Invalid Razorpay signature.");
    }

    const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(data.razorpayOrderId)}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      },
    });
    if (!response.ok) throw new Error("Razorpay order verification failed.");

    const order = (await response.json()) as {
      id: string;
      amount: number;
      currency: string;
      notes?: Record<string, string>;
    };
    if (order.notes?.purpose !== "FOOD_ORDER") throw new Error("Razorpay order purpose mismatch.");
    if (order.notes?.orderking_user_id !== context.userId) throw new Error("Razorpay order ownership mismatch.");

    return {
      razorpayOrderId: order.id,
      razorpayPaymentId: data.razorpayPaymentId,
      amountPaise: Number(order.amount),
      currency: order.currency,
    };
  });
