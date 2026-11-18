import { z } from 'zod';
import { fabric } from './universal-fabric';

export const KingPaySchemas = {
  Transfer: z.object({
    toUserId: z.string(),
    amount: z.number().positive(),
    currency: z.string().length(3),
  }),
};

export const EconomicsSchemas = {
  UpdateTaxRate: z.object({
    newRate: z.number().min(0).max(100),
    region: z.string(),
  }),
};

// Fail-closed: fabric routes never fabricate ledger transactions or tax mutations in memory.
// Authentic transfers execute through PostgreSQL double-entry APIs under /api/v1/kingpay/* and /api/v1/admin/settings.

fabric.registerRoute(
  'POST',
  '/api/fabric/kingpay/transfer',
  { schema: { body: KingPaySchemas.Transfer }, requiredRole: 'ADMIN' },
  async () => {
    return {
      status: 501,
      error: 'Direct fabric transfer disabled. Use authenticated PostgreSQL double-entry ledger APIs.',
    };
  }
);

fabric.registerRoute(
  'POST',
  '/api/fabric/economics/update-tax',
  { schema: { body: EconomicsSchemas.UpdateTaxRate }, requiredRole: 'FOUNDER' },
  async () => {
    return {
      status: 501,
      error: 'Direct fabric tax update disabled. Use authenticated /api/v1/admin/settings endpoint.',
    };
  }
);

export const FabricEngines = {
  isReady: true,
};
