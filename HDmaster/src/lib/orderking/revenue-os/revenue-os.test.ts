import test from 'node:test';
import assert from 'node:assert/strict';

import {
  realityEngine,
  assertReality,
  revenueTruthDB,
  opportunityEngine,
  applicationEngine,
  clientAcquisitionMachine,
  serviceProductizer,
  deliveryFactory,
  selfQaEngine,
  revenueGrowthEngine,
  businessIntelligenceEngine,
  autonomousScheduleManager,
  founderApprovalGovernor,
  universalConnectors,
  layeredMemory,
  knowledgeEngine,
  voiceFounderMode,
  emergencyRecovery,
  costControlOptimizer,
  capabilityBenchmarkSuite,
  continuousCapabilityDiscovery,
  supremeTaskExecutor,
  supremeRevenueOS,
} from './index.ts';

test('Revenue OS Directive 25: Reality Engine & Zero-Fabrication', () => {
  // 1. Unverified claim without evidence must be rejected
  const unverified = assertReality({
    subject: 'Unconfirmed Revenue',
    data: { amount: 1000000 },
    evidence: [],
  });
  assert.equal(unverified.status, 'UNVERIFIED');
  assert.equal(unverified.claimable, false);

  // 2. Verified claim with evidence must be accepted
  const verified = assertReality({
    subject: 'Confirmed Bank Deposit',
    data: { amount: 74999, utr: 'UPI-UTR-908234710293' },
    evidence: ['HDFC Bank Settlement Confirmation UTR 908234710293'],
    status: 'Verified',
  });
  assert.equal(verified.status, 'VERIFIED');
  assert.equal(verified.claimable, true);
  assert.equal(verified.truthStatus, 'Verified');
});

test('Revenue OS Directives 10 & 11: Revenue Truth Database & Hash Chained Ledger', () => {
  // 1. Verify ledger integrity
  const integrity = revenueTruthDB.verifyLedgerIntegrity();
  assert.equal(integrity.isValid, true);
  assert.ok(integrity.checkedCount >= 3);

  // 2. Verified revenue must match actual bank confirmed transactions
  const verifiedInr = revenueTruthDB.getVerifiedRevenue('INR');
  assert.ok(verifiedInr >= 74999);

  // 3. Attempting to confirm payment without UTR or evidence must throw
  assert.throws(() => {
    revenueTruthDB.recordFinancialEvent({
      type: 'payment_confirmed',
      amount: 50000,
      currency: 'INR',
      provider: 'KING_PAY_UPI',
      providerEventId: '',
      verified: true,
      evidence: [],
    });
  }, /REVENUE_TRUTH_VIOLATION/);

  // 4. Valid confirmed payment with UTR and evidence succeeds and updates hash chain
  const event = revenueTruthDB.recordFinancialEvent({
    type: 'payment_confirmed',
    amount: 15000,
    currency: 'INR',
    provider: 'KING_PAY_UPI',
    providerEventId: 'UPI-UTR-TEST-12345678',
    verified: true,
    evidence: ['HDFC Bank Statement verified line item'],
  });
  assert.ok(event.eventHash.length === 64);
  assert.equal(revenueTruthDB.verifyLedgerIntegrity().isValid, true);
});

test('Revenue OS Directives 3, 4 & 29: Opportunity Hunter, Prioritization & Minimum Friction Path', () => {
  const opps = opportunityEngine.getOpportunities();
  assert.ok(opps.length >= 4, 'Must have seeded opportunities');

  const first = opps[0];
  const evalResult = opportunityEngine.evaluateOpportunity(first);
  assert.ok(evalResult.priorityScore > 0);
  assert.ok(evalResult.potentialMarginPercent > 0);
  assert.ok(evalResult.knownCosts.totalKnownCost > 0);

  // Directive 29: Minimum Friction
  const friction = opportunityEngine.analyzeFriction(first);
  assert.ok(friction.estimatedFrictionScore >= 1 && friction.estimatedFrictionScore <= 10);
  assert.ok(friction.timeToInvoiceDays >= 1);

  const ranked = opportunityEngine.getRankedOpportunitiesByLowestFriction();
  assert.ok(ranked.length >= 4);
  assert.ok(ranked[0].friction.estimatedFrictionScore <= ranked[ranked.length - 1].friction.estimatedFrictionScore);
});

