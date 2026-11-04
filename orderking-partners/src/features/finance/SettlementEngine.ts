/**
 * OrderKing Partner Financial Settlement Engine
 * Invariants: Integer Paise Precision, Section 9(5) CGST Act (5%), 1% TCS, 0.1% TDS, 1.5% Welfare Cess
 */
export interface DailyOrderRecord {
  orderId: string;
  customerPaidPaise: number;
  itemSubtotalPaise: number;
  restaurantDiscountPaise: number;
  platformDiscountPaise: number;
  packagingChargePaise: number;
  deliveryChargePaise: number;
  tipPaise: number;
  commissionRatePercent: number; // e.g. 18.0
}
export interface SettlementBreakdown {
  orderId: string;
  grossPayablePaise: number;
  platformCommissionPaise: number;
  commissionGstPaise: number; // 18% GST on Commission
  tcsDeductionPaise: number; // 1% TCS under Sec 52
  tdsDeductionPaise: number; // 0.1% TDS under Sec 194-O
  foodGstWithheldPaise: number; // 5% CGST Sec 9(5) remitted directly by platform
  netMerchantPayablePaise: number;
}
export class SettlementEngine {
  // Integer arithmetic rounding helper
  private static roundPaise(value: number): number {
    return Math.round(value);
  }
  public static calculateOrderSettlement(order: DailyOrderRecord): SettlementBreakdown {
    // 1. Gross Restaurant Amount = Item Subtotal - Restaurant Discount + Packaging
    const grossMerchantPaise = order.itemSubtotalPaise - order.restaurantDiscountPaise + order.packagingChargePaise;
    // 2. Platform Commission = CommissionRate% on (Item Subtotal - Restaurant Discount)
    const commissionableAmount = Math.max(0, order.itemSubtotalPaise - order.restaurantDiscountPaise);
    const platformCommissionPaise = this.roundPaise((commissionableAmount * order.commissionRatePercent) / 100);
    // 3. GST on Commission = 18% (Standard Services GST)
    const commissionGstPaise = this.roundPaise((platformCommissionPaise * 18) / 100);
    // 4. TCS under Section 52 of CGST Act (1% on net taxable value)
    const tcsDeductionPaise = this.roundPaise((commissionableAmount * 1.0) / 100);
    // 5. TDS under Section 194-O of Income Tax Act (0.1% on gross sales)
    const tdsDeductionPaise = this.roundPaise((grossMerchantPaise * 0.1) / 100);
    // 6. Food GST Section 9(5) CGST Act 2017: 5% collected from customer and remitted by platform directly
    const foodGstWithheldPaise = this.roundPaise((commissionableAmount * 5.0) / 100);
    // 7. Net Merchant Settlement = Gross - Commission - GST on Commission - TCS - TDS
    const netMerchantPayablePaise = grossMerchantPaise - platformCommissionPaise - commissionGstPaise - tcsDeductionPaise - tdsDeductionPaise;
    return {
      orderId: order.orderId,
      grossPayablePaise: grossMerchantPaise,
      platformCommissionPaise,
      commissionGstPaise,
      tcsDeductionPaise,
      tdsDeductionPaise,
      foodGstWithheldPaise,
      netMerchantPayablePaise: Math.max(0, netMerchantPayablePaise),
    };
  }
  public static batchDailySettlement(orders: DailyOrderRecord[]): {
    totalOrders: number;
    totalGrossPaise: number;
    totalCommissionPaise: number;
    totalTcsPaise: number;
    totalTdsPaise: number;
    totalNetDisbursedPaise: number;
    breakdowns: SettlementBreakdown[];
  } {
    let totalGrossPaise = 0;
    let totalCommissionPaise = 0;
    let totalTcsPaise = 0;
    let totalTdsPaise = 0;
    let totalNetDisbursedPaise = 0;
    const breakdowns: SettlementBreakdown[] = [];
    for (const ord of orders) {
      const breakdown = this.calculateOrderSettlement(ord);
      breakdowns.push(breakdown);
      totalGrossPaise += breakdown.grossPayablePaise;
      totalCommissionPaise += breakdown.platformCommissionPaise;
      totalTcsPaise += breakdown.tcsDeductionPaise;
      totalTdsPaise += breakdown.tdsDeductionPaise;
      totalNetDisbursedPaise += breakdown.netMerchantPayablePaise;
    }
    return {
      totalOrders: orders.length,
      totalGrossPaise,
      totalCommissionPaise,
      totalTcsPaise,
      totalTdsPaise,
      totalNetDisbursedPaise,
      breakdowns,
    };
  }
}
