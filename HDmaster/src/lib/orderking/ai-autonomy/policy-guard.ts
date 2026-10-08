import { policyEngine, PolicyDecision } from '../policy-kernel/index.ts';
import type { Principal } from '../policy-kernel/index.ts';

export async function enforcePolicy(toolName: string, args: Record<string, any>): Promise<boolean> {
    const principal: Principal = { id: 'ai-system', roles: ['autonomous-agent'] };
    
    const result = await policyEngine.evaluate({
        principal,
        capability: toolName,
        resource: args
    });

    if (result.decision === PolicyDecision.DENY) {
        console.warn(`[POLICY GUARD] Blocked: ${result.reason}`);
        return false;
    }

    if (result.decision === PolicyDecision.AUDIT) {
        console.warn(`[POLICY GUARD] Audit flagged for capability ${toolName}: ${result.reason}`);
        // Still allow, but audited
        return true;
    }

    return true; // Approved
}
