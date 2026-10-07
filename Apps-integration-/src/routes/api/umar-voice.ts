import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { GoogleGenAI, Type } from "@google/genai";
import { getSql } from "@/lib/db";

// Safe wrapper for GenAI initialization
let ai = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (e: any) {
  console.warn("UMAR Voice GenAI init failed:", e);
}

// Tool Declarations
const tools: any = [{
  functionDeclarations: [
    {
      name: "get_platform_metrics",
      description: "Retrieves real-time counts for users, restaurants, riders, and today's orders from the database.",
      parameters: { type: Type.OBJECT, properties: {} }
    },
    {
      name: "get_pending_restaurants",
      description: "Retrieves a list of restaurants awaiting KYC approval.",
      parameters: { type: Type.OBJECT, properties: {} }
    },
    {
      name: "update_delivery_fee",
      description: "Updates the platform's base delivery fee. REQUIRES FOUNDER APPROVAL.",
      parameters: {
        type: Type.OBJECT,
        properties: { newFeeInr: { type: Type.NUMBER, description: "The new base delivery fee in Indian Rupees (INR)." } },
        required: ["newFeeInr"]
      }
    },
    {
      name: "approve_restaurant",
      description: "Approves a restaurant's KYC so they can start receiving orders. REQUIRES FOUNDER APPROVAL.",
      parameters: {
        type: Type.OBJECT,
        properties: { restaurantId: { type: Type.STRING, description: "The UUID of the restaurant to approve." } },
        required: ["restaurantId"]
      }
    },
    {
      name: "check_integration_health",
      description: "Retrieves the real-time status of all external platform integrations (AI, Maps, Payments).",
      parameters: { type: Type.OBJECT, properties: {} }
    },
    {
      name: "get_failed_payments",
      description: "Retrieves the count of recently failed payments or orders.",
      parameters: { type: Type.OBJECT, properties: {} }
    }
  ]
}];