test('Revenue OS Directive 5: Automatic Application Engine (Zero Fabrication)', () => {
  const opps = opportunityEngine.getOpportunities();
  const opp = opps[0];

  const app = applicationEngine.generateApplication(opp.id);
  assert.equal(app.opportunityId, opp.id);
  assert.equal(app.submissionStatus, 'AWAITING_APPROVAL');
  assert.ok(app.honestPortfolioProof.length > 0);
  assert.ok(app.customPitch.includes(opp.skillsMatched[0]));

  // Submit
  const submitted = applicationEngine.submitApplication(app.id);
  assert.equal(submitted.submissionStatus, 'SUBMITTED');
  assert.ok(submitted.submittedAt);
});

test('Revenue OS Directive 6: Client Acquisition Machine & Anti-Spam Protections', () => {
  const prospects = clientAcquisitionMachine.getProspects();
  assert.ok(prospects.length >= 2);

  const p = prospects[0];
  assert.equal(p.stage, 'OUTREACH_DRAFTED');

  // Send outreach
  const sendRes = clientAcquisitionMachine.sendOutreach(p.id);
  assert.equal(sendRes.success, true);
  assert.equal(p.stage, 'OUTREACH_SENT');
  assert.ok(p.sentAt);

  // Opt out handling
  clientAcquisitionMachine.handleOptOut(p.id);
  assert.equal(p.isOptedOut, true);
  assert.equal(p.stage, 'OPTED_OUT');

  // Blocked send to opted-out prospect
  const blockedSend = clientAcquisitionMachine.sendOutreach(p.id);
  assert.equal(blockedSend.success, false);
});

test('Revenue OS Directive 7: Service Productizer', () => {
  const services = serviceProductizer.getAllServices();
  assert.ok(services.length >= 5);

  const directApp = services[0];
  assert.equal(directApp.service, 'Turnkey Direct Ordering App & Fleet Dispatch Suite');
  assert.ok(directApp.marginPercent >= 80);
  assert.ok(directApp.optionalRetainer.monthlyFee > 0);
  assert.ok(directApp.deliverables.length >= 3);
});

test('Revenue OS Directive 8: Automatic Delivery Factory & 15-Stage Task Graph', () => {
  const projects = deliveryFactory.getProjects();
  assert.ok(projects.length >= 1);

  const proj = projects[0];
  assert.ok(proj.taskGraph.length >= 10);

  // Test completing a task node and unblocking dependencies
  const taskToComplete = proj.taskGraph.find((t) => t.status === 'IN_PROGRESS');
  if (taskToComplete) {
    deliveryFactory.completeTask(proj.id, taskToComplete.id, 'TestArtifact.json');
    assert.equal(taskToComplete.status, 'COMPLETED');
  }
});

test('Revenue OS Directive 9: Self-QA 14-Check Verification & Self-Healing Loop', () => {
  // Standard run (all passed)
  const run1 = selfQaEngine.runVerificationSuite('PROJ-701');
  assert.equal(run1.totalChecks, 14);
  assert.equal(run1.passedCount, 14);
  assert.equal(run1.canDeliverToClient, true);

  // Run with simulated failure and self-healing
  const run2 = selfQaEngine.runVerificationSuite('PROJ-701', 'PAYMENT_FLOW_CHECKS');
  assert.equal(run2.totalChecks, 14);
  assert.equal(run2.overallStatus, 'HEALED_AND_PASSED');
  const healedCheck = run2.results.find((r) => r.checkType === 'PAYMENT_FLOW_CHECKS');
  assert.ok(healedCheck?.fixApplied);
  assert.equal(healedCheck?.attemptCount, 2);
});

test('Revenue OS Directives 13 & 14: Revenue Growth & Repeat Business Signals', () => {
  const signals = revenueGrowthEngine.getSignals();
  assert.ok(signals.length >= 1);

  const s = signals[0];
  assert.ok(s.csatScore >= 9.0);
  assert.ok(s.identifiedExpansionOpportunities.length >= 2);

  const prop = revenueGrowthEngine.generateRepeatProposal(s.clientId, 0);
  assert.ok(prop.valueInr > 0);
  assert.ok(prop.proposalText.length > 0);
});

test('Revenue OS Directive 15: Business Intelligence Engine', () => {
  const report = businessIntelligenceEngine.generateReport();
  assert.ok(report.highestRevenueWork.amountInr > 0);
  assert.ok(report.highestMarginWork.marginPercent >= 80);
  assert.ok(report.repeatClientsRatio.totalClients >= 1);
  assert.ok(report.effectiveAcquisitionChannels.length >= 2);
});

