// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/founder/sweep")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async () => {
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
          const userId = await requireUserId();
          const ws = await ensureWorkspace(userId);
          if (!ws.ctx.permissions.includes("view_finance")) return Response.json({ error: "FORBIDDEN" }, { status: 403 });

          return Response.json({
            success: false,
            status: "PROVIDER_REQUIRED",
            message: "Founder sweep is blocked until a real payout/transfer provider is configured and verified. No order or ledger state was changed.",
          }, { status: 503 });
        } catch (error) {
          return Response.json({ success: false, error: "Unauthorized or unavailable." }, { status: 401 });
        }
      },
    },
  },
});
