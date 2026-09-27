// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";

export const Route = createFileRoute("/api/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-razorpay-signature");
        if (!signature) {
          return new Response(JSON.stringify({ error: "Missing signature" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const rawBody = await request.text();
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
          console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
          return new Response(JSON.stringify({ error: "Configuration error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const isValid = WebhookGateway.verifyRazorpaySignature(rawBody, signature, secret);

        if (!isValid) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const payload = JSON.parse(rawBody);
          console.log("Verified Razorpay Webhook:", payload.event);

          // TODO: Implement specific event handling (e.g. payment.captured)
          switch (payload.event) {
            case "payment.captured":
              // Handle captured payment
              break;
            case "payment.failed":
              // Handle failed payment
              break;
            default:
              console.log("Unhandled Razorpay event:", payload.event);
          }

          return new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});


