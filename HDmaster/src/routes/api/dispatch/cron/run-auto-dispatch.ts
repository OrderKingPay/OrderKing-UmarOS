import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "../../../../lib/orderking/server/auto-dispatch-engine.server";

/**
 * AI auto-dispatch server route.
 * External scheduler/Cloudflare Worker must call it with Authorization: Bearer <CRON_SECRET>.
 */
// @ts-expect-error TanStack regenerates routeTree.gen.ts during the Vite build; direct tsc runs before that refresh.
export const Route = createFileRoute("/api/dispatch/cron/run-auto-dispatch")({
  server: {
    // @ts-expect-error TanStack Start server-route type augmentation is not included in direct tsc for this repo version.
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const authHeader = request.headers.get("authorization");

          if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response(
              JSON.stringify({ success: false, message: "Unauthorized" }),
              { status: 401 },
            );
          }

          console.log("[CRON] Initiating AI Haversine Dispatch Engine...");

          const result = await runAlgorithmicAutoDispatch();

          if (result.assignedOrders > 0) {
            console.log(
              `[CRON SUCCESS] AI Auto-Assigned ${result.assignedOrders} orders. Matching matrix:`,
              result.matchedPairs,
            );
          }

          return new Response(JSON.stringify({ success: true, ...result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          console.error("[CRON FATAL] AI Dispatch Engine crashed:", error);
          return new Response(
            JSON.stringify({
              success: false,
              message: "CRON Error",
              error: error?.message,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
