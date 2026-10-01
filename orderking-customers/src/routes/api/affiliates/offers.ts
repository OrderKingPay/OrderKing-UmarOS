import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/affiliates/offers")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { getSql } = await import("@/lib/db");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const category = new URL(request.url).searchParams.get("category");
          const sql = await getSql();
          const offers = await sql`
            SELECT id, provider_name, category, payout_bps, fixed_payout_paise, click_url, disclosure_label
            FROM affiliate_partner_offers
            WHERE status='ACTIVE'
              AND (${category IS NULL OR category=${category)
            ORDER BY payout_bps DESC, fixed_payout_paise DESC
          `;

          return Response.json({ offers });
        } catch (error: any) {
          return Response.json({ error: error?.message || "Affiliate service unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }: any) => {
        try {
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const { getSql } = await import("@/lib/db");
          const user = await getSessionUser();
          if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

          const body = await request.json();
          const offerId = typeof body?.offerId === "string" ? body.offerId.trim() : "";
          const clickId = typeof body?.clickId === "string" ? body.clickId.trim() : "";
          const dedupeKey = typeof body?.dedupeKey === "string" ? body.dedupeKey.trim() : "";
          if (!offerId || !clickId || !dedupeKey) {
            return Response.json({ error: "offerId, clickId and dedupeKey are required" }, { status: 400 });
          }

          const sql = await getSql();
          const rows = await sql`
            INSERT INTO affiliate_click_ledger(offer_id,user_id,click_id,dedupe_key,status)
            SELECT id,${user.id,${clickId,${dedupeKey,'CLICKED'
            FROM affiliate_partner_offers
            WHERE id=${offerId AND status='ACTIVE'
            ON CONFLICT (offer_id,dedupe_key) DO NOTHING
            RETURNING id,click_id
          `;
          if (!rows[0]) {
            return Response.json({ accepted: false, reason: "DUPLICATE_OR_INACTIVE_OFFER" }, { status: 409 });
          }
          return Response.json({ accepted: true, clickId: rows[0].click_id });
        } catch (error: any) {
          return Response.json({ error: error?.message || "Affiliate click unavailable" }, { status: 503 });
        }
      },
    },
  },
});
