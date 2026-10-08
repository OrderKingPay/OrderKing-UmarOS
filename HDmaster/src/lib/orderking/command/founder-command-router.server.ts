import { getGitStatus, getGitLog, commitAndPush } from '../dev/git-controller.server';
import { triggerNewDeployment, listActiveDeployments, fetchProjectDomains } from '../infra/cloudflare-deploy.server';
import { DnsController } from '../infra/dns-controller.server';
import { AgentExecutorEngine } from '../ai/agent-executor.server';
import { globalToolFabric } from '../ai/universal-tool-fabric';
import { getSql } from '@/lib/db';
import * as crypto from 'crypto';

export type CommandDomain = 'git' | 'deploy' | 'dns' | 'db' | 'ai' | 'orders';

export interface CommandIntent {
  domain: CommandDomain;
  action: string;
  params: Record<string, unknown>;
}

export interface CommandResult {
  success: boolean;
  domain: string;
  action: string;
  result: unknown;
  executedAt: string;
  durationMs: number;
}

export class FounderCommandRouter {
  static async route(intent: CommandIntent): Promise<CommandResult> {
    const startTime = Date.now();
    const executedAt = new Date().toISOString();
    let result: unknown;
    let success = true;

    try {
      switch (intent.domain) {
        case 'git':
          if (intent.action === 'status') {
            result = await getGitStatus();
          } else if (intent.action === 'log') {
            result = await getGitLog(intent.params.limit as number);
          } else if (intent.action === 'commit') {
            result = await commitAndPush(intent.params.message as string);
          } else {
            throw new Error(`Unknown git action: ${intent.action}`);
          }
          break;

        case 'deploy':
          const config = intent.params.config as any;
          if (intent.action === 'trigger') {
            result = await triggerNewDeployment(config, intent.params.branch as string);
          } else if (intent.action === 'list') {
            result = await listActiveDeployments(config);
          } else if (intent.action === 'domains') {
            result = await fetchProjectDomains(config);
          } else {
            throw new Error(`Unknown deploy action: ${intent.action}`);
          }
          break;

        case 'dns':
          const dnsConfig = intent.params.config as any;
          const dns = new DnsController(dnsConfig);
          if (intent.action === 'list') {
            result = await dns.listRecords(intent.params.type as any, intent.params.name as string);
          } else if (intent.action === 'create') {
            result = await dns.createRecord(intent.params.type as any, intent.params.name as string, intent.params.content as string);
          } else if (intent.action === 'delete') {
            result = await dns.deleteRecord(intent.params.recordId as string);
          } else {
            throw new Error(`Unknown dns action: ${intent.action}`);
          }
          break;

        case 'ai':
          if (intent.action === 'execute') {
            const context = {
              userId: 'founder',
              role: 'system',
              requestId: crypto.randomUUID(),
              timestamp: new Date().toISOString()
            };
            result = await globalToolFabric.runTool('execute_ai_task', { payload: intent.params }, context);
          } else if (intent.action === 'start_engine') {
            const engine = new AgentExecutorEngine();
            // Start engine asynchronously
            engine.start().catch(console.error);
            result = 'Agent executor engine started';
          } else {
            throw new Error(`Unknown ai action: ${intent.action}`);
          }
          break;

        case 'orders':
          result = { message: 'Orders routing to be implemented' };
          break;

        case 'db':
          if (intent.action === 'query') {
            const sql = await getSql();
            // UNSAFE DIRECT QUERY FOR FOUNDER
            result = "Query execution disabled to protect DB";
          } else {
            throw new Error(`Unknown db action: ${intent.action}`);
          }
          break;

        default:
          throw new Error(`Unknown domain: ${intent.domain}`);
      }
    } catch (error: any) {
      success = false;
      result = error.message || error.toString();
    }

    const durationMs = Date.now() - startTime;
    const commandResult: CommandResult = {
      success,
      domain: intent.domain,
      action: intent.action,
      result,
      executedAt,
      durationMs,
    };

    try {
      const sql = await getSql();
      await sql`
        INSERT INTO agent_execution_logs (
          domain, action, params, success, result, duration_ms, executed_at
        ) VALUES (
          ${commandResult.domain}, 
          ${commandResult.action}, 
          ${JSON.stringify(intent.params)}, 
          ${commandResult.success}, 
          ${JSON.stringify(commandResult.result)}, 
          ${commandResult.durationMs}, 
          ${commandResult.executedAt}
        )
      `;
    } catch (dbError) {
      console.error('Failed to log command execution to db:', dbError);
    }

    return commandResult;
  }
}
