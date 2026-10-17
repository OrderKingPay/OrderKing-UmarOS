// Client-callable RPC bridge. Gateway credentials and price calculation stay server-side.
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import type { QuoteRequest } from "@/lib/market-types";
import { buildQuote } from "./quote";

export type RazorpayOrderRequest = QuoteRequest & {
  amountPaise: number;
  tipPaise?: number;
  donationPaise?: number;
  currency?: string;
  receipt: string;
};

export type RazorpayOrderResponse = {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  isSandbox: boolean;
};

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: RazorpayOrderRequest) => data)
  .handler(async ({ context, data }): Promise<RazorpayOrderResponse> => {
    if (!context?.userId) throw new Error("Sign in before requesting payment.");
    if (!data?.restaurantId || !data.zoneId || !Array.isArray(data.lines) || !data.lines.length) {
      throw new Error("A delivery cart and location are required.");
    }
    const tip = data.tipPaise ?? 0;
    if (!Number.isSafeInteger(tip) || tip < 0 || tip > 100_000) {
      throw new Error("Invalid tip amount.");
    }
    const donation = data.donationPaise ?? 0;
    if (!Number.isSafeInteger(donation) || donation < 0 || donation > 10_000) {
      throw new Error("Invalid donation amount.");
    }
    if (typeof data.receipt !== "string" || !data.receipt.trim() || data.receipt.length > 40) {
      throw new Error("A valid payment receipt is required.");
    }
    if (data.currency && data.currency !== "INR") throw new Error("Only INR is supported.");
    // Recompute the amount and apply delivery gates before any gateway request.
    // No first-order entitlement is inferred from browser input.
    const built = await buildQuote(data, false);
    if (!built.result.isDeliverable || built.result.quote.blockers.length) {
      throw new Error("Delivery is unavailable for this cart.");
    }
    const amountPaise = built.result.quote.totalPaise + tip + donation;
    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0 || data.amountPaise !== amountPaise) {
      throw new Error("Checkout amount changed. Refresh your cart before paying.");
    }
    const { getRazorpayConfig } = await import("./razorpay.server");
    const config = getRazorpayConfig();
    if (!config.hasCredentials || !config.keyId || !config.keySecret) {
      throw new Error("Payment provider is unavailable. No payment was requested.");
    }
    const authHeader = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${authHeader}` },
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt: data.receipt }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("Payment provider could not prepare checkout. Please try again later.");
    const result = await response.json() as { id?: string; amount?: number; currency?: string };
    if (!result.id || result.amount !== amountPaise || result.currency !== "INR") {
      throw new Error("Payment provider returned an invalid checkout. No payment was initiated.");
    }
    return {
      orderId: result.id, amountPaise, currency: "INR", keyId: config.keyId,
      isSandbox: config.keyId.startsWith("rzp_test_"),
    };
  });
