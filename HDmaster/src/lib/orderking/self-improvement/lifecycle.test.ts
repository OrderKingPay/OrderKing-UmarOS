import { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GovernedImprovementLifecycle, LifecycleState } from './lifecycle.ts';
import type { ImprovementProposal } from './lifecycle.ts';
import { PolicyEngine } from '../policy-kernel/engine.ts';
import { PolicyDecision } from '../policy-kernel/types.ts';
import type { Rule, PolicyContext } from '../policy-kernel/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('GovernedImprovementLifecycle', () => {
    let lifecycle: GovernedImprovementLifecycle;
    let engine: PolicyEngine;
    const testFilePath = path.join(__dirname, 'test-target.ts');
    let originalToken: string | undefined;

    beforeEach(() => {
        originalToken = process.env.FOUNDER_APPROVAL_TOKEN;
        engine = new PolicyEngine();
        lifecycle = new GovernedImprovementLifecycle(engine);
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
    });

    afterEach(() => {
        process.env.FOUNDER_APPROVAL_TOKEN = originalToken;
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        const files = fs.readdirSync(__dirname);
        for (const file of files) {
            if (file.includes('.bak.')) {
                fs.unlinkSync(path.join(__dirname, file));
            }
        }
    });

    it('should process a valid proposal and deploy', async () => {


        engine.addRule({
            id: 'allow-all',
            evaluate: (ctx: PolicyContext) => PolicyDecision.ALLOW
        });

        let proposal: ImprovementProposal = {
            id: 'prop-1',
            filePath: testFilePath,
            newCode: 'console.log("Hello");',
            state: LifecycleState.PROPOSED
        };

        proposal = await lifecycle.processProposal(proposal);

        assert.strictEqual(proposal.state, LifecycleState.OBSERVED);
        assert.ok(fs.existsSync(testFilePath));
        assert.strictEqual(fs.readFileSync(testFilePath, 'utf8'), 'console.log("Hello");');
        assert.ok(proposal.backupPath?.endsWith('.bak.new'));
    });

    it('should fail policy check and reject', async () => {
        engine.addRule({
            id: 'deny-all',
            evaluate: (ctx: PolicyContext) => PolicyDecision.DENY
        });

        let proposal: ImprovementProposal = {
            id: 'prop-2',
            filePath: testFilePath,
            newCode: 'console.log("Hello");',
            state: LifecycleState.PROPOSED
        };

        proposal = await lifecycle.processProposal(proposal);

        assert.strictEqual(proposal.state, LifecycleState.REJECTED);
        assert.strictEqual(proposal.error, 'Policy check failed: Denied by rule: deny-all');
        assert.ok(!fs.existsSync(testFilePath));
    });

    it('should fail security check on eval and reject', async () => {

        engine.addRule({
            id: 'allow-all',
            evaluate: (ctx: PolicyContext) => PolicyDecision.ALLOW
        });

        let proposal: ImprovementProposal = {
            id: 'prop-3',
            filePath: testFilePath,
            newCode: 'eval("console.log(1)");',
            state: LifecycleState.PROPOSED
        };

        proposal = await lifecycle.processProposal(proposal);

        assert.strictEqual(proposal.state, LifecycleState.REJECTED);
        assert.ok(proposal.error?.includes('Security review failed'));
    });

    it('should rollback on failure during deploy if backup exists', async () => {

        fs.writeFileSync(testFilePath, 'old code');

        engine.addRule({
            id: 'allow-all',
            evaluate: (ctx: PolicyContext) => PolicyDecision.ALLOW
        });

        const originalDeploy = (lifecycle as any).deploy;
        (lifecycle as any).deploy = async (prop: any) => {
            throw new Error('Deploy failed mock');
        };

        let proposal: ImprovementProposal = {
            id: 'prop-4',
            filePath: testFilePath,
            newCode: 'new code',
            state: LifecycleState.PROPOSED
        };

        proposal = await lifecycle.processProposal(proposal);

        assert.strictEqual(proposal.state, LifecycleState.ROLLED_BACK);
        assert.strictEqual(proposal.error, 'Deploy failed mock');
        assert.strictEqual(fs.readFileSync(testFilePath, 'utf8'), 'old code');
    });
});
