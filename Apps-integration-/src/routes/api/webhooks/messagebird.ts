import { createFileRoute } from "@tanstack/react-router";
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";
import {
  getWebhookEventId,
  markWebhookFailed,
  markWebhookProcessed,
  recordWebhookEvent,
} from "../../../lib/integration/webhook-store";

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
          const payload = JSON.parse(rawBody) as Record<string, unknown>;
          const eventId = getWebhookEventId(request.headers, payload);
          const eventType = typeof payload.type === "string" ? payload.type : "message.event";
          const event = await recordWebhookEvent({
            provider: "messagebird",
            providerEventId: eventId,
            eventType,
            payload,
            signatureValid: true,
          });

          if (!event.duplicate || event.event.status !== "processed") {
            try {
              await markWebhookProcessed(event.event.id);
            } catch (processingError) {
              await markWebhookFailed(
                event.event.id,
                processingError instanceof Error ? processingError.message : "Processing failed",
              );
              throw processingError;
            }
          }

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


