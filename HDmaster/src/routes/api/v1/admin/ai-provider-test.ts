// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { enforceRateLimit } from "@/lib/orderking/security/rate-limiter";
import { testModelConnectivity } from "@/lib/orderking/ai/real-model-registry";

export const Route = createAPIFileRoute("/api/v1/admin/ai-provider-test")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const userId = await requireUserId();
          const workspace = await ensureWorkspace(userId);
          if (!workspace.ctx.permissions.includes("access_AI")) {
            return Response.json({ error: "FORBIDDEN", code: "AI_PERMISSION_REQUIRED" }, { status: 403 });
          }

          const rateLimitResponse = await enforceRateLimit(request, "hdmaster:ai-provider-test", {
            windowMs: 60_000,
            maxRequests: 20,
          });
          if (rateLimitResponse) return rateLimitResponse;

          const body = await request.json();
          const modelId = typeof body?.modelId === "string" ? body.modelId.trim() : "";
          if (!modelId) return Response.json({ error: "modelId is required" }, { status: 400 });

          const result = await testModelConnectivity(modelId);
          return Response.json(result);
        } catch (error: any) {
          console.error("[ai-provider-test] failed:", error);
          return Response.json(
            {
              success: false,
              status: "ERROR",
              message: "Provider verification failed.",
              error: error?.message || "Unknown error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
