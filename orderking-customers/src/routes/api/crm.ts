import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/verify.server";

export const Route = createFileRoute("/api/crm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const user = await getSessionUser();
          if (!user?.id) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          const sql = await getSql();
          const body = await request.json();

          const action = body.action;

          if (action === "track_event") {
            const { eventType, affiliateCode, referralCode, metadata } = body;

            let affiliateId = null;
            let referralId = null;

            if (affiliateCode) {
              const aff = await sql<{ id: string }>`SELECT id FROM crm_affiliates WHERE affiliate_code = ${affiliateCode}`;
              if (aff.length > 0) affiliateId = aff[0].id;
            }

            if (referralCode) {
              const ref = await sql<{ id: string }>`SELECT id FROM crm_referral_programs WHERE referral_code = ${referralCode}`;
              if (ref.length > 0) referralId = ref[0].id;
            }

            await sql`
              INSERT INTO crm_tracking_events (event_type, affiliate_id, referral_id, user_id, metadata)
              VALUES (${eventType}, ${affiliateId}, ${referralId}, ${user.id}, ${metadata ? JSON.stringify(metadata) : null})
            `;

            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          if (action === "log_communication") {
            const roleRows = await sql<{ role?: string }>`SELECT role FROM users WHERE id = ${user.id} LIMIT 1`;
            const role = String(roleRows[0]?.role || "").toUpperCase();
            if (!["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role)) {
              return new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" },
              });
            }
            const { channel, recipient, status, templateId, metadata } = body;

            await sql`
              INSERT INTO crm_communications (channel, recipient, status, template_id, sent_at, metadata)
              VALUES (${channel}, ${recipient}, ${status}, ${templateId || null}, NOW(), ${metadata ? JSON.stringify(metadata) : null})
            `;

            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Unknown action" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });

        } catch (error) {
          console.error("POST /api/crm error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error processing CRM event" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
