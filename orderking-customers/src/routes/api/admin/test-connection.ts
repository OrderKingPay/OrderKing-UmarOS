
import { createFileRoute } from "@tanstack/react-router";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { testModelConnectivity } from "@/lib/ai/real-model-registry";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "FOUNDER", "ADMIN"]);

export const Route = createFileRoute("/api/admin/test-connection")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const sessionUser = await getSessionUser();
          if (!sessionUser?.id) {
            return new Response(
              JSON.stringify({ error: "Unauthorized" }),
              { status: 401, headers: { "content-type": "application/json" } }
            );
          }

          const sql = await getSql();
          const roleRows = await sql<{ role: string }>`
            SELECT role FROM users WHERE id = ${sessionUser.id} LIMIT 1
          `;
          const role = String(roleRows[0]?.role ?? "").toUpperCase();
          if (!ADMIN_ROLES.has(role)) {
            return new Response(
              JSON.stringify({ error: "Forbidden: Admin or Founder role required" }),
              { status: 403, headers: { "content-type": "application/json" } }
            );
          }

          const body = await request.json() as { modelId: string };
          const result = await testModelConnectivity(body.modelId);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("POST /api/admin/test-connection error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error testing connection" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});


