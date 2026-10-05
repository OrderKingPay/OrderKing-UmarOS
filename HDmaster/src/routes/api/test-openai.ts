// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";
import type { ToolDefinition } from "@/lib/orderking/ai/providers/provider-interface";

export const Route = createFileRoute("/api/test-openai")({
  // @ts-expect-error: server.handlers is provided by TanStack Start during route generation.
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const authHeader = request.headers.get("authorization");
          const cronSecret = process.env.CRON_SECRET?.trim();
          if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return new Response(
              JSON.stringify({ status: "UNAUTHORIZED", evidence: "Valid server authorization is required." }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const apiKey = process.env.OPENAI_API_KEY?.trim();
          if (!apiKey) {
            return new Response(
              JSON.stringify({
                status: "CONFIGURATION_REQUIRED",
                evidence: "OPENAI_API_KEY is missing from the Cloudflare server environment. No simulated AI response is returned.",
                actionRequired: "Configure OPENAI_API_KEY in the active Cloudflare project before enabling this diagnostic.",
              }),
              { status: 503, headers: { "Content-Type": "application/json" } },
            );
          }

          const provider = new OpenAIProvider(apiKey);
          const getServerTimeTool: ToolDefinition = {
            name: "get_server_time",
            description: "Retrieves the exact current server time and timezone.",
            parameters: { type: "object", properties: {}, required: [] },
          };

          const startTime = Date.now();
          const response = await provider.chat({
            model: "gpt-4o-mini",
            systemPrompt: "You are Umar OS. Use the get_server_time tool before answering.",
            messages: [{ role: "user", content: "Establish connection and execute the get_server_time tool." }],
            tools: [getServerTimeTool],
          });

          const toolCall = response.toolCalls?.[0];
          const toolExecuted = toolCall?.name === "get_server_time";
          const toolResult = toolExecuted ? new Date().toISOString() : null;
          const latencyMs = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              status: "VERIFIED_REAL",
              evidence: {
                message: "The diagnostic completed against the configured OpenAI provider.",
                latencyMs,
                modelResponse: response.text,
                toolExecution: { wasRequestedByModel: toolExecuted, rawToolResultGenerated: toolResult },
              },
              auditLog: {
                timestamp: new Date().toISOString(),
                action: "OPENAI_CONNECTION_DIAGNOSTIC",
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (error) {
          return new Response(
            JSON.stringify({
              status: "FAILED",
              evidence: "The real OpenAI diagnostic request failed.",
              error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 502, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
