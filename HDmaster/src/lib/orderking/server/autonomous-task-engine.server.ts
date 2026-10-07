import { getSql } from "@/lib/db";
import { nid as newId } from "./workspace.server.ts";
import { z } from "zod";

export const TaskStateEnum = z.enum([
  "REQUESTED",
  "UNDERSTOOD",
  "PLANNED",
  "EXECUTING",
  "VALIDATING",
  "COMPLETED",
  "BLOCKED",
  "FAILED",
  "ESCALATED"
]);
export type TaskState = z.infer<typeof TaskStateEnum>;

export async function spawnTask(orgId: string, owner: string, inputs: Record<string, unknown>, timeoutMs = 300000) {
  const sql = await getSql();
  const id = newId("tsk");
  await sql.query(`
    INSERT INTO autonomous_tasks (id, org_id, owner, state, inputs_json, timeout_ms, created_at, updated_at)
    VALUES ($1, $2, $3, 'REQUESTED', $4, $5, now(), now())
  `, [id, orgId, owner, JSON.stringify(inputs), timeoutMs]);
  return id;
}

export async function updateTaskState(taskId: string, newState: TaskState, context?: { progress?: number; evidence?: string; error?: string; result?: any }) {
  const sql = await getSql();
  const updates: string[] = ["state = $2", "updated_at = now()"];
  const values: any[] = [taskId, newState];
  let i = 3;

  if (context?.progress !== undefined) { updates.push(`progress = $${i++}`); values.push(context.progress); }
  if (context?.evidence !== undefined) { updates.push(`evidence_text = $${i++}`); values.push(context.evidence); }
  if (context?.error !== undefined) { updates.push(`error_state = $${i++}`); values.push(context.error); }
  if (context?.result !== undefined) { updates.push(`result_json = $${i++}`); values.push(JSON.stringify(context.result)); }

  await sql.query(`
    UPDATE autonomous_tasks SET ${updates.join(', ')} WHERE id = $1
  `, values);
}
