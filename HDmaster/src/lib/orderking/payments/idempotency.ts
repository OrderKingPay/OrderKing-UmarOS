/**
 * Strict Idempotency Key Enforcement and Double-Spend Prevention Engine
 * Protects OrderKing & UmarOS against duplicate debits, race conditions, and replay attacks.
 */

import { createHash } from "node:crypto";

export type IdempotencyStatus = "IN_FLIGHT" | "COMPLETED" | "FAILED";

export interface IdempotencyRecord<T = unknown> {
  key: string;
  payloadHash: string;
  status: IdempotencyStatus;
  response?: T;
  error?: string;
  createdAt: number;
  expiresAt: number;
}

export interface CapturedPaymentRecord {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  method: string;
  capturedAt: number;
}

export class IdempotencyMismatchError extends Error {
  readonly code = "IDEMPOTENCY_PAYLOAD_MISMATCH";
  constructor(key: string) {
    super(`Idempotency key "${key}" was previously used with a different request payload.`);
    this.name = "IdempotencyMismatchError";
  }
}

export class ConcurrentExecutionError extends Error {
  readonly code = "CONCURRENT_REQUEST_IN_FLIGHT";
  constructor(key: string) {
    super(`A request with idempotency key "${key}" is currently in-flight. Concurrent duplicates rejected to prevent double-spend.`);
    this.name = "ConcurrentExecutionError";
  }
}

export class DoubleSpendError extends Error {
  readonly code = "DOUBLE_SPEND_PREVENTED";
  constructor(identifier: string, details?: string) {
    super(`Double-spend prevented: ${identifier} has already been settled or captured. ${details ?? ""}`.trim());
    this.name = "DoubleSpendError";
  }
}

export class PaymentIdempotencyEngine {
  private records = new Map<string, IdempotencyRecord<unknown>>();
  private capturedPayments = new Map<string, CapturedPaymentRecord>();
  private settledOrders = new Set<string>();
  private processedWebhookEvents = new Set<string>();
  private defaultTtlMs = 24 * 60 * 60 * 1000; // 24 hours default TTL

  /**
   * Generates a deterministic SHA-256 hash of any JSON-serializable request payload
   */
  hashPayload(payload: unknown): string {
    const canonicalString = JSON.stringify(payload, Object.keys(payload || {}).sort());
    return createHash("sha256").update(canonicalString).digest("hex");
  }

  /**
   * Validates idempotency key format (non-empty string, min 8 chars recommended)
   */
  validateKey(key: string): void {
    if (!key || typeof key !== "string" || !key.trim()) {
      throw new Error("Missing or invalid idempotencyKey: must be a non-empty string");
    }
  }

  /**
   * Atomically executes an operation with strict idempotency and double-spend protection.
   * - If key was completed with identical payload: returns cached response with idempotentReplay: true.
   * - If key was used with different payload: throws IdempotencyMismatchError.
   * - If key is currently in-flight: throws ConcurrentExecutionError.
   */
  async executeIdempotent<T>(
    key: string,
    payload: unknown,
    fn: () => Promise<T>,
    options?: { ttlMs?: number }
  ): Promise<{ result: T; idempotentReplay: boolean }> {
    this.validateKey(key);
    const trimmedKey = key.trim();
    const payloadHash = this.hashPayload(payload);
    const now = Date.now();
    const ttlMs = options?.ttlMs ?? this.defaultTtlMs;

    const existing = this.records.get(trimmedKey);
    if (existing) {
      if (existing.expiresAt > now) {
        if (existing.payloadHash !== payloadHash) {
          throw new IdempotencyMismatchError(trimmedKey);
        }

        if (existing.status === "IN_FLIGHT") {
          throw new ConcurrentExecutionError(trimmedKey);
        }

        if (existing.status === "COMPLETED") {
          return { result: existing.response as T, idempotentReplay: true };
        }

        if (existing.status === "FAILED") {
          throw new Error(existing.error || "Previous idempotent request failed");
        }
      } else {
        // Expired record
        this.records.delete(trimmedKey);
      }
    }

    // Set status to IN_FLIGHT
    this.records.set(trimmedKey, {
      key: trimmedKey,
      payloadHash,
      status: "IN_FLIGHT",
      createdAt: now,
      expiresAt: now + ttlMs,
    });

    try {
      const result = await fn();
      this.records.set(trimmedKey, {
        key: trimmedKey,
        payloadHash,
        status: "COMPLETED",
        response: result,
        createdAt: now,
        expiresAt: now + ttlMs,
      });
      return { result, idempotentReplay: false };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.records.set(trimmedKey, {
        key: trimmedKey,
        payloadHash,
        status: "FAILED",
        error: errorMessage,
        createdAt: now,
        expiresAt: now + ttlMs,
      });
      throw err;
    }
  }

  /**
   * Asserts that an order has not already been marked paid/settled, preventing double-spend
   */
  assertOrderNotSettled(orderId: string): void {
    if (!orderId?.trim()) throw new Error("orderId is required");
    if (this.settledOrders.has(orderId.trim())) {
      throw new DoubleSpendError(`Order "${orderId}"`, "Order has already been fully paid.");
    }
  }

  /**
   * Records that an order has been settled
   */
  markOrderSettled(orderId: string): void {
    if (!orderId?.trim()) throw new Error("orderId is required");
    this.settledOrders.add(orderId.trim());
  }

  /**
   * Prevents duplicate capture of the same payment ID.
   * Returns true if newly registered; throws DoubleSpendError if already captured.
   */
  recordPaymentCapture(input: {
    paymentId: string;
    orderId: string;
    amountPaise: number;
    method?: string;
  }): boolean {
    const pid = input.paymentId?.trim();
    if (!pid) throw new Error("paymentId is required");

    const existing = this.capturedPayments.get(pid);
    if (existing) {
      throw new DoubleSpendError(`Payment "${pid}"`, `Already captured for order "${existing.orderId}" with amount ${existing.amountPaise} paise.`);
    }

    this.capturedPayments.set(pid, {
      paymentId: pid,
      orderId: input.orderId,
      amountPaise: input.amountPaise,
      method: input.method || "upi",
      capturedAt: Date.now(),
    });

    this.markOrderSettled(input.orderId);
    return true;
  }

  /**
   * Checks if payment was already captured
   */
  isPaymentCaptured(paymentId: string): boolean {
    return this.capturedPayments.has(paymentId.trim());
  }

  /**
   * Checks if an incoming webhook event has already been processed to eliminate duplicate side-effects
   */
  isWebhookEventProcessed(eventId: string): boolean {
    return this.processedWebhookEvents.has(eventId.trim());
  }

  /**
   * Marks a webhook event as processed
   */
  markWebhookEventProcessed(eventId: string): void {
    this.processedWebhookEvents.add(eventId.trim());
  }

  /**
   * Clears state (primarily used in testing environments)
   */
  clear(): void {
    this.records.clear();
    this.capturedPayments.clear();
    this.settledOrders.clear();
    this.processedWebhookEvents.clear();
  }
}

export const paymentIdempotency = new PaymentIdempotencyEngine();
