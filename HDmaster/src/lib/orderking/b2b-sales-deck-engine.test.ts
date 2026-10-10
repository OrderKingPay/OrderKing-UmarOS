import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { 
  calculateMultiUnitRoi, 
  getB2BPitchDeckTelemetryCore,
  generateExecutiveEmailPitch,
  type RoiSimulationParams 
} from "./b2b-sales-deck-engine.ts";

describe("B2B SaaS Sales Deck Engine", () => {
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
      avgTicketValue: 30, // $30 avg QSR delivery order
      aggregatorFeePct: 30, // 30% DoorDash/Uber commission
      orderkingCostPct: 8, // 8% OrderKing direct tech cost
      currency: "USD",
    };

    const roi = calculateMultiUnitRoi(usParams);

    // 15 units * 100 orders/day * 365 = 547,500 orders
    // GMV = 547,500 * $30 = $16,425,000
    // 30% aggregator cut = $4,927,500
    // 8% OrderKing cost = $1,314,000
    // Net savings = $3,613,500
    assert.strictEqual(roi.annualGmv, 16425000);
    assert.strictEqual(roi.annualAggregatorFees, 4927500);
    assert.strictEqual(roi.annualOrderKingCost, 1314000);
    assert.strictEqual(roi.annualNetProfitReclaimed, 3613500);
    assert.strictEqual(roi.perStoreAnnualSavings, 240900);
    assert.strictEqual(roi.ebitdaMarginExpansionPct, 22);
  });

  test("calculates exact multi-unit ROI for Saudi restaurant group (SAR)", () => {
    const ksaParams: RoiSimulationParams = {
      unitsCount: 20,
      dailyOrdersPerUnit: 120,
      avgTicketValue: 70, // 70 SAR avg ticket
      aggregatorFeePct: 28, // 28% Jahez/HungerStation cut
      orderkingCostPct: 7, // 7% OrderKing platform cost
      currency: "SAR",
    };

    const roi = calculateMultiUnitRoi(ksaParams);

    // 20 * 120 * 365 = 876,000 orders
    // GMV = 876,000 * 70 = 61,320,000 SAR
    // 28% aggregator = 17,169,600 SAR
    // 7% OrderKing = 4,292,400 SAR
    // Net profit reclaimed = 12,877,200 SAR
    assert.strictEqual(roi.annualGmv, 61320000);
    assert.strictEqual(roi.annualAggregatorFees, 17169600);
    assert.strictEqual(roi.annualOrderKingCost, 4292400);
    assert.strictEqual(roi.annualNetProfitReclaimed, 12877200);
    assert.strictEqual(roi.perStoreAnnualSavings, 643860);
    assert.strictEqual(roi.ebitdaMarginExpansionPct, 21);
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
    assert.match(email.body, /DoorDash/);
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
});
