import { PolicyDecision } from './types.ts';
import type { PolicyContext, EvaluationResult, Rule } from './types.ts';

export class PolicyEngine {
  private rules: Rule[] = [];

  constructor(rules: Rule[] = []) {
    this.rules = rules;
  }

  addRule(rule: Rule) {
    this.rules.push(rule);
  }

  async evaluate(ctx: PolicyContext): Promise<EvaluationResult> {
    let auditTriggered = false;
    let allowed = false;
    let allowedReason = '';

    for (const rule of this.rules) {
      const decision = await rule.evaluate(ctx);
      
      if (decision === PolicyDecision.DENY) {
        return {
          decision: PolicyDecision.DENY,
          reason: `Denied by rule: ${rule.id}`
        };
      }
      
      if (decision === PolicyDecision.AUDIT) {
        auditTriggered = true;
      }
      
      if (decision === PolicyDecision.ALLOW && !allowed) {
        allowed = true;
        allowedReason = `Allowed by rule: ${rule.id}`;
      }
    }

    if (allowed) {
      return {
        decision: auditTriggered ? PolicyDecision.AUDIT : PolicyDecision.ALLOW,
        reason: allowedReason
      };
    }

    // Implicit deny if no rules matched to ALLOW
    return {
      decision: PolicyDecision.DENY,
      reason: 'Implicit Deny: No rules allowed this action'
    };
  }
}
