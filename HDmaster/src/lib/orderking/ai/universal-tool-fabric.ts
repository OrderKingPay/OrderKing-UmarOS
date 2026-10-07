import { z } from 'zod';
import { getSql } from '@/lib/db';

export interface ToolDefinition<Input, Output> {
  id: string;
  scope: string;
  permissions: string[];
  sideEffects: boolean;
  failureHandling: 'THROW' | 'FALLBACK' | 'RETRY';
  timeoutsMs: number;
  retryRules: { maxAttempts: number; backoffMs: number };
  securityBoundaries: string[];
  
  inputSchema: z.ZodType<Input, any, any>;
  outputSchema: z.ZodType<Output, any, any>;
  
  execute: (input: Input, context: ToolContext) => Promise<Output>;
  validate: (input: unknown) => Input;
  authorize: (context: ToolContext) => Promise<boolean>;
  verify: (output: Output) => boolean;
}

export interface ToolContext {
  userId: string;
  role: string;
  requestId: string;
  timestamp: string;
}

export interface ToolAuditRecord {
  toolId: string;
  requestId: string;
  userId: string;
  timestamp: string;
  inputSnapshot: any;
  outputSnapshot: any;
  success: boolean;
  executionMs: number;
  errorDetails?: string;
}

export class UniversalToolFabric {
  private tools: Map<string, ToolDefinition<any, any>> = new Map();

  register<I, O>(tool: ToolDefinition<I, O>) {
    this.tools.set(tool.id, tool);
  }

  private async persistAudit(record: ToolAuditRecord) {
    try {
      const sql = await getSql();
      await sql`
        INSERT INTO tool_execution_audits 
        (tool_id, request_id, user_id, execution_ms, success, input_snapshot, output_snapshot, error_details)
        VALUES 
        (
          ${record.toolId}, ${record.requestId}, ${record.userId}, ${record.executionMs}, 
          ${record.success}, ${JSON.stringify(record.inputSnapshot)}, ${JSON.stringify(record.outputSnapshot)}, ${record.errorDetails || null}
        )
        ON CONFLICT (tool_id, request_id) DO NOTHING
      `;
    } catch (e) {
      console.error('[CRITICAL] Failed to persist tool audit log', e);
    }
  }

  private async checkIdempotency(toolId: string, requestId: string): Promise<any | null> {
    const sql = await getSql();
    const idempKey = `${toolId}:${requestId}`;
    const rows = await sql`SELECT response_body FROM idempotency_keys WHERE key_value = ${idempKey}`;
    if (rows && rows.length > 0) {
      return rows[0].response_body;
    }
    return null;
  }

  private async saveIdempotency(toolId: string, requestId: string, userId: string, response: any) {
    const sql = await getSql();
    const idempKey = `${toolId}:${requestId}`;
    await sql`
      INSERT INTO idempotency_keys (key_value, user_id, action, response_body, status)
      VALUES (${idempKey}, ${userId}, ${toolId}, ${JSON.stringify(response)}, 200)
      ON CONFLICT (key_value) DO NOTHING
    `;
  }

  private async executeWithTimeout<O>(executePromise: Promise<O>, timeoutMs: number): Promise<O> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('EXECUTION_TIMEOUT')), timeoutMs);
    });

    try {
      return await Promise.race([executePromise, timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }

  async runTool<I, O>(toolId: string, rawInput: unknown, context: ToolContext): Promise<O> {
    const tool = this.tools.get(toolId) as ToolDefinition<I, O> | undefined;
    if (!tool) throw new Error(`Tool ${toolId} not found in Universal Fabric.`);

    // 1. IDEMPOTENCY CHECK
    if (tool.sideEffects) {
      const cached = await this.checkIdempotency(toolId, context.requestId);
      if (cached) return cached as O;
    }

    const start = Date.now();
    let success = false;
    let finalOutput: O | undefined;
    let validatedInput: I | undefined;
    let errorDetails: string | undefined;

    try {
      // 2. SCHEMA VALIDATION
      try {
        validatedInput = tool.validate(rawInput);
        tool.inputSchema.parse(validatedInput);
      } catch (err: any) {
        throw new Error(`VALIDATION_FAILURE: ${err.message}`);
      }

      // 3. AUTHORIZATION
      const isAuthorized = await tool.authorize(context);
      if (!isAuthorized) throw new Error(`AUTHORIZATION_DENIED: User ${context.userId} lacks privileges for ${toolId}`);
      
      // 4. EXECUTION WITH TIMEOUT & RETRY
      let attempts = 0;
      let lastError: Error | null = null;
      const maxAttempts = tool.failureHandling === 'RETRY' ? tool.retryRules.maxAttempts : 1;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          finalOutput = await this.executeWithTimeout(tool.execute(validatedInput, context), tool.timeoutsMs);
          lastError = null;
          break;
        } catch (err: any) {
          lastError = err;
          if (attempts < maxAttempts) {
            await new Promise(res => setTimeout(res, tool.retryRules.backoffMs * Math.pow(2, attempts - 1)));
          }
        }
      }

      if (lastError) {
        throw lastError;
      }

      // 5. RESULT VALIDATION & VERIFICATION
      if (finalOutput === undefined) throw new Error('EXECUTION_FAILURE: Output is undefined');
      
      try {
        tool.outputSchema.parse(finalOutput);
      } catch (err: any) {
        throw new Error(`OUTPUT_SCHEMA_FAILURE: ${err.message}`);
      }

      const isVerified = tool.verify(finalOutput);
      if (!isVerified) throw new Error(`VERIFICATION_FAILURE: Output did not pass business logic verification for ${toolId}`);

      success = true;

      // 6. SAVE IDEMPOTENCY
      if (tool.sideEffects) {
        await this.saveIdempotency(toolId, context.requestId, context.userId, finalOutput);
      }

      return finalOutput;
    } catch (err: any) {
      errorDetails = err.message;
      throw err;
    } finally {
      // 7. AUDIT
      await this.persistAudit({
        toolId,
        requestId: context.requestId,
        userId: context.userId,
        timestamp: new Date().toISOString(),
        inputSnapshot: validatedInput ?? rawInput,
        outputSnapshot: finalOutput ?? null,
        success,
        errorDetails,
        executionMs: Date.now() - start
      });
    }
  }
}

export const globalToolFabric = new UniversalToolFabric();
