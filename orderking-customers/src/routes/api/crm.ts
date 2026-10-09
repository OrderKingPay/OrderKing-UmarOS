import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/crm")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const sql = await getSql();
          const body = await request.json();
          
          const action = body.action;

          if (action === "track_event") {
            const { eventType, affiliateCode, referralCode, metadata, userId } = body;
            
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
              VALUES (${eventType}, ${affiliateId}, ${referralId}, ${userId || null}, ${metadata ? JSON.stringify(metadata) : null})
            `;

            return new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }

          if (action === "log_communication") {
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
