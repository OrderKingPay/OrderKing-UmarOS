import { createFileRoute } from "@tanstack/react-router";
import { verifyPayoneerWebhook } from "@/lib/orderking/payments/crypto-webhook";
import { canonicalLedger } from "@/lib/orderking/finance/canonical-ledger";
import { loadPluginConnectorsData } from "@/lib/orderking/cms-connectors";
import { z } from "zod";

const PayoneerWebhookSchema = z.object({
  payment_id: z.string().optional(),
  event_type: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  status: z.string().optional(),
  payee_id: z.string().optional(),
  reference: z.string().optional(),
}).passthrough();

export const Route = createFileRoute("/api/v1/kingpay/payoneer-webhook" as any)({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const signature = request.headers.get("x-payoneer-signature");
          const rawBody = await request.text();

          const connectors = await loadPluginConnectorsData();
          const clientSecret = connectors.payoneer?.clientSecret || process.env.PAYONEER_CLIENT_SECRET;

          if (clientSecret && signature) {
            const isValid = verifyPayoneerWebhook(rawBody, signature, clientSecret);
            if (!isValid) {
              return new Response(JSON.stringify({ error: "Invalid Payoneer cryptographic signature" }), { status: 403 });
            }
          }

          const payload = PayoneerWebhookSchema.parse(JSON.parse(rawBody));
          const paymentId = payload.payment_id || `pay_${Date.now()}`;
          const amount = payload.amount || 0;
          const currency = (payload.currency || "USD").toUpperCase();

          // Settle into Canonical Ledger
          if (payload.status === "COMPLETED" || payload.status === "SETTLED" || payload.event_type === "PAYMENT_RECEIVED") {
            const amountPaise = Math.round(amount * (currency === "USD" ? 8300 : currency === "SAR" ? 2213 : 8300));

            await canonicalLedger.postTransaction({
              idempotencyKey: `payoneer_${paymentId}`,
              eventType: "PAYONEER_CROSS_BORDER_ROYALTY_CLEARED",
              orderId: payload.reference || paymentId,
              entries: [
                {
                  account: "BANK_CLEARING",
                  direction: "DEBIT",
                  amountPaise,
                  entityId: "PAYONEER_COMMERCIAL_WIRE",
                  memo: `Cross-border clearance: ${currency} ${amount.toFixed(2)} [Payee: ${payload.payee_id || "GLOBAL"}]`,
                },
                {
                  account: "FOUNDER_VAULT",
                  direction: "CREDIT",
                  amountPaise,
                  entityId: "FOUNDER_DELAWARE_TREASURY",
                  memo: `Direct institutional sweep from ${currency === "SAR" ? "Saudi Franchise Rail" : "US ACH Rail"}`,
                },
              ],
            });
          }

          return new Response(JSON.stringify({ received: true, paymentId, status: "PROCESSED" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error: "Payoneer webhook handling failed",
              details: error?.message,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
