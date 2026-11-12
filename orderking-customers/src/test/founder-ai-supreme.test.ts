
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BENCHMARK_TEST_SUITE,
  runFullBenchmarkSuite,
} from "../lib/ai/capability-benchmark.ts";
import {
  inspectSystemDependencies,
  DISCOVERED_ECOSYSTEM_CAPABILITIES,
} from "../lib/ai/dependency-inspector.ts";
import {
  generateBusinessIntelligenceReport,
  HISTORICAL_SERVICE_METRICS,
} from "../lib/ai/business-intelligence.ts";
import {
  INITIAL_SCHEDULED_JOBS,
  executeScheduledJob,
} from "../lib/ai/autonomous-scheduler.ts";
import {
  INITIAL_KNOWLEDGE_DOCUMENTS,
  tokenize,
  searchKnowledgeBase,
} from "../lib/ai/knowledge-engine.ts";
import {
  executeEmergencyRecoverySequence,
  INITIAL_DEPLOYMENT_HISTORY,
} from "../lib/ai/emergency-recovery.ts";
import {
  decomposeFounderGoal,
} from "../lib/ai/supreme-task-executor.ts";
import {
  buildCustomizedApplication,
  VERIFIED_FOUNDER_PORTFOLIO,
} from "../lib/ai/application-engine.ts";
import {
  verifyAndProcessWebhook,
} from "../lib/ai/payment-infrastructure.ts";
import {
  generateRepeatProposal,
} from "../lib/ai/repeat-business-engine.ts";
import {
  generateCostControlReport,
  INITIAL_EXPENSE_ITEMS,
} from "../lib/ai/cost-control-engine.ts";
import { calculateFrictionMetrics } from "../lib/ai/opportunity-hunter.ts";
import {
  VOICE_PERSONAS,
  SUPPORTED_LANGUAGES,
  detectSpokenOrTextLanguage,
} from "../lib/ai/supreme-voice-engine.ts";
import {
  parseFounderQuery,
} from "../lib/ai/supreme-founder-ai-core.ts";

