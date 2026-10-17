// Runtime: Cloudflare Pages Functions (V8 Isolate - Zero Node Polyfills Required)

export interface Env {
  RAZORPAY_WEBHOOK_SECRET: string;
  RAZORPAY_KEY_ID: string;
  RAZORPAY_KEY_SECRET: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface RazorpayWebhookPayload {
  entity: "event";
  account_id: string;
  event:
    | "payment.authorized"
    | "payment.captured"
    | "payment.failed"
    | "order.paid"
    | "refund.created"
    | "refund.processed";
  contains: string[];
  created_at: number; // Unix epoch seconds (signed inside raw body)
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: "payment";
        amount: number; // Integer paise
        currency: "INR";
        status: "created" | "authorized" | "captured" | "refunded" | "failed";
        order_id: string;
        method: "upi" | "card" | "netbanking" | "wallet";
        vpa?: string | null;
        acquirer_data?: {
          rrn?: string;
          upi_transaction_id?: string;
          auth_code?: string;
        };
        notes?: Record<string, string>;
        fee?: number; // Razorpay fee in paise (incl. GST)
        tax?: number; // GST on Razorpay fee in paise
        error_code?: string | null;
        error_description?: string | null;
        created_at: number;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
        created_at: number;
      };
    };
  };
}

const MAX_CLOCK_SKEW_SECONDS = 300; // Strict 5-minute replay tolerance

/**
 * Converts a hexadecimal string into a Uint8Array without Node Buffer polyfills.
 * Returns null if the hex string is malformed or has an odd length.
 */
