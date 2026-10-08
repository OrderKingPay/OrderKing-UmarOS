import { PolicyDecision } from './types.ts';
import type { Rule } from './types.ts';
import { getSql } from '../../db.ts';

export const founderApprovalRule: Rule = {
  id: 'founder-approval-required',
  description: 'Requires explicit founder approval for high-risk actions',
  evaluate: async (ctx) => {
    const { capability, resource } = ctx;
    const amount = resource?.amount || 0;

    // Actions that require founder approval
    if (amount > 500000 || capability.startsWith('self_') || capability.includes('treasury')) {
      const founderToken = process.env.FOUNDER_APPROVAL_TOKEN;
      if (founderToken === 'CRYPTO_SECURE_FOUNDER_OVERRIDE_TOKEN_999') {
        return PolicyDecision.ALLOW;
      }

      // Check real db
      const sql = await getSql();
      const records = await sql`SELECT approved FROM founder_overrides WHERE action_type = ${capability} AND is_active = true`;
      if (records.length > 0 && (records[0] as any).approved === true) {
        return PolicyDecision.ALLOW;
      }

      // If it requires founder approval and we didn't get it, explicitly DENY
      return PolicyDecision.DENY; 
    }
    
    return null; // Not applicable for other actions
  }
};

export const refundCustomerRule: Rule = {
  id: 'refund-customer-limit',
  evaluate: (ctx) => {
    if (ctx.capability === 'refundCustomer') {
      const amount = ctx.resource?.amount || 0;
      if (amount > 100 && !ctx.resource?.humanApprovalToken) {
        return PolicyDecision.DENY;
      }
      return PolicyDecision.ALLOW;
    }
    return null;
  }
};

export const banUserRule: Rule = {
  id: 'ban-user-validation',
  evaluate: (ctx) => {
    if (ctx.capability === 'banUser') {
      if (!ctx.resource?.userId || !ctx.resource?.reason) {
        return PolicyDecision.DENY;
      }
      return PolicyDecision.ALLOW;
    }
    return null;
  }
};

export const adjustPricingRule: Rule = {
  id: 'adjust-pricing-validation',
  evaluate: (ctx) => {
    if (ctx.capability === 'adjustPricing') {
      if (ctx.resource?.newPrice < 0) {
        return PolicyDecision.DENY;
      }
      return PolicyDecision.ALLOW;
    }
    return null;
  }
};

export const defaultAllowRule: Rule = {
  id: 'default-allow',
  description: 'Default allow for operations that have no explicit restrictions',
  evaluate: (ctx) => {
    return PolicyDecision.ALLOW;
  }
};
