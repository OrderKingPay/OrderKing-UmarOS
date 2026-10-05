import { createFileRoute } from "@tanstack/react-router";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";

export const Route = createFileRoute("/api/test-openai")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const production =
          process.env.NODE_ENV === "production" ||
          process.env.CF_PAGES === "1" ||
          process.env.CF_WORKERS === "1";

        if (production) {
          return new Response(null, { status: 404 });
        }

        const expected = process.env.ORDERKING_SERVICE_TOKEN?.trim();
        const supplied = request.headers.get("x-orderking-service-token")?.trim();
        if (!expected || !supplied || supplied !== expected) {
          return Response.json({ status: "UNAUTHORIZED" }, { status: 401 });
        }

        const provider = new OpenAIProvider();
        if (!provider.isConfigured) {
          return Response.json(
            { status: "CONFIGURATION_REQUIRED", state: "OPENAI_UNCONFIGURED" },
            { status: 503 },
          );
        }

        try {
          const startTime = Date.now();
          const response = await provider.chat({
            model: process.env.OPENAI_MODEL_ID || "gpt-6-luna",
            systemPrompt: "Return a concise health-check response.",
            messages: [{ role: "user", content: "Health check." }],
          });
          return Response.json({
            status: "VERIFIED_REAL",
            provider: response.provider,
            model: response.model,
            latencyMs: Date.now() - startTime,
            responseText: response.text,
          });
        } catch (error) {
          return Response.json(
            {
              status: "FAILED",
              state: "PROVIDER_ERROR",
              error: error instanceof Error ? error.message : "OpenAI request failed.",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
