import { Domain, domainPolicies } from './domains';
import { AuditLog } from './audit-log';

export interface AuthorizationDecision {
  allowed: boolean;
  reason: string;
}

export class BoundaryGate {
  public static authorize(source: Domain, target: Domain, action: string): AuthorizationDecision {
    if (source === target) {
      const decision: AuthorizationDecision = { allowed: true, reason: 'Intra-domain access is allowed.' };
      AuditLog.logCrossDomainAccess(source, target, action, 'ALLOWED', decision.reason);
      return decision;
    }

    const sourcePolicy = domainPolicies[source];
    if (!sourcePolicy) {
      const decision: AuthorizationDecision = { allowed: false, reason: `No policies defined for source domain: ${source}.` };
      AuditLog.logCrossDomainAccess(source, target, action, 'DENIED', decision.reason);
      return decision;
    }

    const allowedActions = sourcePolicy[target];
    if (!allowedActions) {
      const decision: AuthorizationDecision = { allowed: false, reason: `No cross-domain access configured from ${source} to ${target}.` };
      AuditLog.logCrossDomainAccess(source, target, action, 'DENIED', decision.reason);
      return decision;
    }

    if (allowedActions.includes(action) || allowedActions.includes('*')) {
      const decision: AuthorizationDecision = { allowed: true, reason: `Action '${action}' is allowed from ${source} to ${target}.` };
      AuditLog.logCrossDomainAccess(source, target, action, 'ALLOWED', decision.reason);
      return decision;
    }

    const decision: AuthorizationDecision = { allowed: false, reason: `Action '${action}' is denied from ${source} to ${target}.` };
    AuditLog.logCrossDomainAccess(source, target, action, 'DENIED', decision.reason);
    return decision;
  }
}
