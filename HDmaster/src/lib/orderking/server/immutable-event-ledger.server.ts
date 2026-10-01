// @ts-nocheck
import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";

export async function appendImmutableEvent(input: {
  streamKey: string;
  actorId?: string | null;
  actorType: "CUSTOMER" | "PARTNER" | "RIDER" | "FOUNDER" | "SYSTEM" | "INTEGRATION";
  eventType: string;
  subjectType?: string | null;
  subjectId?: string | null;
  requestId?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  payload?: Record<string, unknown>;
}) {
  if (!input.streamKey || !input.eventType) throw new Error("EVENT_LEDGER_INPUT_INVALID");
  const sql = await getSql();
  const secret = process.env.ORDERKING_EVENT_LEDGER_KEY?.trim();
  const ipHash = input.ipAddress && secret
    ? createHash("sha256").update(`\${secret}|\${input.ipAddress}`).digest("hex")
    : null;

  const rows = await sql<{ id:string; sequence_no:number; event_hash:string; occurred_at:string }>`
    INSERT INTO security_event_ledger (
      stream_key, actor_id, actor_type, event_type, subject_type, subject_id,
      request_id, device_id, ip_hash, payload
    )
    VALUES (
      \${input.streamKey},
      \${input.actorId ?? null},
      \${input.actorType},
      \${input.eventType},
      \${input.subjectType ?? null},
      \${input.subjectId ?? null},
      \${input.requestId ?? null},
      \${input.deviceId ?? null},
      \${ipHash},
      \${JSON.stringify(input.payload ?? {})}
    )
    RETURNING id, sequence_no, event_hash, occurred_at::text AS occurred_at
  `;
  return rows[0];
}
