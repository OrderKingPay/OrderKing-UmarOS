import { z } from 'zod';
import { getSql } from '@/lib/db';
import { globalToolFabric } from './universal-tool-fabric';
import { GoogleGeminiProvider } from './providers/gemini-provider';

// Register the AI Execution Tool within the Universal Tool Fabric
// This ensures safety boundaries, timeouts, retries, and audit logging.
globalToolFabric.register({
  id: 'execute_ai_task',
  scope: 'system',
  permissions: ['system:execute'],
  sideEffects: true,
  failureHandling: 'RETRY',
  timeoutsMs: 120000,
  retryRules: { maxAttempts: 3, backoffMs: 2000 },
  securityBoundaries: ['external-ai'],
  
  inputSchema: z.object({ payload: z.any() }),
  outputSchema: z.object({ result: z.string() }),
  
  validate: (input: any) => input,
  authorize: async () => true, // System level tool execution
  verify: (output: any) => !!output && typeof output.result === 'string',
  
  execute: async (input: { payload: any }) => {
    const provider = new GoogleGeminiProvider();
    const payloadStr = typeof input.payload === 'string' 
      ? input.payload 
      : JSON.stringify(input.payload);
      
    const response = await provider.chat({
      messages: [{ role: 'user', content: payloadStr }],
      systemPrompt: "You are an autonomous AI worker executing a background task. Perform the requested work precisely and return only the output.",
    });
    
    return { result: response.text };
  }
});

/**
 * Core Executor Engine for Multi-Agent Workforce
 * Polls `agent_tasks` table, locks rows securely, and processes AI workloads.
 */
export class AgentExecutorEngine {
  private isRunning = false;

  async start() {
    this.isRunning = true;
    console.log('[AgentExecutorEngine] Engine started.');
    
    while (this.isRunning) {
      try {
        const processed = await this.processNextPendingTask();
        if (!processed) {
          // Backoff if no tasks found
          await new Promise(res => setTimeout(res, 5000));
        }
      } catch (e) {
        console.error('[AgentExecutorEngine] Unhandled loop error:', e);
        await new Promise(res => setTimeout(res, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log('[AgentExecutorEngine] Engine stopped.');
  }

  async processNextPendingTask(): Promise<boolean> {
    const sql = await getSql();
    
    // 1. Lock a pending task and update status to RUNNING
    // Uses FOR UPDATE SKIP LOCKED to allow concurrent executor nodes safely.
    const tasks = await sql`
      WITH locked_task AS (
        SELECT id FROM agent_tasks 
        WHERE status = 'PENDING' 
        ORDER BY created_at ASC 
        FOR UPDATE SKIP LOCKED 
        LIMIT 1
      )
      UPDATE agent_tasks 
      SET status = 'RUNNING', updated_at = NOW() 
      WHERE id = (SELECT id FROM locked_task) 
      RETURNING id, payload;
    `;

    if (!tasks || tasks.length === 0) {
      return false; // No pending tasks available
    }

    const task = tasks[0];
    console.log(`[AgentExecutorEngine] Picked up task ${task.id}`);

    try {
      // 2. Route the task payload through universal-tool-fabric for safety
      const output = await globalToolFabric.runTool<any, { result: string }>(
        'execute_ai_task', 
        { payload: task.payload }, 
        {
          userId: 'system',
          role: 'executor',
          requestId: `task-${task.id}`,
          timestamp: new Date().toISOString()
        }
      );

      // 3. Save final result and mark COMPLETED
      await sql`
        UPDATE agent_tasks
        SET 
          status = 'COMPLETED',
          result = ${JSON.stringify(output.result)},
          updated_at = NOW()
        WHERE id = ${task.id}
      `;
      
      console.log(`[AgentExecutorEngine] Task ${task.id} completed successfully.`);

    } catch (error: any) {
      console.error(`[AgentExecutorEngine] Task ${task.id} failed:`, error);
      
      // 4. Handle API failures gracefully without fabricating success
      await sql`
        UPDATE agent_tasks
        SET
          status = 'FAILED',
          error_details = ${error.message || 'Unknown execution failure'},
          updated_at = NOW()
        WHERE id = ${task.id}
      `;
    }

    return true; 
  }
}
