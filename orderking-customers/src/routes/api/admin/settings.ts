import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";

const FOUNDER_EMAILS = new Set(
  (process.env.ORDERKING_FOUNDER_EMAILS ||
    "hmhabibullah9@gmail.com,founder@orderking.app,hasan@orderking.app")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const ALLOWED_SECRET_KEYS = new Set([
  "umar_os_apikey_gemini",
  "umar_os_apikey_openai",
  "umar_os_apikey_anthropic",
  "umar_os_apikey_xai",
]);

async function requireFounder() {
  const user = await getSessionUser();
  if (!user) return { ok: false as const, status: 401, message: "Unauthorized" };
  const email = user.email?.trim().toLowerCase();
  if (!email || !FOUNDER_EMAILS.has(email)) {
    return { ok: false as const, status: 403, message: "Founder access required" };
  }
  return { ok: true as const, user };
}

export const Route = createFileRoute("/api/admin/settings")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        try {
          const access = await requireFounder();
          if (!access.ok) {
            return new Response(JSON.stringify({ error: access.message }), {
              status: access.status,
              headers: { "content-type": "application/json" },
            });
          }

          const sql = await getSql();
          const rows = await sql<{ key: string; is_secret: boolean }>`
            SELECT key, is_secret FROM system_config
            WHERE key IN ('umar_os_apikey_gemini', 'umar_os_apikey_openai', 'umar_os_apikey_anthropic', 'umar_os_apikey_xai')
          `;

          const settings: Record<string, boolean> = {};
          rows.forEach((r) => {
            if (r.is_secret && ALLOWED_SECRET_KEYS.has(r.key)) {
              settings[r.key] = true;
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
          const access = await requireFounder();
          if (!access.ok) {
            return new Response(JSON.stringify({ error: access.message }), {
              status: access.status,
              headers: { "content-type": "application/json" },
            });
          }

          const body = (await request.json()) as Record<string, unknown>;
          const entries = Object.entries(body).filter(
            ([key, value]) =>
              ALLOWED_SECRET_KEYS.has(key) &&
              typeof value === "string" &&
              value.trim().length > 0 &&
              value !== "********",
          );

          const sql = await getSql();
          for (const [key, value] of entries as Array<[string, string]>) {
            await sql`
              INSERT INTO system_config (key, value, is_secret, updated_at)
              VALUES (${key}, ${value.trim()}, true, now())
              ON CONFLICT (key)
              DO UPDATE SET value = EXCLUDED.value, is_secret = true, updated_at = now()
            `;
          }

          return new Response(JSON.stringify({
            success: true,
            saved: entries.map(([key]) => key),
          }), {
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
