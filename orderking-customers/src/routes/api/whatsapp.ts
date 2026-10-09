import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini for Natural Language Ordering
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const Route = createFileRoute("/api/whatsapp")({
  server: {
    handlers: {
      // Webhook verification for Meta/WhatsApp API
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      // Handle incoming WhatsApp messages
      POST: async ({ request }) => {
        try {
          const body = await request.json();
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

          // 4. (Future) Trigger outbound WhatsApp reply via Meta API
          // await fetch('https://graph.facebook.com/v17.0/.../messages', { ... })

          return new Response("OK", { status: 200 });

        } catch (error) {
          console.error("WhatsApp Webhook Error:", error);
          return new Response("OK", { status: 200 }); // Always 200 to WhatsApp to prevent retries
        }
      },
    },
  },
});
