import test from 'node:test';
import assert from 'node:assert/strict';

import {
  liveOrchestrationEngine,
  type AIProviderAdapter,
} from './live-orchestration-engine.ts';
import {
  founderApprovalGates,
} from './founder-approval-gates.ts';
import {
  businessOsModules,
} from './business-os-modules.ts';
import {
  autonomousCommandOrchestrator,
} from './autonomous-command-orchestrator.ts';

test('Business OS - Live Multi-Model Orchestration Engine', async () => {
  // 1. Model & Adapter Discovery
  const adapters = liveOrchestrationEngine.listRegisteredAdapters();
  assert.ok(adapters.length >= 5, 'Should discover at least 5 frontier provider adapters');
  assert.ok(adapters.some((a) => a.vendor === 'Google'), 'Should have Google Gemini adapter');
  assert.ok(adapters.some((a) => a.vendor === 'Anthropic'), 'Should have Anthropic Claude adapter');
  assert.ok(adapters.some((a) => a.vendor === 'OpenAI'), 'Should have OpenAI adapter');
  assert.ok(adapters.some((a) => a.vendor === 'xAI'), 'Should have xAI Grok adapter');
  assert.ok(adapters.some((a) => a.vendor === 'Sovereign'), 'Should have Sovereign Deterministic adapter');

  // 2. Dynamic Adapter Registration
  const customAdapter: AIProviderAdapter = {
    id: 'test_sovereign_v2',
    name: 'Test Sovereign Model V2',
    vendor: 'Sovereign',
    isConfigured: true,
    activeModels: ['test-sovereign-v2'],
    costPer1kTokensUsd: { input: 0, output: 0 },
    maxContextTokens: 256000,
    async executePrompt({ model, prompt }) {
      return {
        text: `[Test Sovereign ${model}] Verified: ${prompt.slice(0, 50)}`,
        tokensUsed: { prompt: 40, completion: 20, total: 60 },
        latencyMs: 8,
        model,
      };
    },
  };
  liveOrchestrationEngine.registerProviderAdapter(customAdapter);

  const updatedAdapters = liveOrchestrationEngine.listRegisteredAdapters();
  assert.ok(updatedAdapters.some((a) => a.id === 'test_sovereign_v2'), 'Custom adapter must be registered');

  // 3. Concurrent Multi-Model Execution & Consensus
  const consensus = await liveOrchestrationEngine.executeMultiModelConsensus({
    prompt: 'Evaluate restaurant expansion into Sector 5 salt lake with minimal capex.',
    preferredProviders: ['sovereign_local', 'test_sovereign_v2'],
  });

  assert.ok(consensus.consensusId.startsWith('cons-'), 'Consensus ID must have prefix cons-');
  assert.ok(consensus.verdicts.length >= 1, 'At least one model verdict must be present');
  assert.ok(consensus.consensusAgreementScore >= 90, 'Agreement score should be high');
  assert.ok(consensus.unifiedExecutiveSummary.length > 0, 'Unified executive summary must not be empty');
  assert.equal(consensus.hallucinationFreeVerified, true, 'Hallucination free verification must be true');
  assert.ok(consensus.auditSignature.startsWith('SIG_'), 'Audit signature must have SIG_ prefix');

  // 4. Monthly Budget Tracking
  const budget = liveOrchestrationEngine.getBudgetStatus();
  assert.equal(budget.monthlyBudgetCapInr, 50000, 'Monthly budget cap must be ₹50,000');
  assert.ok(budget.accumulatedSpendInr >= 0, 'Accumulated spend must be non-negative');
  assert.ok(budget.remainingBudgetInr <= 50000, 'Remaining budget must be <= ₹50,000');
  assert.equal(budget.isBudgetExhausted, false, 'Budget must not be exhausted in normal test');
});

