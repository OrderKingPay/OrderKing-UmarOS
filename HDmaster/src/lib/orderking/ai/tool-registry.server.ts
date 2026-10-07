import { globalToolFabric } from './universal-tool-fabric';
import { z } from 'zod';
import { getSql } from '@/lib/db';

export function registerFounderTools() {
  globalToolFabric.register({
    id: 'get_platform_state',
    scope: 'system:read',
    permissions: ['SUPER_ADMIN'],
    sideEffects: false,
    failureHandling: 'THROW',
    timeoutsMs: 5000,
    retryRules: { maxAttempts: 1, backoffMs: 0 },
    securityBoundaries: ['tenant_isolation'],
    inputSchema: z.object({}),
    outputSchema: z.object({ users: z.number(), orders: z.number() }),
    validate: (input) => ({}),
    authorize: async (ctx) => ctx.role === 'SUPER_ADMIN',
    verify: (output: any) => typeof output.users === 'number',
    execute: async () => {
      const sql = await getSql();
      const users = await sql`SELECT count(*) as count FROM users`;
      const orders = await sql`SELECT count(*) as count FROM orders WHERE status != 'DELIVERED'`;
      return { 
        users: Number(users[0]?.count || 0),
        orders: Number(orders[0]?.count || 0)
      };
    }
  });

  globalToolFabric.register({
    id: 'get_financial_reconciliation',
    scope: 'finance:read',
    permissions: ['SUPER_ADMIN'],
    sideEffects: false,
    failureHandling: 'RETRY',
    timeoutsMs: 10000,
    retryRules: { maxAttempts: 3, backoffMs: 1000 },
    securityBoundaries: ['financial_isolation'],
    inputSchema: z.object({ date: z.string().optional() }),
    outputSchema: z.object({ totalVolume: z.number() }),
    validate: (input: any) => ({ date: input?.date }),
    authorize: async (ctx) => ctx.role === 'SUPER_ADMIN',
    verify: (output: any) => typeof output.totalVolume === 'number',
    execute: async () => {
      const sql = await getSql();
      const tx = await sql`SELECT sum(amount) as total FROM financial_ledger`;
      return { totalVolume: Number(tx[0]?.total || 0) };
    }
  });

  globalToolFabric.register({
    id: 'find_operational_exceptions',
    scope: 'ops:read',
    permissions: ['SUPER_ADMIN'],
    sideEffects: false,
    failureHandling: 'THROW',
    timeoutsMs: 5000,
    retryRules: { maxAttempts: 1, backoffMs: 0 },
    securityBoundaries: ['tenant_isolation'],
    inputSchema: z.object({}),
    outputSchema: z.object({ exceptions: z.array(z.any()) }),
    validate: (input) => ({}),
    authorize: async (ctx) => ctx.role === 'SUPER_ADMIN',
    verify: (output: any) => Array.isArray(output.exceptions),
    execute: async () => {
      const sql = await getSql();
      const exceptions = await sql`
        SELECT id, restaurant_id, status, created_at 
        FROM orders 
        WHERE (status = 'PREPARING' AND created_at < NOW() - INTERVAL '1 hour')
           OR (status = 'PENDING' AND created_at < NOW() - INTERVAL '15 minutes')
      `;
      return { exceptions: Array.from(exceptions) };
    }
  });

  globalToolFabric.register({
    id: 'diagnose_cancellations',
    scope: 'ops:read',
    permissions: ['SUPER_ADMIN'],
    sideEffects: false,
    failureHandling: 'THROW',
    timeoutsMs: 5000,
    retryRules: { maxAttempts: 1, backoffMs: 0 },
    securityBoundaries: ['tenant_isolation'],
    inputSchema: z.object({ timeframe: z.string().optional() }),
    outputSchema: z.object({ count: z.number(), recent: z.array(z.any()) }),
    validate: (input: any) => ({ timeframe: input?.timeframe }),
    authorize: async (ctx) => ctx.role === 'SUPER_ADMIN',
    verify: (output: any) => typeof output.count === 'number',
    execute: async () => {
      const sql = await getSql();
      const recent = await sql`SELECT id, restaurant_id, total_amount, created_at FROM orders WHERE status = 'CANCELLED' ORDER BY created_at DESC LIMIT 5`;
      const count = await sql`SELECT count(*) as c FROM orders WHERE status = 'CANCELLED'`;
      return { count: Number(count[0]?.c || 0), recent: Array.from(recent) };
    }
  });

  globalToolFabric.register({
    id: 'prepare_eligible_refunds',
    scope: 'finance:write',
    permissions: ['SUPER_ADMIN'],
    sideEffects: true,
    failureHandling: 'THROW',
    timeoutsMs: 5000,
    retryRules: { maxAttempts: 1, backoffMs: 0 },
    securityBoundaries: ['financial_isolation'],
    inputSchema: z.object({ dryRun: z.boolean().default(true) }),
    outputSchema: z.object({ refundsPrepared: z.number(), totalAmount: z.number() }),
    validate: (input: any) => ({ dryRun: input?.dryRun ?? true }),
    authorize: async (ctx) => ctx.role === 'SUPER_ADMIN',
    verify: (output: any) => typeof output.refundsPrepared === 'number',
    execute: async (input) => {
      const sql = await getSql();
      const eligible = await sql`
        SELECT o.id, o.total_amount 
        FROM orders o
        LEFT JOIN financial_ledger f ON f.order_id = o.id AND f.type = 'REFUND'
        WHERE o.status = 'CANCELLED' AND f.id IS NULL
      `;
      
      let totalAmount = 0;
      for (const row of eligible) {
        totalAmount += Number((row as any).total_amount || 0);
      }

      if (!input.dryRun && eligible.length > 0) {
        throw new Error('REQUIRES_EXTERNAL_SERVICE: Razorpay/Stripe API key is not configured. Live refunds cannot be issued. (dryRun must be true)');
      }

      return { refundsPrepared: eligible.length, totalAmount };
    }
  });
}
