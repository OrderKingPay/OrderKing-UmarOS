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
});


