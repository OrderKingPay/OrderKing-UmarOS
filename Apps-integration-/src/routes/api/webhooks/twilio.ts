import { createFileRoute } from "@tanstack/react-router";
import { WebhookGateway } from "../../../lib/integration/webhook-gateway";

export const Route = createFileRoute("/api/webhooks/twilio")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signature = request.headers.get("x-twilio-signature");
        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        const authToken = process.env.TWILIO_AUTH_TOKEN;
        if (!authToken) {
          console.error("TWILIO_AUTH_TOKEN is not configured");
          return new Response("Configuration error", { status: 500 });
        }

        // Reconstruct the full URL
        // `request.url` should be the full request URL but we might need to handle proxy headers
        // if deployed behind a reverse proxy (like Nginx/Vercel). We'll assume `request.url` is correct.
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

        console.log("Verified Twilio Webhook Payload:", paramsObj);

        // TODO: Handle SMS/WhatsApp status callbacks or incoming messages
        const messageStatus = paramsObj.MessageStatus;
        if (messageStatus) {
          console.log(`Message ${paramsObj.MessageSid} status is now: ${messageStatus}`);
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
