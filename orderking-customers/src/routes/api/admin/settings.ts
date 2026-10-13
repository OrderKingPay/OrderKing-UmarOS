
import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";

async function requireFounderOrAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user?.id) return false;
  const sql = await getSql();
  const rows = await sql<{ role?: string }>`SELECT role FROM users WHERE id = ${user.id} LIMIT 1`;
  const role = String(rows[0]?.role || "").toUpperCase();
  return ["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role);
}

export const Route = createFileRoute("/api/admin/settings")({
  server: {
    handlers: {
      GET: async () => {
        try {
          if (!(await requireFounderOrAdmin())) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin privileges required" }), {
              status: 403,
              headers: { "content-type": "application/json" },
            });
          }
          const sql = await getSql();
          const rows = await sql<{ key: string; is_secret: boolean }>`
            SELECT key, is_secret FROM system_config
          `;

          const settings: Record<string, boolean> = {};
          rows.forEach((r) => {
            if (r.is_secret) {
              settings[r.key] = true; // Just indicate it exists
            }
          });

          return new Response(JSON.stringify(settings), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("GET /api/admin/settings error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error reading settings" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
      POST: async ({ request }: any) => {
        try {
          if (!(await requireFounderOrAdmin())) {
            return new Response(JSON.stringify({ error: "Forbidden: Admin privileges required" }), {
              status: 403,
              headers: { "content-type": "application/json" },
            });
          }
          const body = (await request.json()) as Record<string, string>;
          const sql = await getSql();

          // Only save non-empty keys
          for (const [key, value] of Object.entries(body)) {
            if (value && value.trim()) {
              await sql`
                INSERT INTO system_config (key, value, is_secret, updated_at)
                VALUES (${key}, ${value}, true, now())
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
              `;
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("POST /api/admin/settings error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error saving settings" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

