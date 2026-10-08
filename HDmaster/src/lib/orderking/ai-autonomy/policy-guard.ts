import { requireFounderApproval } from '../auth/founder-policy';

export function enforcePolicy(toolName: string, args: Record<string, any>): boolean {
    if (args.amount) {
        try {
            requireFounderApproval(toolName, args.amount);
        } catch (err: any) {
            console.error(`[POLICY GUARD] Blocked by Founder Control: ${err.message}`);
            return false;
        }
    }

    if (toolName === 'refundCustomer') {
        const amount = args.amount;
        // Deny refundCustomer > $100 without human-in-the-loop approval state
        if (amount > 100 && !args.humanApprovalToken) {
            console.warn(`[POLICY GUARD] Blocked: Refund amount $${amount} exceeds autonomous limit of $100. Human approval required.`);
            return false;
        }
    }

    if (toolName === 'banUser') {
        if (!args.userId || !args.reason) {
            console.warn(`[POLICY GUARD] Blocked: banUser requires userId and reason.`);
            return false;
        }
    }

    if (toolName === 'adjustPricing') {
        if (args.newPrice < 0) {
            console.warn(`[POLICY GUARD] Blocked: Price cannot be negative.`);
            return false;
        }
    }

    return true; // Approved by default if not caught by restrictions
}
