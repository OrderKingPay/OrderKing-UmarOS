// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { getSql } from "@/lib/db";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function authorized(request: Request): boolean {
  const expected = process.env.ORDERKING_SERVICE_TOKEN?.trim();
  const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!expected || actual.length !== expected.length) return false;
  return createHmac("sha256", expected).update(actual).digest("hex") === createHmac("sha256", expected).update(expected).digest("hex");
}

export const Route = createFileRoute("/v1/admin/work/events")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        if (!authorized(request)) return json({ error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
        const body = await request.json().catch(() => null) as any;
        if (!body || body.contractVersion !== "1" || !body.eventId || !body.type || !body.actorUserId) {
          return json({ error: "contractVersion, eventId, type and actorUserId are required", code: "INVALID_REQUEST" }, 400);
        }

        const allowed = new Set([
          "JOB_ACCEPTED",
          "JOB_SUBMITTED",
          "PROJECT_CREATED",
          "PROJECT_QUOTE_SUBMITTED",
          "PROJECT_PROVIDER_SELECTED",
        ]);
        if (!allowed.has(body.type)) return json({ error: "Unsupported work event", code: "EVENT_UNSUPPORTED" }, 400);

        const sql = await getSql();
        const existing = await sql.query<{ id: string }>(
          "select id from audit_logs where id=$1 limit 1",
          [String(body.eventId)],
        );
        if (existing[0]) return json({ data: { ok: true, duplicate: true, eventId: String(body.eventId), authoritative: "HDmaster" } });

        await sql.query(
          `insert into audit_logs (id, org_id, actor_employee_id, user_id, action, target_type, target_id, previous_state, next_state, reason)
           values ($1, coalesce($2, 'system'), coalesce($3, 'system'), $4, $5, $6, $7, $8, $9, $10)`,
          [
            String(body.eventId),
            process.env.ORDERKING_SERVICE_ORG_ID?.trim() || "system",
            process.env.ORDERKING_SERVICE_EMPLOYEE_ID?.trim() || "system",
            String(body.actorUserId),
            body.type,
            body.projectId ? "project" : "job",
            String(body.projectId ?? body.acceptanceId ?? body.quoteId ?? body.jobId ?? ""),
            null,
            JSON.stringify(body),
            body.reason ? String(body.reason) : null,
          ],
        );
        return json({ data: { ok: true, duplicate: false, eventId: String(body.eventId), authoritative: "HDmaster" } });
      },
    },
  },
});
