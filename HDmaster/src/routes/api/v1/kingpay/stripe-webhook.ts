import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeWebhook } from "@/lib/orderking/payments/crypto-webhook";
import { canonicalLedger } from "@/lib/orderking/finance/canonical-ledger";
import { loadPluginConnectorsData } from "@/lib/orderking/cms-connectors";
import { z } from "zod";

const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.string(), z.any()),
  }),
}).passthrough();

export const Route = createFileRoute("/api/v1/kingpay/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const signature = request.headers.get("stripe-signature");
          const rawBody = await request.text();

          const connectors = await loadPluginConnectorsData();
          const webhookSecret = connectors.stripeAtlas?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;

          if (webhookSecret && signature) {
            const isValid = verifyStripeWebhook(rawBody, signature, webhookSecret);
            if (!isValid) {
              return new Response(JSON.stringify({ error: "Invalid Stripe cryptographic signature" }), { status: 403 });
            }
          }

          const event = StripeWebhookSchema.parse(JSON.parse(rawBody));

          if (event.type === "invoice.payment_succeeded" || event.type === "checkout.session.completed") {
            const obj = event.data.object;
            const amountTotalCents = (obj.amount_paid || obj.amount_total || 0) as number;
            const currency = (obj.currency || "usd").toUpperCase();
            const customerId = (obj.customer || obj.id || "CUST_SAAS") as string;
            const subscriptionId = (obj.subscription || obj.id || "SUB_SAAS") as string;

            // Post into Canonical Ledger under FOUNDER_VAULT / BANK_CLEARING
            await canonicalLedger.postTransaction({
              idempotencyKey: `stripe_${event.id}`,
              eventType: "STRIPE_ATLAS_USD_SUBSCRIPTION_COLLECTED",
              orderId: subscriptionId,
              entries: [
                {
                  account: "BANK_CLEARING",
                  direction: "DEBIT",
                  amountPaise: Math.round(amountTotalCents * 83), // Convert USD cents to approximate INR equivalent paise for unified reporting
                  entityId: "STRIPE_ATLAS_DELAWARE",
                  memo: `Stripe Atlas USD recurring billing: ${currency} ${(amountTotalCents / 100).toFixed(2)} [Customer: ${customerId}]`,
                },
                {
                  account: "FOUNDER_VAULT",
                  direction: "CREDIT",
                  amountPaise: Math.round(amountTotalCents * 83),
                  entityId: "FOUNDER_DELAWARE_HOLDING",
                  memo: `Delaware C-Corp USD SaaS Revenue: ${currency} ${(amountTotalCents / 100).toFixed(2)}`,
                },
              ],
            });
          }

          return new Response(JSON.stringify({ received: true, eventId: event.id, status: "PROCESSED" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: "Stripe webhook handling failed",
              details: error?.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
