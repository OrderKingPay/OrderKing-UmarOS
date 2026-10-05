import * as crypto from 'crypto';
import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { z } from 'zod';
import { getSql, type Sql } from '../../../lib/db';

/**
 * 👑 ORDERKING REAL MONEY GATEWAY (RAZORPAY)
 */

const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        order_id: z.string().optional(),
        notes: z.record(z.string(), z.any()).optional(),
        status: z.string(),
        error_code: z.string().optional(),
        error_description: z.string().optional(),
      }).passthrough()
    }).optional(),
    refund: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        payment_id: z.string(),
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

          const event = RazorpayWebhookSchema.parse(JSON.parse(rawBody));
          const gatewayEventId = request.headers.get('x-razorpay-event-id') || event.payload?.payment?.entity?.id || crypto.randomUUID();

          const sql = await getSql();

          // Check if event already processed for idempotency
          const existingWebhook = await sql`
            SELECT id FROM payment_webhook_events
            WHERE gateway = 'RAZORPAY' AND gateway_event_id = ${gatewayEventId}
          `;
          
          if (existingWebhook.length > 0) {
            console.log(`[IDEMPOTENT] Webhook event ${gatewayEventId} already processed.`);
            return new Response(JSON.stringify({ success: true, message: 'Already processed' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          // Handle Payment Captures
          if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const paymentData = event.payload.payment?.entity;
            if (!paymentData) return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), { status: 400 });

            const internalOrderId = paymentData.notes?.internal_order_id;
            if (!internalOrderId) return new Response(JSON.stringify({ success: true, message: 'Ignored: No internal_order_id' }), { status: 200 });

            await sql.transaction(async (tx: Sql) => {
              const orderRows = await tx<{
                org_id: string; restaurant_id: string; rider_id: string | null;
                total_paise: number; commission_paise: number; delivery_fee_paise: number;
                payment_status: string; status: string;
              }>`
                SELECT org_id, restaurant_id, rider_id, total_paise, commission_paise, delivery_fee_paise, payment_status, status 
                FROM orders WHERE id = ${internalOrderId} FOR UPDATE
              `;

              if (orderRows.length === 0) return; 
              const order = orderRows[0];

              if (order.payment_status === 'PAID') return;

              const terminalStates = ['DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED', 'REJECTED', 'DELIVERY_FAILED'];
              const newStatus = terminalStates.includes(order.status) ? order.status : 'CONFIRMED';

              await tx`
                UPDATE orders SET payment_status = 'PAID', status = ${newStatus}, updated_at = NOW() WHERE id = ${internalOrderId}
              `;

              const founderRevenue = order.commission_paise; 
              const riderPayout = order.delivery_fee_paise;
              const restaurantPayout = order.total_paise - founderRevenue - riderPayout;

              await tx`
                INSERT INTO ledger_entries (id, org_id, order_id, restaurant_id, party, kind, source, rule_key, amount_paise, note)
                VALUES (${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, ${order.restaurant_id}, 'RESTAURANT', 'CREDIT', 'ORDER_PAYMENT', 'AUTO_SPLIT', ${restaurantPayout}, 'Restaurant payout for order')
              `;
              await tx`
                INSERT INTO ledger_entries (id, org_id, order_id, party, kind, source, rule_key, amount_paise, note)
                VALUES (${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, 'PLATFORM', 'CREDIT', 'ORDER_COMMISSION', 'AUTO_SPLIT', ${founderRevenue}, 'Platform commission')
              `;
              if (order.rider_id) {
                await tx`
                  INSERT INTO ledger_entries (id, org_id, order_id, rider_id, party, kind, source, rule_key, amount_paise, note)
                  VALUES (${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, ${order.rider_id}, 'RIDER', 'CREDIT', 'DELIVERY_FEE', 'AUTO_SPLIT', ${riderPayout}, 'Rider delivery fee')
                `;
              }

              await tx`
                INSERT INTO payment_webhook_events (id, gateway, gateway_event_id, event_type, payload_json, signature)
                VALUES (${crypto.randomUUID()}, 'RAZORPAY', ${gatewayEventId}, ${event.event}, ${rawBody}, ${receivedSignature})
                ON CONFLICT DO NOTHING
              `;
            });

            return new Response(JSON.stringify({ success: true, message: 'Payment secured' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          // Handle Payment Failures
          if (event.event === 'payment.failed') {
            const paymentData = event.payload.payment?.entity;
            if (!paymentData) return new Response(JSON.stringify({ success: false, message: 'Invalid payload' }), { status: 400 });
            
            const internalOrderId = paymentData.notes?.internal_order_id;
            if (internalOrderId) {
              await sql.transaction(async (tx: Sql) => {
                const orderRows = await tx<{ status: string, payment_status: string }>`SELECT status, payment_status FROM orders WHERE id = ${internalOrderId} FOR UPDATE`;
                if (orderRows.length === 0) return;
                const order = orderRows[0];
                
                if (order.payment_status === 'PAID') return; // Cannot fail if already paid successfully

                await tx`UPDATE orders SET payment_status = 'FAILED', status = 'FAILED', updated_at = NOW() WHERE id = ${internalOrderId}`;
                await tx`INSERT INTO payment_webhook_events (id, gateway, gateway_event_id, event_type, payload_json, signature) VALUES (${crypto.randomUUID()}, 'RAZORPAY', ${gatewayEventId}, ${event.event}, ${rawBody}, ${receivedSignature}) ON CONFLICT DO NOTHING`;
              });
            }
            return new Response(JSON.stringify({ success: true, message: 'Payment failed handled' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          // Handle Refunds (Full and Partial)
          if (event.event === 'refund.created' || event.event === 'refund.processed') {
            const refundData = event.payload.refund?.entity;
            const paymentData = event.payload.payment?.entity;
            if (!refundData) return new Response(JSON.stringify({ success: false, message: 'Invalid refund payload' }), { status: 400 });

            const internalOrderId = refundData.notes?.internal_order_id || paymentData?.notes?.internal_order_id;
            
            if (internalOrderId) {
              await sql.transaction(async (tx: Sql) => {
                const orderRows = await tx<{ org_id: string, total_paise: number, refunded_paise: number }>`SELECT org_id, total_paise, refunded_paise FROM orders WHERE id = ${internalOrderId} FOR UPDATE`;
                if (orderRows.length === 0) return;
                const order = orderRows[0];

                const refundAmount = refundData.amount;
                const newRefundedTotal = order.refunded_paise + refundAmount;
                const isFullRefund = newRefundedTotal >= order.total_paise;
                const newStatus = isFullRefund ? 'REFUNDED' : order.status;

                await tx`UPDATE orders SET refunded_paise = ${newRefundedTotal}, status = ${newStatus}, updated_at = NOW() WHERE id = ${internalOrderId}`;
                
                // Track refund in ledger
                await tx`
                  INSERT INTO ledger_entries (id, org_id, order_id, party, kind, source, rule_key, amount_paise, note)
                  VALUES (${crypto.randomUUID()}, ${order.org_id}, ${internalOrderId}, 'PLATFORM', 'DEBIT', 'ORDER_REFUND', 'MANUAL_REFUND', ${refundAmount}, 'Refund to customer')
                `;

                await tx`INSERT INTO payment_webhook_events (id, gateway, gateway_event_id, event_type, payload_json, signature) VALUES (${crypto.randomUUID()}, 'RAZORPAY', ${gatewayEventId}, ${event.event}, ${rawBody}, ${receivedSignature}) ON CONFLICT DO NOTHING`;
              });
            }
            return new Response(JSON.stringify({ success: true, message: 'Refund handled' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          // Ignore other events
          return new Response(JSON.stringify({ success: true, message: 'Event skipped' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
          
        } catch (error: any) {
          if (error instanceof z.ZodError) return new Response(JSON.stringify({ success: false, message: 'Invalid payload format', details: error.issues }), { status: 400, headers: { 'Content-Type': 'application/json' } });
          console.error('[FATAL] Webhook processing error:', error);
          return new Response(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
        }
      }
    }
  }
});
