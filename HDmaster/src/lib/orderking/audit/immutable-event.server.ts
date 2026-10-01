// @ts-nocheck
import { getSql } from "@/lib/db";
import crypto from "node:crypto";

export type ImmutableEvent = {
  orgId?: string | null;
  actorUserId?: string | null;
  actorEmployeeId?: string | null;
  sourceTable: string;
  sourceId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt?: Date;
};

export async function appendImmutableEvent(event: ImmutableEvent, db: any = null) {
  const sql = db ?? await getSql();
  const eventId = crypto.randomUUID();
  const rows = await sql<{ event_id: string; event_hash: string }>`
    INSERT INTO immutable_event_ledger (
      event_id,
      org_id,
      actor_user_id,
      actor_employee_id,
      source_table,
      source_id,
      event_type,
      occurred_at,
      payload
    )
    VALUES (
      ${eventId},
      ${event.orgId ?? null},
      ${event.actorUserId ?? null},
      ${event.actorEmployeeId ?? null},
      ${event.sourceTable},
      ${event.sourceId},
      ${event.eventType},
      ${event.occurredAt ?? new Date()},
      ${JSON.stringify(event.payload ?? {})}::jsonb
    )
    RETURNING event_id, event_hash
  `;
  return rows[0] ?? null;
}
