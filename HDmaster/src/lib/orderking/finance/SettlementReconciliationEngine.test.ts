import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  SettlementReconciliationEngine,
  type OrderReconciliationInput,
  type BatchReconciliationInput,
  type SettlementCycleType,
} from "./SettlementReconciliationEngine.ts";
import { STATUTORY_TAX_RATES } from "../revenue/tax-calculator.ts";

describe("SettlementReconciliationEngine - Statutory Tax & Dual Settlement Verification", () => {
  const engine = new SettlementReconciliationEngine();

  describe("1. Statutory Section 9(5) CGST Act Compliance", () => {
    test("calculates 5% food GST as platform liability without debiting from merchant net payable", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_sec95_01",
        orderNumber: "OK-1001",
        placedAt: "2026-10-15T12:00:00Z",
        foodValuePaise: 100000, // ₹1,000.00
        packingPaise: 5000,     // ₹50.00
        restaurantDiscountPaise: 10000, // ₹100.00
        commissionBps: 2800,    // 28% standard take-rate
        hasValidPan: true,
        panNumber: "ABCDE1234F",
        cycleType: "STANDARD_WEEKLY",
      };

      const result = engine.reconcileOrder(input);

      // Gross Sales = Food (100000) + Packing (5000) = 105000 paise (₹1,050.00)
      assert.equal(result.grossSalesPaise, 105000);
      // Net Taxable Supply = Gross Sales - Restaurant Discount = 105000 - 10000 = 95000 paise (₹950.00)
      assert.equal(result.netTaxableSupplyPaise, 95000);

      // Section 9(5) 5% Food GST on 95000 net supply = 4750 paise (₹47.50)
      // CGST = 2375 paise, SGST = 2375 paise
      assert.equal(result.sec9_5FoodGstPaise, 4750);
      assert.equal(result.sec9_5RemittanceGstin, "ORDERKING_GSTIN");

      // Verify Section 9(5) is NOT part of deductions debited from merchant
      // Deductions = Commission (28% of 95000 = 26600)
      // + 18% GST on Commission (4788)
      // + Gateway Fee 1.8% on 105000 (1890)
      // + 18% GST on Gateway (340)
      // + Section 52 TCS 1% on 95000 (950)
      // + Section 194-O TDS 1% on 105000 (1050)
      // Total Deductions = 26600 + 4788 + 1890 + 340 + 950 + 1050 = 35618 paise
      assert.equal(result.platformCommissionPaise, 26600);
      assert.equal(result.gstOnCommissionPaise, 4788);
      assert.equal(result.cgstOnCommissionPaise + result.sgstOnCommissionPaise, 4788);
      assert.equal(result.gatewayFeePaise, 1890);
      assert.equal(result.gstOnGatewayFeePaise, 340);
      assert.equal(result.tcsSection52Paise, 950);
      assert.equal(result.tcsCgstPaise + result.tcsSgstPaise, 950);
      assert.equal(result.tdsSection194OPaise, 1050);
      assert.equal(result.totalStatutoryWithholdingsPaise, 950 + 1050); // TCS + TDS = 2000 paise

      assert.equal(result.totalDeductionsPaise, 35618);
      // Net Payable = Gross (105000) - Restaurant Discount (10000) - Deductions (35618) = 59382 paise (₹593.82)
      assert.equal(result.netPayablePaise, 59382);

      // Verify that deducting Section 9(5) would result in a lower payout, proving it's NOT debited
      assert.ok(result.netPayablePaise > (59382 - 4750));
    });
  });

  describe("2. Statutory Withholdings: Section 52 TCS and Section 194-O TDS", () => {
    test("deducts 1% TCS on net taxable supply and 1% TDS on gross sales", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_withholding_01",
        orderNumber: "OK-1002",
        placedAt: "2026-10-15T13:00:00Z",
        foodValuePaise: 200000, // ₹2,000.00
        packingPaise: 10000,    // ₹100.00
        restaurantDiscountPaise: 20000, // ₹200.00
        commissionBps: 2800,
        hasValidPan: true,
        panNumber: "ABCDE1234F",
      };

      const result = engine.reconcileOrder(input);

      // Gross Sales = 210000 paise
      // Net Taxable Supply = 210000 - 20000 = 190000 paise
      // TCS 1% on 190000 = 1900 paise (0.5% CGST = 950, 0.5% SGST = 950)
      assert.equal(result.tcsSection52Paise, 1900);
      assert.equal(result.tcsCgstPaise, 950);
      assert.equal(result.tcsSgstPaise, 950);

      // TDS 1% on Gross Sales 210000 = 2100 paise
      assert.equal(result.tdsSection194OPaise, 2100);
      assert.equal(result.totalStatutoryWithholdingsPaise, 4000);
    });

    test("deducts higher 5% TDS under Section 206AA if PAN is invalid or missing", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_no_pan_01",
        orderNumber: "OK-1003",
        placedAt: "2026-10-15T13:30:00Z",
        foodValuePaise: 100000, // ₹1,000.00
        packingPaise: 0,
        commissionBps: 2800,
        hasValidPan: false, // Invalid / missing PAN triggers 5% TDS
      };

      const result = engine.reconcileOrder(input);
      // 5% TDS on 100000 paise = 5000 paise (₹50.00)
      assert.equal(result.tdsSection194OPaise, 5000);
    });
  });

  describe("3. 18% GST on Platform Service Revenue", () => {
    test("applies 18% GST (9% CGST + 9% SGST) to platform commission and payment gateway fee", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_gst18_01",
        orderNumber: "OK-1004",
        placedAt: "2026-10-15T14:00:00Z",
        foodValuePaise: 50000, // ₹500.00
        packingPaise: 0,
        restaurantDiscountPaise: 0,
        commissionBps: 2800,   // 28%
        gatewayFeeBps: 180,    // 1.8%
        hasValidPan: true,
      };

      const result = engine.reconcileOrder(input);

      // Commission: 28% of 50000 = 14000 paise
      assert.equal(result.platformCommissionPaise, 14000);
      // 18% GST on Commission: 14000 * 18% = 2520 paise
      assert.equal(result.gstOnCommissionPaise, 2520);
      assert.equal(result.cgstOnCommissionPaise, 1260);
      assert.equal(result.sgstOnCommissionPaise, 1260);

      // Gateway fee: 1.8% of 50000 = 900 paise
      assert.equal(result.gatewayFeePaise, 900);
      // 18% GST on Gateway fee: 900 * 18% = 162 paise
      assert.equal(result.gstOnGatewayFeePaise, 162);
    });
  });

  describe("4. Commercial Rates: 28% Delivery Take-Rate and 0% Table QR Commission", () => {
    test("verifies 2800 bps standard delivery take-rate calculation", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_take_rate_01",
        orderNumber: "OK-1005",
        placedAt: "2026-10-15T15:00:00Z",
        foodValuePaise: 100000, // ₹1,000.00
        packingPaise: 0,
        commissionBps: 2800,    // 28.00%
        hasValidPan: true,
      };

      const result = engine.reconcileOrder(input);
      assert.equal(result.platformCommissionPaise, 28000); // Exactly ₹280.00
      assert.equal(result.gstOnCommissionPaise, 5040);     // 18% of 28000 = 5040
    });

    test("verifies 0% commission on Table QR orders (sovereign ordering)", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_table_qr_01",
        orderNumber: "OK-1006",
        placedAt: "2026-10-15T15:30:00Z",
        foodValuePaise: 100000,
        packingPaise: 0,
        commissionBps: 0, // 0 bps for Table QR dine-in
        hasValidPan: true,
      };

      const result = engine.reconcileOrder(input);
      assert.equal(result.platformCommissionPaise, 0);
      assert.equal(result.gstOnCommissionPaise, 0);
      assert.equal(result.cgstOnCommissionPaise, 0);
      assert.equal(result.sgstOnCommissionPaise, 0);

      // Only Gateway Fee (1800 + 324 = 2124) + TCS (1000) + TDS (1000) debited
      assert.equal(result.tcsSection52Paise, 1000);
      assert.equal(result.tdsSection194OPaise, 1000);
      assert.equal(result.totalDeductionsPaise, 2124 + 2000); // 4124 paise
      assert.equal(result.netPayablePaise, 100000 - 4124);   // 95876 paise (₹958.76)
    });
  });

  describe("5. Dual Settlement Cycles: Standard Weekly Wednesday vs Express Daily T+1", () => {
    test("Standard Weekly cycle applies zero liquidity fee", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_std_cycle_01",
        orderNumber: "OK-1007",
        placedAt: "2026-10-15T16:00:00Z",
        foodValuePaise: 100000,
        packingPaise: 0,
        commissionBps: 2800,
        hasValidPan: true,
        cycleType: "STANDARD_WEEKLY",
      };

      const result = engine.reconcileOrder(input);
      assert.equal(result.cycleType, "STANDARD_WEEKLY");
      assert.equal(result.expressEarlyLiquidityFeePaise, 0);
      assert.equal(result.gstOnExpressLiquidityFeePaise, 0);
    });

    test("Express Daily (T+1) cycle deducts 0.5% early-liquidity fee and 18% GST", () => {
      const input: OrderReconciliationInput = {
        orderId: "ord_exp_cycle_01",
        orderNumber: "OK-1008",
        placedAt: "2026-10-15T16:30:00Z",
        foodValuePaise: 100000,
        packingPaise: 0,
        commissionBps: 2800,
        hasValidPan: true,
        cycleType: "EXPRESS_DAILY",
      };

      const result = engine.reconcileOrder(input);
      assert.equal(result.cycleType, "EXPRESS_DAILY");

      // Preliminary net earnings before liquidity fee = 100000 - (28000 + 5040 + 1800 + 324 + 1000 + 1000) = 62836 paise
      // Express liquidity fee: 0.5% (50 bps) of 62836 = 314 paise
      assert.equal(result.expressEarlyLiquidityFeePaise, 314);
      // 18% GST on 314 paise: 314 * 18% = 57 paise
      assert.equal(result.gstOnExpressLiquidityFeePaise, 57);

      // Net payable is reduced by exactly 314 + 57 = 371 paise
      const standardNet = 62836;
      assert.equal(result.netPayablePaise, standardNet - 371);
    });
  });

  describe("6. Batch Reconciliation Statement Aggregation", () => {
    test("aggregates multiple orders and amortizes onboarding fee correctly", () => {
      const batchInput: BatchReconciliationInput = {
        restaurantId: "rest_batch_01",
        restaurantName: "The Grand Darbar",
        cycleType: "STANDARD_WEEKLY",
        periodStart: "2026-10-05",
        periodEnd: "2026-10-11",
        payoutDate: "2026-10-14",
        panNumber: "ABCDE1234F",
        amortizedOnboardingFeePaise: 9900, // ₹99.00 weekly amortization
        orders: [
          {
            orderId: "ord_b1",
            orderNumber: "OK-B01",
            placedAt: "2026-10-06T12:00:00Z",
            foodValuePaise: 100000, // ₹1,000.00
            packingPaise: 2000,
            commissionBps: 2800,
          },
          {
            orderId: "ord_b2",
            orderNumber: "OK-B02",
            placedAt: "2026-10-08T18:00:00Z",
            foodValuePaise: 150000, // ₹1,500.00
            packingPaise: 3000,
            restaurantDiscountPaise: 10000, // ₹100.00
            commissionBps: 2800,
          },
        ],
      };

      const batch = engine.reconcileBatch(batchInput);

      assert.equal(batch.ordersCount, 2);
      assert.equal(batch.totalFoodValuePaise, 250000);
      assert.equal(batch.totalPackingPaise, 5000);
      assert.equal(batch.totalGrossSalesPaise, 255000);
      assert.equal(batch.totalRestaurantDiscountPaise, 10000);
      assert.equal(batch.totalNetTaxableSupplyPaise, 245000);

      // Section 9(5) 5% Food GST remitted by platform
      assert.equal(batch.totalSec9_5FoodGstRemittedPaise, Math.round((102000 * 0.05) + (143000 * 0.05)));

      // Amortized onboarding fee
      assert.equal(batch.amortizedOnboardingFeePaise, 9900);

      // Total deductions include the onboarding fee
      const sumOrderDeductions = batch.lines.reduce((s, l) => s + l.totalDeductionsPaise, 0);
      assert.equal(batch.totalDeductionsPaise, sumOrderDeductions + 9900);

      // Net batch payable = sum of order net payables - onboarding fee
      const sumOrderPayables = batch.lines.reduce((s, l) => s + l.netPayablePaise, 0);
      assert.equal(batch.netBatchPayablePaise, sumOrderPayables - 9900);
      assert.equal(batch.status, "CALCULATED");
    });
  });

  describe("7. Backward-Compatible BigInt Settlement", () => {
    test("calculates payout using BigInt SafeInteger arithmetic", () => {
      const order = {
        orderId: "ord_legacy_01",
        subtotal: 100000n, // 100000 paise
        taxRateBps: 500n,  // 5% Section 9(5)
        platformFeeBps: 3304n, // 28% commission + 18% GST (2800 * 1.18 = 3304 bps)
        deductions: 2000n, // 1% TCS + 1% TDS = 2000 paise
      };

      const res = engine.calculateSettlement(order);
      assert.equal(res.subtotal, 100000n);
      assert.equal(res.taxAmount, 5000n); // 5% food tax remitted by platform
      assert.equal(res.platformFee, 33040n);
      assert.equal(res.partnerPayout, 100000n - 33040n - 2000n); // 64960n paise
    });
  });
});
