import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookSignature } from "@/lib/orderking/payments/razorpay.server";
import { canonicalLedger } from "@/lib/orderking/finance/canonical-ledger";
import { z } from "zod";

const RazorpayWebhookSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        order_id: z.string(),
        notes: z.record(z.string(), z.string()).optional()
      })
    })
  }).passthrough()
}).passthrough();

export const Route = createFileRoute("/api/v1/kingpay/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const signature = request.headers.get("x-razorpay-signature");
          if (!signature) {
            return new Response(JSON.stringify({ error: "Missing signature" }), { status: 400 });
          }

          const rawBody = await request.text();
          
          const isValid = verifyWebhookSignature(rawBody, signature);
          if (!isValid) {
            return new Response(JSON.stringify({ error: "Invalid cryptographic signature" }), { status: 403 });
          }

          const data = RazorpayWebhookSchema.parse(JSON.parse(rawBody));

          if (data.event === "payment.captured") {
            const payment = data.payload.payment.entity;
            const accountId = payment.notes?.accountId || "PLATFORM_HOLDING";

            await canonicalLedger.postTransaction({
              idempotencyKey: `rzp_capture_${payment.id}`,
              eventType: "RAZORPAY_PAYMENT_CAPTURED",
              orderId: payment.order_id,
              memo: `Razorpay payment captured for account ${accountId}`,
              entries: [
                {
                  account: "BANK_CLEARING" as any,
                  direction: "DEBIT",
                  amountPaise: payment.amount,
                  entityId: "GATEWAY",
                  memo: "Gateway clearing debit"
                },
                {
                  account: accountId as any,
                  direction: "CREDIT",
                  amountPaise: payment.amount,
                  entityId: "USER",
                  memo: "User cash in credit"
                }
              ]
            });
          }

          return new Response(JSON.stringify({ success: true, status: "PROCESSED" }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" } 
          });

        } catch (error: any) {
          return new Response(JSON.stringify({ 
            error: "Webhook processing failed. Changes rolled back.", 
            details: error.message 
          }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }
  }
});
