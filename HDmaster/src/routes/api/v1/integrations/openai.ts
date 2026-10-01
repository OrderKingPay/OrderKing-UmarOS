// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const executeOpenAi = createServerFn({ method: "POST" })
  .inputValidator((data: { prompt: string }) => {
    if (!data.prompt?.trim()) throw new Error("prompt is required");
    if (data.prompt.length > 12000) throw new Error("prompt too long");
    return { prompt: data.prompt.trim() };
  })
  .handler(async ({ data }) => {
    const { requireUserId } = await import("@/lib/auth/verify.server");
    const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
    const { enforceRateLimit } = await import("@/lib/orderking/security/rate-limiter");
    const OpenAI = (await import("openai")).default;

    const userId = await requireUserId();
    const workspace = await ensureWorkspace(userId);
    if (!workspace.ctx.permissions.includes("access_AI")) {
      throw new Error("AI_PERMISSION_REQUIRED");
    }

    const request = new Request("https://internal.local/openai", { headers: { "x-forwarded-for": userId } });
    const limited = await enforceRateLimit(request, `hdmaster:openai-integration:${userId}`, {
      windowMs: 60_000,
      maxRequests: 30,
    });
    if (limited) throw new Error("RATE_LIMITED");

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim();
    if (!apiKey) throw new Error("OPENAI_NOT_CONFIGURED");
    if (!model) throw new Error("OPENAI_MODEL_NOT_CONFIGURED");

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({ model, input: data.prompt });
    return { model: response.model, ai_response: response.output_text };
  });

export const Route = createFileRoute("/api/v1/integrations/openai")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const result = await executeOpenAi({ data: body });
          return Response.json({ success: true, ...result });
        } catch (error: any) {
          const message = error?.message || "OpenAI request failed";
          const status =
            message === "AI_PERMISSION_REQUIRED" || message === "Unauthorized" ? 403 :
            message === "RATE_LIMITED" ? 429 :
            message === "OPENAI_NOT_CONFIGURED" || message === "OPENAI_MODEL_NOT_CONFIGURED" ? 503 : 502;
          return Response.json({ success: false, error: message }, { status });
        }
      },
    },
  },
});