export const Route = createAPIFileRoute("/api/umar-voice")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          if (!ai) {
            return new Response(JSON.stringify({ 
              text: "UMAR VOICE OFFLINE: The system requires the secure `GEMINI_API_KEY` to activate conversational control. Please configure the environment variables.", 
              success: true 
            }), { status: 200, headers: { "Content-Type": "application/json" } });
          }

          const body = await request.json();
          const { message, history, pendingToolCall } = body;

          const sql = await getSql();

          // 1. If we are executing an APPROVED pending tool call
          if (pendingToolCall && pendingToolCall.action === 'execute_tool') {
             const { name, args } = pendingToolCall;
             let resultMsg = "";
             
             try {
                if (name === 'update_delivery_fee') {
                  const bag = await getSettingsBag(sql);
                  if (!bag.marketplace) bag.marketplace = {};
                  bag.marketplace.deliveryBasePaise = Math.round(args.newFeeInr * 100);
                  await saveSettingsBag(sql, bag);
                  
                  await auditLog(sql, "UMAR_VOICE", "FEE_UPDATED", `Base delivery fee updated to ₹${args.newFeeInr}`);
                  resultMsg = `Successfully updated base delivery fee to ₹${args.newFeeInr}.`;
                } else if (name === 'approve_restaurant') {
                  await sql`UPDATE restaurants SET verification_status = 'APPROVED' WHERE id = ${args.restaurantId}`;
                  await auditLog(sql, "UMAR_VOICE", "RESTAURANT_APPROVED", `Approved KYC for restaurant ${args.restaurantId}`);
                  resultMsg = `Successfully approved restaurant ${args.restaurantId}. They are now live on the platform.`;
                }
             } catch (e: any) {
                resultMsg = `Tool execution failed: ${e.message}`;
             }

             // Send the result back to the model to summarize
             const response = await ai.models.generateContent({
               model: "gemini-1.5-pro",
               contents: [
                 ...(history || []),
                 { role: "user", parts: [{ text: message }] },
                 { role: "model", parts: [{ functionCall: { name, args } }] },
                 { role: "function", parts: [{ functionResponse: { name, response: { result: resultMsg } } }] }
               ],
               config: { tools, systemInstruction: getSystemInstruction() }
             });

             return new Response(JSON.stringify({ text: response.text, success: true }), { headers: { "Content-Type": "application/json" } });
          }

          // 2. Normal Conversation Flow
          const chatSession = ai.chats.create({
            model: "gemini-1.5-pro",
            config: { tools, systemInstruction: getSystemInstruction() },
            history: history || []
          });

          let response = await chatSession.sendMessage(message);

          // Handle tool calls automatically for READ operations
          if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            
            // DANGEROUS WRITE OPERATIONS -> Request User Approval
            if (['update_delivery_fee', 'approve_restaurant'].includes(call.name || '')) {
              return new Response(JSON.stringify({
                text: `I understand you want to ${(call.name || '').replace('_', ' ')}. This is a protected action. Please review and approve the execution.`,
                requiresApproval: true,
                toolCall: { name: call.name || "", args: call.args },
                success: true
              }), { headers: { "Content-Type": "application/json" } });
            }

            // SAFE READ OPERATIONS -> Execute immediately
            let functionResult = {};
            if (call.name === 'get_platform_metrics') {
              const [{ count: u }] = await sql`SELECT COUNT(*) FROM "user"` || [{ count: 0 }];
              const [{ count: r }] = await sql`SELECT COUNT(*) FROM restaurants` || [{ count: 0 }];
              const [{ count: o }] = await sql`SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE` || [{ count: 0 }];
              functionResult = { users: Number(u), restaurants: Number(r), todayOrders: Number(o) };
              await auditLog(sql, "UMAR_VOICE", "METRICS_ACCESSED", "Accessed live platform metrics.");
            } else if (call.name === 'get_pending_restaurants') {
              const pending = await sql`SELECT id, name FROM restaurants WHERE verification_status = 'PENDING_APPROVAL'` || [];
              functionResult = { pending_count: pending.length, restaurants: pending };
            } else if (call.name === 'check_integration_health') {
              functionResult = {
                ai_core: process.env.GEMINI_API_KEY ? 'ONLINE' : 'MISSING_CREDENTIALS',
                openai: process.env.OPENAI_API_KEY ? 'ONLINE' : 'MISSING_CREDENTIALS',
                payments: process.env.RAZORPAY_KEY ? 'ONLINE' : 'MISSING_CREDENTIALS',
                maps: process.env.MAPBOX_TOKEN ? 'ONLINE' : 'MISSING_CREDENTIALS'
              };
            } else if (call.name === 'get_failed_payments') {
              const failed = await sql`SELECT id, status, amount FROM orders WHERE status = 'FAILED' OR status = 'CANCELLED' ORDER BY created_at DESC LIMIT 10` || [];
              functionResult = { failed_count: failed.length, recent_failed: failed };
            }

            response = await chatSession.sendMessage({ message: [{ functionResponse: { name: call.name || "", response: functionResult } }] });
          }

          return new Response(JSON.stringify({ 
            text: response.text,
            success: true
          }), { status: 200, headers: { "Content-Type": "application/json" } });

        } catch (error: any) {
          console.error("[UMAR Voice] Error:", error);
          return new Response(JSON.stringify({ error: "Voice core fault", details: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});

function getSystemInstruction() {
  return `You are UMAR VOICE, the supreme conversational control layer for the OrderKing Platform.
You speak directly to the Founder. You are professional, highly concise, and capable of executing platform commands.
If the founder asks for metrics or status, use your tools to fetch real data. DO NOT INVENT DATA.
If the founder wants to modify fees or approve restaurants, use the corresponding tools. The system will automatically prompt the founder for security approval.`;
}

async function getSettingsBag(sql: any) {
  const rows = await sql`SELECT settings_json FROM platform_settings LIMIT 1`;
  if (rows.length > 0 && rows[0].settings_json) {
    try { return JSON.parse(rows[0].settings_json); } catch (e: any) {}
  }
  return {};
}

async function saveSettingsBag(sql: any, bag: any) {
  await sql`
    INSERT INTO platform_settings (id, settings_json) 
    VALUES (1, ${JSON.stringify(bag)})
    ON CONFLICT (id) DO UPDATE SET settings_json = EXCLUDED.settings_json
  `;
}

async function auditLog(sql: any, actor: string, event: string, details: string) {
  await sql`
    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id SERIAL PRIMARY KEY, timestamp TIMESTAMPTZ DEFAULT NOW(), actor TEXT NOT NULL, event_type TEXT NOT NULL, details JSONB NOT NULL, status TEXT NOT NULL
    )
  `;
  await sql`
    INSERT INTO system_audit_logs (actor, event_type, details, status)
    VALUES (${actor}, ${event}, ${JSON.stringify({ message: details })}, 'SUCCESS')
  `;
}

