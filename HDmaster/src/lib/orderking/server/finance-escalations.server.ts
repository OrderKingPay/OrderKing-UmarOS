import { getSql } from "@/lib/db";
import { randomUUID } from "node:crypto";

export type FinanceEscalationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type FinanceEscalationStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";

export interface FinanceEscalationInput {
  orgId?: string | null;
  orderId?: string | null;
  settlementBatchId?: string | null;
  userId?: string | null;
  sourceApp: string;
  category: string;
  severity: FinanceEscalationSeverity;
  amountPaise?: number | null;
  evidence?: Record<string, unknown>;
  requestedAction: string;
}

export async function createFinanceEscalation(input: FinanceEscalationInput) {
  const sql = await getSql();
  const id = `fes_${randomUUID()}`;
  await sql`
    INSERT INTO finance_escalations (
      id, org_id, order_id, settlement_batch_id, user_id, source_app,
      category, severity, status, amount_paise, currency, evidence, requested_action
    )
    VALUES (
      ${id}, ${input.orgId ?? null}, ${input.orderId ?? null},
      ${input.settlementBatchId ?? null}, ${input.userId ?? null}, ${input.sourceApp},
      ${input.category}, ${input.severity}, "OPEN",
      ${input.amountPaise ?? null}, "INR", ${JSON.stringify(input.evidence ?? {})},
      ${input.requestedAction}
    )
  `;
  return { id, status: "OPEN" as const };
}

export async function listFinanceEscalations(status?: FinanceEscalationStatus) {
  const sql = await getSql();
  if (status) {
    return await sql`
      SELECT id, org_id, order_id, settlement_batch_id, user_id, source_app,
             category, severity, status, amount_paise, currency, evidence,
             requested_action, resolution_note, created_at, resolved_at, resolved_by
      FROM finance_escalations
      WHERE status = ${status}
      ORDER BY CASE severity
        WHEN "CRITICAL" THEN 0
        WHEN "HIGH" THEN 1
        WHEN "MEDIUM" THEN 2
        ELSE 3
      END, created_at DESC
      LIMIT 200
    `;
  }
  return await sql`
    SELECT id, org_id, order_id, settlement_batch_id, user_id, source_app,
           category, severity, status, amount_paise, currency, evidence,
           requested_action, resolution_note, created_at, resolved_at, resolved_by
    FROM finance_escalations
    ORDER BY CASE severity
      WHEN "CRITICAL" THEN 0
      WHEN "HIGH" THEN 1
      WHEN "MEDIUM" THEN 2
      ELSE 3
    END, created_at DESC
    LIMIT 200
  `;
}

export async function resolveFinanceEscalation(id: string, status: "RESOLVED" | "REJECTED", resolvedBy: string, note: string) {
  const sql = await getSql();
  const updated = await sql`
    UPDATE finance_escalations
    SET status = ${status}, resolution_note = ${note.slice(0, 2000)},
        resolved_at = NOW(), resolved_by = ${resolvedBy}
    WHERE id = ${id} AND status IN ("OPEN","IN_REVIEW")
    RETURNING id, status, resolved_at
  `;
  return updated[0] ?? null;
}