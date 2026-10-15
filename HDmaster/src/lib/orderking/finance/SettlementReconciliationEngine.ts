/**
 * SettlementReconciliationEngine
 * 
 * Strict Indian Statutory Tax Compliance & Dual Settlement Reconciliation Engine:
 * 1. Section 9(5) CGST Act 2017:
 *    5% GST on restaurant food bills collected by the platform and remitted directly
 *    under OrderKing GSTIN (the restaurant does not pay output tax on delivery orders).
 * 2. Section 52 CGST Act 2017:
 *    1% TCS (0.5% CGST + 0.5% SGST) deducted from net restaurant sales.
 * 3. Section 194-O Income Tax Act 1961:
 *    1% TDS deducted on gross sales for registered PANs.
 * 4. Section 9(1) CGST Act 2017:
 *    18% GST on platform service revenue (commissions, gateway fees, express liquidity fee).
 * 
 * Dual Settlement Cycles:
 * - Standard Cycle: Weekly Wednesday settlement for Monday 00:00:00 to Sunday 23:59:59 IST orders (0% liquidity fee).
 * - Express Daily Cycle (T+1): Daily payout of yesterday's net earnings for a nominal 0.5% early-liquidity fee.
 * 
 * ZERO floating-point money. Precise SafeInteger and BigInt paise math everywhere.
 */

import {
  STATUTORY_TAX_RATES,
  applyTaxBps,
  assertSafePaise,
  calculateSection9_5FoodGST,
  calculateSection52TCS,
  calculateSection194OTDS,
  calculatePlatformServiceGST,
} from "../revenue/tax-calculator";

export type SettlementCycleType = "STANDARD_WEEKLY" | "EXPRESS_DAILY";

export interface OrderReconciliationInput {
  orderId: string;
  orderNumber: string;
  placedAt: string;
  foodValuePaise: number;
  packingPaise?: number;
  restaurantDiscountPaise?: number;
  platformDiscountPaise?: number;
  commissionBps: number;
  gatewayFeeBps?: number;
  penaltiesPaise?: number;
  otherDeductionsPaise?: number;
  otherDeductionsCode?: string | null;
  refundAdjustmentPaise?: number;
  hasValidPan?: boolean;
  panNumber?: string;
  isInterstate?: boolean;
  cycleType?: SettlementCycleType;
}

export interface OrderReconciliationStatement {
  orderId: string;
  orderNumber: string;
  placedAt: string;
  cycleType: SettlementCycleType;
  
  // Gross & Net Sales
  foodValuePaise: number;
  packingPaise: number;
  grossSalesPaise: number;
  
  // Customer Discounts
  customerDiscountsPaise: number;
  restaurantDiscountPaise: number;
  platformDiscountPaise: number;
  netTaxableSupplyPaise: number;

  // Platform Commission & 18% GST
  platformCommissionPaise: number;
  gstOnCommissionPaise: number;
  cgstOnCommissionPaise: number;
  sgstOnCommissionPaise: number;

  // Gateway Fees & 18% GST
  gatewayFeePaise: number;
  gstOnGatewayFeePaise: number;

  // Penalties & Other Permitted Deductions
  penaltiesPaise: number;
  otherDeductionsPaise: number;
  otherDeductionsCode: string | null;
  refundAdjustmentPaise: number;

  // Indian Statutory Withholdings Debited from Merchant
  tcsSection52Paise: number;
  tcsCgstPaise: number;
  tcsSgstPaise: number;
  tdsSection194OPaise: number;
  totalStatutoryWithholdingsPaise: number;

  // Section 9(5) CGST Act (Platform Liability remitted under OrderKing GSTIN; NOT debited from merchant)
  sec9_5FoodGstPaise: number;
  sec9_5RemittanceGstin: string;

  // Express Daily (T+1) Early Liquidity Fee (0.5% + 18% GST)
  expressEarlyLiquidityFeePaise: number;
  gstOnExpressLiquidityFeePaise: number;

  // Total Deductions & Net Payable
  totalDeductionsPaise: number;
  netPayablePaise: number;
}

export interface BatchReconciliationInput {
  restaurantId: string;
  restaurantName: string;
  cycleType: SettlementCycleType;
  periodStart: string;
  periodEnd: string;
  payoutDate: string;
  orders: OrderReconciliationInput[];
  amortizedOnboardingFeePaise?: number;
  panNumber?: string;
  bankAccountMasked?: string;
}

