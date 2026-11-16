import { createFileRoute } from "@tanstack/react-router";
import { handleLatestRequest, handleLatestPostRequest } from "@/lib/orderking/customization/sync-bus";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/sync/customizations/latest")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          return handleLatestRequest(request);
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "Hydration route internal error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { isAuthorizedAdmin } = await import("@/lib/orderking/server/workspace.server");
          const session = await getSessionUser();
          const authHeader = request.headers.get("authorization") || "";
          const cronSecret = process.env.CRON_SECRET?.trim() || "";
          const umarMasterKey = process.env.UMAR_OS_MASTER_KEY?.trim() || "";
          const isKeyAuth = Boolean(
            (cronSecret.length >= 16 && authHeader === `Bearer ${cronSecret}`) ||
            (umarMasterKey.length >= 16 && authHeader === `Bearer ${umarMasterKey}`)
          );
          const isSessionAdmin = session?.id ? await isAuthorizedAdmin(session.id, session.email) : false;

          if (!isKeyAuth && !isSessionAdmin) {
            return new Response(JSON.stringify({ error: "Unauthorized: Admin session or master token required" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
          return await handleLatestPostRequest(request);
        } catch (err: any) {
          return new Response(
            JSON.stringify({
              error: err?.message || "Failed to persist customization config",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        });
      },
    },
  },
});