test('Revenue OS Directive 16: Autonomous Schedule Manager', () => {
  const tasks = autonomousScheduleManager.getTasks();
  assert.equal(tasks.length, 5);

  const hourly = tasks.find((t) => t.frequency === 'HOURLY');
  assert.ok(hourly);

  const exec = autonomousScheduleManager.executeTask(hourly!.id);
  assert.equal(exec.task.status, 'COMPLETED');
  assert.ok(exec.task.lastExecutedAt);
});

test('Revenue OS Directive 17: Founder Approval Governor (Risk-Based Minimization)', () => {
  // Low risk auto-executes
  const lowRisk = founderApprovalGovernor.evaluateAction({
    action: 'view_public_market_data',
    what: 'View public directory listings',
    why: 'Routine scan',
    who: 'System',
    riskCategory: 'LOW_RISK',
    expectedResult: 'Display listings',
    previewPayload: {},
  });
  assert.equal(lowRisk.requiresApproval, false);
  assert.equal(lowRisk.autoExecuted, true);

  // High risk requires approval
  const highRisk = founderApprovalGovernor.evaluateAction({
    action: 'execute_bank_payout',
    what: 'Transfer funds to contractor',
    why: 'Milestone complete',
    who: 'Contractor A',
    riskCategory: 'HIGH_RISK',
    costInr: 25000,
    expectedResult: 'Funds transferred',
    previewPayload: { amount: 25000 },
  });
  assert.equal(highRisk.requiresApproval, true);
  assert.ok(highRisk.approvalCard);

  // Founder approval
  const approved = founderApprovalGovernor.approve(highRisk.approvalCard!.id);
  assert.equal(approved.status, 'APPROVED');
  assert.ok(approved.resolvedAt);
});

test('Revenue OS Directives 18 & 19: Universal Connectors & 3-Tier Fallback', async () => {
  const connList = universalConnectors.listConnectors();
  assert.ok(connList.length >= 3);

  // Successful primary execution
  const res = await universalConnectors.executeWithFallback({
    primaryConnectorId: 'conn-king-pay-upi',
    action: 'create_payment_link',
    input: { amountInr: 5000, description: 'Milestone Advance' },
  });
  assert.equal(res.success, true);
  assert.equal(res.executedBy, 'King Pay UPI Gateway Connector');

  // Fallback to secondary when primary invalid
  const fallbackRes = await universalConnectors.executeWithFallback({
    primaryConnectorId: 'non-existent-primary',
    secondaryConnectorId: 'conn-postgres-ledger',
    action: 'query',
    input: {},
  });
  assert.equal(fallbackRes.success, true);
  assert.equal(fallbackRes.executedBy, 'PostgreSQL Sovereign Ledger Connector');

  // Safe failure + human notice when all fail
  const allFailRes = await universalConnectors.executeWithFallback({
    primaryConnectorId: 'invalid-1',
    secondaryConnectorId: 'invalid-2',
    action: 'test',
    input: {},
  });
  assert.equal(allFailRes.success, false);
  assert.equal(allFailRes.humanNoticeRequired, true);
});

test('Revenue OS Directive 20: Layered Agent Memory System', () => {
  layeredMemory.save({
    layer: 'PROJECT_MEMORY',
    key: 'proj_701_status',
    value: { stage: 'TESTS', progress: 80 },
    tags: ['proj-701'],
  });

  const record = layeredMemory.get('PROJECT_MEMORY', 'proj_701_status');
  assert.ok(record);
  assert.equal((record?.value as any).stage, 'TESTS');

  // Modify
  layeredMemory.update(record!.id, { stage: 'DEPLOYMENT', progress: 90 });
  const updated = layeredMemory.get('PROJECT_MEMORY', 'proj_701_status');
  assert.equal((updated?.value as any).stage, 'DEPLOYMENT');

  // Delete
  assert.equal(layeredMemory.delete(record!.id), true);
  assert.equal(layeredMemory.get('PROJECT_MEMORY', 'proj_701_status'), undefined);
});

test('Revenue OS Directive 21: Knowledge Engine Document Retrieval', () => {
  const docs = knowledgeEngine.listDocuments();
  assert.ok(docs.length >= 2);

  const searchRes = knowledgeEngine.search('Section 79 UPI Escrow');
  assert.ok(searchRes.length > 0);
  assert.equal(searchRes[0].title, 'OrderKing Section 79 UPI Escrow Architecture');
  assert.ok(searchRes[0].relevanceScore > 0);
});

