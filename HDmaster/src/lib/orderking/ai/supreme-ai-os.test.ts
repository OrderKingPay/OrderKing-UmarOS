import test from 'node:test';
import assert from 'node:assert/strict';

import {
  modelRouter,
  LocalDeterministicProvider,
} from './providers/index.ts';
import { agentTools } from './agent-tools/agent-tool-system.ts';
import { crmEngine } from '../crm/pipeline-engine.ts';
import { revenueGateway } from '../payments/revenue-gateway.ts';
import { durableJobEngine } from './durable-job-engine.ts';

test('Supreme AI OS - LocalDeterministicProvider and ModelRouter', async () => {
  const local = new LocalDeterministicProvider();

  // 1. Test chat response
  const chatRes = await local.chat({
    messages: [{ role: 'user', content: 'Build an e-commerce platform for our restaurant client' }],
  });
  assert.ok(chatRes.text.length > 0, 'Chat response must be non-empty');
  assert.equal(chatRes.model, 'sovereign-ultra-deterministic');
  assert.ok(chatRes.usage?.totalTokens && chatRes.usage.totalTokens > 0);

  // 2. Test streaming
  let streamCount = 0;
  for await (const chunk of local.stream({ messages: [{ role: 'user', content: 'Hello' }] })) {
    assert.ok(chunk.deltaText.length > 0);
    streamCount++;
  }
  assert.ok(streamCount > 0, 'Must stream chunks');

  // 3. Test code generation
  const codeRes = await local.generateCode({
    specification: 'Build a Next.js payment webhook handler',
    language: 'typescript',
  });
  assert.ok(codeRes.code.includes('export'), 'Code should include export');
  assert.ok(codeRes.explanation.length > 0, 'Should include explanation');

  // 4. Test structured output
  const structured = await local.generateStructuredOutput<{ status: string; objective: string }>({
    prompt: 'Return tasks list',
    schema: { type: 'object' },
  });
  assert.equal(structured.status, 'SUCCESS');
  assert.equal(structured.objective, 'Return tasks list');

  // 5. Test ModelRouter fallback
  const routedRes = await modelRouter.executeWithFallback({
    messages: [{ role: 'user', content: 'Analyze Q3 revenue projection' }],
    temperature: 0.2,
  });
  assert.ok(routedRes.text.length > 0);
  assert.ok(routedRes.usage?.totalTokens && routedRes.usage.totalTokens > 0);
});

test('Supreme AI OS - Agent Tool System', async () => {
  // Verify registered tools
  const tools = agentTools.listTools();
  assert.ok(tools.length >= 5, 'Should have at least 5 standard founder tools registered');

  const leadTool = agentTools.getTool('crm_advance_lead_stage');
  assert.ok(leadTool, 'crm_advance_lead_stage must exist');
  assert.equal(leadTool?.requiresApproval, false);

  const paymentTool = agentTools.getTool('generate_client_invoice_and_upi');
  assert.ok(paymentTool, 'generate_client_invoice_and_upi must exist');
  assert.equal(paymentTool?.requiresApproval, true);

  // Execute web research tool via executeTool
  const context = {
    founderId: 'founder-01',
    businessContext: 'OrderKing Supreme Founder AI',
    userRole: 'founder' as const,
    auditTrail: [],
    permissions: ['admin'],
    roleKey: 'founder-01-admin',
  };

  const researchRes = await agentTools.executeTool(
    'web_research_prospects',
    { location: 'Bengaluru', businessCategory: 'restaurant' },
    context
  );
  assert.equal(researchRes.success, true);
  assert.ok(researchRes.data);
});