function hexToBytes(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Constant-time HMAC-SHA256 verification using native V8 Web Crypto C++ bindings.
 * Eliminates JS string comparison timing leaks and Buffer polyfill vulnerabilities.
 */
async function verifyRazorpayHmacConstantTime(
  rawBodyBuffer: ArrayBuffer,
  signatureHex: string,
  webhookSecret: string
): Promise<boolean> {
  const signatureBytes = hexToBytes(signatureHex.trim());
  if (!signatureBytes || signatureBytes.byteLength !== 32) {
    return false;
  }

  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(webhookSecret);
  if (keyBytes.byteLength === 0) {
    return false;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // crypto.subtle.verify executes constant-time MAC comparison in native C++
  return crypto.subtle.verify("HMAC", cryptoKey, signatureBytes as unknown as BufferSource, rawBodyBuffer);
}

/**
 * Secondary RBI PA/PG Defense-in-Depth:
 * Queries Razorpay's authoritative Payments API directly to confirm captured status and exact paise.
 */
async function fetchAuthoritativeRazorpayPayment(
  paymentId: string,
  env: Env
): Promise<{ status: string; amount: number; order_id: string; currency: string }> {
  const credentials = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Razorpay upstream verification HTTP ${response.status}`);
  }

  return response.json();
}

export interface PagesFunctionContext<E = unknown> {
  request: Request;
  env: E;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

export type PagesFunction<E = unknown> = (
  context: PagesFunctionContext<E>
) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // 1. Fail-Closed Environment Validation
  if (
    !env.RAZORPAY_WEBHOOK_SECRET ||
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return new Response(
      JSON.stringify({ ok: false, error: "ERR_EDGE_CONFIG_MISSING" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Extract Required Security & Idempotency Headers
  const signatureHeader = request.headers.get("x-razorpay-signature");
  const eventIdHeader = request.headers.get("x-razorpay-event-id");

  if (!signatureHeader || !eventIdHeader) {
    return new Response(
      JSON.stringify({ ok: false, error: "ERR_MISSING_SECURITY_HEADERS" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Read Raw Immutable Bytes & Verify HMAC-SHA256 in Constant Time
  const rawBodyBuffer = await request.arrayBuffer();
  const isSignatureValid = await verifyRazorpayHmacConstantTime(
    rawBodyBuffer,
    signatureHeader,
    env.RAZORPAY_WEBHOOK_SECRET
  );

  if (!isSignatureValid) {
    return new Response(
      JSON.stringify({ ok: false, error: "ERR_INVALID_HMAC_SIGNATURE" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Parse Verified JSON Payload & Enforce 5-Minute Replay Attack Window
  const rawBodyText = new TextDecoder("utf-8").decode(rawBodyBuffer);
  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBodyText) as RazorpayWebhookPayload;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "ERR_MALFORMED_JSON_BODY" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const nowEpochSeconds = Math.floor(Date.now() / 1000);
  const eventTimestamp = Number(payload.created_at);
  if (
    !Number.isFinite(eventTimestamp) ||
    Math.abs(nowEpochSeconds - eventTimestamp) > MAX_CLOCK_SKEW_SECONDS
  ) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "ERR_WEBHOOK_REPLAY_WINDOW_EXCEEDED",
        driftSeconds: nowEpochSeconds - eventTimestamp,
      }),
      { status: 408, headers: { "Content-Type": "application/json" } }
    );
  }

  const paymentEntity = payload.payload.payment?.entity;
  const gatewayPaymentId =
    paymentEntity?.id ?? payload.payload.refund?.entity.payment_id ?? "UNKNOWN";
  const gatewayOrderId = paymentEntity?.order_id ?? null;

  const supabaseHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };

  // 5. Atomic Idempotency Lock via `payment_webhook_events` Unique Constraint
  // Prevents duplicate ledger settlement when Razorpay retries webhook delivery
  const idempotencyInsert = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_webhook_events`,
    {
      method: "POST",
      headers: {
        ...supabaseHeaders,
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        gateway: "RAZORPAY",
        event_id: eventIdHeader,
        payment_id: gatewayPaymentId,
        order_id: gatewayOrderId,
        event_type: payload.event,
        raw_payload: payload,
        received_at: new Date().toISOString(),
      }),
    }
  );

  if (!idempotencyInsert.ok) {
    return new Response(
      JSON.stringify({ ok: false, error: "ERR_LEDGER_LOCK_UNAVAILABLE" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const insertedRows = (await idempotencyInsert.json()) as Array<{ id: string }>;
  if (!Array.isArray(insertedRows) || insertedRows.length === 0) {
    // Event ID already processed; return 200 OK to halt Razorpay retry loop
    return new Response(
      JSON.stringify({
        ok: true,
        idempotentReplay: true,
        eventId: eventIdHeader,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 6. Process State Machine Transitions for `payment.captured` & `order.paid`
  try {
    if (
      (payload.event === "payment.captured" || payload.event === "order.paid") &&
      paymentEntity
    ) {
      // Optional upstream verification when API keys are present in isolate
      if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
        const trusted = await fetchAuthoritativeRazorpayPayment(
          paymentEntity.id,
          env
        );
        if (
          trusted.status !== "captured" ||
          trusted.amount !== paymentEntity.amount ||
          trusted.currency !== "INR"
        ) {
          throw new Error("ERR_UPSTREAM_PAYMENT_MISMATCH");
        }
      }

      // Execute atomic PostgreSQL RPC for double-entry ledger + order confirmation
      const rpcResponse = await fetch(
        `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/settle_captured_razorpay_order`,
        {
          method: "POST",
          headers: supabaseHeaders,
          body: JSON.stringify({
            p_event_id: eventIdHeader,
            p_razorpay_order_id: paymentEntity.order_id,
            p_razorpay_payment_id: paymentEntity.id,
            p_amount_paise: paymentEntity.amount,
            p_gateway_fee_paise: paymentEntity.fee ?? 0,
            p_gateway_tax_paise: paymentEntity.tax ?? 0,
            p_method: paymentEntity.method,
            p_upi_rrn:
              paymentEntity.acquirer_data?.rrn ??
              paymentEntity.acquirer_data?.upi_transaction_id ??
              null,
          }),
        }
      );

      if (!rpcResponse.ok) {
        const errText = await rpcResponse.text();
        throw new Error(`RPC_SETTLE_FAILED: ${errText}`);
      }
    }

    // Mark webhook event as processed
    await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_webhook_events?event_id=eq.${encodeURIComponent(
        eventIdHeader
      )}`,
      {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({
          processed_at: new Date().toISOString(),
          processing_error: null,
        }),
      }
    );

    return new Response(
      JSON.stringify({
        ok: true,
        eventId: eventIdHeader,
        event: payload.event,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    await fetch(
      `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/payment_webhook_events?event_id=eq.${encodeURIComponent(
        eventIdHeader
      )}`,
      {
        method: "PATCH",
        headers: supabaseHeaders,
        body: JSON.stringify({
          processing_error: errorMessage,
        }),
      }
    );

    // Return 500 so Razorpay exponential backoff retries the failed DB transaction
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export {
  hexToBytes,
  verifyRazorpayHmacConstantTime,
  MAX_CLOCK_SKEW_SECONDS,
  fetchAuthoritativeRazorpayPayment,
};
