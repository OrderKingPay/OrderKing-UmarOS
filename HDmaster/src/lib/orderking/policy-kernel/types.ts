export const PolicyDecision = {
  ALLOW: 'ALLOW',
  DENY: 'DENY',
  AUDIT: 'AUDIT'
} as const;

export type PolicyDecision = typeof PolicyDecision[keyof typeof PolicyDecision];

export interface Principal {
  id: string;
  roles: string[];
  attributes?: Record<string, any>;
}

export interface PolicyContext {
  principal: Principal;
  capability: string;
  resource?: Record<string, any>;
  environment?: Record<string, any>;
}

export interface EvaluationResult {
  decision: PolicyDecision;
  reason?: string;
}

export interface Rule {
  id: string;
  description?: string;
  /**
   * Evaluates a policy context.
   * Return ALLOW to explicitly allow the action.
   * Return DENY to explicitly deny the action (overrides any ALLOW).
   * Return AUDIT to flag for audit but not deny.
   * Return null if the rule is not applicable to the context.
   */
  evaluate: (ctx: PolicyContext) => Promise<PolicyDecision | null> | PolicyDecision | null;
}