describe("HDmaster Founder AI — Premium Capabilities Suite", () => {
  describe("1. Capability Benchmarking Suite (§26)", () => {
    it("should define test cases across all 11 core disciplines", () => {
      assert.strictEqual(BENCHMARK_TEST_SUITE.length, 11);
      const categories = BENCHMARK_TEST_SUITE.map((t) => t.category);
      assert.ok(categories.includes("reasoning"));
      assert.ok(categories.includes("coding"));
      assert.ok(categories.includes("web_research"));
      assert.ok(categories.includes("tool_selection"));
      assert.ok(categories.includes("agent_planning"));
      assert.ok(categories.includes("task_completion"));
      assert.ok(categories.includes("voice_latency"));
      assert.ok(categories.includes("translation"));
      assert.ok(categories.includes("software_generation"));
      assert.ok(categories.includes("self_qa_recovery"));
      assert.ok(categories.includes("revenue_workflow"));
    });

    it("should execute full benchmark suite and produce measured scores and evidence", async () => {
      const report = await runFullBenchmarkSuite();
      assert.strictEqual(report.totalTests, 11);
      assert.strictEqual(report.passedTests, 11);
      assert.ok(report.averageScore >= 80);
      assert.ok(report.averageLatencyMs > 0);
      assert.ok(report.results.every((r) => r.evidence.length > 0));
    });
  });

  describe("2. Continuous Dependency Inspector & Discovery (§27, §30)", () => {
    it("should inspect core system dependencies without throwing", () => {
      const inspection = inspectSystemDependencies();
      assert.strictEqual(inspection.total, 8);
      assert.ok(inspection.fallbackActive >= 0);
      assert.ok(inspection.dependencies.every((d) => d.envVar && d.fallbackModeDescription));
    });

    it("should discover newly available ecosystem capabilities", () => {
      assert.ok(DISCOVERED_ECOSYSTEM_CAPABILITIES.length >= 4);
      assert.ok(DISCOVERED_ECOSYSTEM_CAPABILITIES.some((c) => c.provider === "Anthropic"));
      assert.ok(DISCOVERED_ECOSYSTEM_CAPABILITIES.some((c) => c.provider === "OpenAI"));
    });
  });

  describe("3. Business Intelligence Engine & Autonomous Scheduler (§15, §16)", () => {
    it("should compute historical performance rankings and strategic insights", () => {
      const report = generateBusinessIntelligenceReport();
      assert.strictEqual(report.topRevenueServices.length, HISTORICAL_SERVICE_METRICS.length);
      assert.ok(report.highestMarginServices[0].averageMarginPct >= 80);
      assert.ok(report.clientRetentionRatePct > 70);
      assert.ok(report.insights.length > 0);
    });

    it("should execute autonomous scheduled jobs and update execution telemetry", async () => {
      const job = INITIAL_SCHEDULED_JOBS[0];
      const event = await executeScheduledJob(job.id);
      assert.strictEqual(event.jobId, job.id);
      assert.strictEqual(event.status, "SUCCESS");
      assert.ok(event.executionDurationMs >= 0);
    });
  });

  describe("4. Searchable Knowledge Engine & Layered Memory (§20, §21)", () => {
    it("should tokenize text and extract keywords", () => {
      const tokens = tokenize("OrderKing provides 0% commission food delivery!");
      assert.ok(tokens.includes("orderking"));
      assert.ok(tokens.includes("provides"));
      assert.ok(tokens.includes("commission"));
      assert.ok(tokens.includes("food"));
      assert.ok(tokens.includes("delivery"));
    });

    it("should search knowledge documents and return ranked snippet results", () => {
      const results = searchKnowledgeBase("commission upi", INITIAL_KNOWLEDGE_DOCUMENTS);
      assert.ok(results.length > 0);
      assert.ok(results[0].matchScore > 0);
      assert.ok(results[0].snippet.length > 0);
    });
  });

  describe("5. Emergency Recovery & Rollback Engine (§23)", () => {
    it("should execute full 8-stage recovery sequence and resolve incident", () => {
      const { incident, stageHistory } = executeEmergencyRecoverySequence(
        "Simulated 500 error in checkout gateway",
        "v2.3.9"
      );
      assert.strictEqual(incident.status, "RESOLVED");
      assert.strictEqual(stageHistory.length, 9);
      assert.strictEqual(stageHistory[0].stage, "DETECT");
      assert.strictEqual(stageHistory[8].stage, "VERIFY");
    });

    it("should preserve immutable deployment snapshots", () => {
      assert.ok(INITIAL_DEPLOYMENT_HISTORY.length >= 3);
      assert.strictEqual(INITIAL_DEPLOYMENT_HISTORY[0].status, "HEALTHY");
    });
  });

  describe("6. The Premium Task Executor (§28)", () => {
    it("should decompose founder goal into 14 sequential stages", () => {
      const plan = decomposeFounderGoal("Build me an online business");
      assert.strictEqual(plan.totalStages, 14);
      assert.strictEqual(plan.stages.length, 14);
      assert.strictEqual(plan.stages[0].stage, "RESEARCH");
      assert.strictEqual(plan.stages[13].stage, "REVENUE_TRACKING");
    });

    it("should identify human gates and pause execution safely without pretending completion", () => {
      const plan = decomposeFounderGoal("Build me an online business");
      assert.strictEqual(plan.isPaused, true);
      const paymentStage = plan.stages.find((s) => s.stage === "PAYMENT_SYSTEM");
      assert.strictEqual(paymentStage?.status, "PAUSED_FOR_HUMAN");
      assert.ok(paymentStage?.humanGate !== undefined);
      assert.strictEqual(paymentStage?.humanGate?.satisfied, false);
    });
  });

  describe("7. Automatic Application Engine (§5)", () => {
    it("should build customized application with genuine portfolio attachments and 0 fabricated credentials", () => {
      const opp = {
        id: "OPP-TEST-001",
        source: "Direct Inquiry",
        title: "Zero-Commission Direct Food Ordering App & WhatsApp Dispatch",
        client: "Test Merchant Group",
        requirements: ["React 19 / PWA", "1-Tap UPI QR", "WhatsApp Merchant Notification", "Fleet Dispatch"],
        skillsMatched: ["React 19 / PWA", "1-Tap UPI QR", "WhatsApp Merchant Notification", "Fleet Dispatch"],
        missingSkills: [],
        estimatedEffortHours: 16,
        statedBudget: 149999,
        currency: "INR",
        deadline: "2026-10-05",
        evidence: ["Test merchant requirement specification"],
        status: "QUALIFIED" as const,
        nextAction: "Emit Advance Invoice",
        frictionMetrics: calculateFrictionMetrics(149999, 16, 4, 4, true),
      };
      const draft = buildCustomizedApplication(opp);
      assert.strictEqual(draft.opportunityId, opp.id);
      assert.ok(draft.customCoverLetter.includes("HDmaster Founder Engineering Core"));
      assert.ok(draft.proposedPriceInr > 0);
      assert.ok(draft.marginPct > 50);
      assert.ok(draft.verifiedPortfolioAttachments.length > 0);
      assert.ok(draft.verifiedPortfolioAttachments.every((p) => VERIFIED_FOUNDER_PORTFOLIO.some((vp) => vp.id === p.id)));
    });
  });

  describe("8. Automatic Revenue Collection & Payment Infrastructure (§10)", () => {
    it("should process verified webhook and reconcile invoice with provider transaction ID", () => {
      const testInvoices = [
        {
          id: "INV-TEST-001",
          clientName: "Test Client",
          clientEmail: "billing@example.com",
          projectName: "POS License",
          items: [{ id: "ITEM-1", description: "License", quantity: 1, unitPriceInr: 74500, totalInr: 74500 }],
          subtotalInr: 74500,
          taxInr: 0,
          totalInr: 74500,
          paymentMethod: "UPI_DIRECT" as const,
          status: "ESCROW_LOCKED" as const,
          paymentLink: "upi://pay?pa=9395065587@ybl&am=74500&cu=INR",
          qrPayload: "upi://pay?pa=9395065587@ybl&am=74500&cu=INR",
          issuedAt: new Date().toISOString(),
          reconciled: false,
        },
      ];
      const invoice = testInvoices[0]; // ESCROW_LOCKED invoice
      const payload = {
        eventId: "EVT-TEST-WEBHOOK-99",
        provider: "UPI_BANK" as const,
        eventType: "bank.settlement.received" as const,
        amount: invoice.totalInr,
        currency: "INR",
        invoiceId: invoice.id,
        signature: "sha256_valid_signature_token",
        timestamp: new Date().toISOString(),
      };

      const result = verifyAndProcessWebhook(payload, testInvoices);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.invoice?.status, "RECEIVED");
      assert.strictEqual(result.invoice?.providerEventId, "EVT-TEST-WEBHOOK-99");
      assert.strictEqual(result.invoice?.reconciled, true);
    });

    it("should reject webhook with invalid signature or mismatched amount", () => {
      const testInvoices = [
        {
          id: "INV-TEST-002",
          clientName: "Test Client",
          clientEmail: "billing@example.com",
          projectName: "POS License",
          items: [{ id: "ITEM-1", description: "License", quantity: 1, unitPriceInr: 110000, totalInr: 110000 }],
          subtotalInr: 110000,
          taxInr: 0,
          totalInr: 110000,
          paymentMethod: "UPI_DIRECT" as const,
          status: "RECEIVED" as const,
          paymentLink: "upi://pay?pa=9395065587@ybl&am=110000&cu=INR",
          qrPayload: "upi://pay?pa=9395065587@ybl&am=110000&cu=INR",
          issuedAt: new Date().toISOString(),
          reconciled: true,
        },
      ];
      const invoice = testInvoices[0];
      const badPayload = {
        eventId: "EVT-BAD",
        provider: "UPI_BANK" as const,
        eventType: "bank.settlement.received" as const,
        amount: 999999, // mismatched amount
        currency: "INR",
        invoiceId: invoice.id,
        signature: "sha256_valid_signature",
        timestamp: new Date().toISOString(),
      };

      const result = verifyAndProcessWebhook(badPayload, testInvoices);
      assert.strictEqual(result.success, false);
      assert.ok(result.error?.includes("AMOUNT_MISMATCH"));
    });
  });

  describe("9. Revenue Growth & Repeat-Business Engine (§13, §14)", () => {
    it("should generate structured proposals for completed high-CSAT client projects", () => {
      const testOpps = [
        {
          id: "REP-TEST-001",
          clientId: "CLI-TEST-1",
          clientName: "Test Merchant Partner",
          previousProject: "POS & QR Billing Engine",
          completedAt: new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
          csatRating: 5,
          type: "MAINTENANCE_RETAINER" as const,
          title: "Monthly Uptime SLA & Menu Sync Retainer",
          rationale: "30 days live operation.",
          proposedMonthlyInr: 15000,
          expectedAnnualLtvInr: 180000,
          approvalStatus: "PENDING_FOUNDER_APPROVAL" as const,
          proposalDraft:
            "Following your launch, we propose a Maintenance Retainer (₹15,000/mo) covering uptime SLA and menu syncing.",
        },
        {
          id: "REP-TEST-002",
          clientId: "CLI-TEST-2",
          clientName: "Test Logistics Partner",
          previousProject: "Geodesic Clustering Algorithm",
          completedAt: new Date(Date.now() - 14 * 86400 * 1000).toISOString(),
          csatRating: 4.8,
          type: "ANALYTICS_DASHBOARD" as const,
          title: "Fleet Route Telemetry Dashboard",
          rationale: "Requested telemetry visibility.",
          proposedMonthlyInr: 25000,
          expectedAnnualLtvInr: 300000,
          approvalStatus: "PENDING_FOUNDER_APPROVAL" as const,
          proposalDraft:
            "We prepared a Fleet Telemetry Dashboard for ₹25,000/month.",
        },
      ];
      const opp = testOpps[0];
      const proposal = generateRepeatProposal(opp);
      assert.ok(proposal.length > 20);
      assert.ok(opp.csatRating >= 4.5);
      assert.ok(opp.proposedMonthlyInr > 0);
    });
  });

  describe("10. Cost Control & Expense Optimization Engine (§24)", () => {
    it("should calculate projected monthly savings and recommend zero-cost equivalent architectures", () => {
      const report = generateCostControlReport();
      assert.ok(report.totalMonthlySpendInr > 0);
      assert.ok(report.totalProjectedSavingsInr >= 30000); // UPI 0% + PGlite + Web Speech saves > ₹30k/mo
      assert.ok(report.optimizationRecommendations.length >= 3);
      assert.ok(INITIAL_EXPENSE_ITEMS.some((e) => e.category === "PAYMENT_FEES" && e.alternative?.recommendedSolution.includes("0% MDR")));
    });
  });

  describe("11. Premium Voice Engine & Multilingual Audio Synthesis (§25)", () => {
    it("should configure all 4 young female natural acoustic personas with warm DSP parameters", () => {
      const personas = Object.values(VOICE_PERSONAS);
      assert.strictEqual(personas.length, 4);

      for (const p of personas) {
        assert.ok(p.id === "aria" || p.id === "priya" || p.id === "ananya" || p.id === "zara");
        assert.ok(p.pitch >= 1.15 && p.pitch <= 1.25, `Pitch out of range for ${p.id}: ${p.pitch}`);
        assert.ok(p.rate >= 1.0 && p.rate <= 1.1, `Rate out of range for ${p.id}: ${p.rate}`);
        assert.ok(p.dspProfile.presenceGainDb > 0);
        assert.ok(p.dspProfile.airShelfDb > 0);
        assert.ok(p.dspProfile.lowCutHz >= 100 && p.dspProfile.lowCutHz <= 160);
        assert.ok(p.preferredVoiceNames.length > 0);
        assert.ok(p.vocalAuraColor.startsWith("#"));
      }
    });

    it("should support 15 native languages with native scripts and greetings", () => {
      assert.strictEqual(SUPPORTED_LANGUAGES.length, 15);
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      assert.ok(codes.includes("en-IN"));
      assert.ok(codes.includes("bn-IN"));
      assert.ok(codes.includes("hi-IN"));
      assert.ok(codes.includes("as-IN"));
      assert.ok(codes.includes("ur-IN"));
      assert.ok(codes.includes("es-ES"));
      assert.ok(codes.includes("fr-FR"));
      assert.ok(codes.includes("ar-SA"));
      assert.ok(codes.includes("de-DE"));
      assert.ok(codes.includes("zh-CN"));
      assert.ok(codes.includes("ja-JP"));
      assert.ok(codes.includes("ta-IN"));
      assert.ok(codes.includes("te-IN"));

      for (const lang of SUPPORTED_LANGUAGES) {
        assert.ok(lang.name.length > 0);
        assert.ok(lang.nativeName.length > 0);
        assert.ok(lang.greetingText.length > 10);
        assert.ok(lang.flag.length > 0);
      }
    });

    it("should accurately detect spoken language heuristics across dialects", () => {
      assert.strictEqual(detectSpokenOrTextLanguage("apnar taka lagbe ki"), "bn-IN");
      assert.strictEqual(detectSpokenOrTextLanguage("আপনি কেমন আছেন"), "bn-IN");
      assert.strictEqual(detectSpokenOrTextLanguage("hello mujhe online paise kamane hai"), "hi-IN");
      assert.strictEqual(detectSpokenOrTextLanguage("आप कैसे हैं"), "hi-IN");
      assert.strictEqual(detectSpokenOrTextLanguage("hola amigo necesito un proyecto"), "es-ES");
      assert.strictEqual(detectSpokenOrTextLanguage("bonjour je veux développer une app"), "fr-FR");
      assert.strictEqual(detectSpokenOrTextLanguage("hallo wir brauchen ein neues projekt"), "de-DE");
      assert.strictEqual(detectSpokenOrTextLanguage("build enterprise software platform"), "en-IN");
    });
  });

  describe("12. Premium Founder AI Chat Core & Async Query Engine", () => {
    it("should resolve client sales intent and return qualified lead pitch card", async () => {
      const res = await parseFounderQuery("find clients to sell our food delivery software", "9395065587@ybl");
      assert.strictEqual(res!.intent, "client_sales");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "lead_pitch");
      assert.ok(res!.actionCard.data.lead.projectBudget >= 140000);
      assert.ok(res!.actionCard.data.lead.suggestedSolution.length > 10);
      assert.ok(res!.voiceSpokenText.length > 20);
      assert.ok(res!.executionSteps && res!.executionSteps.length >= 3);
    });

    it("should resolve high-paid remote jobs and return contract gig proposal card", async () => {
      const res = await parseFounderQuery("find high paid remote contracts and freelance jobs", "9395065587@ybl");
      assert.strictEqual(res!.intent, "remote_jobs");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "remote_gig_bid");
      assert.ok(res!.actionCard.data.hourlyRateUsd >= 80);
      assert.ok(res!.actionCard.data.proposalTemplate.includes("Hi Hiring Team"));
      assert.ok(res!.voiceSpokenText.length > 20);
    });

    it("should execute capability benchmark suite and return verified report card", async () => {
      const res = await parseFounderQuery("run capability benchmark suite", "9395065587@ybl");
      assert.strictEqual(res!.intent, "capability_benchmarks");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "benchmark_results");
      assert.strictEqual(res!.actionCard.data.totalTests, 11);
      assert.ok(res!.actionCard.data.averageScore >= 50);
      assert.ok(res!.responseMarkdown.includes("Verified Capability Benchmark Report"));
    });

    it("should scaffold heavy enterprise application and return multi-file blueprint", async () => {
      const res = await parseFounderQuery("scaffold heavy enterprise hospital erp web app", "9395065587@ybl");
      assert.strictEqual(res!.intent, "enterprise_blueprint");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "enterprise_blueprint");
      assert.ok(res!.actionCard.data.files.length >= 2);
      assert.ok(res!.actionCard.data.files.some((f: any) => f.filename.endsWith(".tsx")));
      assert.ok(res!.actionCard.data.commercialValueInr > 0);
      assert.ok(res!.actionCard.data.handoffCredentials.databaseUrl.includes("postgresql"));
    });

    it("should generate 0% fee direct KingPay UPI invoice card", async () => {
      const res = await parseFounderQuery("generate invoice for client ₹250000", "9395065587@ybl");
      assert.strictEqual(res!.intent, "invoice_pay");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "invoice_pay");
      assert.strictEqual(res!.actionCard.data.amountInr, 250000);
      assert.ok(res!.actionCard.data.upiPaymentLink.includes("upi://pay"));
      assert.ok(res!.actionCard.data.upiPaymentLink.includes("pa=9395065587%40ybl"));
    });

    it("should decompose founder goals into 14-stage delivery graph", async () => {
      const res = await parseFounderQuery("create delivery graph for marketplace business", "9395065587@ybl");
      assert.strictEqual(res!.intent, "delivery_graph");
      assert.ok(res!.actionCard);
      assert.strictEqual(res!.actionCard.type, "delivery_graph");
      assert.strictEqual(res!.actionCard.data.totalStages, 14);
      assert.ok(res!.actionCard.data.stages.length === 14);
    });

    it("should generate authentic Bengali / Sylheti voice responses when queried in Bengali", async () => {
      const res = await parseFounderQuery("apnar sathe client dhundte chai", "9395065587@ybl");
      assert.strictEqual(res!.detectedLanguage, "bn-IN");
      assert.ok(
        res!.voiceSpokenText.includes("Ami") ||
        res!.voiceSpokenText.includes("kora") ||
        res!.voiceSpokenText.includes("Hello") ||
        res!.voiceSpokenText.includes("taka")
      );
    });
  });
});
