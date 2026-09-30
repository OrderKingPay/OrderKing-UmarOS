import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";
import { getSql } from "../../../lib/db";

// Simple nid generator if not imported
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const Route = createAPIFileRoute("/api/webhooks/messagebird")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
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

        let payload: any;
        try {
          payload = JSON.parse(rawBody);
        } catch (error) {
          return new Response("Invalid JSON payload", { status: 400 });
        }

        const eventId = payload.id || signature;

        try {
          const sql = await getSql();
          const inserted = await sql.query<{ id: string }>(
            `insert into payment_webhook_events (id, gateway, gateway_event_id, event_type, payload_json, signature)
             values ($1, 'MESSAGEBIRD', $2, $3, $4, $5)
             on conflict (gateway, gateway_event_id) do nothing returning id`,
            [generateId("pwe"), eventId, payload.type || "incoming", rawBody, signature]
          );

          if (!inserted[0]) {
            console.log(`Duplicate MessageBird webhook event skipped: ${eventId}`);
            return new Response(JSON.stringify({ status: "ok", duplicate: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          console.log("Verified MessageBird Webhook Payload:", payload);

          // Handle MessageBird events (e.g. message.status)
          const messageStatus = payload.message?.status || payload.status;
          if (messageStatus) {
            let mappedStatus = 'SENT';
            if (messageStatus === 'delivered') mappedStatus = 'DELIVERED';
            else if (messageStatus === 'delivery_failed' || messageStatus === 'failed') mappedStatus = 'FAILED';
            
            await sql.query(
              `update notifications set status=$1, provider_confirmed=1, delivered_at=case when $1='DELIVERED' then now() else delivered_at end where provider_message_id=$2`,
              [mappedStatus, eventId]
            );
          }
          await sql.query(`update payment_webhook_events set processed_at=now(), processing_error=null where gateway='MESSAGEBIRD' and gateway_event_id=$1`, [eventId]);

          return new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const sql = await getSql();
          await sql.query(`update payment_webhook_events set processing_error=$1 where gateway='MESSAGEBIRD' and gateway_event_id=$2`, [error instanceof Error ? error.message : String(error), eventId]);
          return new Response("Error processing webhook", { status: 500 });
        }
      },
    },
  },
});


