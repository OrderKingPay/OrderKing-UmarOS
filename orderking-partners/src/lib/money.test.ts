import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addPaise,
  assertPaise,
  computeRestaurantPayable,
  formatINR,
  mulBps,
  rupeesToPaise,
  subPaise,
  STATUTORY_TAX_RATES,
  DELIVERY_COMMISSION_TIERS,
  PAYMENT_GATEWAY_CONFIG,
  calculatePaymentGatewayFee,
} from "./money.ts";

describe("money & Indian statutory settlement", () => {
  it("rejects floating point paise", () => {
    assert.throws(() => assertPaise(10.5));
  });

  it("formats INR from integer paise", () => {
    assert.equal(formatINR(50000), "₹500.00");
    assert.equal(formatINR(45), "₹0.45");
    assert.equal(formatINR(-120050), "-₹1,200.50");
  });

  it("converts rupees at the boundary only", () => {
    assert.equal(rupeesToPaise(12.34), 1234);
  });

  it("adds only integers and detects overflow", () => {
    assert.equal(addPaise(1, 2, 3), 6);
    assert.throws(() => addPaise(1.2 as number));
  });

  it("rounds half away from zero on bps", () => {
    assert.equal(mulBps(100, 1000), 10);
    assert.equal(mulBps(15, 1000), 2);
  });

  it("computes standard statutory settlement with 18% GST on commission, 1% TCS, and 1% TDS", () => {
    // ₹500 food value, ₹50 restaurant discount, 10% commission
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
    });

    // Gross & Taxable Base
    assert.equal(s.grossSalesPaise, 50000);
    assert.equal(s.netTaxableSupplyPaise, 45000);

    // Platform Commission (10% of 45000 = 4500 paise)
    assert.equal(s.commissionPaise, 4500);

    // 18% GST on Platform Commission (9% CGST + 9% SGST)
    assert.equal(s.commissionGstPaise, 810);
    assert.equal(s.commissionCgstPaise, 405);
    assert.equal(s.commissionSgstPaise, 405);
    assert.equal(s.commissionCgstPaise + s.commissionSgstPaise, s.commissionGstPaise);

    // Section 52 CGST Act 1% TCS on Net Taxable Supply (0.5% CGST + 0.5% SGST)
    assert.equal(s.tcsSec52Paise, 450);
    assert.equal(s.tcsCgstPaise, 225);
    assert.equal(s.tcsSgstPaise, 225);
    assert.equal(s.tcsCgstPaise + s.tcsSgstPaise, s.tcsSec52Paise);

    // Section 194-O Income Tax Act 1% TDS on Gross Sales (1% of 50000 = 500 paise)
    assert.equal(s.tdsSec194OPaise, 500);

    // Total debited deductions: 4500 + 810 + 450 + 500 = 6260 paise
    assert.equal(s.totalDeductionsPaise, 6260);

    // Net Restaurant Payable (NRP): 45000 - 6260 = 38740 paise (₹387.40)
    assert.equal(s.restaurantPayablePaise, 38740);
    assert.equal(s.netRestaurantPayablePaise, 38740);
  });

  it("strictly tracks CGST Act Section 9(5) 5% GST as platform liability without debiting from restaurant payable", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
    });

    // 5% GST under Section 9(5) on 45000 net food = 2250 paise (2.5% CGST + 2.5% SGST)
    assert.equal(s.sec9_5GstPaise, 2250);
    assert.equal(s.sec9_5CgstPaise, 1125);
    assert.equal(s.sec9_5SgstPaise, 1125);
    assert.equal(s.platformLiabilitySec9_5Paise, 2250);

    // Section 9(5) GST must NOT be included in restaurant debited deductions
    assert.equal(s.totalDeductionsPaise, 6260);
    assert.equal(s.restaurantPayablePaise, 38740);
  });

  it("computes Section 194-O TDS on gross sales including packaging charges", () => {
    // ₹500 food + ₹20 packaging = ₹520 gross sales. ₹20 restaurant discount.
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 2000,
      restaurantDiscountPaise: 2000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
    });

    assert.equal(s.grossSalesPaise, 52000);
    assert.equal(s.netTaxableSupplyPaise, 50000);

    // Commission: 10% of 50000 = 5000
    assert.equal(s.commissionPaise, 5000);
    // 18% GST on Commission = 900 (450 CGST + 450 SGST)
    assert.equal(s.commissionGstPaise, 900);
    // 1% TCS on Net Taxable Supply (50000) = 500
    assert.equal(s.tcsSec52Paise, 500);
    // 1% TDS under Section 194-O on Gross Sales (52000) = 520 paise
    assert.equal(s.tdsSec194OPaise, 520);

    // Total deductions = 5000 + 900 + 500 + 520 = 6920
    assert.equal(s.totalDeductionsPaise, 6920);
    // Net Payable: 50000 - 6920 = 43080 paise
    assert.equal(s.restaurantPayablePaise, 43080);
  });

  it("deducts amortized onboarding fee of ₹99.00 (9900 paise) recurring per batch/cycle", () => {
    // Test with applyOnboardingFee: true
    const s1 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      applyOnboardingFee: true,
    });

    assert.equal(s1.amortizedOnboardingFeePaise, STATUTORY_TAX_RATES.AMORTIZED_ONBOARDING_FEE_PAISE);
    assert.equal(s1.amortizedOnboardingFeePaise, 9900);
    assert.equal(s1.totalDeductionsPaise, 6260 + 9900);
    assert.equal(s1.restaurantPayablePaise, 38740 - 9900); // 28840 paise

    // Test with explicit amortizedOnboardingFeePaise
    const s2 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      amortizedOnboardingFeePaise: 9900,
    });
    assert.equal(s2.amortizedOnboardingFeePaise, 9900);
    assert.equal(s2.restaurantPayablePaise, 28840);
  });

  it("adds platform-funded promotional subsidies as credit to restaurant payable", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 10000, // ₹100 platform coupon
      commissionBps: 1000,
    });

    assert.equal(s.commissionPaise, 5000);
    assert.equal(s.commissionGstPaise, 900);
    assert.equal(s.tcsSec52Paise, 500);
    assert.equal(s.tdsSec194OPaise, 500);
    assert.equal(s.totalDeductionsPaise, 6900);

    // Restaurant receives food value (50000) + platform promotion credit (10000) - deductions (6900) = 53100 paise
    assert.equal(s.platformFundedDiscountPaise, 10000);
    assert.equal(s.restaurantPayablePaise, 53100);
  });

  it("handles other permitted deductions with mandatory reason code", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      otherDeductionsPaise: 1000,
      otherDeductionsCode: "PACKAGING_AUDIT_ADJUSTMENT",
    });

    assert.equal(s.otherDeductionsPaise, 1000);
    assert.equal(s.otherDeductionsCode, "PACKAGING_AUDIT_ADJUSTMENT");
    assert.equal(s.restaurantPayablePaise, 38740 - 1000); // 37740 paise

    // Refuses other deductions without explicit reason code
    assert.throws(
      () =>
        computeRestaurantPayable({
          foodValuePaise: 10000,
          packingPaise: 0,
          restaurantDiscountPaise: 0,
          platformFundedDiscountPaise: 0,
          commissionBps: 1000,
          otherDeductionsPaise: 100,
        }),
      /other deductions require an explicit reason code/,
    );
  });

  it("handles refund adjustments correctly (+ and -)", () => {
    // Negative refund adjustment (chargeback debit)
    const sNegative = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      refundAdjustmentPaise: -1500,
    });
    assert.equal(sNegative.refundAdjustmentPaise, -1500);
    assert.equal(sNegative.restaurantPayablePaise, 38740 - 1500); // 37240 paise

    // Positive refund adjustment (reversal credit)
    const sPositive = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      refundAdjustmentPaise: 2000,
    });
    assert.equal(sPositive.refundAdjustmentPaise, 2000);
    assert.equal(sPositive.restaurantPayablePaise, 38740 + 2000); // 40740 paise
  });

  it("guarantees zero floating-point rounding drift with odd paise amounts", () => {
    // Odd food value & commission rate to test paise half-rounding
    const s = computeRestaurantPayable({
      foodValuePaise: 33333, // ₹333.33
      packingPaise: 111,     // ₹1.11
      restaurantDiscountPaise: 777, // ₹7.77
      platformFundedDiscountPaise: 0,
      commissionBps: 1250,   // 12.5%
    });

    // Check exact integer properties
    assert.ok(Number.isSafeInteger(s.commissionPaise));
    assert.ok(Number.isSafeInteger(s.commissionGstPaise));
    assert.ok(Number.isSafeInteger(s.sec9_5GstPaise));
    assert.ok(Number.isSafeInteger(s.tcsSec52Paise));
    assert.ok(Number.isSafeInteger(s.tdsSec194OPaise));
    assert.ok(Number.isSafeInteger(s.restaurantPayablePaise));

    // CGST and SGST splits must sum exactly to total GST with zero 1-paise drift
    assert.equal(s.commissionCgstPaise + s.commissionSgstPaise, s.commissionGstPaise);
    assert.equal(s.sec9_5CgstPaise + s.sec9_5SgstPaise, s.sec9_5GstPaise);
    assert.equal(s.tcsCgstPaise + s.tcsSgstPaise, s.tcsSec52Paise);

    // Net formula exact reconciliation in integer paise
    const expectedPayable = addPaise(
      s.grossSalesPaise,
      -s.restaurantDiscountPaise,
      s.platformFundedDiscountPaise,
      -s.totalDeductionsPaise,
      s.refundAdjustmentPaise,
    );
    assert.equal(s.restaurantPayablePaise, expectedPayable);
  });

  it("supports disabling statutory taxes when pure commercial net is requested", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 5000,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      applyGstOnCommission: false,
      applyTcsSec52: false,
      applyTdsSec194O: false,
    });

    assert.equal(s.commissionPaise, 4500);
    assert.equal(s.commissionGstPaise, 0);
    assert.equal(s.tcsSec52Paise, 0);
    assert.equal(s.tdsSec194OPaise, 0);
    assert.equal(s.totalDeductionsPaise, 4500);
    assert.equal(s.restaurantPayablePaise, 40500);
  });

  it("calculates weekly batch settlement with statutory taxes and single per-cycle amortized onboarding fee", async () => {
    const { settlementEngine } = await import("./kingpay/settlement.ts");

    const batch = settlementEngine.calculateBatchSettlement({
      restaurantId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      idempotencyKey: "test_batch_cycle_01",
      applyOnboardingFee: true, // Amortized once per batch cycle
      orders: [
        {
          orderId: "order_1",
          foodValuePaise: 50000,
          packingPaise: 2000,
          restaurantDiscountPaise: 2000,
          platformFundedDiscountPaise: 0,
          commissionBps: 1000,
        },
        {
          orderId: "order_2",
          foodValuePaise: 40000,
          packingPaise: 1000,
          restaurantDiscountPaise: 1000,
          platformFundedDiscountPaise: 5000,
          commissionBps: 1000,
        },
      ],
    });

    assert.equal(batch.ordersCount, 2);
    assert.equal(batch.totals.totalGrossSalesPaise, 52000 + 41000); // 93000 paise
    assert.equal(batch.totals.totalNetTaxableSupplyPaise, 50000 + 40000); // 90000 paise
    assert.equal(batch.totals.totalCommissionPaise, 5000 + 4000); // 9000 paise
    assert.equal(batch.totals.totalCommissionGstPaise, 900 + 720); // 1620 paise (18%)
    assert.equal(batch.totals.totalTcsSec52Paise, 500 + 400); // 900 paise (1%)
    assert.equal(batch.totals.totalTdsSec194OPaise, 520 + 410); // 930 paise (1% on 93000 gross)
    assert.equal(batch.totals.totalSec9_5GstPaise, 2500 + 2000); // 4500 paise (5% platform liability)

    // Amortized onboarding fee: single ₹99.00 / 9900 paise for the batch
    assert.equal(batch.totals.amortizedOnboardingFeePaise, 9900);

    // Order 1 payable: 50000 - (5000 + 900 + 500 + 520) = 43080
    // Order 2 payable: 40000 + 5000 - (4000 + 720 + 400 + 410) = 45000 - 5530 = 39470
    // Total order payable = 43080 + 39470 = 82550
    // Net batch payable = 82550 - 9900 (onboarding fee) = 72650
    assert.equal(batch.totals.netBatchPayablePaise, 72650);
  });

  it("defines standard DELIVERY_COMMISSION_TIERS accurately", () => {
    assert.equal(DELIVERY_COMMISSION_TIERS.DINE_IN, 0);
    assert.equal(DELIVERY_COMMISSION_TIERS.ENTERPRISE, 1800);
    assert.equal(DELIVERY_COMMISSION_TIERS.GROWTH, 2200);
    assert.equal(DELIVERY_COMMISSION_TIERS.STANDARD, 2500);
    assert.equal(DELIVERY_COMMISSION_TIERS.FULL_SERVICE, 2800);
  });

  it("computes standard 28% full service delivery settlement with exact statutory splits", () => {
    // ₹500 food value, ₹0 packaging, ₹0 discount, standard 28% delivery commission (2800 bps)
    const s = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: DELIVERY_COMMISSION_TIERS.FULL_SERVICE, // 2800 bps
    });

    // Gross & Taxable Base
    assert.equal(s.grossSalesPaise, 50000);
    assert.equal(s.netTaxableSupplyPaise, 50000);

    // 28% Delivery Commission: 28% of 50000 = 14000 paise (₹140.00)
    assert.equal(s.commissionPaise, 14000);

    // 18% GST on Commission: 18% of 14000 = 2520 paise (₹25.20)
    // 9% CGST (1260 paise) + 9% SGST (1260 paise)
    assert.equal(s.commissionGstPaise, 2520);
    assert.equal(s.commissionCgstPaise, 1260);
    assert.equal(s.commissionSgstPaise, 1260);
    assert.equal(s.commissionCgstPaise + s.commissionSgstPaise, s.commissionGstPaise);

    // Section 9(5) CGST Act 5% Food GST (platform liability remitted directly to Govt):
    // 5% of 50000 = 2500 paise (₹25.00)
    assert.equal(s.sec9_5GstPaise, 2500);
    assert.equal(s.sec9_5CgstPaise, 1250);
    assert.equal(s.sec9_5SgstPaise, 1250);
    assert.equal(s.platformLiabilitySec9_5Paise, 2500);

    // Section 52 CGST Act 1% TCS on Net Taxable Supply: 1% of 50000 = 500 paise (₹5.00)
    assert.equal(s.tcsSec52Paise, 500);
    assert.equal(s.tcsCgstPaise, 250);
    assert.equal(s.tcsSgstPaise, 250);
    assert.equal(s.tcsCgstPaise + s.tcsSgstPaise, s.tcsSec52Paise);

    // Section 194-O Income Tax Act 1% TDS on Gross Sales: 1% of 50000 = 500 paise (₹5.00)
    assert.equal(s.tdsSec194OPaise, 500);

    // Total debited deductions: 14000 + 2520 + 500 + 500 = 17520 paise (₹175.20)
    // Notice Section 9(5) 2500 paise is NOT debited
    assert.equal(s.totalDeductionsPaise, 17520);

    // Net Restaurant Payable (NRP): 50000 - 17520 = 32480 paise (₹324.80)
    assert.equal(s.restaurantPayablePaise, 32480);
    assert.equal(s.netRestaurantPayablePaise, 32480);
  });

  it("smoothly calculates settlement across custom negotiated rates from 0% to 35%", () => {
    // 1. 0% Sovereign Dine-In Tier
    const s0 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: DELIVERY_COMMISSION_TIERS.DINE_IN, // 0 bps
    });
    assert.equal(s0.commissionPaise, 0);
    assert.equal(s0.commissionGstPaise, 0);
    assert.equal(s0.totalDeductionsPaise, 1000); // 500 TCS + 500 TDS
    assert.equal(s0.restaurantPayablePaise, 49000); // ₹490.00 Net

    // 2. 18% Enterprise Tier
    const s18 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: DELIVERY_COMMISSION_TIERS.ENTERPRISE, // 1800 bps
    });
    assert.equal(s18.commissionPaise, 9000); // 18% of 50000 = 9000
    assert.equal(s18.commissionGstPaise, 1620); // 18% GST on 9000 = 1620
    assert.equal(s18.totalDeductionsPaise, 9000 + 1620 + 500 + 500); // 11620
    assert.equal(s18.restaurantPayablePaise, 38380);

    // 3. 22% Growth Brand Tier
    const s22 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: DELIVERY_COMMISSION_TIERS.GROWTH, // 2200 bps
    });
    assert.equal(s22.commissionPaise, 11000); // 22% of 50000 = 11000
    assert.equal(s22.commissionGstPaise, 1980); // 18% GST on 11000 = 1980
    assert.equal(s22.totalDeductionsPaise, 11000 + 1980 + 500 + 500); // 13980
    assert.equal(s22.restaurantPayablePaise, 36020);

    // 4. 25% Standard Delivery Tier
    const s25 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: DELIVERY_COMMISSION_TIERS.STANDARD, // 2500 bps
    });
    assert.equal(s25.commissionPaise, 12500); // 25% of 50000 = 12500
    assert.equal(s25.commissionGstPaise, 2250); // 18% GST on 12500 = 2250
    assert.equal(s25.totalDeductionsPaise, 12500 + 2250 + 500 + 500); // 15750
    assert.equal(s25.restaurantPayablePaise, 34250);

    // 5. 35% Negotiated Ceiling (3500 bps)
    const s35 = computeRestaurantPayable({
      foodValuePaise: 50000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: 3500, // 3500 bps (35%)
    });
    assert.equal(s35.commissionPaise, 17500); // 35% of 50000 = 17500
    assert.equal(s35.commissionGstPaise, 3150); // 18% GST on 17500 = 3150
    assert.equal(s35.totalDeductionsPaise, 17500 + 3150 + 500 + 500); // 21650
    assert.equal(s35.restaurantPayablePaise, 28350);
  });

  it("handles odd fractional paise amounts at 28% without floating point drift", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 44444, // ₹444.44
      packingPaise: 250,     // ₹2.50
      restaurantDiscountPaise: 999, // ₹9.99
      platformFundedDiscountPaise: 0,
      commissionBps: 2800,   // 28%
    });

    // Net taxable supply: 44444 + 250 - 999 = 43695
    assert.equal(s.netTaxableSupplyPaise, 43695);

    // Commission: 43695 * 2800 / 10000 = 12234.6 -> rounded to 12235 paise
    assert.equal(s.commissionPaise, 12235);

    // 18% GST on 12235: 12235 * 1800 / 10000 = 2202.3 -> rounded to 2202 paise
    assert.equal(s.commissionGstPaise, 2202);
    assert.equal(s.commissionCgstPaise + s.commissionSgstPaise, s.commissionGstPaise);

    // All properties are safe integers
    assert.ok(Number.isSafeInteger(s.commissionPaise));
    assert.ok(Number.isSafeInteger(s.commissionGstPaise));
    assert.ok(Number.isSafeInteger(s.sec9_5GstPaise));
    assert.ok(Number.isSafeInteger(s.tcsSec52Paise));
    assert.ok(Number.isSafeInteger(s.tdsSec194OPaise));
    assert.ok(Number.isSafeInteger(s.restaurantPayablePaise));

    // Exact reconciliation
    const expected = addPaise(
      s.grossSalesPaise,
      -s.restaurantDiscountPaise,
      s.platformFundedDiscountPaise,
      -s.totalDeductionsPaise,
      s.refundAdjustmentPaise,
    );
    assert.equal(s.restaurantPayablePaise, expected);
  });

  it("calculates Express Daily (T+1) cycle settlement deducting nominal 0.5% early-liquidity fee and 18% GST", () => {
    const standard = computeRestaurantPayable({
      foodValuePaise: 100000, // ₹1,000.00
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000, // 10%
      cycleType: "STANDARD_WEEKLY",
    });

    const express = computeRestaurantPayable({
      foodValuePaise: 100000,
      packingPaise: 0,
      restaurantDiscountPaise: 0,
      platformFundedDiscountPaise: 0,
      commissionBps: 1000,
      cycleType: "EXPRESS_DAILY",
    });

    assert.equal(standard.cycleType, "STANDARD_WEEKLY");
    assert.equal(express.cycleType, "EXPRESS_DAILY");
    assert.equal(standard.expressEarlyLiquidityFeePaise, 0);

    // Express early liquidity fee (0.5% on preliminary net earnings)
    assert.ok(express.expressEarlyLiquidityFeePaise > 0);
    assert.ok(express.expressEarlyLiquidityFeeGstPaise > 0);
    // 18% GST on early liquidity fee
    assert.equal(
      express.expressEarlyLiquidityFeeGstPaise,
      Math.round((express.expressEarlyLiquidityFeePaise * 18) / 100)
    );

    const expressDeductionDiff = express.expressEarlyLiquidityFeePaise + express.expressEarlyLiquidityFeeGstPaise;
    assert.equal(express.restaurantPayablePaise, standard.restaurantPayablePaise - expressDeductionDiff);
  });

  it("calculates order-level settlement with payment gateway fee (1.8% + 18% GST) and penalties", () => {
    const s = computeRestaurantPayable({
      foodValuePaise: 200000, // ₹2,000.00
      packingPaise: 5000,     // ₹50.00
      restaurantDiscountPaise: 10000, // ₹100.00
      platformFundedDiscountPaise: 0,
      commissionBps: 1200,   // 12%
      gatewayFeeBps: 180,    // 1.8% PG fee
      penaltiesPaise: 2500,  // ₹25.00 delay penalty
    });

    assert.equal(s.grossSalesPaise, 205000);
    assert.equal(s.netTaxableSupplyPaise, 195000);

    // Gateway fee: 1.8% of 205000 = 3690 paise
    assert.equal(s.gatewayFeePaise, 3690);
    // 18% GST on PG fee = 664 paise (round half away)
    assert.equal(s.gatewayFeeGstPaise, 664);
    // Penalties = 2500 paise
    assert.equal(s.penaltiesPaise, 2500);

    // Check all values are integers
    assert.ok(Number.isSafeInteger(s.totalDeductionsPaise));
    assert.ok(Number.isSafeInteger(s.restaurantPayablePaise));
  });
});