test('Revenue OS Directive 22: Voice-First Founder Mode Live Telemetry', () => {
  // Revenue Query
  const revRes = voiceFounderMode.executeVoiceCommand("Show me today's revenue");
  assert.equal(revRes.matchedIntent, 'QUERY_REVENUE');
  assert.ok(revRes.spokenSummary.includes('Verified'));
  assert.ok((revRes.liveSystemData as any).verifiedRevenueInr > 0);

  // Opportunity Query
  const oppRes = voiceFounderMode.executeVoiceCommand('Find me new development opportunities');
  assert.equal(oppRes.matchedIntent, 'DISCOVER_OPPORTUNITIES');
  assert.ok((oppRes.liveSystemData as any).totalOpportunities > 0);
});

test('Revenue OS Directive 23: Emergency Recovery & Rollback', () => {
  const history = emergencyRecovery.getDeploymentHistory('PROJ-701');
  assert.ok(history.length >= 1);

  // Deploy new version
  const newDep = emergencyRecovery.recordDeployment({
    projectId: 'PROJ-701',
    version: 'v1.1.0',
    commitHash: '8b7c6d5e',
  });

  // Trigger emergency recovery on incident
  const recovery = emergencyRecovery.triggerEmergencyRecovery(newDep.id, 'Memory leak detected in edge worker');
  assert.equal(recovery.recoveryStatus, 'RECOVERED_VIA_ROLLBACK');
  assert.ok(recovery.stepsExecuted.length >= 9);
  assert.equal(recovery.currentActiveDeployment.version, 'v1.0.0');
});

test('Revenue OS Directive 24: Cost Control Optimizer', () => {
  const total = costControlOptimizer.getTotalMonthlyExpensesInr();
  const savings = costControlOptimizer.getTotalPotentialSavingsInr();
  assert.ok(total > 0);
  assert.ok(savings > 0);
  assert.ok(savings <= total);
});

test('Revenue OS Directive 26: Capability Benchmarking Suite', () => {
  const run = capabilityBenchmarkSuite.runFullBenchmark();
  assert.equal(run.totalDimensions, 12);
  assert.ok(run.overallScore >= 90);
  assert.ok(run.dimensionScores.every((s) => s.measuredScore > 80));
});

test('Revenue OS Directive 27: Continuous Capability Discovery', () => {
  const upgrades = continuousCapabilityDiscovery.getDiscoveredUpgrades();
  assert.ok(upgrades.length >= 3);
  const aiUpgrade = upgrades.find((u) => u.category === 'AI_MODEL');
  assert.ok(aiUpgrade);
  assert.equal(aiUpgrade?.compatibilityStatus, 'COMPATIBLE');
});

test('Revenue OS Directive 28: Supreme Task Executor (14 Pillars & Human Pause Points)', () => {
  const execution = supremeTaskExecutor.decomposeGoal('Build me a legitimate online business around this opportunity');
  assert.equal(execution.pillars.length, 14);

  // Pillar 8 (Payment System) must pause for founder banking credentials
  const paymentPillar = execution.pillars.find((p) => p.pillar === 'PAYMENT_SYSTEM');
  assert.equal(paymentPillar?.status, 'PAUSED_FOR_HUMAN_ACTION');
  assert.ok(paymentPillar?.humanActionRequired);

  // Resume with credential
  const resumed = supremeTaskExecutor.resumePillarWithCredential(
    execution.blueprintId,
    'PAYMENT_SYSTEM',
    'orderking@okhdfcbank'
  );
  const updatedPillar = resumed.pillars.find((p) => p.pillar === 'PAYMENT_SYSTEM');
  assert.equal(updatedPillar?.status, 'COMPLETED');
});

test('Revenue OS Directives 1, 2, 12 & 30: Supreme Revenue Operating System Master Loop', () => {
  const metrics = supremeRevenueOS.getMoneyDashboardMetrics('THIS_MONTH');

  // Directive 12: Strict Segmentation
  assert.ok(metrics.actualVerifiedRevenueInr > 0, 'Actual revenue must be > 0');
  assert.ok(metrics.pendingPaymentsInr > 0, 'Pending payments must be > 0');
  assert.ok(metrics.estimatedPipelineValueInr > 0, 'Estimated pipeline must be > 0');
  assert.ok(metrics.forecastedRevenueInr > 0, 'Forecasted revenue must be > 0');

  // Actual != Estimated
  assert.notEqual(metrics.actualVerifiedRevenueInr, metrics.estimatedPipelineValueInr);
  assert.equal(metrics.zeroFabricationConfirmed, true);
  assert.equal(metrics.immutableLedgerIntegrity, true);

  // Directive 2: Operating Loop Transitions
  const transitions = supremeRevenueOS.getTransitions();
  assert.ok(transitions.length >= 8);
  assert.ok(transitions.every((t) => t.realityStatus === 'VERIFIED'));
});
