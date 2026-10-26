import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePromoUnitEconomics,
  type PromoUnitEconomicsInput,
} from "./promo-economics.ts";

describe("Umar OS — Promo Unit Economics & Mandatory Loss Warning Engine", () => {
  it("calculates positive unit margin and success banner for profitable promo", () => {
    const input: PromoUnitEconomicsInput = {
      aovPaise: 40000, // ₹400
      commissionBps: 2000, // 20% = ₹80
      platformFeePaise: 1000, // ₹10
      discountKind: "PERCENT",
      discountPercentBps: 1000, // 10% = ₹40
      maxDiscountPaise: 5000, // Capped at ₹50
      isPostBookingCashback: false,
      riderPayoutPaise: 3000, // ₹30
      paymentGatewayBps: 100, // 1% = ₹4
    };

    const res = calculatePromoUnitEconomics(input);

    assert.equal(res.commissionRevenuePaise, 8000); // ₹80
    assert.equal(res.grossRevenuePaise, 9000); // ₹80 + ₹10 = ₹90
    assert.equal(res.nominalSubsidyPaise, 4000); // ₹40
    assert.equal(res.riderPayoutPaise, 3000); // ₹30
    assert.equal(res.paymentGatewayCostPaise, 400); // ₹4
    assert.equal(res.totalCostsPaise, 7400); // ₹30 + ₹4 + ₹40 = ₹74
    assert.equal(res.netUnitMarginPaise, 1600); // ₹90 - ₹74 = +₹16 (1600 paise)
    assert.equal(res.isProfitable, true);
    assert.equal(res.isLossMaking, false);
    assert.equal(res.lossAmountPaise, 0);
    assert.ok(res.successMessage?.includes("PROFITABLE CAMPAIGN"));
    assert.equal(res.warningMessage, null);
  });

  it("triggers MANDATORY LOSS WARNING when subsidy creates negative unit margin", () => {
    const input: PromoUnitEconomicsInput = {
      aovPaise: 25000, // ₹250
      commissionBps: 1500, // 15% = ₹37.50 (~₹38)
      platformFeePaise: 500, // ₹5
      discountKind: "FLAT",
      flatDiscountPaise: 6000, // Flat ₹60 subsidy
      isPostBookingCashback: false,
      riderPayoutPaise: 3500, // ₹35
      paymentGatewayBps: 100, // 1% = ₹2.50 (~₹3)
    };

    const res = calculatePromoUnitEconomics(input);

    // Revenue: ~₹38 + ₹5 = ₹43
    // Costs: ₹35 (rider) + ₹3 (pg) + ₹60 (subsidy) = ₹98
    // Net: ₹43 - ₹98 = -₹55 (loss)
    assert.equal(res.isLossMaking, true);
    assert.equal(res.isProfitable, false);
    assert.ok(res.lossAmountPaise > 0);
    assert.ok(res.warningMessage?.includes("MANDATORY LOSS WARNING: NEGATIVE UNIT ECONOMICS DETECTED"));
    assert.ok(res.warningMessage?.includes("Platform treasury will lose"));
    assert.ok(res.warningMessage?.includes("Minimum break-even order value needed"));
    assert.ok((res.breakEvenAovPaise ?? 0) > input.aovPaise);
  });

  it("correctly models Goibibo-style post-booking wallet cashback preserving upfront cash float", () => {
    const input: PromoUnitEconomicsInput = {
      aovPaise: 30000, // ₹300
      commissionBps: 1500, // 15% = ₹45
      platformFeePaise: 1000, // ₹10
      discountKind: "PERCENT",
      discountPercentBps: 2000, // 20% = ₹60
      maxDiscountPaise: 6000,
      isPostBookingCashback: true, // Cashback credited to wallet on delivery
      riderPayoutPaise: 3500, // ₹35
      paymentGatewayBps: 100, // 1% = ₹3
    };

    const res = calculatePromoUnitEconomics(input);

    assert.equal(res.nominalSubsidyPaise, 6000); // ₹60 liability
    assert.equal(res.effectiveUpfrontSubsidyPaise, 0); // Zero cash deducted at checkout
    assert.equal(res.walletCashbackLiabilityPaise, 6000);
    // Immediate cash outflow is only rider (₹35) + pg (₹3) = ₹38
    assert.equal(res.immediateCashOutflowPaise, 3800);
    // Upfront cash net margin is ₹55 (revenue) - ₹38 (outflow) = +₹17 (1700 paise) positive cash float!
    assert.equal(res.netUnitMarginImmediatePaise, 1700);
  });

  it("handles edge cases safely (zero AOV, negative values, zero commission)", () => {
    const res = calculatePromoUnitEconomics({
      aovPaise: 0,
      commissionBps: 0,
      platformFeePaise: 0,
      discountKind: "PERCENT",
      isPostBookingCashback: false,
    });

    assert.equal(res.aovPaise, 0);
    assert.equal(res.grossRevenuePaise, 0);
    assert.equal(res.netYieldPercent, 0);
    assert.equal(res.isLossMaking, true);
    assert.ok(res.warningMessage?.includes("MANDATORY LOSS WARNING"));
  });
});
