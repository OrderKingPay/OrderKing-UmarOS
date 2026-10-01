import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/v1/admin/affiliates/metrics")({
  // @ts-expect-error
  server: {
    handlers: {
      GET: async () => {
        const { requireUserId } = await import("@/lib/auth/verify.server");
        const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
        const { getSql } = await import("@/lib/db");
        const uid = await requireUserId();
        const ws = await ensureWorkspace(uid);
        if (!ws.ctx.permissions.includes("view_finance")) {
          return Response.json({ error: "FORBIDDEN" }, { status: 403 });
        }
        const sql = await getSql();
        const rows = await sql`
          SELECT p.id,p.name,p.category,p.commission_type,p.commission_value,p.terms_version,
                 COUNT(DISTINCT c.id)::int AS clicks,
                 COUNT(DISTINCT CASE WHEN v.conversion_status='CONFIRMED' THEN v.id END)::int AS confirmed_conversions,
                 COALESCE(SUM(CASE WHEN v.conversion_status='CONFIRMED' THEN v.gross_value_paise ELSE 0 END),0)::bigint AS gross_value_paise,
                 COALESCE(SUM(CASE WHEN v.conversion_status='CONFIRMED' THEN v.commission_paise ELSE 0 END),0)::bigint AS commission_paise
          FROM affiliate_partners p
          LEFT JOIN affiliate_clicks c ON c.partner_id=p.id
          LEFT JOIN affiliate_conversions v ON v.partner_id=p.id
          WHERE p.active=true
          GROUP BY p.id
          ORDER BY commission_paise DESC, confirmed_conversions DESC, clicks DESC
        `;
        return Response.json({
          generatedAt: new Date().toISOString(),
          partners: rows,
        }, {
          headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=20" },
        });
      },
    },
  },
});