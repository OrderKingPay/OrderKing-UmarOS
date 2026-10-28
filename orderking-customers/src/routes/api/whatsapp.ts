import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { GoogleGenAI } from "@google/genai/web";
import crypto from "node:crypto";
import { timingSafeStringCompare, timingSafeHexCompare } from "@/lib/security/crypto-safe";
import { generateBotCareResponse } from "@orderking/ui";

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

          // 1. Identify user and active order by phone number
          const cleanPhone = (phone || "").replace(/\D/g, "").replace(/^(?:91|0)/, "");
          let activeOrder: { id: string; status: string; public_id?: string } | null = null;
          try {
            const orders = await sql<{ id: string; status: string; public_id: string }>`
              SELECT o.id, o.status, o.public_id 
              FROM orders o
              JOIN "user" u ON o.user_id = u.id
              WHERE u.phone LIKE ${"%" + cleanPhone}
              ORDER BY o.placed_at DESC
              LIMIT 1
            `;
            if (orders.length > 0) activeOrder = orders[0];
          } catch {
            /* ignore db error */
          }

          // 2. Generate sovereign 24/7 care response in local language (en/hi/bn/syl)
          const botCare = generateBotCareResponse(text, {
            orderId: activeOrder?.public_id || activeOrder?.id,
            orderStatus: activeOrder?.status,
          });

          let finalReply = botCare.replyText;
          let parsed: any = {
            intent: botCare.intent,
            language: botCare.language,
            reply: botCare.replyText,
          };

          // 3. If Gemini is available, enhance response while maintaining local tongue
          if (process.env.GEMINI_API_KEY) {
            try {
              const prompt = `
                You are OrderKing's Sovereign AI Customer Care Assistant. 
                User message: "${text}"
                Detected Language: ${botCare.language} (en, hi, bn, or syl)
                Grounding reply template: "${botCare.replyText}"
                Active Order: ${activeOrder ? `#${activeOrder.public_id || activeOrder.id} (${activeOrder.status})` : "None"}

                Instruction:
                1. Determine user intent.
                2. Reply strictly in the EXACT SAME LANGUAGE and DIALECT as the user (English, Hindi, Bengali, or Sylheti).
                3. Return JSON:
                {
                  "intent": "${botCare.intent}",
                  "reply": "friendly, accurate response based on grounding template"
                }
              `;

              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              const aiResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { responseMimeType: "application/json" },
              });

              const geminiParsed = JSON.parse(aiResponse.text || "{}");
              if (geminiParsed.reply) {
                finalReply = geminiParsed.reply;
                parsed = { ...parsed, ...geminiParsed };
              }
            } catch (aiErr) {
              console.warn("Gemini WhatsApp enhancement skipped, using sovereign deterministic care reply:", aiErr);
            }
          }

          // 4. Log communication in the CRM tracking infrastructure
          await sql`
            INSERT INTO crm_communications (channel, recipient, status, metadata, sent_at)
            VALUES ('whatsapp', ${phone}, 'received', ${JSON.stringify(parsed)}, NOW())
          `;

          // 5. Trigger outbound WhatsApp reply via Meta Cloud API v21.0 if credentials configured
          if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && phone && finalReply) {
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
                    text: { body: finalReply },
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
