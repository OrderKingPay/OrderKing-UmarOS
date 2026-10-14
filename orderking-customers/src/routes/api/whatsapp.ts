import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { GoogleGenAI } from "@google/genai/web";
import crypto from "node:crypto";
import { timingSafeStringCompare, timingSafeHexCompare } from "@/lib/security/crypto-safe";

export const Route = createFileRoute("/api/whatsapp")({
  server: {
    handlers: {
      // Webhook verification for Meta/WhatsApp API
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (
          mode === "subscribe" &&
          token &&
          process.env.WHATSAPP_VERIFY_TOKEN &&
          timingSafeStringCompare(token, process.env.WHATSAPP_VERIFY_TOKEN)
        ) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      // Handle incoming WhatsApp messages
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text();
          const signatureHeader = request.headers.get("x-hub-signature-256");

          if (process.env.WHATSAPP_APP_SECRET && signatureHeader) {
            const expectedHex = crypto
              .createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
              .update(rawBody)
              .digest("hex");
            const receivedHex = signatureHeader.replace(/^sha256=/, "");
            if (!timingSafeHexCompare(expectedHex, receivedHex)) {
              return new Response("Unauthorized", { status: 401 });
            }
          }

          const body = JSON.parse(rawBody || "{}");
          const sql = await getSql();

          // Extract message details (Meta Graph API structure)
          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0];
          const value = changes?.value;
          const message = value?.messages?.[0];
          const contact = value?.contacts?.[0];

          if (!message || message.type !== "text") {
            return new Response("OK", { status: 200 }); // Ignore non-text for now
          }

          const phone = contact?.wa_id;
          const text = message.text.body;

          // 1. Identify user by phone number
          const users = await sql<{ id: string }>`SELECT id FROM auth.users WHERE raw_user_meta_data->>'phone' = ${phone} LIMIT 1`;
          let userId = users.length > 0 ? users[0].id : null;

          // 2. Use Gemini to parse intent
          const prompt = `
            You are OrderKing's AI assistant. 
            User message: "${text}"
            
            Determine the intent. Reply strictly in JSON format:
            {
              "intent": "order" | "status" | "support" | "unknown",
              "items": [{"name": "string", "qty": number}],
              "orderId": "string if status",
              "reply": "friendly natural language response acknowledging their request"
            }
          `;

          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });

          const parsed = JSON.parse(aiResponse.text || "{}");

          // 3. Log communication in the CRM tracking infrastructure
          await sql`
            INSERT INTO crm_communications (channel, recipient, status, metadata, sent_at)
            VALUES ('whatsapp', ${phone}, 'received', ${JSON.stringify(parsed)}, NOW())
          `;

          // 4. Trigger outbound WhatsApp reply via Meta Cloud API v21.0 if credentials configured
          if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && phone && parsed.reply) {
            try {
              await fetch(
                `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: phone,
                    type: "text",
                    text: { body: parsed.reply },
                  }),
                }
              );
            } catch (_err) {
              console.warn("Outbound WhatsApp reply send skipped:", _err);
            }
          }

          return new Response("OK", { status: 200 });

        } catch (error) {
          console.error("WhatsApp Webhook Error:", error);
          return new Response("OK", { status: 200 }); // Always 200 to WhatsApp to prevent retries
        }
      },
    },
  },
});
