import { type AccessContext, hasPermission, type Permission, ForbiddenError } from "../rbac.ts";

export const IdentityType = {
  HUMAN: "HUMAN",
  ORCHESTRATOR: "ORCHESTRATOR",
  AGENT: "AGENT",
  TOOL: "TOOL",
} as const;

export type IdentityType = typeof IdentityType[keyof typeof IdentityType];

export interface ChainIdentity {
  type: IdentityType;
  context: AccessContext;
}

export class CallChainContext {
  private chain: ChainIdentity[];

  constructor(initialChain?: ChainIdentity[]) {
    this.chain = initialChain ? [...initialChain] : [];
  }

  /**
   * Pushes a new identity onto the call chain.
   * Returns a new CallChainContext to maintain immutability.
   */
  pushIdentity(identity: ChainIdentity): CallChainContext {
    return new CallChainContext([...this.chain, identity]);
  }

  get identities(): readonly ChainIdentity[] {
    return this.chain;
  }

  /**
   * Evaluates if the current call chain has the required permission.
   * To prevent privilege laundering, we require the intersection of privileges.
   * This means ALL identities in the chain must have the required permission.
   */
  hasPermission(perm: Permission): boolean {
    if (this.chain.length === 0) {
      return false; // Empty chain has no permissions
    }
    
    // Every identity in the chain must have the permission
    return this.chain.every((identity) => hasPermission(identity.context, perm));
  }
  
  /**
   * Requires that the chain has the permission, otherwise throws ForbiddenError
   */
  requirePermission(perm: Permission): void {
    if (!this.hasPermission(perm)) {
      throw new ForbiddenError(`Forbidden: Call chain missing permission: ${perm}`);
    }
  }
}