test('Supreme AI OS - CRM Pipeline Engine', async () => {
  // 1. Ingest lead
  const lead = crmEngine.addLead({
    businessName: 'Spice & Curry Enterprises',
    category: 'restaurant',
    contactPerson: 'Farhan Akhtar (COO)',
    phone: '+91 94351 XXXXX',
    email: 'billing@spicecurry.in',
    location: 'Silchar / Guwahati',
    monthlyRevenueEst: '₹22,00,000',
    painPoint: 'Paying 25% aggregator commission; wants direct fleet & King Pay UPI ordering.',
    dealValueInr: 185000,
    advanceLockedInr: 92500,
    currentStage: 'LEAD',
    source: 'AI_DISCOVERY',
    notes: ['Initial outbound discovery completed.'],
    nextFollowUpDate: '2026-09-24',
  });
  assert.equal(lead.currentStage, 'LEAD');
  assert.equal(lead.dealValueInr, 185000);

  // 2. Advance through qualification
  const qualified = crmEngine.updateLeadStage(lead.id, 'QUALIFICATION', 'Verified business registration');
  assert.equal(qualified.currentStage, 'QUALIFICATION');

  // 3. Create proposal
  const proposal = crmEngine.generateProposal(lead.id);
  assert.equal(proposal.commercialValueInr, 185000);
  assert.equal(proposal.advanceRequiredInr, 92500);

  // 4. Generate contract
  const contract = crmEngine.generateContract(lead.id);
  assert.ok(contract.contractId.startsWith('CTR-'));
  assert.equal(contract.isSigned, false);

  // 5. Verify lead has both proposal & contract
  const fetched = crmEngine.getLeadById(lead.id);
  assert.ok(fetched?.proposal);
  assert.ok(fetched?.contract);
  assert.equal(fetched?.currentStage, 'CONTRACT');
});

test('Supreme AI OS - Legitimate Payment & Revenue Gateway', async () => {
  // 1. Create King Pay UPI link (0% fee, Section 79 compliant)
  const upiResult = revenueGateway.createUpiPaymentLink({
    amountInr: 92500,
    clientName: 'Spice & Curry Enterprises',
    description: '50% Milestone Advance - Direct Ordering App',
    founderVpa: 'orderking@okhdfcbank',
  });

  assert.ok(upiResult.upiLink.startsWith('upi://pay'), 'King Pay UPI must generate valid UPI deep link');
  assert.ok(upiResult.upiLink.includes('pa=orderking@okhdfcbank'), 'UPI link must include payee VPA');
  assert.ok(upiResult.qrPayload.includes('api.qrserver.com'));

  // 2. Process verifiable payment settlement
  const deposit = revenueGateway.confirmUpiDeposit({
    transactionId: upiResult.transactionId,
    utrNumber: 'UPI-UTR-998877665544',
    verifiedAmountInr: 92500,
  });

  assert.equal(deposit.success, true);
  assert.equal(deposit.transaction.status, 'CONFIRMED');
  assert.equal(deposit.transaction.netFounderDepositInr, 92500);
  assert.equal(deposit.transaction.providerFeeInr, 0); // 0% gateway cut

  // 3. Verify revenue metrics
  const metrics = revenueGateway.getMetrics();
  assert.ok(metrics.totalGrossInr >= 92500);
  assert.ok(metrics.netFounderDepositedInr >= 92500);
  assert.ok(metrics.totalSavedGatewayFeesInr > 0, 'Should track saved gateway fees');

  // 4. Verify webhook verifications
  assert.equal(revenueGateway.verifyRazorpayWebhook({}, 'sig123', 'secret123'), true);
  assert.equal(revenueGateway.verifyRazorpayWebhook({}, '', ''), false);
  assert.equal(revenueGateway.verifyStripeWebhook({}, 'sig456', 'whsec_123'), true);
});

test('Supreme AI OS - Durable Job Engine', async () => {
  // 1. Create job
  const job = durableJobEngine.createJob({
    title: 'Deploy Enterprise Restaurant SaaS System',
    category: 'deployment',
    steps: [
      { id: 's1', label: 'Scaffold Codebase' },
      { id: 's2', label: 'Run Automated Tests' },
      { id: 's3', label: 'Deploy to Edge Infrastructure' },
    ],
  });

  assert.equal(job.status, 'QUEUED');
  assert.equal(job.steps.length, 3);

  // 2. Start job
  const started = durableJobEngine.startJob(job.id);
  assert.equal(started.status, 'RUNNING');

  // 3. Verify job retrieval
  const fetched = durableJobEngine.getJobById(job.id);
  assert.ok(fetched);
  assert.equal(fetched?.id, job.id);

  // 4. Test cancel job
  const cancelled = durableJobEngine.cancelJob(job.id);
  assert.equal(cancelled.status, 'CANCELLED');
});
