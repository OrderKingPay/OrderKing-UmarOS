import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";

export type CustomerSecurityEventInput = {
  streamKey: string;
  actorId: string;
  actorType: string;
  eventType: string;
  subjectType?: string | null;
  subjectId?: string | null;
  requestId?: string | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  payload?: Record<string, unknown>;
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function appendCustomerSecurityEvent(input: CustomerSecurityEventInput): Promise<void> {
  const sql = await getSql();

  await sql.transaction(async (tx) => {
    // Serialize sequence allocation per stream so the hash chain cannot fork under normal concurrency.
    await tx.query("select pg_advisory_xact_lock(hashtext($1))", [input.streamKey]);

    const previousRows = await tx.query<{ sequence_no: number | string; event_hash: string }>(
      `select sequence_no, event_hash
       from security_event_ledger
       where stream_key = $1
       order by sequence_no desc
       limit 1`,
      [input.streamKey],
    );

    const previous = previousRows[0] ?? null;
    const sequenceNo = Number(previous?.sequence_no ?? 0) + 1;
    const occurredAt = new Date().toISOString();
    const payload = input.payload ?? {};
    const ipHash = input.ipAddress ? hash(input.ipAddress) : null;

    const canonical = JSON.stringify({
      streamKey: input.streamKey,
      sequenceNo,
      occurredAt,
      actorId: input.actorId,
      actorType: input.actorType,
      eventType: input.eventType,
      subjectType: input.subjectType ?? null,
      subjectId: input.subjectId ?? null,
      requestId: input.requestId ?? null,
      deviceId: input.deviceId ?? null,
      ipHash,
      payload,
      previousHash: previous?.event_hash ?? null,
    });

    const eventHash = hash(canonical);

    await tx.query(
      `insert into security_event_ledger (
        stream_key, sequence_no, occurred_at, actor_id, actor_type, event_type,
        subject_type, subject_id, request_id, device_id, ip_hash, payload,
        previous_hash, event_hash
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        input.streamKey,
        sequenceNo,
        occurredAt,
        input.actorId,
        input.actorType,
        input.eventType,
        input.subjectType ?? null,
        input.subjectId ?? null,
        input.requestId ?? null,
        input.deviceId ?? null,
        ipHash,
        JSON.stringify(payload),
        previous?.event_hash ?? null,
        eventHash,
      ],
    );
  });
}
