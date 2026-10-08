export type Action = 'read' | 'write' | 'delete' | 'admin';
export type Resource = 'orders' | 'inventory' | 'payments' | 'customers' | 'settings';

export interface IAMContext {
  tenantId: string;
  userId: string;
  roles: string[];
}

export class IAMPolicyEnforcer {
  /**
   * Enforces role-based access control (RBAC) and basic IAM policies.
   */
  public enforce(context: IAMContext, action: Action, resource: Resource): boolean {
    if (context.roles.includes('superadmin')) {
      return true;
    }
    
    if (action === 'admin' && !context.roles.includes('admin')) {
      throw new Error(`IAM Policy Violation: User ${context.userId} is not authorized for ${action} on ${resource}`);
    }

    if (!context.roles.length) {
       throw new Error("IAM Policy Violation: Access Denied, no roles assigned.");
    }

    // Extensible logic for fine-grained permissions per resource...

    return true;
  }
}
