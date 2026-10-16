import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import * as nodeTest from "node:test";
import * as vitest from "vitest";

const isVitest = Boolean(process.env.VITEST);
const describe: any = (isVitest ? vitest.describe : nodeTest.describe) as any;
const it: any = (isVitest ? vitest.it : nodeTest.it) as any;
const beforeEach: any = (isVitest ? vitest.beforeEach : (nodeTest as any).beforeEach ?? ((fn: any) => fn())) as any;
const afterEach: any = (isVitest ? vitest.afterEach : (nodeTest as any).afterEach ?? ((fn: any) => fn())) as any;

import {
  onRequestPost,
  hexToBytes,
  verifyRazorpayHmacConstantTime,
  MAX_CLOCK_SKEW_SECONDS,
} from "../../../../functions/api/payments/razorpay-webhook.ts";
import type {
  Env,
  PagesFunctionContext,
} from "../../../../functions/api/payments/razorpay-webhook.ts";

function signPayload(payloadString: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadString, "utf8").digest("hex");
}

function createMockContext(
  bodyString: string,
  headers: Record<string, string>,
  envOverrides: Partial<Env> = {}
): PagesFunctionContext<Env> {
  const encoder = new TextEncoder();
  const rawBytes = encoder.encode(bodyString);

  const request = new Request("https://hdmaster.orderking.delivery/api/payments/razorpay-webhook", {
    method: "POST",
    headers: new Headers(headers),
    body: rawBytes,
  });

  const env: Env = {
    RAZORPAY_WEBHOOK_SECRET: "whsec_test_secret_998877",
    RAZORPAY_KEY_ID: "rzp_test_12345",
    RAZORPAY_KEY_SECRET: "rzp_secret_67890",
    NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
    ...envOverrides,
  };

  return {
    request,
    env,
    params: {},
    waitUntil: () => {},
    next: async () => new Response(),
    data: {},
  };
}

