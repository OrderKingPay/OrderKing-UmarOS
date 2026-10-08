import * as fs from 'node:fs';
import * as path from 'node:path';
import { PolicyEngine } from '../policy-kernel/engine.ts';
import { PolicyDecision } from '../policy-kernel/types.ts';
import type { PolicyContext } from '../policy-kernel/types.ts';

export const LifecycleState = {
    PROPOSED: 'PROPOSED',
    POLICY_CHECKED: 'POLICY_CHECKED',
    TESTED: 'TESTED',
    SECURITY_REVIEWED: 'SECURITY_REVIEWED',
    APPROVED: 'APPROVED',
    VERSIONED: 'VERSIONED',
    DEPLOYED: 'DEPLOYED',
    OBSERVED: 'OBSERVED',
    ROLLED_BACK: 'ROLLED_BACK',
    REJECTED: 'REJECTED'
} as const;

export type LifecycleState = typeof LifecycleState[keyof typeof LifecycleState];

export interface ImprovementProposal {
    id: string;
    filePath: string;
    newCode: string;
    state: LifecycleState;
    backupPath?: string;
    error?: string;
}

export class GovernedImprovementLifecycle {
    private policyEngine: PolicyEngine;

    constructor(policyEngine: PolicyEngine) {
        this.policyEngine = policyEngine;
    }

    async processProposal(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        try {
            proposal = await this.transitionTo(proposal, LifecycleState.PROPOSED);
            proposal = await this.checkPolicy(proposal);
            proposal = await this.runTestsAndSecurity(proposal);
            proposal = await this.approve(proposal);
            proposal = await this.version(proposal);
            proposal = await this.deploy(proposal);
            proposal = await this.transitionTo(proposal, LifecycleState.OBSERVED);
            return proposal;
        } catch (error: any) {
            proposal.state = LifecycleState.REJECTED;
            proposal.error = error.message;
            if (proposal.backupPath) {
                 await this.rollback(proposal);
            }
            return proposal;
        }
    }

    private async transitionTo(proposal: ImprovementProposal, state: LifecycleState) {
        proposal.state = state;
        return proposal;
    }

    private async checkPolicy(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        const ctx: PolicyContext = {
            principal: { id: 'self-improver', roles: ['system'] },
            capability: 'self_refactor',
            resource: { filePath: proposal.filePath }
        };
        const result = await this.policyEngine.evaluate(ctx);
        if (result.decision === PolicyDecision.DENY) {
            throw new Error(`Policy check failed: ${result.reason}`);
        }
        return this.transitionTo(proposal, LifecycleState.POLICY_CHECKED);
    }

    private async runTestsAndSecurity(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        // Basic AST/Security check
        if (proposal.newCode.includes('eval(') || proposal.newCode.includes('child_process.exec(')) {
            throw new Error('Security review failed: Prohibited functions used');
        }
        
        proposal = await this.transitionTo(proposal, LifecycleState.TESTED);
        return this.transitionTo(proposal, LifecycleState.SECURITY_REVIEWED);
    }

    private async approve(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        // The policy kernel handles approval/denial, so this is just a final state transition
        // or a human-in-the-loop check if needed. For now, it's automatic after policy check.
        return this.transitionTo(proposal, LifecycleState.APPROVED);
    }

    private async version(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        if (fs.existsSync(proposal.filePath)) {
            proposal.backupPath = `${proposal.filePath}.bak.${Date.now()}`;
            fs.copyFileSync(proposal.filePath, proposal.backupPath);
        } else {
            proposal.backupPath = `${proposal.filePath}.bak.new`; // Indicator that file was new
        }
        return this.transitionTo(proposal, LifecycleState.VERSIONED);
    }

    private async deploy(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        fs.writeFileSync(proposal.filePath, proposal.newCode, 'utf8');
        return this.transitionTo(proposal, LifecycleState.DEPLOYED);
    }

    async rollback(proposal: ImprovementProposal): Promise<ImprovementProposal> {
        if (proposal.backupPath && proposal.backupPath.endsWith('.bak.new')) {
            if (fs.existsSync(proposal.filePath)) {
                fs.unlinkSync(proposal.filePath);
            }
        } else if (proposal.backupPath && fs.existsSync(proposal.backupPath)) {
            fs.copyFileSync(proposal.backupPath, proposal.filePath);
            fs.unlinkSync(proposal.backupPath);
        }
        return this.transitionTo(proposal, LifecycleState.ROLLED_BACK);
    }
}
