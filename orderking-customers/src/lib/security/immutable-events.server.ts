// @ts-nocheck
import crypto from "node:crypto";
import { getSql } from "@/lib/db";

export async function emitImmutableEvent(event: {
  scope: string;
  eventType: string;
  sourceTable: string;
  sourceId: string;
  actorUserId?: string | null;
  actorEmployeeId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const sql = await getSql();
  const eventId = crypto.randomUUID();
  const rows = await sql.query(
    "INSERT INTO immutable_event_ledger (" +
      "event_id, org_id, actor_user_id, actor_employee_id, source_table, source_id, event_type, occurred_at, payload" +
    ") VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8::jsonb) RETURNING event_id, event_hash",
    [
      eventId,
      event.scope,
      event.actorUserId ?? null,
      event.actorEmployeeId ?? null,
      event.sourceTable,
      event.sourceId,
      event.eventType,
      JSON.stringify(event.payload ?? {}),
    ],
  );
  return rows[0] ?? null;
}