describe("Razorpay Hardened Edge Webhook Handler (Cloudflare V8 Isolate) - HDmaster", () => {
  const TEST_SECRET = "whsec_test_secret_998877";
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("Native Web Crypto & Hex Parsing (Zero Node Buffer Leaks)", () => {
    it("converts valid hex strings to Uint8Array in constant time", () => {
      const validHex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
      const bytes = hexToBytes(validHex);
      assert.notEqual(bytes, null);
      assert.equal(bytes?.byteLength, 32);
      assert.equal(bytes?.[0], 0x00);
      assert.equal(bytes?.[31], 0x1f);
    });

    it("rejects odd-length or malformed hex inputs without leaking exceptions", () => {
      assert.equal(hexToBytes(""), null);
      assert.equal(hexToBytes("abc"), null); // Odd length
      assert.equal(hexToBytes("zzzz"), null); // Invalid hex chars
      assert.equal(hexToBytes("123g"), null); // Non-hex char
    });

    it("verifies authentic HMAC signatures via crypto.subtle.verify", async () => {
      const payload = JSON.stringify({ entity: "event", event: "payment.captured" });
      const rawBuffer = new TextEncoder().encode(payload).buffer;
      const signature = signPayload(payload, TEST_SECRET);

      const isValid = await verifyRazorpayHmacConstantTime(rawBuffer, signature, TEST_SECRET);
      assert.equal(isValid, true);
    });

    it("rejects tampered HMAC signatures with 1-bit / 1-byte deviation", async () => {
      const payload = JSON.stringify({ entity: "event", event: "payment.captured" });
      const rawBuffer = new TextEncoder().encode(payload).buffer;
      const validSig = signPayload(payload, TEST_SECRET);

      // Flip first char
      const tamperedFirst = (validSig[0] === "a" ? "b" : "a") + validSig.slice(1);
      assert.equal(await verifyRazorpayHmacConstantTime(rawBuffer, tamperedFirst, TEST_SECRET), false);

      // Flip last char
      const lastIdx = validSig.length - 1;
      const tamperedLast = validSig.slice(0, lastIdx) + (validSig[lastIdx] === "0" ? "1" : "0");
      assert.equal(await verifyRazorpayHmacConstantTime(rawBuffer, tamperedLast, TEST_SECRET), false);

      // Wrong secret
      assert.equal(await verifyRazorpayHmacConstantTime(rawBuffer, validSig, "wrong_secret_123"), false);
    });

    it("rejects wrong-length signature bytes (not 32 bytes / 256 bits)", async () => {
      const payload = "test";
      const rawBuffer = new TextEncoder().encode(payload).buffer;
      const shortSig = "0123456789abcdef0123456789abcdef";
      assert.equal(await verifyRazorpayHmacConstantTime(rawBuffer, shortSig, TEST_SECRET), false);
    });
  });

  describe("Fail-Closed Security & Header Validation", () => {
    it("returns 500 ERR_EDGE_CONFIG_MISSING if webhook secret is not set", async () => {
      const body = JSON.stringify({ event: "payment.captured" });
      const context = createMockContext(body, {}, { RAZORPAY_WEBHOOK_SECRET: "" });

      const response = await onRequestPost(context);
      assert.equal(response.status, 500);
      const data = await response.json();
      assert.deepEqual(data, { ok: false, error: "ERR_EDGE_CONFIG_MISSING" });
    });

    it("returns 400 ERR_MISSING_SECURITY_HEADERS when headers are omitted", async () => {
      const body = JSON.stringify({ event: "payment.captured" });
      const context = createMockContext(body, {}); // No signature or event-id headers

      const response = await onRequestPost(context);
      assert.equal(response.status, 400);
      const data = await response.json();
      assert.deepEqual(data, { ok: false, error: "ERR_MISSING_SECURITY_HEADERS" });
    });

    it("returns 401 ERR_INVALID_HMAC_SIGNATURE when signature is tampered", async () => {
      const body = JSON.stringify({ event: "payment.captured" });
      const invalidSignature = "f".repeat(64);
      const context = createMockContext(body, {
        "x-razorpay-signature": invalidSignature,
        "x-razorpay-event-id": "evt_test_123",
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 401);
      const data = await response.json();
      assert.deepEqual(data, { ok: false, error: "ERR_INVALID_HMAC_SIGNATURE" });
    });
  });

  describe("Strict 5-Minute Replay Attack Mitigation (MAX_CLOCK_SKEW_SECONDS = 300)", () => {
    it("verifies tolerance constant is strictly 300 seconds (5 minutes)", () => {
      assert.equal(MAX_CLOCK_SKEW_SECONDS, 300);
    });

    it("rejects expired payloads older than 300 seconds with HTTP 408", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredTimestamp = now - 305; // 5m 5s ago

      const payload = {
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        contains: ["payment"],
        created_at: expiredTimestamp,
        payload: {
          payment: {
            entity: {
              id: "pay_test_001",
              entity: "payment",
              amount: 50000,
              currency: "INR",
              status: "captured",
              order_id: "order_test_001",
              method: "upi",
              created_at: expiredTimestamp,
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = signPayload(body, TEST_SECRET);
      const context = createMockContext(body, {
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": "evt_replay_001",
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 408);
      const data: any = await response.json();
      assert.equal(data.ok, false);
      assert.equal(data.error, "ERR_WEBHOOK_REPLAY_WINDOW_EXCEEDED");
      assert.ok(data.driftSeconds > 300);
    });

    it("rejects future timestamps exceeding 300 seconds with HTTP 408", async () => {
      const now = Math.floor(Date.now() / 1000);
      const futureTimestamp = now + 350; // 5m 50s into future

      const payload = {
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        contains: ["payment"],
        created_at: futureTimestamp,
        payload: {},
      };

      const body = JSON.stringify(payload);
      const signature = signPayload(body, TEST_SECRET);
      const context = createMockContext(body, {
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": "evt_future_001",
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 408);
      const data: any = await response.json();
      assert.equal(data.ok, false);
      assert.equal(data.error, "ERR_WEBHOOK_REPLAY_WINDOW_EXCEEDED");
    });
  });

  describe("Atomic Database Idempotency Lock via payment_webhook_events", () => {
    it("returns HTTP 200 with idempotentReplay: true on duplicate event replay", async () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        contains: ["payment"],
        created_at: now,
        payload: {
          payment: {
            entity: {
              id: "pay_dup_001",
              entity: "payment",
              amount: 25000,
              currency: "INR",
              status: "captured",
              order_id: "order_dup_001",
              method: "upi",
              created_at: now,
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = signPayload(body, TEST_SECRET);
      const eventId = "evt_duplicate_replay_999";

      let rpcWasCalled = false;
      globalThis.fetch = async (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes("/rest/v1/payment_webhook_events")) {
          return new Response(JSON.stringify([]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (urlStr.includes("/rest/v1/rpc/settle_captured_razorpay_order")) {
          rpcWasCalled = true;
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        }
        return new Response("Not Found", { status: 404 });
      };

      const context = createMockContext(body, {
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": eventId,
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.deepEqual(data, {
        ok: true,
        idempotentReplay: true,
        eventId,
      });
      // CRITICAL: Ledger settlement RPC must NOT be called on replay
      assert.equal(rpcWasCalled, false);
    });
  });

  describe("Authoritative Upstream Verification & PostgreSQL RPC Settlement", () => {
    it("executes settle_captured_razorpay_order and returns 200 for valid payment.captured", async () => {
      const now = Math.floor(Date.now() / 1000);
      const paymentId = "pay_valid_777";
      const orderId = "order_valid_888";
      const eventId = "evt_first_time_001";
      const amountPaise = 65000;

      const payload = {
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        contains: ["payment"],
        created_at: now,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              entity: "payment",
              amount: amountPaise,
              currency: "INR",
              status: "captured",
              order_id: orderId,
              method: "upi",
              fee: 1300,
              tax: 234,
              acquirer_data: {
                rrn: "412345678901",
                upi_transaction_id: "UPI123456789",
              },
              created_at: now,
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = signPayload(body, TEST_SECRET);

      const capturedCalls: { url: string; method?: string; body?: string }[] = [];

      globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
        const urlStr = input.toString();
        const method = init?.method ?? (input instanceof Request ? input.method : "GET");
        const reqBody = init?.body?.toString();
        capturedCalls.push({ url: urlStr, method, body: reqBody });

        // 1. Idempotency Lock
        if (urlStr.includes("/rest/v1/payment_webhook_events") && method === "POST") {
          return new Response(JSON.stringify([{ id: "lock-uuid-001" }]), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        }

        // 2. Upstream Razorpay Payment Verification
        if (urlStr.includes(`https://api.razorpay.com/v1/payments/${paymentId}`)) {
          return new Response(
            JSON.stringify({
              id: paymentId,
              entity: "payment",
              amount: amountPaise,
              currency: "INR",
              status: "captured",
              order_id: orderId,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        // 3. PostgreSQL RPC Settlement
        if (urlStr.includes("/rest/v1/rpc/settle_captured_razorpay_order")) {
          return new Response(JSON.stringify({ ok: true, settled: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // 4. Supabase event mark as processed
        if (urlStr.includes("/rest/v1/payment_webhook_events") && method === "PATCH") {
          return new Response(JSON.stringify({ updated: 1 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response("Not found", { status: 404 });
      };

      const context = createMockContext(body, {
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": eventId,
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.deepEqual(data, {
        ok: true,
        eventId,
        event: "payment.captured",
      });

      // Verify RPC payload arguments
      const rpcCall = capturedCalls.find((c) => c.url.includes("/rest/v1/rpc/settle_captured_razorpay_order"));
      assert.ok(rpcCall);
      const rpcArgs = JSON.parse(rpcCall!.body!);
      assert.deepEqual(rpcArgs, {
        p_event_id: eventId,
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_amount_paise: amountPaise,
        p_gateway_fee_paise: 1300,
        p_gateway_tax_paise: 234,
        p_method: "upi",
        p_upi_rrn: "412345678901",
      });
    });

    it("returns HTTP 500 when authoritative upstream returns amount/status mismatch", async () => {
      const now = Math.floor(Date.now() / 1000);
      const paymentId = "pay_fake_999";
      const payload = {
        entity: "event",
        account_id: "acc_test",
        event: "payment.captured",
        contains: ["payment"],
        created_at: now,
        payload: {
          payment: {
            entity: {
              id: paymentId,
              entity: "payment",
              amount: 99900,
              currency: "INR",
              status: "captured",
              order_id: "order_fake_999",
              method: "upi",
              created_at: now,
            },
          },
        },
      };

      const body = JSON.stringify(payload);
      const signature = signPayload(body, TEST_SECRET);

      globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
        const urlStr = input.toString();
        const method = init?.method ?? "GET";

        if (urlStr.includes("/rest/v1/payment_webhook_events") && method === "POST") {
          return new Response(JSON.stringify([{ id: "lock-uuid-999" }]), { status: 201 });
        }

        // Upstream returns mismatch: status is 'failed' or amount is 100
        if (urlStr.includes("https://api.razorpay.com/v1/payments/")) {
          return new Response(
            JSON.stringify({
              id: paymentId,
              amount: 100, // Mismatched amount!
              status: "failed",
              currency: "INR",
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes("/rest/v1/payment_webhook_events") && method === "PATCH") {
          return new Response(JSON.stringify({ updated: 1 }), { status: 200 });
        }

        return new Response("Not found", { status: 404 });
      };

      const context = createMockContext(body, {
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": "evt_fake_999",
      });

      const response = await onRequestPost(context);
      assert.equal(response.status, 500);
      const data: any = await response.json();
      assert.equal(data.ok, false);
      assert.equal(data.error, "ERR_UPSTREAM_PAYMENT_MISMATCH");
    });
  });
});
