import test from "node:test";
import assert from "node:assert/strict";
import { MASTER_AI_SPECIALISTS, getSpecialist, listSpecialists } from "./specialists.ts";
import { ORDER_KING_REPOS, validateRepo, resolveRepoPath } from "./workspace-repos.server.ts";
import { detectAvailableProviders, selectActiveProvider, runCognitiveConsensus, type ModelCallRequest } from "./model-router.server.ts";
import { MASTER_AI_TOOL_REGISTRY, getMasterAiToolSpec } from "./tool-registry.ts";
import { MASTER_AI_OPERATING_CONTRACT } from "./master-ai-operating-contract.ts";

test("Order King Master AI - 23 Specialists Coverage (Zero-Employee Architecture)", () => {
  const specialists = listSpecialists();
  assert.equal(specialists.length, 23, "Must define exactly 23 specialist roles");

  const requiredIds = [
    "architect",
    "engineer",
    "debugger",
    "database",
    "security",
    "qa",
    "devops",
    "payments",
    "dispatch",
    "restaurant_ops",
    "rider_ops",
    "customer_exp",
    "data_bi",
    "product",
    "researcher",
    "reviewer",
    "release_mgr",
    "strategist",
    "alliances",
    "mindreader",
    "bonus_treasury",
    "kingpay_director",
    "profit_director",
  ];

  for (const id of requiredIds) {
    const spec = getSpecialist(id);
    assert.ok(spec, `Specialist ${id} must exist`);
    assert.equal(spec.id, id);
    assert.ok(spec.name.length > 0);
    assert.ok(spec.systemInstruction.length > 50);
    assert.ok(spec.capabilities.length >= 3);
  }
});

test("Order King Master AI - Multi-Repository Allowlist Invariant", () => {
  assert.equal(ORDER_KING_REPOS.length, 5);
  assert.deepEqual(ORDER_KING_REPOS, [
    "HDmaster",
    "orderking-customers--orders-",
    "OrderKing-partners",
    "orderking-riders",
    "Apps-integration-",
  ]);

  for (const r of ORDER_KING_REPOS) {
    assert.equal(validateRepo(r), r);
    const resolved = resolveRepoPath(r);
    assert.ok(resolved.length > 0);
  }

  assert.throws(() => validateRepo("malicious-repo"), /not in the Order King ecosystem allowlist/);
  assert.throws(() => validateRepo("../../../etc"), /not in the Order King ecosystem allowlist/);
});

test("Order King Master AI - Multi-Model Routing & Local Fallback", () => {
  const providers = detectAvailableProviders();
  assert.ok(providers.length >= 4);

  const local = providers.find((p) => p.provider === "local_deterministic");
  assert.ok(local, "Local deterministic provider must always exist");
  assert.equal(local.ready, true, "Local deterministic provider must always be ready");

  const selected = selectActiveProvider("local_deterministic");
  assert.equal(selected.provider, "local_deterministic");
});