export interface BatchReconciliationStatement {
  batchId: string;
  restaurantId: string;
  restaurantName: string;
  cycleType: SettlementCycleType;
  periodStart: string;
  periodEnd: string;
  payoutDate: string;
  bankAccountMasked: string;
  ordersCount: number;
  lines: OrderReconciliationStatement[];

  // Batch Aggregates
  totalGrossSalesPaise: number;
  totalFoodValuePaise: number;
  totalPackingPaise: number;
  totalRestaurantDiscountPaise: number;
  totalPlatformDiscountPaise: number;
  totalNetTaxableSupplyPaise: number;

  totalCommissionPaise: number;
  totalGstOnCommissionPaise: number;
  totalGatewayFeePaise: number;
  totalGstOnGatewayFeePaise: number;

  totalPenaltiesPaise: number;
  totalOtherDeductionsPaise: number;
  totalRefundAdjustmentPaise: number;

  totalTcsSection52Paise: number;
  totalTdsSection194OPaise: number;
  totalSec9_5FoodGstRemittedPaise: number;

  totalExpressEarlyLiquidityFeePaise: number;
  totalGstOnExpressLiquidityFeePaise: number;
  amortizedOnboardingFeePaise: number;

  totalDeductionsPaise: number;
  netBatchPayablePaise: number;
  status: "CALCULATED" | "VALIDATED" | "INITIATED" | "PAID";
}

/** Legacy OrderFinancials interface preserved for backward compatibility */
export interface OrderFinancials {
  orderId: string;
  subtotal: bigint;
  taxRateBps: bigint;
  platformFeeBps: bigint;
  deductions: bigint;
}

export interface SettlementResult {
  orderId: string;
  subtotal: bigint;
  taxAmount: bigint;
  platformFee: bigint;
  deductions: bigint;
  partnerPayout: bigint;
}