test('Business OS - Founder Approval Gates & Audit Chain', async () => {
  // 1. Gate Trigger Detection
  const gateFin = founderApprovalGates.requiresApproval('FINANCIAL', { amountInr: 5000 });
  assert.equal(gateFin, true, 'Financial amount > ₹200 must require approval');

  const gateSmallFin = founderApprovalGates.requiresApproval('FINANCIAL', { amountInr: 150 });
  assert.equal(gateSmallFin, false, 'Financial amount <= ₹200 should not block');

  const gateLegal = founderApprovalGates.requiresApproval('LEGAL');
  assert.equal(gateLegal, true, 'Legal actions must require founder approval');

  const gateDestructive = founderApprovalGates.requiresApproval('DESTRUCTIVE');
  assert.equal(gateDestructive, true, 'Destructive actions must require founder approval');

  const gateProd = founderApprovalGates.requiresApproval('PRODUCTION');
  assert.equal(gateProd, true, 'Production deployments must require founder approval');

  const gateExternal = founderApprovalGates.requiresApproval('EXTERNAL');
  assert.equal(gateExternal, true, 'External mass broadcasts must require founder approval');

  // 2. Gate Request Creation
  const request = founderApprovalGates.createApprovalRequest({
    domain: 'FINANCIAL',
    title: 'Authorize Vendor Payout',
    description: 'Release ₹12,500 to Packaging Vendor',
    targetEntity: 'Barak Packaging Industries',
    amountInr: 12500,
    payload: { vendorId: 'v-101', amountInr: 12500 },
    rollbackAction: { actionName: 'CANCEL_TRANSFER', payload: { vendorId: 'v-101' } },
  });

  assert.ok(request.id.startsWith('gate-'), 'Gate request ID must start with gate-');
  assert.equal(request.status, 'PENDING');
  assert.equal(request.amountInr, 12500);

  // 3. Approval Flow
  const approveResult = founderApprovalGates.approveRequest(request.id);
  assert.equal(approveResult.success, true);
  assert.equal(approveResult.request?.status, 'APPROVED');

  // 4. Rejection Flow
  const rejectReq = founderApprovalGates.createApprovalRequest({
    domain: 'DESTRUCTIVE',
    title: 'Drop Test Orders Table',
    description: 'Purge stale sandbox orders',
    targetEntity: 'PostgreSQL sandbox schema',
    payload: { table: 'test_orders' },
  });
  const rejectResult = founderApprovalGates.rejectRequest(rejectReq.id, 'Not permitted during launch');
  assert.equal(rejectResult.success, true);

  // 5. Chained Audit Integrity (HMAC-SHA256)
  const auditChain = founderApprovalGates.getAuditChain();
  assert.ok(auditChain.length >= 3, 'Audit chain must have recorded initial seed + approval + rejection');

  // Cryptographic hash chain validation
  for (let i = 1; i < auditChain.length; i++) {
    const current = auditChain[i];
    const prev = auditChain[i - 1];
    assert.equal(current.previousHash, prev.hash, `Hash chain broken at sequence ${current.sequence}`);
    assert.ok(current.hash.length === 64, 'HMAC-SHA256 hash must be 64 characters');
  }
});

