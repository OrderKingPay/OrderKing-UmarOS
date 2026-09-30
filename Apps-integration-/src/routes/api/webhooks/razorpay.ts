import * as crypto from 'crypto';
import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { z } from 'zod';
import { getSql, type Sql } from '../../../lib/db';

/**
 * 👑 ORDERKING REAL MONEY GATEWAY (RAZORPAY)
 * 
 * SPACE-X LEVEL RELIABILITY ARCHITECTURE:
 * - Direct PostgreSQL ACID transactions via lib/db.ts (no missing Supabase RPCs)
 * - Cryptographic Webhook verification (timing-attack resistant)
 * - Strict FOR UPDATE Row-Level Locking (impossible to double-credit an order)
 * - Immutable canonical ledger injection (secures the Founder's revenue split in real-time)
 */

const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        order_id: z.string(),
        notes: z.record(z.string(), z.any()).optional(),
        status: z.string(),
      }).passthrough()
    }).optional()
  }).passthrough()
}).passthrough();

export const Route = createAPIFileRoute('/api/webhooks/razorpay')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
      const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
      
      if (!RAZORPAY_WEBHOOK_SECRET) {
         console.error('[SECURITY FATAL] RAZORPAY_WEBHOOK_SECRET is missing.');
         return new Response(JSON.stringify({ success: false, message: 'Server misconfiguration' }), { status: 500 });
      }

      const receivedSignature = request.headers.get('x-razorpay-signature');
      if (!receivedSignature) {
        return new Response(JSON.stringify({ success: false, message: 'Missing signature' }), { status: 401 });
      }

      const rawBody = await request.text();
      
      // Cryptographic Signature Validation
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature);
      const receivedBuffer = Buffer.from(receivedSignature);
      
      let isValidSignature = false;
      if (expectedBuffer.length === receivedBuffer.length) {
        isValidSignature = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
      }

      if (!isValidSignature) {
        console.error('[SECURITY ALERT] Invalid Razorpay webhook signature detected.');
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Invalid signature' }), { status: 401 });
      }

      // Parse payload
      const event = RazorpayWebhookSchema.parse(JSON.parse(rawBody));
      
      // We only process successful captures
      if (event.event === 'payment.captured' || event.event === 'order.paid') {
        const paymentData = event.payload.payment?.entity;
        if (!paymentData) {
          return new Response(JSON.stringify({ success: false, message: 'Invalid payment payload' }), { status: 400 });
        }

        const razorpayOrderId = paymentData.order_id;
        const internalOrderId = paymentData.notes?.internal_order_id; // Pass this from the frontend during order creation

        if (!internalOrderId) {
          console.warn(`[WARNING] Webhook received for Razorpay Order ${razorpayOrderId} without an internal_order_id in notes.`);
          return new Response(JSON.stringify({ success: true, message: 'Ignored: No internal_order_id mapped.' }), { status: 200 });
        }

        const sql = await getSql();

        await sql.transaction(async (tx: Sql) => {
          // Record the event first. Duplicate delivery events stop here without changing money state.
          const eventInsert = await tx<{ id: string }>`
            INSERT INTO payment_webhook_events (
              id, gateway, gateway_event_id, event_type, payload_json, signature
            )
            VALUES (
              ${crypto.randomUUID()}, 'RAZORPAY', ${paymentData.id}, ${event.event}, ${rawBody}, ${receivedSignature}
            )
            ON CONFLICT (gateway, gateway_event_id) DO NOTHING
            RETURNING id
          `;

          if (eventInsert.length === 0) {
            return;
          }

          // Lock the order until this transaction completes. Do not SKIP LOCKED:
          // a valid payment must never be acknowledged while waiting for another transaction.
          const orderRows = await tx<{
            org_id: string;
            restaurant_id: string;
            rider_id: string | null;
            total_paise: number;
            commission_paise: number;
            delivery_fee_paise: number;
            payment_status: string;
          }>`
            SELECT org_id, restaurant_id, rider_id, total_paise, commission_paise, delivery_fee_paise, payment_status
            FROM orders
            WHERE id = ${internalOrderId}
            FOR UPDATE
          `;

          if (orderRows.length === 0) {
            throw new Error(`Order ${internalOrderId} not found.`);
          }

          const order = orderRows[0];

          if (paymentData.currency !== "INR") {
            throw new Error(`Unsupported payment currency: ${paymentData.currency}`);
          }

          if (Number(paymentData.amount) !== Number(order.total_paise)) {
            throw new Error(
              `Payment amount mismatch: provider=${paymentData.amount}, order=${order.total_paise}`
            );
          }

          if (order.payment_status === "PAID") {
            return;
          }

          await tx`
            UPDATE orders
            SET payment_status = 'PAID',
                status = 'ACCEPTED',
                updated_at = NOW()
            WHERE id = ${internalOrderId}
          `;

          const founderRevenue = order.commission_paise;
          const riderPayout = order.delivery_fee_paise;
          const restaurantPayout = order.total_paise - founderRevenue - riderPayout;

          if (restaurantPayout < 0 || founderRevenue < 0 || riderPayout < 0) {
            throw new Error("Invalid negative revenue split detected.");
          }

          await tx`
            INSERT INTO ledger_entries (id, org_id, order_id, restaurant_id, party, kind, source, rule_key, amount_paise, note)
            VALUES (
              ${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, ${order.restaurant_id},
              'RESTAURANT', 'CREDIT', 'ORDER_PAYMENT', 'AUTO_SPLIT', ${restaurantPayout}, 'Restaurant payout for order'
            )
          `;

          await tx`
            INSERT INTO ledger_entries (id, org_id, order_id, party, kind, source, rule_key, amount_paise, note)
            VALUES (
              ${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId},
              'PLATFORM', 'CREDIT', 'ORDER_COMMISSION', 'AUTO_SPLIT', ${founderRevenue}, 'Platform commission'
            )
          `;

          if (order.rider_id) {
            await tx`
              INSERT INTO ledger_entries (id, org_id, order_id, rider_id, party, kind, source, rule_key, amount_paise, note)
              VALUES (
                ${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, ${order.rider_id},
                'RIDER', 'CREDIT', 'DELIVERY_FEE', 'AUTO_SPLIT', ${riderPayout}, 'Rider delivery fee'
              )
            `;
          }

          await tx`
            UPDATE payment_webhook_events
            SET processed_at = NOW(), processing_error = NULL
            WHERE gateway = 'RAZORPAY' AND gateway_event_id = ${paymentData.id}
          `;
        });
        console.info(`[REVENUE SECURED] Order ${internalOrderId} paid successfully. Money split injected into ledgers.`);
        return new Response(JSON.stringify({ success: true, message: 'Payment secured' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      // Ignore other events (like payment.failed, we handle that elsewhere)
      return new Response(JSON.stringify({ success: true, message: 'Event skipped' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({ success: false, message: 'Invalid payload format', details: error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      console.error('[FATAL] Webhook processing error:', error);
      return new Response(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
    }
      }
    }
  }
});
