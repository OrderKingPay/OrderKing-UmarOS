// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";
import type { ToolDefinition } from "@/lib/orderking/ai/providers/provider-interface";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";

export const Route = createFileRoute("/api/test-openai")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const userId = await requireUserId();
          const workspace = await ensureWorkspace(userId);
          if (!workspace.ctx.permissions.includes("access_AI")) {
            return new Response(JSON.stringify({
              status: "FORBIDDEN",
              evidence: "The authenticated account does not have access_AI permission."
            }), { status: 403, headers: { "Content-Type": "application/json" } });
          }

          const rateLimitResponse = await enforceRateLimit(request, "hdmaster:openai-test", {
            windowMs: 60_000,
            maxRequests: 10,
          });
          if (rateLimitResponse) return rateLimitResponse;

          const apiKey = process.env.OPENAI_API_KEY?.trim();
          if (!apiKey) {
            return new Response(JSON.stringify({
              status: "CONFIGURATION_REQUIRED",
              evidence: "OPENAI_API_KEY is missing from the secure server environment.",
              actionRequired: "Configure OPENAI_API_KEY in the deployment platform secret environment."
            }), { status: 503, headers: { "Content-Type": "application/json" } });
          }

          const provider = new OpenAIProvider(apiKey);
          const getServerTimeTool: ToolDefinition = {
            name: "get_server_time",
            description: "Retrieves the exact current server time and timezone.",
            parameters: { type: "object", properties: {}, required: [] }
          };

          const startTime = Date.now();
          const response = await provider.chat({
            model: process.env.OPENAI_MODEL?.trim() || undefined,
            systemPrompt: "You are OrderKing's OpenAI integration health verifier. Request the get_server_time tool only when useful and never claim it executed unless a tool call is returned.",
            messages: [{ role: "user", content: "Establish the OpenAI connection and request the server-time tool if appropriate." }],
            tools: [getServerTimeTool]
          });

          const toolRequested = Boolean(response.toolCalls?.some((tool) => tool.name === "get_server_time"));
          const toolResult = toolRequested ? new Date().toISOString() : null;
          const latencyMs = Date.now() - startTime;

          return new Response(JSON.stringify({
            status: "VERIFIED_REAL",
            evidence: {
              model: response.model,
              provider: response.provider,
              latencyMs,
              modelResponse: response.text,
              toolExecution: {
                wasRequestedByModel: toolRequested,
                rawToolResultGenerated: toolResult,
              }
            },
            auditLog: {
              timestamp: new Date().toISOString(),
              action: "OPENAI_CONNECTION_TEST",
              authorizedUser: workspace.email,
            }
          }), { status: 200, headers: { "Content-Type": "application/json" } });

        } catch (e: any) {
          return new Response(JSON.stringify({
            status: "FAILED",
            evidence: "Real OpenAI API request failed.",
            error: e?.message || "Unknown error"
          }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      }
    }
  }
});
