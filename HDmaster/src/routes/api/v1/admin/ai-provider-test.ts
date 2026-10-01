// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const verifyAiProvider = createServerFn({ method: "POST" })
  .inputValidator((data: { modelId: string }) => {
    if (!data.modelId?.trim()) throw new Error("modelId is required");
    return { modelId: data.modelId.trim() };
  })
  .handler(async ({ data }) => {
    const { requireUserId } = await import("@/lib/auth/verify.server");
    const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
    const { enforceRateLimit } = await import("@/lib/orderking/security/rate-limiter");
    const { testModelConnectivity } = await import("@/lib/orderking/ai/real-model-registry");

    const userId = await requireUserId();
    const workspace = await ensureWorkspace(userId);
    if (!workspace.ctx.permissions.includes("access_AI")) throw new Error("AI_PERMISSION_REQUIRED");

    const request = new Request("https://internal.local/ai-test", { headers: { "x-forwarded-for": userId } });
    const limited = await enforceRateLimit(request, `hdmaster:ai-provider-test:${userId}`, {
      windowMs: 60_000,
      maxRequests: 20,
    });
    if (limited) throw new Error("RATE_LIMITED");

    return await testModelConnectivity(data.modelId);
  });

export const Route = createFileRoute("/api/v1/admin/ai-provider-test")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          return Response.json(await verifyAiProvider({ data: body }));
        } catch (error: any) {
          const message = error?.message || "Provider verification failed";
          const status =
            message === "AI_PERMISSION_REQUIRED" ? 403 :
            message === "RATE_LIMITED" ? 429 : 500;
          return Response.json({ success: false, status: "ERROR", message }, { status });
        }
      },
    },
  },
});