test('Business OS - Domain Business Intelligence Modules', async () => {
  // 1. Finance Module
  const pnl = businessOsModules.calculateFinancialPnL();
  assert.ok(pnl.grossMerchandiseValueInr > 0, 'GMV must be positive');
  assert.ok(pnl.netRevenueInr > 0, 'Platform revenue must be positive');
  assert.ok(pnl.netFounderProfitInr > 0, 'Founder profit must be positive');
  assert.ok(pnl.aggregatorSavingsInr > 0, 'Aggregator savings must be positive');
  assert.ok(pnl.retainedCapitalVaultInr > 0, 'Founder retained vault allocation must be positive');

  // 2. Sales & Lawful Opportunity Discovery Module
  const leads = businessOsModules.discoverLawfulOpportunities();
  assert.ok(leads.length >= 3, 'Should identify real restaurant candidates');
  const firstLead = leads[0];
  assert.ok(firstLead.annualAggregatorLossInr > 0, 'Loss calculation must be positive');
  assert.ok(firstLead.businessName.length > 0, 'Business name must not be empty');

  // 3. Marketing Module
  const campaign = businessOsModules.generateGrowthCampaign(firstLead);
  assert.ok(campaign.campaignTitle.includes(firstLead.businessName), 'Campaign title must mention business');
  assert.ok(campaign.pitchScript.includes('OrderKing'), 'Pitch script must reference OrderKing');
  assert.ok(campaign.pitchScript.includes('0% commission'), 'Pitch must highlight 0% commission');

  // 4. HR & Minimal Human Staff Topology
  const hrTopology = businessOsModules.getMinimalStaffRoster();
  assert.equal(hrTopology.totalHumanStaff, 3, 'Must maintain minimal 3 human staff');
  assert.ok(hrTopology.automatedSubsystemsCount >= 20, 'Must have 20+ automated bots');
  assert.ok(hrTopology.monthlyPayrollSavingsInr > 500000, 'Must save significant payroll');

  // 5. Operations Module (Kitchen SLAs)
  const opsAudit = businessOsModules.auditKitchenSlas();
  assert.ok(opsAudit.length >= 1, 'Should audit kitchen SLAs');
  assert.ok(opsAudit.every((o) => o.avgPrepMinutes > 0), 'Prep minutes must be positive');
  assert.ok(opsAudit.every((o) => o.cancellationRatePct <= 5), 'Cancellation rate must be low');

  // 6. Procurement & Inventory Module
  const inventory = businessOsModules.inspectInventoryAlerts();
  assert.ok(inventory.length >= 2, 'Must have inventory items monitored');
  assert.ok(inventory.every((i) => i.currentStock >= 0), 'Stock must be non-negative');

  // 7. Deployment & SRE Module
  const sreHealth = businessOsModules.inspectSreHealth();
  assert.ok(sreHealth.length >= 3, 'Must monitor at least 3 core services');
  assert.ok(sreHealth.every((s) => s.status === 'HEALTHY'), 'All services must be healthy');
  assert.ok(sreHealth.every((s) => s.autoRollbackArmed === true), 'Auto rollback must be armed');
});

test('Business OS - Autonomous Command Orchestrator (5-Stage Pipeline)', async () => {
  // Execute a single command through the complete 5-stage pipeline
  const result = await autonomousCommandOrchestrator.executeFounderCommand(
    'Audit restaurant operations, check packaging stock, and prepare weekly finance summary.'
  );

  assert.ok(result.commandId.startsWith('cmd-'), 'Command ID must start with cmd-');
  assert.ok(result.executionSteps.length >= 5, 'Must execute across all 5 stages');

  // Stage checks
  const stages = result.executionSteps.map((s) => s.stage);
  assert.ok(stages.includes('PLAN'), 'Must include PLAN stage');
  assert.ok(stages.includes('PARALLEL_AGENTS'), 'Must include PARALLEL_AGENTS stage');
  assert.ok(stages.includes('MULTI_MODEL_VERIFY'), 'Must include MULTI_MODEL_VERIFY stage');
  assert.ok(stages.includes('AUTHORIZATION'), 'Must include AUTHORIZATION stage');
  assert.ok(stages.includes('EXECUTE'), 'Must include EXECUTE stage');

  // Multi-model consensus verification
  assert.ok(result.consensus.verdicts.length >= 1, 'Consensus must have verdicts');
  assert.ok(result.consensus.consensusAgreementScore >= 90, 'Consensus agreement score must be >= 90');

  // Concise executive summary
  assert.ok(result.conciseSummary.length > 50, 'Concise summary must be informative');
  assert.ok(result.totalDurationMs >= 0, 'Duration should be tracked');
});
