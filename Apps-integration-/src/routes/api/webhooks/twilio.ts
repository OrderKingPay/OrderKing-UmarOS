import { createAPIFileRoute } from '@/lib/createAPIFileRoute';
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";
import { getSql } from "../../../lib/db";

// Simple nid generator if not imported
const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const Route = createAPIFileRoute("/api/webhooks/twilio")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const signature = request.headers.get("x-twilio-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
          console.error("TWILIO_AUTH_TOKEN is not configured");
          return new Response("Configuration error", { status: 500 });
        }

        const url = request.url;
        
        const bodyText = await request.text();
        const params = new URLSearchParams(bodyText);
        
        const paramsObj: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
          paramsObj[key] = value;
        }

        const isValid = WebhookGateway.verifyTwilioSignature(url, paramsObj, signature, authToken);

        if (!isValid) {
          return new Response("Invalid signature", { status: 400 });
        }

        const eventId = paramsObj.MessageSid || signature;

        try {
          const sql = await getSql();
          const inserted = await sql.query<{ id: string }>(
            `insert into payment_webhook_events (id, gateway, gateway_event_id, event_type, payload_json, signature)
             values ($1, 'TWILIO', $2, $3, $4, $5)
             on conflict (gateway, gateway_event_id) do nothing returning id`,
            [generateId("pwe"), eventId, paramsObj.MessageStatus || "incoming", bodyText, signature]
          );

          if (!inserted[0]) {
            console.log(`Duplicate Twilio webhook event skipped: ${eventId}`);
            return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
              status: 200,
              headers: { "Content-Type": "text/xml" },
            });
          }

          console.log("Verified Twilio Webhook Payload:", paramsObj);

          // Handle SMS/WhatsApp status callbacks or incoming messages
          const messageStatus = paramsObj.MessageStatus;
          if (messageStatus) {
            console.log(`Message ${paramsObj.MessageSid} status is now: ${messageStatus}`);
            let mappedStatus = 'SENT';
            if (messageStatus === 'delivered') mappedStatus = 'DELIVERED';
            else if (messageStatus === 'failed' || messageStatus === 'undelivered') mappedStatus = 'FAILED';
            
            await sql.query(
              `update notifications set status=$1, provider_confirmed=1, delivered_at=case when $1='DELIVERED' then now() else delivered_at end where provider_message_id=$2`,
              [mappedStatus, eventId]
            );
          }
          
          await sql.query(`update payment_webhook_events set processed_at=now(), processing_error=null where gateway='TWILIO' and gateway_event_id=$1`, [eventId]);
        } catch (error) {
          const sql = await getSql();
          await sql.query(`update payment_webhook_events set processing_error=$1 where gateway='TWILIO' and gateway_event_id=$2`, [error instanceof Error ? error.message : String(error), eventId]);
          return new Response("Error processing webhook", { status: 500 });
        }

        // Return an empty TwiML response
        const twiml = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
        return new Response(twiml, {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      },
    },
  },
});


