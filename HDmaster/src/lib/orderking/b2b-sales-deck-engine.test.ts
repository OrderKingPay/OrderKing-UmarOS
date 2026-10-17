import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  calculateMultiUnitRoi,
  getB2BPitchDeckTelemetryCore,
  generateExecutiveEmailPitch,
  type RoiSimulationParams,
} from "./b2b-sales-deck-engine.ts";
import {
  CrmPipelineEngine,
  SELLABLE_ORDERKING_SERVICES,
} from "./crm/pipeline-engine.ts";

describe("B2B SaaS Sales Deck Engine & 15-Stage CRM Revenue System", () => {
  test("strictly enforces zero fake data: returns 'System Ready for Live Benchmark' when 0 real orders exist", async () => {
    const telemetry = await getB2BPitchDeckTelemetryCore();

    assert.ok(telemetry);
    assert.strictEqual(telemetry.founderPedigree.yearsExperience, 12);
    assert.match(telemetry.founderPedigree.brandHistory, /Burger King/);

    if (telemetry.realOrdersCount === 0) {
      assert.strictEqual(telemetry.dispatchSpeed.stat, "System Ready for Live Benchmark");
      assert.strictEqual(telemetry.profitMargins.stat, "System Ready for Live Benchmark");
      assert.strictEqual(telemetry.antiFraud.stat, "System Ready for Live Benchmark");
      assert.strictEqual(telemetry.hasLiveOrders, false);
    } else {
      assert.strictEqual(telemetry.hasLiveOrders, true);
    }
  });

  test("calculates exact multi-unit ROI for US franchisee portfolio (USD)", () => {
    const usParams: RoiSimulationParams = {
      unitsCount: 15,
      dailyOrdersPerUnit: 100,
      avgTicketValue: 30,
      aggregatorFeePct: 30,
      orderkingCostPct: 8,
      currency: "USD",
    };

    const roi = calculateMultiUnitRoi(usParams);

    assert.strictEqual(roi.annualGmv, 16425000);
    assert.strictEqual(roi.annualAggregatorFees, 4927500);
    assert.strictEqual(roi.annualOrderKingCost, 1314000);
    assert.strictEqual(roi.annualNetProfitReclaimed, 3613500);
    assert.strictEqual(roi.perStoreAnnualSavings, 240900);
    assert.strictEqual(roi.ebitdaMarginExpansionPct, 22);
    assert.ok(roi.paybackPeriodDays > 0);
    assert.ok(Array.isArray(roi.assumptionsSummary) && roi.assumptionsSummary.length > 0);
  });

  test("calculates exact multi-unit ROI for Saudi restaurant group (SAR)", () => {
    const ksaParams: RoiSimulationParams = {
      unitsCount: 20,
      dailyOrdersPerUnit: 120,
      avgTicketValue: 70,
      aggregatorFeePct: 28,
      orderkingCostPct: 7,
      currency: "SAR",
    };

    const roi = calculateMultiUnitRoi(ksaParams);

    assert.strictEqual(roi.annualGmv, 61320000);
    assert.strictEqual(roi.annualAggregatorFees, 17169600);
    assert.strictEqual(roi.annualOrderKingCost, 4292400);
    assert.strictEqual(roi.annualNetProfitReclaimed, 12877200);
    assert.strictEqual(roi.perStoreAnnualSavings, 643860);
    assert.strictEqual(roi.ebitdaMarginExpansionPct, 21);
  });

  test("calculates exact multi-unit ROI & executive pitch for INDIA restaurant group (INR)", async () => {
    const telemetry = await getB2BPitchDeckTelemetryCore();
    const indiaParams: RoiSimulationParams = {
      unitsCount: 10,
      dailyOrdersPerUnit: 80,
      avgTicketValue: 350,
      aggregatorFeePct: 28,
      orderkingCostPct: 6,
      currency: "INR",
    };

    const roi = calculateMultiUnitRoi(indiaParams);
    assert.strictEqual(roi.annualGmv, 102200000);
    assert.strictEqual(roi.ebitdaMarginExpansionPct, 22);

    const email = generateExecutiveEmailPitch("INDIA", telemetry, roi, "Rajesh Sharma", "Barak Hospitality Group");
    assert.match(email.subject, /Barak Hospitality Group/);
    assert.match(email.body, /UPI/);
    assert.match(email.body, /GST/);
  });

  test("verifies anti-fraud shield telemetry is live and authenticated", async () => {
    const telemetry = await getB2BPitchDeckTelemetryCore();
    assert.ok(telemetry.antiFraud);
    assert.strictEqual(telemetry.antiFraud.hmacSignaturesActive, true);
    assert.strictEqual(telemetry.antiFraud.opticalProofRegistryActive, true);
    assert.strictEqual(telemetry.antiFraud.status, "ARMED_AND_ACTIVE");
  });

  test("generates targeted executive email pitch for US buyers", async () => {
    const telemetry = await getB2BPitchDeckTelemetryCore();
    const roi = calculateMultiUnitRoi({
      unitsCount: 10,
      dailyOrdersPerUnit: 80,
      avgTicketValue: 30,
      aggregatorFeePct: 30,
      orderkingCostPct: 8,
      currency: "USD",
    });

    const email = generateExecutiveEmailPitch("US", telemetry, roi, "John Miller", "Apex QSR Holdings");
    assert.match(email.subject, /Burger King/);
    assert.match(email.subject, /Apex QSR Holdings/);
    assert.match(email.body, /12 years/);
    assert.match(email.body, /legacy aggregators/);
    assert.match(email.body, /Sub-8 minute/);
    assert.match(email.body, /Toast\/NCR Aloha/);
  });

  test("generates targeted executive email pitch for Saudi buyers (Arabic)", async () => {
    const telemetry = await getB2BPitchDeckTelemetryCore();
    const roi = calculateMultiUnitRoi({
      unitsCount: 15,
      dailyOrdersPerUnit: 100,
      avgTicketValue: 65,
      aggregatorFeePct: 28,
      orderkingCostPct: 7,
      currency: "SAR",
    });

    const email = generateExecutiveEmailPitch("SAUDI", telemetry, roi, "الأستاذ سلطان", "مجموعة الضيافة العالمية");
    assert.match(email.subject, /برجر كنج/);
    assert.match(email.body, /12 عاماً/);
    assert.match(email.body, /ZATCA/);
    assert.match(email.body, /هنقرستيشن/);
    assert.match(email.body, /ر\.س/);
  });

  test("quarantines SCENARIO_TEMPLATE leads from verified revenue and tracks 9 separated financial buckets", () => {
    const engine = new CrmPipelineEngine();
    assert.strictEqual(SELLABLE_ORDERKING_SERVICES.length, 10);

    // Initial pre-seeded leads are quarantined as SCENARIO_TEMPLATE with 0 verified collected revenue
    const initialBreakdown = engine.getCommercialRevenueBreakdown();
    assert.strictEqual(initialBreakdown.verifiedMoneyCollectedInr, 0);
    assert.strictEqual(initialBreakdown.verifiedLeadsCount, 0);
    assert.ok(initialBreakdown.scenarioTemplatesCount >= 3);

    // Add a real verified lead with contact permission
    const added = engine.addLead({
      businessName: "Royal Spice Kitchen",
      category: "restaurant",
      contactPerson: "Ankit Verma",
      phone: "+91 9876543210",
      email: "ankit@royalspice.in",
      location: "Silchar, Assam",
      monthlyRevenueEst: "₹2,00,000",
      painPoint: "High aggregator commissions",
      dealValueInr: 45000,
      advanceLockedInr: 0,
      currentStage: "LEAD",
      notes: [],
      nextFollowUpDate: "2026-10-15",
      source: "INBOUND",
      contactPermissionConfirmed: true,
      selectedServiceId: SELLABLE_ORDERKING_SERVICES[0].id,
    });

    assert.strictEqual(added.dataProvenance, "VERIFIED_CRM_RECORD");

    // Duplicate detection rejects same email/phone
    const dup = engine.findDuplicateLead("ankit@royalspice.in", "+91 9876543210");
    assert.ok(dup);
    assert.strictEqual(dup?.id, added.id);

    // Record a verified payment with UTR
    const paid = engine.recordVerifiedPayment(added.id, 45000, "UTR9988776655", 5000);
    assert.strictEqual(paid.verifiedCollectedInr, 45000);

    const postPaidBreakdown = engine.getCommercialRevenueBreakdown();
    assert.strictEqual(postPaidBreakdown.verifiedLeadsCount, 1);
    assert.strictEqual(postPaidBreakdown.verifiedMoneyCollectedInr, 45000);
    assert.strictEqual(postPaidBreakdown.directDeliveryCostsInr, 5000);
    assert.strictEqual(postPaidBreakdown.netProfitInr, 40000);
  });
});

