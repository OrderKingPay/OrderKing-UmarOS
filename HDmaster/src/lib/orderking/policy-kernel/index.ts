import { PolicyEngine } from './engine.ts';
import { 
  founderApprovalRule, 
  refundCustomerRule, 
  banUserRule, 
  adjustPricingRule, 
  defaultAllowRule 
} from './rules.ts';

// Create a singleton instance of the policy engine
export const policyEngine = new PolicyEngine([
  founderApprovalRule,
  refundCustomerRule,
  banUserRule,
  adjustPricingRule,
  defaultAllowRule
]);

export * from './types.ts';
export * from './engine.ts';
export * from './rules.ts';
