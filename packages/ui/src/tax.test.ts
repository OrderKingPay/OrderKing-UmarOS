import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STATUTORY_TAX_RATES,
  calculateSection95Tax,
  calculateStatutoryWithholding,
  compileTPlus1DailySettlement,
  generateAutomatedCreditNote,
  applyTaxBpsPaise,
} from "./tax.ts";

describe("🇮🇳 CGST Act Section 9(5) Tax Engine (packages/ui/src/tax.ts)", () => {
  it("strictly calculates 5% GST without Input Tax Credit (ITC) on restaurant food delivery orders", () => {
    // ₹1,000 food subtotal (100,000 paise), ₹50 packaging (5,000 paise)
    const result = calculateSection95Tax({
      foodSubtotalPaise: 100000,
      packagingChargePaise: 5000,
      platformFeePaise: 600, // ₹6 platform fee
      deliveryFeePaise: 3500, // ₹35 delivery fee
      customerTipPaise: 2000, // ₹20 customer tip
    });

    // Food 5% GST = 5,000 paise (2.5% CGST 2,500 + 2.5% SGST 2,500)
    assert.equal(result.foodGstPaise, 5000);
    assert.equal(result.lineItems.food.cgstPaise, 2500);
    assert.equal(result.lineItems.food.sgstPaise, 2500);
    assert.equal(result.lineItems.food.igstPaise, 0);
    assert.equal(result.lineItems.food.itcEligible, false); // ITC BLOCKED under Sec 9(5)
    assert.equal(result.lineItems.food.liabilityBearer, "ECO_PLATFORM");

    // Packaging 5% GST = 250 paise (125 CGST + 125 SGST)
    assert.equal(result.packagingGstPaise, 250);
    assert.equal(result.lineItems.packaging.itcEligible, false);
    assert.equal(result.lineItems.packaging.liabilityBearer, "ECO_PLATFORM");

    // Total Section 9(5) Taxable = 105,000 paise (₹1,050.00), Tax = 5,250 paise (₹52.50)
    assert.equal(result.totalSec95TaxablePaise, 105000);
    assert.equal(result.totalSec95GstPaise, 5250);
    assert.equal(result.itcBlockedSec95TaxPaise, 5250);

    // Platform services: 18% GST with ITC eligibility
    // Platform fee 600 paise * 18% = 108 paise (54 CGST + 54 SGST)
    assert.equal(result.platformFeeGstPaise, 108);
    assert.equal(result.lineItems.platformFee.itcEligible, true);
    // Delivery fee 3500 paise * 18% = 630 paise (315 CGST + 315 SGST)
    assert.equal(result.deliveryFeeGstPaise, 630);
    assert.equal(result.lineItems.deliveryFee.itcEligible, true);
    assert.equal(result.itcEligibleTaxPaise, 738);

    // Tip: 0% GST exempt pure agent
    assert.equal(result.lineItems.tip.totalTaxPaise, 0);
    assert.equal(result.lineItems.tip.liabilityBearer, "EXEMPT");

    // GSTR-3B Table Mappings
    assert.equal(result.gstr3b.table3_1_1_i_taxableAmountPaise, 105000);
    assert.equal(result.gstr3b.table3_1_1_i_taxPayablePaise, 5250);
    assert.equal(result.gstr3b.table3_1_a_taxableAmountPaise, 4100);
    assert.equal(result.gstr3b.table3_1_a_taxPayablePaise, 738);

    // Customer Payable = 105000 + 5250 + 4100 + 738 + 2000 = 117088 paise
    assert.equal(result.customerPayablePaise, 117088);
  });

  it("handles interstate supply splitting tax to 5% IGST without ITC", () => {
    const result = calculateSection95Tax({
      foodSubtotalPaise: 80000,
      packagingChargePaise: 2000,
      platformFeePaise: 500,
      deliveryFeePaise: 4000,
      isInterstate: true,
    });

    assert.equal(result.isInterstate, true);
    assert.equal(result.lineItems.food.cgstPaise, 0);
    assert.equal(result.lineItems.food.sgstPaise, 0);
    assert.equal(result.lineItems.food.igstPaise, 4000); // 5% IGST on 80,000
    assert.equal(result.lineItems.food.itcEligible, false);
    assert.equal(result.lineItems.packaging.igstPaise, 100); // 5% IGST on 2,000
    assert.equal(result.totalSec95GstPaise, 4100);
  });
});