test("Order King Master AI - Tool Registry Coverage & Safety", () => {
  const toolNames = Object.keys(MASTER_AI_TOOL_REGISTRY);
  assert.ok(toolNames.length >= 45, "Registry must register comprehensive operational & engineering tools");

  // Read tools
  assert.ok(getMasterAiToolSpec("get_order"));
  assert.ok(getMasterAiToolSpec("get_restaurant"));
  assert.ok(getMasterAiToolSpec("get_rider"));
  assert.ok(getMasterAiToolSpec("get_payment"));
  assert.ok(getMasterAiToolSpec("daily_report"));
  assert.ok(getMasterAiToolSpec("revenue_report"));
  assert.ok(getMasterAiToolSpec("get_dashboard"));
  assert.ok(getMasterAiToolSpec("get_ceo_brief"));

  // Engineering tools
  assert.ok(getMasterAiToolSpec("get_repository_status"));
  assert.ok(getMasterAiToolSpec("inspect_file"));
  assert.ok(getMasterAiToolSpec("search_code"));
  assert.ok(getMasterAiToolSpec("run_typecheck"));
  assert.ok(getMasterAiToolSpec("run_tests"));
  assert.ok(getMasterAiToolSpec("create_patch"));
  assert.ok(getMasterAiToolSpec("apply_patch"));

  // Autonomous Employee Suite tools
  assert.ok(getMasterAiToolSpec("onboard_restaurant"));
  assert.ok(getMasterAiToolSpec("onboard_rider"));
  assert.ok(getMasterAiToolSpec("generate_menu"));
  assert.ok(getMasterAiToolSpec("auto_diagnose_and_prepare_fix"));
  assert.ok(getMasterAiToolSpec("generate_scheduled_report"));
  assert.ok(getMasterAiToolSpec("reconcile_wallet_ledger"));
  assert.ok(getMasterAiToolSpec("analyze_fintech_risk"));
  assert.ok(getMasterAiToolSpec("run_weekly_settlements"));
  assert.ok(getMasterAiToolSpec("optimize_affiliate_alliances"));
  assert.ok(getMasterAiToolSpec("audit_customer_grievance_compliance"));
  assert.ok(getMasterAiToolSpec("audit_merchant_and_rider_grievance_compliance"));
  assert.ok(getMasterAiToolSpec("audit_offline_2g_settlement_sync"));
  assert.ok(getMasterAiToolSpec("audit_loan_and_card_affiliate_commissions"));
  assert.ok(getMasterAiToolSpec("audit_bajaj_finance_affiliate_and_emi_leads"));
  assert.ok(getMasterAiToolSpec("orchestrate_universal_pos_printer_sync"));

  // Executive Autonomous Tools (Strategy, Alliances, Mind-Reader, Treasury, KingPay)
  assert.ok(getMasterAiToolSpec("maximize_profit_margins"));
  assert.ok(getMasterAiToolSpec("harvest_financial_bonuses"));
  assert.ok(getMasterAiToolSpec("generate_corporate_alliance"));
  assert.ok(getMasterAiToolSpec("customer_mind_reader_recommend"));
  assert.ok(getMasterAiToolSpec("optimize_kingpay_flow"));

  // World's Highest Frontier Technologies (Competitive Radar, Quantum Pre-Dispatch, Treasury Yield, Neural Fraud, Self-Healing)
  assert.ok(getMasterAiToolSpec("market_competitive_radar"));
  assert.ok(getMasterAiToolSpec("predictive_pre_dispatch"));
  assert.ok(getMasterAiToolSpec("optimize_treasury_yield"));
  assert.ok(getMasterAiToolSpec("neural_fraud_sentinel"));
  assert.ok(getMasterAiToolSpec("autonomous_hotpatch_engine"));
  assert.ok(getMasterAiToolSpec("run_hyper_cognitive_diagnostic_and_healing"));
  assert.ok(getMasterAiToolSpec("autonomous_workforce_replacement_orchestrator"));
  assert.ok(getMasterAiToolSpec("autonomous_mind_reader_telemetry"));
  assert.ok(getMasterAiToolSpec("autonomous_revenue_and_affiliate_maximizer"));
  assert.ok(getMasterAiToolSpec("autonomous_customer_addiction_and_gamification_director"));
  assert.ok(getMasterAiToolSpec("autonomous_universal_hardware_and_pos_director"));
  assert.ok(getMasterAiToolSpec("founder_private_cash_vault_telemetry"));
  assert.ok(getMasterAiToolSpec("founder_profit_maximizer_and_tax_arbitrage"));
  assert.ok(getMasterAiToolSpec("autonomous_legal_income_discovery_engine"));
  assert.ok(getMasterAiToolSpec("autonomous_maximum_force_profit_orchestrator"));
  assert.ok(getMasterAiToolSpec("autonomous_100x_profit_and_addiction_director"));
  assert.ok(getMasterAiToolSpec("autonomous_go_live_production_director"));
  assert.ok(getMasterAiToolSpec("autonomous_night_safety_and_long_distance_director"));
  assert.ok(getMasterAiToolSpec("autonomous_prestige_subsidies_and_viral_growth_director"));
  assert.ok(getMasterAiToolSpec("autonomous_omni_prestige_grant_and_hyper_growth_director"));
  assert.ok(getMasterAiToolSpec("autonomous_opportunity_radar_and_auto_booking_director"));
  assert.ok(getMasterAiToolSpec("autonomous_meta_and_google_ad_domination_orchestrator"));

  // High-risk tools must require confirmation / approval
  const cancelSpec = getMasterAiToolSpec("cancel_order")!;
  assert.equal(cancelSpec.risk, "HIGH_RISK");
  assert.equal(cancelSpec.confirmationRequired, true);

  const refundSpec = getMasterAiToolSpec("issue_refund")!;
  assert.equal(refundSpec.risk, "FINANCIAL");
  assert.equal(refundSpec.confirmationRequired, true);

  const patchSpec = getMasterAiToolSpec("apply_patch")!;
  assert.equal(patchSpec.risk, "HIGH_RISK");
  assert.equal(patchSpec.confirmationRequired, true);

  const hotpatchSpec = getMasterAiToolSpec("autonomous_hotpatch_engine")!;
  assert.equal(hotpatchSpec.risk, "HIGH_RISK");
  assert.equal(hotpatchSpec.confirmationRequired, true);
});

test("Order King Master AI - Multi-Model Cognitive Consensus Quorum Engine", async () => {
  const req: ModelCallRequest = {
    // specialist: getSpecialist("architect"),
    systemPrompt: "You are the Chief Systems Architect.",
    messages: [{ role: "user", content: "Evaluate cross-repository architectural state." }],
    tools: [],
  };

  const consensus = await runCognitiveConsensus(req);
  assert.equal(consensus.consensusReached, true);
  assert.ok(consensus.confidenceScore >= 0.85);
  assert.ok(consensus.modelsParticipated.length >= 3);
  assert.ok(consensus.agreementRatio.includes("Quorum Agreement"));
  assert.ok(consensus.synthesizedResponse.text.length > 0);
});

test("Order King Master AI - Operating Contract Identity", () => {
  assert.equal(MASTER_AI_OPERATING_CONTRACT.identity, "ORDER_KING_MASTER_AI");
  assert.equal(MASTER_AI_OPERATING_CONTRACT.primaryAuthority, "HDMASTER");
  assert.ok(MASTER_AI_OPERATING_CONTRACT.mandatoryRules.length >= 10);
});
