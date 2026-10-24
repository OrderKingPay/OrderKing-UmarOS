import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhookSignature } from "@/lib/orderking/payments/razorpay.server";
import { canonicalLedger } from "@/lib/orderking/finance/canonical-ledger";
import { handleRazorpayXPayoutWebhook } from "@/lib/orderking/finance/razorpayx-payout-engine";
import { z } from "zod";

const RazorpayWebhookBaseSchema = z.object({
  event: z.string(),
  payload: z.record(z.string(), z.any()),
}).passthrough();

export const Route = createFileRoute("/api/v1/kingpay/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
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

          const parsedJson = JSON.parse(rawBody);
          const data = RazorpayWebhookBaseSchema.parse(parsedJson);

          // 1. Handle RazorpayX Payout Lifecycle Events
          if (data.event.startsWith("payout.") || data.event.startsWith("fund_account.")) {
            const payoutResult = await handleRazorpayXPayoutWebhook(parsedJson);
            return new Response(JSON.stringify({ success: true, ...payoutResult }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // 2. Handle Payment Capture Events
          if (data.event === "payment.captured") {
            const paymentObj = data.payload?.payment?.entity;
            if (!paymentObj?.id) {
              return new Response(JSON.stringify({ error: "Missing payment entity" }), { status: 400 });
            }
            const paymentId = paymentObj.id;
            
            // Impenetrable backend validation: Always fetch the source of truth from Razorpay directly
            const { fetchRazorpayPayment } = await import("@/lib/orderking/payments/razorpay.server");
            const trustedPayment = await fetchRazorpayPayment(paymentId);
            
            if (trustedPayment.status !== "captured") {
              return new Response(JSON.stringify({ error: "Payment is not in captured state on Razorpay servers" }), { status: 400 });
            }
            
            if (trustedPayment.amount !== paymentObj.amount) {
              return new Response(JSON.stringify({ error: "Amount mismatch detected" }), { status: 400 });
            }

            const payment = paymentObj;
            const accountId = payment.notes?.accountId || "PLATFORM_HOLDING";

            await canonicalLedger.postTransaction({
              idempotencyKey: `rzp_capture_${payment.id}`,
              eventType: "RAZORPAY_PAYMENT_CAPTURED",
              orderId: payment.order_id,
              entries: [
                {
                  account: "BANK_CLEARING" as any,
                  direction: "DEBIT",
                  amountPaise: trustedPayment.amount,
                  entityId: "GATEWAY",
                  memo: "Gateway clearing debit",
                },
                {
                  account: accountId as any,
                  direction: "CREDIT",
                  amountPaise: trustedPayment.amount,
                  entityId: "USER",
                  memo: "User cash in credit",
                },
              ],
            });
          }

          return new Response(JSON.stringify({ success: true, status: "PROCESSED" }), { 
            status: 200, 
            headers: { "Content-Type": "application/json" },
          });

        } catch (error: any) {
          console.error("[Razorpay Webhook Error]:", error);
          return new Response(JSON.stringify({ 
            error: "Webhook processing failed. Changes rolled back.", 
            details: error.message,
          }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
