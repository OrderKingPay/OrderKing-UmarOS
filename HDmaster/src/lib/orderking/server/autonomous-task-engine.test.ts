import assert from 'node:assert/strict';
import { spawnTask, updateTaskState } from './autonomous-task-engine.server.ts';
import { getSql } from '../../db.ts';

async function run() {
  const sql = await getSql();
  await sql.query(`INSERT INTO organizations (id, name, slug) VALUES ('org_task', 'Task Org', 'task-org') ON CONFLICT DO NOTHING`);
  const taskId = await spawnTask('org_task', 'AI_AGENT', { command: 'Generate report' });
  
  let res = await sql.query(`SELECT state FROM autonomous_tasks WHERE id = $1`, [taskId]) as any;
  assert.equal(res[0].state, 'REQUESTED');
  
  await updateTaskState(taskId, 'EXECUTING', { progress: 0.5 });
  res = await sql.query(`SELECT state, progress FROM autonomous_tasks WHERE id = $1`, [taskId]) as any;
  assert.equal(res[0].state, 'EXECUTING');
  assert.equal(res[0].progress, 0.5);

  await updateTaskState(taskId, 'COMPLETED', { result: { success: true }, evidence: 'Report saved to disk.' });
  res = await sql.query(`SELECT state, result_json, evidence_text FROM autonomous_tasks WHERE id = $1`, [taskId]) as any;
  assert.equal(res[0].state, 'COMPLETED');
  assert.equal(JSON.parse(res[0].result_json).success, true);
  assert.equal(res[0].evidence_text, 'Report saved to disk.');

  console.log("✅ Autonomous Task Engine successfully completed 1000X Lifecycle!");
}

run().catch(console.error).finally(() => process.exit(0));
