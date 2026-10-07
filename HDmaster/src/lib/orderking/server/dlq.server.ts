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

export async function processDlqBatch() {
  const sql = await getSql();
  
  // Find pending or retried items that are due
  const pending = await sql.query<{
    id: string;
    org_id: string;
    target_system: DlqSystem;
    payload_json: string;
    retry_count: number;
  }>(
    `SELECT id, org_id, target_system, payload_json, retry_count
     FROM dead_letter_queue
     WHERE status IN ('PENDING', 'RETRIED') 
       AND next_retry_at <= now()
     ORDER BY next_retry_at ASC
     LIMIT 50`
  );
  
  for (const item of pending) {
    try {
      // In a real system, you'd route this back into the specific system.
      // For now, we simulate executing the retry block.
      console.log(`[DLQ] Retrying ${item.target_system} for org ${item.org_id}...`);
      
      // Update as successful
      await sql.query(`UPDATE dead_letter_queue SET status = 'RESOLVED', updated_at = now() WHERE id = $1`, [item.id]);
    } catch (err) {
      const errorStr = err instanceof Error ? err.message : "Unknown retry error";
      const nextRetryCount = item.retry_count + 1;
      const nextStatus = nextRetryCount >= 5 ? 'DEAD' : 'RETRIED';
      // Exponential backoff
      const intervalStr = `${Math.pow(2, nextRetryCount)} minutes`;
      
      await sql.query(
        `UPDATE dead_letter_queue 
         SET status = $2, retry_count = $3, error_message = $4, next_retry_at = now() + $5::interval, updated_at = now()
         WHERE id = $1`,
        [item.id, nextStatus, nextRetryCount, errorStr, intervalStr]
      );
    }
  }
}
