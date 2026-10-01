import { getSql } from "@/lib/db";
export type ImmutableEventInput = {
  scope: string; eventType: string; sourceTable: string; sourceId: string;
  actorUserId?: string | null; actorEmployeeId?: string | null; occurredAt?: string; payload?: Record<string, unknown>;
};
export async function emitImmutableEvent(input: ImmutableEventInput): Promise<number> {
  const sql = await getSql();
  const eventId = `${input.sourceTable}:${input.sourceId}:${input.eventType}:${input.occurredAt ?? Date.now()}`;
  const rows = await sql<{ event_seq: number }>`
    SELECT public.orderking_emit_immutable_event(
      ${eventId}, ${input.scope}, ${input.actorUserId ?? null}, ${input.actorEmployeeId ?? null},
      ${input.sourceTable}, ${input.sourceId}, ${input.eventType},
      ${input.occurredAt ? new Date(input.occurredAt) : new Date()},
      ${JSON.stringify(input.payload ?? {})}::jsonb
    ) AS event_seq
  `;
  return Number(rows[0]?.event_seq ?? 0);
}