describe("🇮🇳 TCS Section 52 (1%) & TDS Section 194-O (1%) Withholding", () => {
  it("enforces 1% TCS and 1% TDS on merchant sales", () => {
    // Gross sales ₹2,000 (200,000 paise), Restaurant discount ₹200 (20,000 paise)
    // Net taxable supply = ₹1,800 (180,000 paise)
    const withholding = calculateStatutoryWithholding({
      grossSalesPaise: 200000,
      restaurantDiscountPaise: 20000,
      hasValidPan: true,
      isInterstate: false,
    });

    assert.equal(withholding.grossSalesPaise, 200000);
    assert.equal(withholding.netTaxableSupplyPaise, 180000);

    // Section 52 TCS = 1% on 180,000 paise = 1,800 paise (900 CGST + 900 SGST)
    assert.equal(withholding.tcsSection52Paise, 1800);
    assert.equal(withholding.tcsCgstPaise, 900);
    assert.equal(withholding.tcsSgstPaise, 900);
    assert.equal(withholding.tcsIgstPaise, 0);

    // Section 194-O TDS = 1% on 200,000 gross sales = 2,000 paise
    assert.equal(withholding.tdsSection194OPaise, 2000);
    assert.equal(withholding.totalWithholdingPaise, 3800);
  });

  it("applies Section 206AA penal 5% TDS when PAN is invalid or missing", () => {
    const withholding = calculateStatutoryWithholding({
      grossSalesPaise: 100000,
      hasValidPan: false,
    });

    // 5% TDS under Sec 206AA on ₹1,000 = ₹50 (5,000 paise)
    assert.equal(withholding.tdsRateBps, 500);
    assert.equal(withholding.tdsSection194OPaise, 5000);
  });
});

describe("🇮🇳 T+1 Daily Merchant Settlement Engine (Midnight to 10:00 AM Dispatch)", () => {
  it("compiles all orders completed up to 12:00 Midnight and schedules payout for next morning 10:00 AM", () => {
    const orderDate = "2026-10-18";
    const batch = compileTPlus1DailySettlement({
      restaurantId: "rest_royal_biryani_01",
      restaurantName: "Royal Biryani House",
      bankAccountMasked: "HDFC-XXXX-8921",
      ifscCode: "HDFC0001234",
      orderDate,
      orders: [
        {
          orderId: "ord_101",
          foodValuePaise: 50000, // ₹500
          packingPaise: 3000, // ₹30
          restaurantDiscountPaise: 5000, // ₹50
          commissionBps: 1800, // 18%
          completedAt: "2026-10-18T13:45:00Z",
        },
        {
          orderId: "ord_102",
          foodValuePaise: 70000, // ₹700
          packingPaise: 4000, // ₹40
          restaurantDiscountPaise: 0,
          commissionBps: 1800, // 18%
          completedAt: "2026-10-18T23:55:00Z", // Completed just before 12:00 Midnight
        },
      ],
    });

    // Verification of T+1 schedule
    assert.equal(batch.orderDate, "2026-10-18");
    assert.equal(batch.cutoffTimestamp, "2026-10-18T23:59:59.999+05:30"); // 12:00 Midnight IST
    assert.equal(batch.scheduledPayoutDate, "2026-10-19"); // Day T+1
    assert.equal(batch.scheduledPayoutTime, "10:00 AM");
    assert.equal(batch.scheduledPayoutTimestamp, "2026-10-19T10:00:00.000+05:30");
    assert.equal(batch.status, "SCHEDULED_FOR_10AM_PAYOUT");
    assert.equal(batch.isMidnightCompiled, true);

    // Order 1: Net Taxable = 500 + 30 - 50 = 48000 paise. Commission 18% = 8640. Comm GST 18% = 1555. TCS 1% = 480. TDS 1% = 530.
    // Order 2: Net Taxable = 700 + 40 = 74000 paise. Commission 18% = 13320. Comm GST 18% = 2398. TCS 1% = 740. TDS 1% = 740.
    assert.equal(batch.ordersCount, 2);
    assert.equal(batch.totalGrossSalesPaise, 127000);
    assert.equal(batch.totalNetTaxableSupplyPaise, 122000);
    assert.equal(batch.totalTcsSection52Paise, 1220); // 1% TCS
    assert.equal(batch.totalTdsSection194OPaise, 1270); // 1% TDS
    assert.equal(batch.netPayablePaise, 93597);
  });
});

describe("🇮🇳 Automated Statutory Credit Note Engine (Section 34 CGST Act)", () => {
  it("generates a legally compliant GST credit note upon order refund/cancellation", () => {
    const cn = generateAutomatedCreditNote({
      originalInvoiceNumber: "INV-202610-09821",
      originalOrderId: "ord_cancel_99",
      restaurantId: "rest_punjab_grill_02",
      restaurantGstin: "07AAACP1234D1Z2",
      reasonCode: "05_ORDER_CANCELLED",
      reasonDescription: "Customer cancellation prior to food preparation",
      taxableAmountPaise: 50000, // ₹500
      isInterstate: false,
    });

    assert.match(cn.creditNoteNumber, /^CN-\d{6}-\d{6}$/);
    assert.equal(cn.statutoryBasis, "Section 34, Central Goods and Services Tax (CGST) Act, 2017");
    assert.equal(cn.reasonCode, "05_ORDER_CANCELLED");
    assert.equal(cn.taxableAmountPaise, 50000);
    assert.equal(cn.cgstPaise, 4500); // 9% CGST
    assert.equal(cn.sgstPaise, 4500); // 9% SGST
    assert.equal(cn.totalGstPaise, 9000); // 18% GST reversal
    assert.equal(cn.totalCreditNoteAmountPaise, 59000);
    assert.equal(cn.tcsReversalPaise, 500); // 1% TCS reversal
    assert.equal(cn.tdsAdjustmentPaise, 500); // 1% TDS reversal
    assert.ok(cn.digitalSignatureRef.startsWith("DSC-OK-ECO-"));
  });
});
