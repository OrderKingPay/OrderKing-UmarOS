// @ts-nocheck
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
  const adapters = liveOrchestrationEngine.listRegisteredAdapters();
  assert.equal(adapters.length, 1, "Umar OS automatic orchestration must expose only its mandatory OpenAI adapter");
  assert.equal(adapters[0]?.vendor, "OpenAI");
  assert.equal(adapters[0]?.id, "openai");

  const budget = liveOrchestrationEngine.getBudgetStatus();
  assert.equal(budget.monthlyBudgetCapInr, 50000);
  assert.equal(budget.costStatus, "UNVERIFIED_UNTIL_PROVIDER_PRICING_IS_CONFIGURED");

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(
      () =>
        liveOrchestrationEngine.executeMultiModelConsensus({
          prompt: "Evaluate a restaurant expansion without inventing facts.",
        }),
      /OPENAI_API_KEY is not configured/,
      "Live orchestration must fail closed when OpenAI is unavailable",
    );
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
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

test('Business OS - Domain Business Intelligence Modules are evidence-gated', async () => {
  const pnl = businessOsModules.calculateFinancialPnL();
  assert.equal(pnl.dataStatus, "LIVE_DATA_REQUIRED");
  assert.equal(pnl.netFounderProfitInr, 0);
  assert.equal(pnl.cashRunwayMonths, null);

  const leads = businessOsModules.discoverLawfulOpportunities();
  assert.deepEqual(leads, []);

  const campaign = businessOsModules.generateGrowthCampaign();
  assert.equal(campaign.dataStatus, "LIVE_DATA_REQUIRED");
  assert.equal(campaign.roiEstimateRatio, null);

  const hrTopology = businessOsModules.getMinimalStaffRoster();
  assert.equal(hrTopology.dataStatus, "LIVE_DATA_REQUIRED");
  assert.equal(hrTopology.totalHumanStaff, 0);

  assert.deepEqual(businessOsModules.auditKitchenSlas(), []);
  assert.deepEqual(businessOsModules.inspectInventoryAlerts(), []);
  assert.deepEqual(businessOsModules.inspectSreHealth(), []);

  const forecast = businessOsModules.forecastDemand();
  assert.equal(forecast.dataStatus, "LIVE_DATA_REQUIRED");
  assert.deepEqual(forecast.peakHours, []);

  const fleet = businessOsModules.analyzeFleetDispatch();
  assert.equal(fleet.dataStatus, "LIVE_DATA_REQUIRED");
  assert.equal(fleet.activeRiders, 0);
});


test('Business OS - Autonomous Command Orchestrator fails closed without OpenAI', async () => {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    await assert.rejects(
      () =>
        autonomousCommandOrchestrator.executeFounderCommand(
          'Audit restaurant operations, check packaging stock, and prepare weekly finance summary.'
        ),
      /OPENAI_API_KEY is not configured/,
      "Founder command execution must not simulate AI verification",
    );
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
});
