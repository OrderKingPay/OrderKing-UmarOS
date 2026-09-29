import * as crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import {
  getWebhookEventId,
  markWebhookProcessed,
  recordWebhookEvent,
} from '../../../lib/integration/webhook-store';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export const APIRoute = createAPIFileRoute('/api/webhooks/razorpay')({
  POST: async ({ request }: { request: Request }) => {
    try {
      const receivedSignature = request.headers.get('x-razorpay-signature');
      if (!receivedSignature) {
        return new Response(JSON.stringify({ success: false, message: 'Missing signature' }), { status: 401 });
      }

      const rawBody = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValidSignature = receivedSignature.length === expectedSignature.length && crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(receivedSignature),
      );

      if (!isValidSignature) {
        console.error('[SECURITY ALERT] Invalid Razorpay webhook signature detected.');
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Invalid signature' }), { status: 401 });
      }

      const event = JSON.parse(rawBody) as Record<string, any>;
      const stored = await recordWebhookEvent({
        provider: 'razorpay',
        providerEventId: getWebhookEventId(request.headers, event),
        eventType: typeof event.event === 'string' ? event.event : 'unknown',
        payload: event,
        signatureValid: true,
      });

      if (stored.duplicate && stored.event.status === 'processed') {
        return new Response(JSON.stringify({ success: true, message: 'Duplicate webhook acknowledged' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (event.event === 'order.paid') {
        const paymentData = event.payload.payment.entity;
        const orderId = paymentData.order_id;
        
        // Execute an atomic ACID transaction via Supabase RPC
        const { error } = await supabase.rpc('handle_order_paid_transaction', {
          p_order_id: orderId,
          p_payment_id: paymentData.id,
          p_amount: paymentData.amount,
          p_currency: paymentData.currency
        });

        if (error) {
          throw new Error(`Transaction Failed: ${error.message}`);
        }

        await markWebhookProcessed(stored.event.id);
        return new Response(JSON.stringify({ success: true, message: 'Webhook processed successfully' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      await markWebhookProcessed(stored.event.id);
      return new Response(JSON.stringify({ success: true, message: 'Event ignored' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error: unknown) {
      console.error('[FATAL] Webhook processing error:', error);
      return new Response(JSON.stringify({ success: false, message: 'Internal Server Error' }), { status: 500 });
    }
  }
});