export class SettlementReconciliationEngine {
  /**
   * Generates order-level reconciliation statement in exact SafeInteger paise.
   * Complies with Section 9(5) CGST, Section 52 TCS, Section 194-O TDS, and 18% GST.
   */
  public reconcileOrder(input: OrderReconciliationInput): OrderReconciliationStatement {
    const food = assertSafePaise(input.foodValuePaise, "foodValuePaise");
    const packing = assertSafePaise(input.packingPaise ?? 0, "packingPaise");
    const restDisc = assertSafePaise(input.restaurantDiscountPaise ?? 0, "restaurantDiscountPaise");
    const platDisc = assertSafePaise(input.platformDiscountPaise ?? 0, "platformDiscountPaise");
    const penalties = assertSafePaise(input.penaltiesPaise ?? 0, "penaltiesPaise");
    const otherDeductions = assertSafePaise(input.otherDeductionsPaise ?? 0, "otherDeductionsPaise");
    const refundAdj = assertSafePaise(input.refundAdjustmentPaise ?? 0, "refundAdjustmentPaise");
    const cycleType: SettlementCycleType = input.cycleType ?? "STANDARD_WEEKLY";
    const isInterstate = Boolean(input.isInterstate);

    // 1. Gross Sales = Food Value + Packaging Charges
    const grossSalesPaise = food + packing;

    // 2. Net Taxable Supply = Gross Sales - Restaurant-Funded Discounts
    const netTaxableSupplyPaise = Math.max(0, grossSalesPaise - restDisc);

    // 3. Platform Commission on Net Taxable Supply
    const platformCommissionPaise = applyTaxBps(netTaxableSupplyPaise, input.commissionBps);
    const commGst = calculatePlatformServiceGST(platformCommissionPaise, isInterstate);

    // 4. Payment Gateway Fee & 18% GST (default 1.8% / 180 bps on gross transaction)
    const gwBps = input.gatewayFeeBps ?? STATUTORY_TAX_RATES.STANDARD_PAYMENT_GATEWAY_FEE_BPS;
    const gatewayFeePaise = applyTaxBps(grossSalesPaise, gwBps);
    const gwGst = calculatePlatformServiceGST(gatewayFeePaise, isInterstate);

    // 5. Statutory Withholdings
    // Section 52 CGST Act: 1% TCS on Net Taxable Supply
    const tcs = calculateSection52TCS(netTaxableSupplyPaise, isInterstate);

    // Section 194-O Income Tax Act: 1% TDS on Gross Sales
    const hasValidPan = input.hasValidPan ?? Boolean(input.panNumber && input.panNumber.length === 10);
    const tds = calculateSection194OTDS(grossSalesPaise, hasValidPan, input.panNumber);

    // Section 9(5) CGST Act: 5% Food GST remitted by Platform (NOT debited from merchant)
    const sec9_5 = calculateSection9_5FoodGST(netTaxableSupplyPaise, isInterstate);

    // 6. Express Daily (T+1) Early Liquidity Fee (0.5% + 18% GST)
    let expressEarlyLiquidityFeePaise = 0;
    let gstOnExpressLiquidityFeePaise = 0;
    if (cycleType === "EXPRESS_DAILY") {
      // Net earnings before early liquidity deduction:
      const preliminaryNet = Math.max(
        0,
        grossSalesPaise -
          restDisc +
          platDisc -
          (platformCommissionPaise +
            commGst.totalGstPaise +
            gatewayFeePaise +
            gwGst.totalGstPaise +
            penalties +
            otherDeductions +
            tcs.totalTcsPaise +
            tds.tdsPaise) +
          refundAdj
      );
      expressEarlyLiquidityFeePaise = applyTaxBps(
        preliminaryNet,
        STATUTORY_TAX_RATES.EXPRESS_DAILY_EARLY_LIQUIDITY_FEE_BPS
      );
      const expressGst = calculatePlatformServiceGST(expressEarlyLiquidityFeePaise, isInterstate);
      gstOnExpressLiquidityFeePaise = expressGst.totalGstPaise;
    }

    // Total deductions debited from merchant
    const totalDeductionsPaise =
      platformCommissionPaise +
      commGst.totalGstPaise +
      gatewayFeePaise +
      gwGst.totalGstPaise +
      penalties +
      otherDeductions +
      tcs.totalTcsPaise +
      tds.tdsPaise +
      expressEarlyLiquidityFeePaise +
      gstOnExpressLiquidityFeePaise;

    // Net Restaurant Payable in exact integer paise
    const netPayablePaise = Math.max(
      0,
      grossSalesPaise - restDisc + platDisc - totalDeductionsPaise + refundAdj
    );

    return {
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      placedAt: input.placedAt,
      cycleType,
      foodValuePaise: food,
      packingPaise: packing,
      grossSalesPaise,
      customerDiscountsPaise: restDisc + platDisc,
      restaurantDiscountPaise: restDisc,
      platformDiscountPaise: platDisc,
      netTaxableSupplyPaise,
      platformCommissionPaise,
      gstOnCommissionPaise: commGst.totalGstPaise,
      cgstOnCommissionPaise: commGst.cgstPaise,
      sgstOnCommissionPaise: commGst.sgstPaise,
      gatewayFeePaise,
      gstOnGatewayFeePaise: gwGst.totalGstPaise,
      penaltiesPaise: penalties,
      otherDeductionsPaise: otherDeductions,
      otherDeductionsCode: input.otherDeductionsCode ?? null,
      refundAdjustmentPaise: refundAdj,
      tcsSection52Paise: tcs.totalTcsPaise,
      tcsCgstPaise: tcs.cgstTcsPaise,
      tcsSgstPaise: tcs.sgstTcsPaise,
      tdsSection194OPaise: tds.tdsPaise,
      totalStatutoryWithholdingsPaise: tcs.totalTcsPaise + tds.tdsPaise,
      sec9_5FoodGstPaise: sec9_5.totalGstPaise,
      sec9_5RemittanceGstin: sec9_5.remittanceGstin,
      expressEarlyLiquidityFeePaise,
      gstOnExpressLiquidityFeePaise,
      totalDeductionsPaise,
      netPayablePaise,
    };
  }

