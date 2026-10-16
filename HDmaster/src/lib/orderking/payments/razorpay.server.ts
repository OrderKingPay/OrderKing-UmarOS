import { resilientFetch } from "../sre/resilient-fetch.ts";
import { createHmac, timingSafeEqual } from "node:crypto";
import { paymentIdempotency } from "./idempotency.ts";

const API_BASE = "https://api.razorpay.com/v1";

type RazorpayOrder = {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: "created" | "attempted" | "paid";
};

type RazorpayPayment = {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
  error_code?: string | null;
  error_description?: string | null;
};

export interface RazorpayWebhookPayload {
  id?: string;
  entity?: string;
  event: string;
  contains?: string[];
  payload?: {
    payment?: {
      entity?: RazorpayPayment & {
        notes?: Record<string, string>;
      };
    };
    order?: {
      entity?: RazorpayOrder & {
        notes?: Record<string, string>;
      };
    };
  };
  created_at?: number;
}

export interface RazorpayWebhookProcessingResult {
  success: boolean;
  duplicate?: boolean;
  event?: string;
  paymentId?: string;
  orderId?: string;
  amountPaise?: number;
  status?: string;
  error?: string;
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (name === "RAZORPAY_KEY_ID" && !value.startsWith("rzp_test_") && !value.startsWith("rzp_live_")) {
    throw new Error(`Strict enforcement: ${name} must be a valid Razorpay key starting with 'rzp_test_' or 'rzp_live_'`);
  }
  return value;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${required("RAZORPAY_KEY_ID")}:${required("RAZORPAY_KEY_SECRET")}`).toString("base64")}`;
}

async function razorpay<T>(path: string, init: RequestInit): Promise<T> {
  const response = await resilientFetch(`${API_BASE}${path}`, {
    ...init,
    timeoutMs: 10000,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: { description: text.slice(0, 500) } };
  }
  if (!response.ok) {
    const message =
      body && typeof body === "object" && body !== null && "error" in body &&
      typeof (body as { error?: { description?: unknown } }).error?.description === "string"
        ? (body as { error: { description: string } }).error.description
        : `Razorpay HTTP ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

/**
 * Creates a Razorpay Order with strict idempotency key enforcement and double-spend protection
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<RazorpayOrder> {
  if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) {
    throw new Error("Payment amount must be a positive integer number of paise");
  }

  // Double-spend check on order receipt
  paymentIdempotency.assertOrderNotSettled(input.receipt);

  const requestFn = () =>
    razorpay<RazorpayOrder>("/orders", {
      method: "POST",
      headers: input.idempotencyKey ? { "X-Razorpay-Idempotency-Key": input.idempotencyKey } : undefined,
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: "INR",
        receipt: input.receipt,
        notes: input.notes,
      }),
    });

  if (input.idempotencyKey?.trim()) {
    const { result } = await paymentIdempotency.executeIdempotent(
      input.idempotencyKey,
      { amountPaise: input.amountPaise, receipt: input.receipt, notes: input.notes },
      requestFn
    );
    return result;
  }

  return requestFn();
}

/**
 * Fetches verified payment status from Razorpay
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!paymentId.trim()) throw new Error("paymentId is required");
  return razorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
}

/**
 * Verifies standard checkout signature (HMAC SHA-256 of orderId|paymentId)
 */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = required("RAZORPAY_KEY_SECRET");
  const expected = createHmac("sha256", secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.signature);
}

/**
 * Cryptographically verifies raw webhook body using HMAC SHA-256 and constant-time comparison
 */
export function verifyWebhookSignature(rawBody: string, signature: string, customSecret?: string): boolean {
  if (!rawBody || !signature) return false;
  const secret = customSecret?.trim() || required("RAZORPAY_WEBHOOK_SECRET");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/**
 * Verifies the X-Razorpay-Signature HTTP header (case-insensitive and whitespace-safe)
 */
export function verifyRazorpayWebhookHeader(
  rawBody: string,
  signatureHeader: string | null | undefined,
  customSecret?: string
): boolean {
  if (!signatureHeader || typeof signatureHeader !== "string") return false;
  return verifyWebhookSignature(rawBody, signatureHeader.trim(), customSecret);
}

/**
 * Processes Razorpay Webhook event with cryptographic verification, duplicate suppression,
 * and double-spend prevention.
 */
export async function processRazorpayWebhookEvent(input: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  webhookSecret?: string;
}): Promise<RazorpayWebhookProcessingResult> {
  const isValid = verifyRazorpayWebhookHeader(input.rawBody, input.signatureHeader, input.webhookSecret);
  if (!isValid) {
    return { success: false, error: "Invalid Razorpay webhook signature (X-Razorpay-Signature)" };
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(input.rawBody);
  } catch {
    return { success: false, error: "Malformed webhook JSON payload" };
  }

  // Deduplicate webhook delivery events
  const eventId = payload.id;
  if (eventId) {
    if (paymentIdempotency.isWebhookEventProcessed(eventId)) {
      return { success: true, duplicate: true, event: payload.event };
    }
  }

  const payment = payload.payload?.payment?.entity;
  const order = payload.payload?.order?.entity;

  if (payload.event === "payment.captured" && payment) {
    // Strict Double-Spend Prevention on payment ID
    try {
      paymentIdempotency.recordPaymentCapture({
        paymentId: payment.id,
        orderId: payment.order_id || "direct_pay",
        amountPaise: payment.amount,
        method: payment.method,
      });
    } catch (err: unknown) {
      if ((err as Error).name === "DoubleSpendError") {
        return {
          success: true,
          duplicate: true,
          event: payload.event,
          paymentId: payment.id,
          orderId: payment.order_id ?? undefined,
          amountPaise: payment.amount,
          status: "ALREADY_CAPTURED",
        };
      }
      throw err;
    }

    if (eventId) {
      paymentIdempotency.markWebhookEventProcessed(eventId);
    }

    return {
      success: true,
      duplicate: false,
      event: payload.event,
      paymentId: payment.id,
      orderId: payment.order_id ?? undefined,
      amountPaise: payment.amount,
      status: "CAPTURED",
    };
  }

  if (payload.event === "payment.failed" && payment) {
    if (eventId) paymentIdempotency.markWebhookEventProcessed(eventId);
    return {
      success: true,
      event: payload.event,
      paymentId: payment.id,
      orderId: payment.order_id ?? undefined,
      status: "FAILED",
    };
  }

  if (payload.event === "order.paid" && order) {
    paymentIdempotency.markOrderSettled(order.id);
    if (eventId) paymentIdempotency.markWebhookEventProcessed(eventId);
    return {
      success: true,
      event: payload.event,
      orderId: order.id,
      amountPaise: order.amount_paid,
      status: "PAID",
    };
  }

  if (eventId) paymentIdempotency.markWebhookEventProcessed(eventId);
  return { success: true, event: payload.event };
}

function safeEqualHex(expected: string, received: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export type { RazorpayOrder, RazorpayPayment };
