// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/finance/weekly-settlement-report")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
          const { getWeeklySettlementReport } = await import("@/lib/orderking/finance/settlement-report");

          const userId = await requireUserId();
          const ws = await ensureWorkspace(userId);
          if (!ws.ctx.permissions.includes("view_finance")) {
            return Response.json({ error: "FORBIDDEN" }, { status: 403 });
          }

          const restaurantId = new URL(request.url).searchParams.get("restaurantId");
          if (!restaurantId) return Response.json({ error: "restaurantId is required" }, { status: 400 });

          return Response.json(await getWeeklySettlementReport(restaurantId));
        } catch (error: any) {
          console.error("[weekly-settlement-report]", error);
          return Response.json({ error: "Settlement report unavailable." }, { status: 500 });
        }
      },
    },
  },
});
