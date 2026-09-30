// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";
import { testModelConnectivity } from "@/lib/orderking/ai/real-model-registry";

export const Route = createFileRoute("/api/v1/admin/ai-provider-test")({
    handlers: {
      POST: async ({ request }: any) => {
    try {
      const userId = await requireUserId();
      const workspace = await ensureWorkspace(userId);
      if (!workspace.ctx.permissions.includes("access_AI")) {
        return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const rateLimitResponse = await enforceRateLimit(request, "hdmaster:ai-provider-test", {
        windowMs: 60_000,
        maxRequests: 20,
      });
      if (rateLimitResponse) return rateLimitResponse;

      const body = await request.json();
      const modelId = typeof body?.modelId === "string" ? body.modelId.trim() : "";
      if (!modelId) {
        return new Response(JSON.stringify({ error: "modelId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await testModelConnectivity(modelId);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("[ai-provider-test] failed:", error);
      return new Response(JSON.stringify({
        success: false,
        status: "ERROR",
        message: "Provider verification failed.",
        error: error?.message || "Unknown error",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
