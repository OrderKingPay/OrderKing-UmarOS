import { describe, it, expect } from "vitest";
import {
  SettlementEngine,
  type DailyOrderRecord,
  type DailySettlementBatch,
} from "../features/finance/SettlementEngine";

describe("SettlementEngine - OrderKing Commercial & Statutory Standards", () => {
  it("enforces statutory constants and platform credentials", () => {
    expect(SettlementEngine.PLATFORM_GSTIN).toBe("18AFXPH9838M1Z9");
    expect(SettlementEngine.SAC_CODE).toBe("996331");
    expect(SettlementEngine.STANDARD_PG_FEE_BPS).toBe(184); // 1.84%
    expect(SettlementEngine.SERVICES_GST_BPS).toBe(1800); // 18.0%
    expect(SettlementEngine.TCS_SEC52_BPS).toBe(100); // 1.0%
    expect(SettlementEngine.TDS_SEC194O_WITH_PAN_BPS).toBe(10); // 0.1%
    expect(SettlementEngine.TDS_SEC194O_WITHOUT_PAN_BPS).toBe(100); // 1.0%
  });

  it("calculates single order breakdown with 100% integer paise precision (with PAN, with GSTIN)", () => {
    // Order: ₹500 food, ₹30 packaging, ₹50 restaurant discount, ₹24 customer GST (5% on 480), customer pays ₹504
    const order: DailyOrderRecord = {
      orderId: "ord_ok_1001",
      orderNumber: "OK-1001",
      deliveredAt: "2026-11-17T14:30:00.000Z",
      customerPaidPaise: 50400,
      itemSubtotalPaise: 50000,
      packagingChargePaise: 3000,
      customerGstPaise: 2400, // 5% CGST/SGST Sec 9(5)
      restaurantDiscountPaise: 5000,
      platformDiscountPaise: 0,
      commissionRatePercent: 22.0, // 22%
      hasPan: true, // 0.1% TDS
      hasGstin: true, // 1.0% TCS
      paymentMethod: "PREPAID_ONLINE",
      penaltyPaise: 0,
    };

    const b = SettlementEngine.calculateOrderSettlement(order);

    // 1. Gross Order Value = 50000 + 3000 + 2400 = 55400 paise (₹554.00)
    expect(b.grossOrderValuePaise).toBe(55400);

    // 2. Taxable Food Value = 50000 - 5000 + 3000 = 48000 paise (₹480.00)
    expect(b.taxableFoodValuePaise).toBe(48000);

    // 3. Platform Commission = 48000 * 22% = 10560 paise (₹105.60)
    expect(b.platformCommissionPaise).toBe(10560);

    // 4. GST on Commission = 10560 * 18% = 1900.8 -> 1901 paise (₹19.01)
    expect(b.commissionGstPaise).toBe(1901);

    // 5. Payment Gateway Fee: 50400 * 1.84% = 927.36 -> 927 paise (₹9.27)
    expect(b.paymentGatewayFeePaise).toBe(927);

    // 6. GST on PG Fee: 927 * 18% = 166.86 -> 167 paise (₹1.67)
    expect(b.paymentGatewayGstPaise).toBe(167);

    // 7. Section 52 TCS: 48000 * 1.0% = 480 paise (₹4.80)
    expect(b.tcsDeductionPaise).toBe(480);

    // 8. Section 194-O TDS (with PAN): 48000 * 0.1% = 48 paise (₹0.48)
    expect(b.tdsDeductionPaise).toBe(48);

    // 9. Customer GST Sec 9(5) withheld: 2400 paise
    expect(b.customerGstSec95Paise).toBe(2400);

    // 10. Net Merchant Payable
    // Deductions = 10560 + 1901 + 927 + 167 + 480 + 48 + 2400 + 0 = 16483 paise
    // Net = 55400 - 16483 = 38917 paise (₹389.17)
    expect(b.netMerchantPayablePaise).toBe(38917);
    expect(Number.isSafeInteger(b.netMerchantPayablePaise)).toBe(true);
  });

  it("exempts Payment Gateway fees for Direct NPCI UPI orders", () => {
    const order: DailyOrderRecord = {
      orderId: "ord_ok_direct_upi",
      orderNumber: "OK-UPI-01",
      deliveredAt: "2026-11-17T12:00:00.000Z",
      customerPaidPaise: 40000,
      itemSubtotalPaise: 40000,
      packagingChargePaise: 0,
      customerGstPaise: 2000,
      restaurantDiscountPaise: 0,
      platformDiscountPaise: 0,
      commissionRatePercent: 20.0,
      hasPan: true,
      hasGstin: true,
      paymentMethod: "DIRECT_UPI", // Direct UPI
    };

    const b = SettlementEngine.calculateOrderSettlement(order);
    expect(b.paymentGatewayFeePaise).toBe(0);
    expect(b.paymentGatewayGstPaise).toBe(0);
    expect(b.platformCommissionPaise).toBe(8000); // 40000 * 20%
    expect(b.commissionGstPaise).toBe(1440); // 8000 * 18%
  });

  it("applies 1.0% TDS when PAN is missing under Section 194-O", () => {
    const order: DailyOrderRecord = {
      orderId: "ord_ok_no_pan",
      deliveredAt: "2026-11-17T13:00:00.000Z",
      customerPaidPaise: 20000,
      itemSubtotalPaise: 20000,
      packagingChargePaise: 0,
      customerGstPaise: 1000,
      restaurantDiscountPaise: 0,
      platformDiscountPaise: 0,
      commissionRatePercent: 18.0,
      hasPan: false, // NO PAN -> 1.0% TDS
      hasGstin: false, // NO GSTIN -> 0 TCS
      paymentMethod: "PREPAID_ONLINE",
    };

    const b = SettlementEngine.calculateOrderSettlement(order);
    // Taxable food value = 20000
    // TDS 1% = 200 paise
    expect(b.tdsDeductionPaise).toBe(200);
    expect(b.tcsDeductionPaise).toBe(0);
  });

  it("deducts merchant fault cancellation penalties directly from net settlement", () => {
    const order: DailyOrderRecord = {
      orderId: "ord_ok_penalized",
      deliveredAt: "2026-11-17T15:00:00.000Z",
      customerPaidPaise: 30000,
      itemSubtotalPaise: 30000,
      packagingChargePaise: 0,
      customerGstPaise: 1500,
      restaurantDiscountPaise: 0,
      platformDiscountPaise: 0,
      commissionRatePercent: 20.0,
      hasPan: true,
      hasGstin: true,
      penaltyPaise: 10000, // ₹100.00 merchant fault penalty
      paymentMethod: "PREPAID_ONLINE",
    };

    const b = SettlementEngine.calculateOrderSettlement(order);
    expect(b.penaltyDeductionPaise).toBe(10000);
  });

  it("processes Daily T+1 Settlement Batch with authentic 16-char UTR and deductions", () => {
    const orders: DailyOrderRecord[] = [
      {
        orderId: "ord_batch_1",
        orderNumber: "OK-B01",
        deliveredAt: "2026-11-17T11:00:00.000Z",
        customerPaidPaise: 60000,
        itemSubtotalPaise: 60000,
        packagingChargePaise: 2000,
        customerGstPaise: 3100,
        restaurantDiscountPaise: 0,
        platformDiscountPaise: 0,
        commissionRatePercent: 20.0,
        hasPan: true,
        hasGstin: true,
        paymentMethod: "PREPAID_ONLINE",
      },
      {
        orderId: "ord_batch_2",
        orderNumber: "OK-B02",
        deliveredAt: "2026-11-17T18:00:00.000Z",
        customerPaidPaise: 40000,
        itemSubtotalPaise: 40000,
        packagingChargePaise: 1000,
        customerGstPaise: 2050,
        restaurantDiscountPaise: 0,
        platformDiscountPaise: 0,
        commissionRatePercent: 20.0,
        hasPan: true,
        hasGstin: true,
        paymentMethod: "DIRECT_UPI",
      },
      {
        // Different calendar day - should NOT be included in 2026-11-17 batch
        orderId: "ord_batch_other_day",
        orderNumber: "OK-B03",
        deliveredAt: "2026-11-18T10:00:00.000Z",
        customerPaidPaise: 50000,
        itemSubtotalPaise: 50000,
        packagingChargePaise: 0,
        customerGstPaise: 2500,
        restaurantDiscountPaise: 0,
        platformDiscountPaise: 0,
        commissionRatePercent: 20.0,
        hasPan: true,
        hasGstin: true,
        paymentMethod: "PREPAID_ONLINE",
      },
    ];

    const batch = SettlementEngine.processDailySettlementBatch(orders, "2026-11-17", {
      onboardingFeeAmortizedPaise: 33300, // ₹333.00
      sponsoredAdsCpcDeductedPaise: 15000, // ₹150.00 ad spend
    });

    expect(batch.totalOrdersCount).toBe(2);
    expect(batch.batchDate).toBe("2026-11-17");
    expect(batch.settlementDate).toBe("2026-11-18"); // T+1
    expect(batch.bankUtrNumber).toMatch(/^RZPX\d{6}[A-Z0-9]{6}$/);
    expect(batch.bankUtrNumber.length).toBe(16);
    expect(batch.onboardingFeeAmortizedPaise).toBe(33300);
    expect(batch.sponsoredAdsCpcDeductedPaise).toBe(15000);
    expect(batch.totalNetDisbursedPaise).toBeGreaterThan(0);
    expect(Number.isSafeInteger(batch.totalNetDisbursedPaise)).toBe(true);
  });

  it("generates statutory GSTR-8 tax invoice under platform GSTIN 18AFXPH9838M1Z9", () => {
    const orders: DailyOrderRecord[] = [
      {
        orderId: "ord_gstr8_1",
        deliveredAt: "2026-11-17T12:00:00.000Z",
        customerPaidPaise: 100000,
        itemSubtotalPaise: 100000,
        packagingChargePaise: 0,
        customerGstPaise: 5000,
        restaurantDiscountPaise: 0,
        platformDiscountPaise: 0,
        commissionRatePercent: 20.0,
        hasPan: true,
        hasGstin: true,
      },
    ];

    const batch = SettlementEngine.processDailySettlementBatch(orders, "2026-11-17");
    const gstr8 = SettlementEngine.generateGstr8Invoice(
      [batch],
      {
        merchantLegalName: "Barak Valley Flavours LLP",
        merchantGstin: "18AABCB1234F1Z1",
        merchantPan: "AABCB1234F",
      },
      "2026-11"
    );

    expect(gstr8.platformGstin).toBe("18AFXPH9838M1Z9");
    expect(gstr8.platformTradeName).toBe("Orderkingpay");
    expect(gstr8.sacCode).toBe("996331");
    expect(gstr8.periodMonth).toBe("2026-11");
    expect(gstr8.totalTcsCollectedPaise).toBe(batch.totalTcsDeductionPaise);
    expect(gstr8.cgstTcsCollectedPaise + gstr8.sgstTcsCollectedPaise).toBe(
      gstr8.totalTcsCollectedPaise
    );
  });

  it("exports batch CSV for accounting records with correct statutory headers", () => {
    const orders: DailyOrderRecord[] = [
      {
        orderId: "ord_csv_1",
        orderNumber: "OK-CSV1",
        deliveredAt: "2026-11-17T12:00:00.000Z",
        customerPaidPaise: 50000,
        itemSubtotalPaise: 50000,
        packagingChargePaise: 2000,
        customerGstPaise: 2600,
        restaurantDiscountPaise: 0,
        platformDiscountPaise: 0,
        commissionRatePercent: 20.0,
        hasPan: true,
        hasGstin: true,
      },
    ];

    const batch = SettlementEngine.processDailySettlementBatch(orders, "2026-11-17");
    const csv = SettlementEngine.exportBatchCsv(batch);

    expect(csv).toContain("Order ID,Order #,Gross Order Value (INR),Taxable Food (INR)");
    expect(csv).toContain("Commission (INR),Commission GST (INR),PG Fee (INR)");
    expect(csv).toContain("TCS Sec 52 (INR),TDS Sec 194-O (INR),Customer GST Sec 9(5) (INR)");
    expect(csv).toContain("OK-CSV1");
  });
});
