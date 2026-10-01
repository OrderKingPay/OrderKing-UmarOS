import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/affiliate/click")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        try {
          const { getSql } = await import("@/lib/db");
          const { getSessionUser } = await import("@/lib/auth/verify.server");
          const sql = await getSql();
          const user = await getSessionUser().catch(() => null);
          const url = new URL(request.url);
          const offerId = url.searchParams.get("offer") || url.searchParams.get("partner");
          const source = url.searchParams.get("source") || "orderking";
          const campaign = url.searchParams.get("utm_campaign") || null;
          const referrer = url.searchParams.get("ref") || null;
          if (!offerId) return new Response("Missing affiliate offer", { status: 400 });
          const rows = await sql<{ id: string; tracking_base_url: string; active: boolean }>`
            SELECT id, tracking_base_url, active FROM affiliate_partners WHERE id = ${offerId} AND active = true AND tracking_base_url IS NOT NULL AND tracking_base_url <> '' LIMIT 1
          `;
          if (!rows[0]) return new Response("Affiliate partner unavailable", { status: 404 });
          const clickId = crypto.randomUUID();
          await sql`INSERT INTO affiliate_attribution_ledger (offer_id,user_id,click_id,source,medium,campaign,referrer_code,provider_payload) VALUES (${rows[0].id},${user?.id ?? null},${clickId},${source},'referral',${campaign},${referrer},${JSON.stringify({ partnerId: rows[0].id })})`;
          const target = new URL(rows[0].tracking_base_url);
          target.searchParams.set("click_id", clickId);
          if (referrer) target.searchParams.set("ref", referrer);
          if (campaign) target.searchParams.set("utm_campaign", campaign);
          return Response.redirect(target.toString(), 302);
        } catch (error) {
          console.error("[affiliate-click]", error);
          return new Response("Affiliate service unavailable", { status: 503 });
        }
      },
    },
  },
});