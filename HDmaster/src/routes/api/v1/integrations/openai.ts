// @ts-nocheck
import OpenAI from "openai";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-6.1-sol";

export const Route = createAPIFileRoute("/api/v1/integrations/openai")({
  server: {
    handlers: {\n      POST: async ({ request }: any) => {
    try {
      const userId = await requireUserId();
      const workspace = await ensureWorkspace(userId);
      if (!workspace.ctx.permissions.includes("access_AI")) {
        return new Response(JSON.stringify({ error: "FORBIDDEN", code: "AI_PERMISSION_REQUIRED" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rateLimitResponse = await enforceRateLimit(request, "hdmaster:openai-integration", {
        windowMs: 60_000,
        maxRequests: 30,
      });
      if (rateLimitResponse) return rateLimitResponse;

      const body = await request.json();
      const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
      if (!prompt) {
        return new Response(JSON.stringify({ error: "prompt is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: "OpenAI is not configured on this server.",
            code: "OPENAI_NOT_CONFIGURED",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const client = new OpenAI({ apiKey });
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL,
        input: prompt,
      });

      return new Response(
        JSON.stringify({
          success: true,
          model: response.model,
          ai_response: response.output_text,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error: any) {
      const status = error?.status === 401 ? 401 : 502;
      console.error("[openai] request failed:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: status === 401 ? "Unauthorized." : "OpenAI request failed.",
          code: status === 401 ? "UNAUTHORIZED" : "OPENAI_REQUEST_FAILED",
        }),
        {
          status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
