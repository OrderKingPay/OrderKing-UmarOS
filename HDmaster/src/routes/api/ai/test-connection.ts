import { createFileRoute } from "@tanstack/react-router";
import { testModelConnectivity, getVerifiedModelRegistry } from "@/lib/orderking/ai/real-model-registry";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";

async function requireAdminSession(): Promise<boolean> {
  const session = await getSessionUser();
  if (!session?.id) return false;
  const sql = await getSql();
  const rows = await sql`SELECT role FROM users WHERE id = ${session.id} LIMIT 1`;
  const role = rows.length > 0 ? String((rows[0] as any).role || "").toUpperCase() : "";
  return ["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role);
}

export const Route = createFileRoute("/api/ai/test-connection")({
  server: {
    handlers: {
      GET: async () => {
        if (!(await requireAdminSession())) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        }
        const registry = getVerifiedModelRegistry();
        return new Response(JSON.stringify(registry), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        });
      },
      POST: async ({ request }: any) => {
        try {
          if (!(await requireAdminSession())) {
            return new Response(JSON.stringify({ success: false, status: "UNAUTHORIZED", message: "Admin session required" }), {
              status: 401,
              headers: { "content-type": "application/json; charset=utf-8" },
            });
          }
          const body = (await request.json()) as { modelId?: string };
          const modelId = body?.modelId || "sovereign-ultra";
          const result = await testModelConnectivity(modelId);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json; charset=utf-8" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              success: false,
              status: "ERROR",
              message: error instanceof Error ? error.message : "Failed to test connectivity",
            }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
