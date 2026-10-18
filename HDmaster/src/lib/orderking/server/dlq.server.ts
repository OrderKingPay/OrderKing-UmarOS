import { getSql } from "@/lib/db";
import { nid } from "./workspace.server";

export type DlqSystem = "RIDER_DISPATCH" | "PAYMENT_WEBHOOK" | "ORDER_TRANSITION";

export async function enqueueToDlq(
  orgId: string,
  targetSystem: DlqSystem,
  payload: Record<string, unknown>,
  errorMessage: string
) {
  const sql = await getSql();
  const id = nid("dlq");
  
  await sql.query(
    `INSERT INTO dead_letter_queue (id, org_id, target_system, payload_json, error_message)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, orgId, targetSystem, JSON.stringify(payload), errorMessage]
  );
  
  return id;
}

export type DlqRetryHandler = (input: {
  id: string;
  orgId: string;
  targetSystem: DlqSystem;
  payload: Record<string, unknown>;
}) => Promise<void>;

// Fail closed: do not claim that queued work succeeded without an actual retry handler.
// Handler implementations must be idempotent, because retries can execute more than once.
export async function processDlqBatch(
  handlers: Partial<Record<DlqSystem, DlqRetryHandler>> = {}
): Promise<{ considered: number; resolved: number; deferred: number; failed: number }> {
  const sql = await getSql();
  const pending = await sql.query<{
    id: string; org_id: string; target_system: DlqSystem;
    payload_json: string; retry_count: number;
  }>(
    "SELECT id, org_id, target_system, payload_json, retry_count " +
    "FROM dead_letter_queue WHERE status IN ('PENDING','RETRIED') " +
    "AND next_retry_at <= now() ORDER BY next_retry_at ASC LIMIT 50"
  );
  let resolved = 0, deferred = 0, failed = 0;
  for (const item of pending) {
    const handler = handlers[item.target_system];
    if (!handler) {
      // No compatible consumer connected: leave the record untouched for real recovery.
      deferred++;
      continue;
    }
    try {
      const decoded: unknown = JSON.parse(item.payload_json);
      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
        throw new Error('Invalid DLQ payload structure');
      }
      await handler({ id: item.id, orgId: item.org_id,
        targetSystem: item.target_system, payload: decoded as Record<string, unknown> });
      await sql.query(
        "UPDATE dead_letter_queue SET status = 'RESOLVED', updated_at = now() " +
        "WHERE id = $1 AND status IN ('PENDING','RETRIED')",
        [item.id]
      );
      resolved++;
    } catch (err) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : 'DLQ retry handler failed';
      const nextRetryCount = item.retry_count + 1;
      const newStatus = nextRetryCount >= 5 ? 'DEAD' : 'RETRIED';
      const delaySeconds = Math.min(86400, 30 * Math.pow(2, nextRetryCount));
      await sql.query(
        "UPDATE dead_letter_queue SET status = $2, retry_count = $3, " +
        "error_message = $4, next_retry_at = now() + ($5 * interval '1 second'), " +
        "updated_at = now() WHERE id = $1 AND status IN ('PENDING','RETRIED')",
        [item.id, newStatus, nextRetryCount, errorMessage, delaySeconds]
      );
    }
  }
  return { considered: pending.length, resolved, deferred, failed };
}
