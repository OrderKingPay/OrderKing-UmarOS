import { createFileRoute } from "@tanstack/react-router";
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";

export const Route = createFileRoute("/api/webhooks/messagebird")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("messagebird-signature");
        const timestamp = request.headers.get("messagebird-request-timestamp");
        
        if (!signature || !timestamp) {
          return new Response("Missing signature or timestamp", { status: 400 });
        }

        const signingKey = process.env.MESSAGEBIRD_SIGNING_KEY;
        if (!signingKey) {
          console.error("MESSAGEBIRD_SIGNING_KEY is not configured");
          return new Response("Configuration error", { status: 500 });
        }

        const url = request.url;
        const rawBody = await request.text();

        const isValid = WebhookGateway.verifyMessageBirdSignature(
          url,
          rawBody,
          signature,
          timestamp,
          signingKey
        );

        if (!isValid) {
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          const payload = JSON.parse(rawBody);
          console.log("Verified MessageBird Webhook Payload:", payload);

          // TODO: Handle MessageBird events (e.g. message.status)
          return new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response("Invalid JSON payload", { status: 400 });
        }
      },
    },
  },
});
