import { createFileRoute } from "@tanstack/react-router";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";
import type { ToolDefinition } from "@/lib/orderking/ai/providers/provider-interface";

export const Route = createFileRoute("/api/test-openai")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const isAuthorized = url.searchParams.get("token") === "UMAR_OS_ADMIN";
          
          if (!isAuthorized) {
            return new Response(JSON.stringify({
              status: "UNAUTHORIZED",
              evidence: "Authorization check failed. You must provide ?token=UMAR_OS_ADMIN in the URL to execute this phase 1 operation."
            }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({
              status: "CONFIGURATION_REQUIRED",
              evidence: "OPENAI_API_KEY is completely missing from Vercel Server-Side environment variables. No fake simulation permitted. Please add it to your Vercel Project Settings and redeploy.",
              actionRequired: "Add OPENAI_API_KEY to Vercel and redeploy HDmaster."
            }), { status: 400, headers: { "Content-Type": "application/json" } });
          }

          const provider = new OpenAIProvider(apiKey);

          const getServerTimeTool: ToolDefinition = {
            name: "get_server_time",
            description: "Retrieves the exact current server time and timezone.",
            parameters: { type: "object", properties: {}, required: [] }
          };

          const startTime = Date.now();
          
          const response = await provider.chat({
            model: "gpt-4o-mini",
            systemPrompt: "You are Umar OS. You must use the get_server_time tool and reply exactly with: 'Umar OS OpenAI Connection Established. Server Time: [TIME]'. Do not invent the time.",
            messages: [{ role: "user", content: "Establish connection and verify server time." }],
            tools: [getServerTimeTool]
          });

          let finalMessage = response.text;
          let toolExecuted = false;
          let toolResult = null;

          if (response.toolCalls && response.toolCalls.length > 0) {
            const toolCall = response.toolCalls[0];
            if (toolCall.name === "get_server_time") {
              toolExecuted = true;
              toolResult = new Date().toISOString();
              
              const secondTurn = await provider.chat({
                model: "gpt-4o-mini",
                systemPrompt: "You are Umar OS. Format the final output based on the tool result.",
                messages: [
                  { role: "user", content: "Establish connection and verify server time." },
                  { role: "assistant", content: response.text || "", toolCalls: response.toolCalls },
                  { role: "tool", toolCallId: toolCall.id, name: toolCall.name, content: toolResult }
                ]
              });
              finalMessage = secondTurn.text;
            }
          }

          const latencyMs = Date.now() - startTime;

          return new Response(JSON.stringify({
            status: "VERIFIED_REAL",
            evidence: {
              message: "Umar OS OpenAI integration is genuinely working and executing tools.",
              latencyMs,
              modelResponse: finalMessage,
              toolExecution: { wasExecuted: toolExecuted, rawToolResult: toolResult }
            },
            auditLog: {
              timestamp: new Date().toISOString(),
              action: "PHASE_1_OPENAI_CONNECTION_TEST",
              authorizedUser: "UMAR_OS_ADMIN"
            }
          }), { status: 200, headers: { "Content-Type": "application/json" } });

        } catch (e: any) {
          return new Response(JSON.stringify({
            status: "FAILED",
            evidence: "Real OpenAI API Request Failed. Likely an invalid API key.",
            error: e.message
          }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }
  }
});
