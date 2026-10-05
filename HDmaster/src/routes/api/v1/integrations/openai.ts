import { createAPIFileRoute } from "@tanstack/react-start/api";
import { OpenAIProvider } from "@/lib/orderking/ai/providers/openai-provider";

export const APIRoute = createAPIFileRoute("/api/v1/integrations/openai")({
  POST: async ({ request }) => {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }

    const body = (await request.json()) as { prompt?: unknown };
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return Response.json({ error: "prompt is required." }, { status: 400 });
    }

    const provider = new OpenAIProvider();
    if (!provider.isConfigured) {
      return Response.json(
        {
          error: "OpenAI is not configured. Add OPENAI_API_KEY to the server-side secret store.",
          state: "CONFIGURATION_REQUIRED",
        },
        { status: 503 },
      );
    }

    try {
      const result = await provider.chat({
        model: process.env.OPENAI_MODEL_ID || "gpt-6-luna",
        messages: [{ role: "user", content: prompt }],
      });
      return Response.json({
        success: true,
        provider: result.provider,
        model: result.model,
        text: result.text,
        usage: result.usage,
        latencyMs: result.latencyMs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OpenAI request failed.";
      return Response.json(
        { error: "OpenAI provider request failed.", detail: message, state: "PROVIDER_ERROR" },
        { status: 502 },
      );
    }
  },
});
