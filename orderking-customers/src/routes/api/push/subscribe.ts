import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/push/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const body = await request.json();
          const { endpoint, keys, user_id, city_id } = body || {};

          if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return new Response(JSON.stringify({ error: "Invalid subscription payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const sql = await getSql();

          // Ensure table exists for Web Push subscribers
          await sql`
            CREATE TABLE IF NOT EXISTS user_push_subscriptions (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id TEXT,
              city_id TEXT,
              endpoint TEXT UNIQUE NOT NULL,
              p256dh TEXT NOT NULL,
              auth TEXT NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `;

          await sql`
            INSERT INTO user_push_subscriptions (user_id, city_id, endpoint, p256dh, auth, last_active_at)
            VALUES (${user_id || null}, ${city_id || "karimganj"}, ${endpoint}, ${keys.p256dh}, ${keys.auth}, NOW())
            ON CONFLICT (endpoint) DO UPDATE
            SET last_active_at = NOW(), city_id = COALESCE(EXCLUDED.city_id, user_push_subscriptions.city_id);
          `;

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Push subscription registration error:", error);
          return new Response(JSON.stringify({ error: "Failed to persist push subscription" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
