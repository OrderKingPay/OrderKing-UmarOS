import { createHmac } from "node:crypto";
import { getSql } from "@/lib/db";
import { createRazorpayOrder, fetchRazorpayPayment, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/orderking/payments/razorpay.server";
import { nid } from "./workspace.server";
import { kingpayLedgerEngine } from "@/lib/orderking/finance/kingpay-ledger-engine";
import Stripe from "stripe";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function serviceAuthorized(request: Request): boolean {
  const expected = process.env.ORDERKING_SERVICE_TOKEN?.trim();
  if (!expected) return false;
  const actual = request.headers.get("x-orderking-service-token")?.trim() ?? "";
  return actual.length === expected.length && createHmac("sha256", expected).update(actual).digest("hex") === createHmac("sha256", expected).update(expected).digest("hex");
}

function fail(err: unknown) {
  const message = err instanceof Error ? err.message : "Unexpected error";
  const status = message === "Unauthorized" ? 401 : message.includes("not found") ? 404 : 400;
  return json({ error: message }, status);
}

async function markPaymentCaptured(paymentId: string, gatewayOrderId: string, amountPaise: number, method: string) {
  const sql = await getSql();
  const rows = await sql.query<{ id: string; org_id: string; order_id: string; amount_paise: number }>(
    `select id, org_id, order_id, amount_paise from payment_intents where gateway_order_id=$1 limit 1`,
    [gatewayOrderId],
  );
  const intent = rows[0];
  if (!intent) throw new Error("Payment intent not found");
  if (Number(intent.amount_paise) !== amountPaise) throw new Error("Payment amount mismatch");

  await sql.query(
    `update payment_intents
       set gateway_payment_id=$1, status='CAPTURED', updated_at=now()
     where id=$2 and status not in ('REFUNDED','FAILED')`,
    [paymentId, intent.id],
  );
  await sql.query(
    `update orders set payment_status='PAID' where id=$1 and org_id=$2 and payment_status <> 'PAID'`,
    [intent.order_id, intent.org_id],
  );

  const journalId = nid("jrnl");
  const sourceId = `payment:${paymentId}`;
  const inserted = await sql.query<{ id: string }>(
    `insert into journal_entries (id, org_id, order_id, source_type, source_id, description)
     values ($1,$2,$3,'PAYMENT',$4,$5)
     on conflict (org_id, source_type, source_id) do nothing
     returning id`,
    [journalId, intent.org_id, intent.order_id, sourceId, `Razorpay ${method} payment ${paymentId}`],
  );
  if (inserted[0]) {
    await sql.query(
      `insert into journal_lines (id, journal_id, account, direction, amount_paise, party_type, party_id)
       values ($1,$2,'CUSTOMER_RECEIVABLE','DEBIT',$3,'CUSTOMER',$4),
              ($5,$2,'PLATFORM_CASH','CREDIT',$3,'PLATFORM',$4)`,
      [nid("jl"), journalId, amountPaise, intent.order_id, nid("jl")],
    );
  }

  // Settle the ledger upon successful payment using KingPayLedgerEngine
  try {
    kingpayLedgerEngine.processPayment(
      `idem_capt_${paymentId}`,
      intent.order_id, // acting as senderId or userId
      intent.org_id,
      amountPaise / 100 // assuming it needs INR not paise
    );
  } catch (e) {
    console.error("Ledger engine error:", e);
  }

  return { orderId: intent.order_id, paymentIntentId: intent.id, paymentId };
}

async function markPaymentFailed(paymentId: string, gatewayOrderId: string, reason: string | null) {
  const sql = await getSql();
  await sql.query(
    `update payment_intents set gateway_payment_id=coalesce(gateway_payment_id,$1), status='FAILED', failure_reason=$2, updated_at=now()
     where gateway_order_id=$3 and status not in ('CAPTURED','REFUNDED')`,
    [paymentId, reason, gatewayOrderId],
  );
  const intents = await sql.query<{ order_id: string; org_id: string }>(
    `select order_id, org_id from payment_intents where gateway_order_id=$1 limit 1`,
    [gatewayOrderId],
  );
  if (intents[0]) {
    await sql.query(
      `update orders set payment_status='FAILED', status=case when status='PENDING' then 'PAYMENT_FAILED' else status end
       where id=$1 and org_id=$2 and payment_status <> 'PAID'`,
      [intents[0].order_id, intents[0].org_id],
    );
  }
}

export async function handlePaymentHttp(request: Request, params: Record<string, string | undefined>) {
  try {
    const path = (params._splat ?? params["$"] ?? Object.values(params)[0] ?? "").replace(/^\/+|\/+$/g, "");
    const method = request.method.toUpperCase();

    if (method === "POST" && path === "webhook") {
      const raw = await request.text();
      const stripeSignature = request.headers.get("stripe-signature");
      const razorpaySignature = request.headers.get("x-razorpay-signature");

      const sql = await getSql();

      if (stripeSignature) {
        const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!stripeSecret) return json({ error: "Stripe webhook secret missing" }, 500);
        
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2026-08-26.dahlia" });
        let event;
        try {
          event = stripe.webhooks.constructEvent(raw, stripeSignature, stripeSecret);
        } catch (err: any) {
          return json({ error: `Webhook Error: ${err.message}` }, 400);
        }

        const inserted = await sql.query<{ id: string }>(
          `insert into payment_webhook_events (id,gateway,gateway_event_id,event_type,payload_json,signature)
           values ($1,'STRIPE',$2,$3,$4,$5)
           on conflict (gateway,gateway_event_id) do nothing returning id`,
          [nid("pwe"), event.id, event.type, raw, stripeSignature],
        );
        if (!inserted[0]) return json({ ok: true, duplicate: true });

        try {
          if (event.type === "payment_intent.succeeded") {
            const pi = event.data.object as Stripe.PaymentIntent;
            // Stripe stores amount in cents, which is compatible with paise conceptually,
            // but we treat amount conceptually. Gateway order ID is pi.id for intents created by us.
            await markPaymentCaptured(pi.id, pi.id, pi.amount, "card");
          } else if (event.type === "payment_intent.payment_failed") {
            const pi = event.data.object as Stripe.PaymentIntent;
            await markPaymentFailed(pi.id, pi.id, pi.last_payment_error?.message || null);
          }
          await sql.query(`update payment_webhook_events set processed_at=now(), processing_error=null where gateway='STRIPE' and gateway_event_id=$1`, [event.id]);
        } catch (error) {
          await sql.query(`update payment_webhook_events set processing_error=$1 where gateway='STRIPE' and gateway_event_id=$2`, [error instanceof Error ? error.message : String(error), event.id]);
          throw error;
        }
        return json({ ok: true });
      } else if (razorpaySignature) {
        if (!verifyWebhookSignature(raw, razorpaySignature)) return json({ error: "Invalid webhook signature" }, 401);
        const payload = JSON.parse(raw) as {
          id?: string;
          event?: string;
          payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; method?: string; error_code?: string; error_description?: string } } };
        };
        if (!payload.id || !payload.event) return json({ error: "Invalid webhook payload" }, 400);
        const inserted = await sql.query<{ id: string }>(
          `insert into payment_webhook_events (id,gateway,gateway_event_id,event_type,payload_json,signature)
           values ($1,'RAZORPAY',$2,$3,$4,$5)
           on conflict (gateway,gateway_event_id) do nothing returning id`,
          [nid("pwe"), payload.id, payload.event, raw, razorpaySignature],
        );
        if (!inserted[0]) return json({ ok: true, duplicate: true });

        try {
          const entity = payload.payload?.payment?.entity;
          if (payload.event === "payment.captured" && entity?.id && entity.order_id && entity.amount != null) {
            await markPaymentCaptured(entity.id, entity.order_id, Number(entity.amount), entity.method ?? "unknown");
          } else if (payload.event === "payment.failed" && entity?.id && entity.order_id) {
            await markPaymentFailed(entity.id, entity.order_id, entity.error_description ?? entity.error_code ?? null);
          } else if (payload.event === "order.paid" && entity?.order_id) {
            const payment = await fetchRazorpayPayment(entity.id ?? "");
            if (payment.status === "captured" && payment.order_id) {
              await markPaymentCaptured(payment.id, payment.order_id, payment.amount, payment.method);
            }
          }
          await sql.query(`update payment_webhook_events set processed_at=now(), processing_error=null where gateway='RAZORPAY' and gateway_event_id=$1`, [payload.id]);
        } catch (error) {
          await sql.query(`update payment_webhook_events set processing_error=$1 where gateway='RAZORPAY' and gateway_event_id=$2`, [error instanceof Error ? error.message : String(error), payload.id]);
          throw error;
        }
        return json({ ok: true });
      } else {
        return json({ error: "Missing webhook signature" }, 400);
      }
    }

    if (method === "POST" && !serviceAuthorized(request)) return json({ error: "Unauthorized" }, 401);

    if (method === "POST" && path === "orders") {
      const body = (await request.json()) as { orderId: string; idempotencyKey: string };
      if (!body.orderId || !body.idempotencyKey || body.idempotencyKey.length < 16) return json({ error: "orderId and strong idempotencyKey are required" }, 400);
      const sql = await getSql();
      const orders = await sql.query<{ id: string; org_id: string; total_paise: number; payment_status: string; status: string }>(
        `select id, org_id, total_paise, payment_status, status from orders where id=$1 limit 1`, [body.orderId],
      );
      const order = orders[0];
      if (!order) throw new Error("Order not found");
      if (Number(order.total_paise) <= 0) throw new Error("Order total must be positive");
      if (order.status !== "PENDING") throw new Error("Payment can only be initiated for a pending order");
      const prior = await sql.query<{ gateway_order_id: string; amount_paise: number }>(
        `select gateway_order_id, amount_paise from payment_intents where org_id=$1 and idempotency_key=$2 limit 1`, [order.org_id, body.idempotencyKey],
      );
      if (prior[0]) return json({ ok: true, gateway: "RAZORPAY", gatewayOrderId: prior[0].gateway_order_id, amountPaise: Number(prior[0].amount_paise), keyId: process.env.RAZORPAY_KEY_ID });
      const gatewayOrder = await createRazorpayOrder({ amountPaise: Number(order.total_paise), receipt: order.id, idempotencyKey: body.idempotencyKey, notes: { orderkingOrderId: order.id } });
      await sql.query(
        `insert into payment_intents (id,org_id,order_id,gateway,gateway_order_id,amount_paise,status,idempotency_key)
         values ($1,$2,$3,'RAZORPAY',$4,$5,'CREATED',$6)`,
        [nid("payint"), order.org_id, order.id, gatewayOrder.id, gatewayOrder.amount, body.idempotencyKey],
      );
      return json({ ok: true, gateway: "RAZORPAY", gatewayOrderId: gatewayOrder.id, amountPaise: gatewayOrder.amount, currency: gatewayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID });
    }

    if (method === "POST" && path === "verify") {
      const body = (await request.json()) as { orderId: string; razorpayOrderId: string; paymentId: string; signature: string };
      if (!verifyCheckoutSignature({ orderId: body.razorpayOrderId, paymentId: body.paymentId, signature: body.signature })) return json({ error: "Invalid payment signature" }, 400);
      const payment = await fetchRazorpayPayment(body.paymentId);
      if (payment.order_id !== body.razorpayOrderId) return json({ error: "Payment order mismatch" }, 400);
      if (payment.status !== "captured") return json({ ok: false, status: payment.status });
      return json({ ok: true, status: "CAPTURED", paymentId: payment.id, orderId: body.orderId });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return fail(err);
  }
}