  /**
   * Generates batch reconciliation statement aggregating all orders in a settlement cycle.
   */
  public reconcileBatch(input: BatchReconciliationInput): BatchReconciliationStatement {
    const lines = input.orders.map((o) =>
      this.reconcileOrder({
        ...o,
        cycleType: input.cycleType,
        panNumber: o.panNumber ?? input.panNumber,
      })
    );

    const totalFoodValuePaise = lines.reduce((s, l) => s + l.foodValuePaise, 0);
    const totalPackingPaise = lines.reduce((s, l) => s + l.packingPaise, 0);
    const totalGrossSalesPaise = lines.reduce((s, l) => s + l.grossSalesPaise, 0);
    const totalRestaurantDiscountPaise = lines.reduce((s, l) => s + l.restaurantDiscountPaise, 0);
    const totalPlatformDiscountPaise = lines.reduce((s, l) => s + l.platformDiscountPaise, 0);
    const totalNetTaxableSupplyPaise = lines.reduce((s, l) => s + l.netTaxableSupplyPaise, 0);

    const totalCommissionPaise = lines.reduce((s, l) => s + l.platformCommissionPaise, 0);
    const totalGstOnCommissionPaise = lines.reduce((s, l) => s + l.gstOnCommissionPaise, 0);
    const totalGatewayFeePaise = lines.reduce((s, l) => s + l.gatewayFeePaise, 0);
    const totalGstOnGatewayFeePaise = lines.reduce((s, l) => s + l.gstOnGatewayFeePaise, 0);

    const totalPenaltiesPaise = lines.reduce((s, l) => s + l.penaltiesPaise, 0);
    const totalOtherDeductionsPaise = lines.reduce((s, l) => s + l.otherDeductionsPaise, 0);
    const totalRefundAdjustmentPaise = lines.reduce((s, l) => s + l.refundAdjustmentPaise, 0);

    const totalTcsSection52Paise = lines.reduce((s, l) => s + l.tcsSection52Paise, 0);
    const totalTdsSection194OPaise = lines.reduce((s, l) => s + l.tdsSection194OPaise, 0);
    const totalSec9_5FoodGstRemittedPaise = lines.reduce((s, l) => s + l.sec9_5FoodGstPaise, 0);

    const totalExpressEarlyLiquidityFeePaise = lines.reduce((s, l) => s + l.expressEarlyLiquidityFeePaise, 0);
    const totalGstOnExpressLiquidityFeePaise = lines.reduce((s, l) => s + l.gstOnExpressLiquidityFeePaise, 0);

    const onboarding = assertSafePaise(input.amortizedOnboardingFeePaise ?? 0, "amortizedOnboardingFeePaise");

    const totalOrderPayable = lines.reduce((s, l) => s + l.netPayablePaise, 0);
    const netBatchPayablePaise = Math.max(0, totalOrderPayable - onboarding);

    const totalDeductionsPaise =
      lines.reduce((s, l) => s + l.totalDeductionsPaise, 0) + onboarding;

    const batchId = `batch_${input.cycleType.toLowerCase()}_${input.periodStart}_${Date.now()}`;

    return {
      batchId,
      restaurantId: input.restaurantId,
      restaurantName: input.restaurantName,
      cycleType: input.cycleType,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      payoutDate: input.payoutDate,
      bankAccountMasked: input.bankAccountMasked || "XXXX-XXXX-1234",
      ordersCount: lines.length,
      lines,
      totalGrossSalesPaise,
      totalFoodValuePaise,
      totalPackingPaise,
      totalRestaurantDiscountPaise,
      totalPlatformDiscountPaise,
      totalNetTaxableSupplyPaise,
      totalCommissionPaise,
      totalGstOnCommissionPaise,
      totalGatewayFeePaise,
      totalGstOnGatewayFeePaise,
      totalPenaltiesPaise,
      totalOtherDeductionsPaise,
      totalRefundAdjustmentPaise,
      totalTcsSection52Paise,
      totalTdsSection194OPaise,
      totalSec9_5FoodGstRemittedPaise,
      totalExpressEarlyLiquidityFeePaise,
      totalGstOnExpressLiquidityFeePaise,
      amortizedOnboardingFeePaise: onboarding,
      totalDeductionsPaise,
      netBatchPayablePaise,
      status: "CALCULATED",
    };
  }

  /**
   * Backward-compatible calculateSettlement method using BigInt.
   * Under Section 9(5) CGST Act, platform remits food tax under OrderKing GSTIN,
   * so partner payout is Subtotal - Platform Fee - Deductions.
   */
  public calculateSettlement(order: OrderFinancials): SettlementResult {
    // 5% Food GST under Section 9(5) CGST Act remitted by platform
    const taxAmount = (order.subtotal * order.taxRateBps) / 10000n;

    // Platform Fee (e.g. commission + 18% GST)
    const platformFee = (order.subtotal * order.platformFeeBps) / 10000n;

    // Partner Payout = Subtotal - Platform Fee - Deductions (Sec 9(5) tax is remitted to Govt)
    const partnerPayout = order.subtotal - platformFee - order.deductions;

    if (partnerPayout < 0n) {
      throw new Error(`Negative payout calculated for order ${order.orderId}. Payout: ${partnerPayout}`);
    }

    return {
      orderId: order.orderId,
      subtotal: order.subtotal,
      taxAmount,
      platformFee,
      deductions: order.deductions,
      partnerPayout,
    };
  }
}
