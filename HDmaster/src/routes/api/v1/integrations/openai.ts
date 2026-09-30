// @ts-nocheck
import OpenAI from "openai";
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";

const DEFAULT_MODEL = process.env.OPENAI_MODEL?.trim() || "";

export const Route = createAPIFileRoute("/api/v1/integrations/openai")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const userId = await requireUserId();
          const workspace = await ensureWorkspace(userId);
          if (!workspace.ctx.permissions.includes("access_AI")) {
            return Response.json({ error: "FORBIDDEN", code: "AI_PERMISSION_REQUIRED" }, { status: 403 });
          }

          const rateLimitResponse = await enforceRateLimit(request, "hdmaster:openai-integration", {
            windowMs: 60_000,
            maxRequests: 30,
          });
          if (rateLimitResponse) return rateLimitResponse;

          const body = await request.json();
          const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
          if (!prompt) {
            return Response.json({ error: "prompt is required" }, { status: 400 });
          }

          const apiKey = process.env.OPENAI_API_KEY?.trim();
          const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
          if (!apiKey) {
            return Response.json(
              { error: "OpenAI is not configured on this server.", code: "OPENAI_NOT_CONFIGURED" },
              { status: 503 },
            );
          }
          if (!model) {
            return Response.json(
              { error: "OPENAI_MODEL is not configured on this server.", code: "OPENAI_MODEL_NOT_CONFIGURED" },
              { status: 503 },
            );
          }

          const client = new OpenAI({ apiKey });
          const response = await client.responses.create({ model, input: prompt });

          return Response.json({
            success: true,
            model: response.model,
            ai_response: response.output_text,
          });
        } catch (error: any) {
          console.error("[openai] request failed:", error);
          return Response.json(
            {
              success: false,
              error: error?.status === 401 ? "Unauthorized." : "OpenAI request failed.",
              code: error?.status === 401 ? "UNAUTHORIZED" : "OPENAI_REQUEST_FAILED",
            },
            { status: error?.status === 401 ? 401 : 502 },
          );
        }
      },
    },
  },
});
