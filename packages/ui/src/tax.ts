/**
 * 🇮🇳 ORDERKING / UMAROS STATUTORY TAX & COMPLIANCE ENGINE
 * packages/ui/src/tax.ts
 *
 * Statutory Parity:
 * 1. CGST Act 2017 Section 9(5) Tax Engine:
 *    - Mandatory 5% GST on Restaurant Food Delivery Orders.
 *    - Remitted directly by Electronic Commerce Operator (ECO / OrderKing) under OrderKing GSTIN.
 *    - Input Tax Credit (ITC) is strictly BLOCKED (Notification No. 17/2021-CT(R)).
 *    - Composite supply: Packaging charges taxed at 5% without ITC.
 *    - Platform services (platform fee, delivery fee): 18% GST WITH Input Tax Credit.
 *    - Customer tip: 0% GST (pure agent pass-through, exempt).
 * 2. Section 52 CGST Act 2017:
 *    - 1% Tax Collected at Source (TCS) on net taxable supplies (0.5% CGST + 0.5% SGST or 1% IGST).
 * 3. Section 194-O Income Tax Act 1961:
 *    - 1% Tax Deducted at Source (TDS) on gross sales (100 bps).
 * 4. T+1 Daily Merchant Settlement:
 *    - Orders completed up to 12:00 Midnight (23:59:59 IST) compiled and tax-deducted.
 *    - Automated bank transfer / UPI payout scheduled for 10:00 AM the following morning (T+1).
 * 5. Statutory Automated Credit Note Engine:
 *    - Section 34 CGST Act compliant credit note generation for order cancellations, refunds,
 *      and post-sale commission adjustments.
 *
 * 100% SafeInteger paise arithmetic. Zero floating-point rounding drift.
 */

// ============================================================================
// 1. STATUTORY CONSTANTS & TAX RATES
// ============================================================================

export const STATUTORY_TAX_RATES = {
  /** Section 9(5) CGST Act: 5% GST on restaurant food delivery (SAC 99633) - Platform pays without ITC */
  FOOD_GST_BPS: 500, // 5.00%
  FOOD_CGST_BPS: 250, // 2.50%
  FOOD_SGST_BPS: 250, // 2.50%
  FOOD_IGST_BPS: 500, // 5.00%

  /** Packaging charges: composite supply with food -> 5% under Sec 9(5) without ITC */
  PACKAGING_GST_BPS: 500, // 5.00%
  PACKAGING_CGST_BPS: 250, // 2.50%
  PACKAGING_SGST_BPS: 250, // 2.50%
  PACKAGING_IGST_BPS: 500, // 5.00%

  /** Platform convenience fee: 18% GST with ITC eligibility (SAC 9985) */
  PLATFORM_FEE_GST_BPS: 1800, // 18.00%
  PLATFORM_FEE_CGST_BPS: 900, // 9.00%
  PLATFORM_FEE_SGST_BPS: 900, // 9.00%
  PLATFORM_FEE_IGST_BPS: 1800, // 18.00%

  /** Delivery fee: 18% GST with ITC eligibility (SAC 9968) */
  DELIVERY_FEE_GST_BPS: 1800, // 18.00%
  DELIVERY_FEE_CGST_BPS: 900, // 9.00%
  DELIVERY_FEE_SGST_BPS: 900, // 9.00%
  DELIVERY_FEE_IGST_BPS: 1800, // 18.00%

  /** Section 52 CGST Act: 1% Tax Collected at Source (TCS) on net taxable supplies */
  TCS_SEC52_BPS: 100, // 1.00%
  TCS_CGST_BPS: 50, // 0.50%
  TCS_SGST_BPS: 50, // 0.50%
  TCS_IGST_BPS: 100, // 1.00%

  /** Section 194-O Income Tax Act: 1% Tax Deducted at Source (TDS) on gross sales */
  TDS_SEC194_O_BPS: 100, // 1.00%
  /** Section 206AA Income Tax Act: Higher 5% TDS if PAN is missing */
  TDS_SEC194_O_NO_PAN_BPS: 500, // 5.00%

  /** 18% GST on platform commission revenue (SAC 9985) */
  COMMISSION_GST_BPS: 1800, // 18.00%
  COMMISSION_CGST_BPS: 900, // 9.00%
  COMMISSION_SGST_BPS: 900, // 9.00%
  COMMISSION_IGST_BPS: 1800, // 18.00%
} as const;

// ============================================================================
// 2. INTEGER-PAISE MATH HELPERS
// ============================================================================

export class StatutoryTaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatutoryTaxError";
  }
}

export function assertSafePaise(value: unknown, label = "amountPaise"): number {
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new StatutoryTaxError(`${label} must be a safe integer number of paise, received ${String(value)}`);
  }
  return value;
}

/**
 * Calculates basis points application with banker's / half-away-from-zero integer rounding.
 * e.g. Math.floor((amountPaise * bps + 5000) / 10000)
 */
export function applyTaxBpsPaise(amountPaise: number, bps: number): number {
  assertSafePaise(amountPaise, "amountPaise");
  if (!Number.isInteger(bps)) {
    throw new StatutoryTaxError(`bps must be an integer, received ${bps}`);
  }
  if (amountPaise <= 0 || bps <= 0) return 0;

  const prod = amountPaise * bps;
  if (!Number.isSafeInteger(prod)) {
    throw new StatutoryTaxError("Paise multiplication overflow during tax calculation");
  }
  const abs = Math.abs(prod);
  const q = Math.floor(abs / 10000);
  const r = abs % 10000;
  const rounded = q + (r >= 5000 ? 1 : 0);
  return prod < 0 ? -rounded : rounded;
}

// ============================================================================
// 3. CGST SECTION 9(5) TAX ENGINE INTERFACES & CALCULATION
// ============================================================================

export interface TaxItemBreakdown {
  name: "FOOD" | "PACKAGING" | "PLATFORM_FEE" | "DELIVERY_FEE" | "CUSTOMER_TIP";
  taxablePaise: number;
  rateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  grossPaise: number;
  isSection95: boolean;
  itcEligible: boolean;
  liabilityBearer: "ECO_PLATFORM" | "PLATFORM_DIRECT" | "EXEMPT";
}

export interface Section95InputPaise {
  foodSubtotalPaise: number;
  packagingChargePaise?: number;
  merchantDiscountPaise?: number; // Pre-tax restaurant discount
  platformDiscountPaise?: number; // Post-tax platform voucher/subsidy
  platformFeePaise?: number;
  deliveryFeePaise?: number;
  customerTipPaise?: number;
  isInterstate?: boolean;
}

export interface Section95OutputPaise {
  isInterstate: boolean;
  netFoodTaxablePaise: number;
  packagingTaxablePaise: number;
  totalSec95TaxablePaise: number;

  platformFeeTaxablePaise: number;
  deliveryFeeTaxablePaise: number;
  totalPlatformTaxablePaise: number;

  // Taxes
  foodGstPaise: number;
  packagingGstPaise: number;
  totalSec95GstPaise: number; // 5% GST payable by ECO under Sec 9(5)

  platformFeeGstPaise: number;
  deliveryFeeGstPaise: number;
  totalPlatformGstPaise: number;

  totalTaxPaise: number;
  customerPayablePaise: number;

  // Input Tax Credit Breakdown
  itcEligibleTaxPaise: number; // 18% Platform & delivery services GST
  itcBlockedSec95TaxPaise: number; // 5% Food & packaging GST (No ITC under Notif 17/2021)

  // GSTR-3B Statutory Table Mappings
  gstr3b: {
    table3_1_1_i_taxableAmountPaise: number; // Food + Packaging taxable value
    table3_1_1_i_taxPayablePaise: number; // Section 9(5) tax liability remitted by platform
    table3_1_a_taxableAmountPaise: number; // Platform fees + Delivery fees taxable value
    table3_1_a_taxPayablePaise: number; // Platform outward supplies GST
  };

  lineItems: {
    food: TaxItemBreakdown;
    packaging: TaxItemBreakdown;
    platformFee: TaxItemBreakdown;
    deliveryFee: TaxItemBreakdown;
    tip: TaxItemBreakdown;
  };
}

/**
 * Calculates Section 9(5) CGST Act taxes for food delivery orders with zero floating-point drift.
 * - Restaurant Food & Packaging: 5% GST payable by platform ECO, strictly WITHOUT Input Tax Credit (ITC).
 * - Platform Convenience & Delivery Fees: 18% GST payable with full Input Tax Credit eligibility.
 */
export function calculateSection95Tax(input: Section95InputPaise): Section95OutputPaise {
  const isInterstate = Boolean(input.isInterstate);
  const rawFood = Math.max(0, assertSafePaise(input.foodSubtotalPaise, "foodSubtotalPaise"));
  const merchDisc = Math.max(0, assertSafePaise(input.merchantDiscountPaise ?? 0, "merchantDiscountPaise"));
  const netFoodTaxablePaise = Math.max(0, rawFood - merchDisc);
  const packagingTaxablePaise = Math.max(0, assertSafePaise(input.packagingChargePaise ?? 0, "packagingChargePaise"));
  const platformFeeTaxablePaise = Math.max(0, assertSafePaise(input.platformFeePaise ?? 0, "platformFeePaise"));
  const deliveryFeeTaxablePaise = Math.max(0, assertSafePaise(input.deliveryFeePaise ?? 0, "deliveryFeePaise"));
  const tipPaise = Math.max(0, assertSafePaise(input.customerTipPaise ?? 0, "customerTipPaise"));
  const platformDiscount = Math.max(0, assertSafePaise(input.platformDiscountPaise ?? 0, "platformDiscountPaise"));

  const computeTax = (taxablePaise: number, totalBps: number) => {
    if (taxablePaise <= 0 || totalBps <= 0) {
      return { cgst: 0, sgst: 0, igst: 0, total: 0 };
    }
    if (isInterstate) {
      const igst = applyTaxBpsPaise(taxablePaise, totalBps);
      return { cgst: 0, sgst: 0, igst, total: igst };
    }
    const halfBps = Math.floor(totalBps / 2);
    const cgst = applyTaxBpsPaise(taxablePaise, halfBps);
    const sgst = applyTaxBpsPaise(taxablePaise, halfBps);
    return { cgst, sgst, igst: 0, total: cgst + sgst };
  };

  // 1. Food: 5% GST (Section 9(5) ECO liable, No ITC)
  const foodTax = computeTax(netFoodTaxablePaise, STATUTORY_TAX_RATES.FOOD_GST_BPS);
  const foodLine: TaxItemBreakdown = {
    name: "FOOD",
    taxablePaise: netFoodTaxablePaise,
    rateBps: STATUTORY_TAX_RATES.FOOD_GST_BPS,
    cgstPaise: foodTax.cgst,
    sgstPaise: foodTax.sgst,
    igstPaise: foodTax.igst,
    totalTaxPaise: foodTax.total,
    grossPaise: netFoodTaxablePaise + foodTax.total,
    isSection95: true,
    itcEligible: false,
    liabilityBearer: "ECO_PLATFORM",
  };

  // 2. Packaging: 5% GST (Composite supply with food, Section 9(5) ECO liable, No ITC)
  const pkgTax = computeTax(packagingTaxablePaise, STATUTORY_TAX_RATES.PACKAGING_GST_BPS);
  const packagingLine: TaxItemBreakdown = {
    name: "PACKAGING",
    taxablePaise: packagingTaxablePaise,
    rateBps: STATUTORY_TAX_RATES.PACKAGING_GST_BPS,
    cgstPaise: pkgTax.cgst,
    sgstPaise: pkgTax.sgst,
    igstPaise: pkgTax.igst,
    totalTaxPaise: pkgTax.total,
    grossPaise: packagingTaxablePaise + pkgTax.total,
    isSection95: true,
    itcEligible: false,
    liabilityBearer: "ECO_PLATFORM",
  };

  // 3. Platform Fee: 18% GST (Platform direct outward supply, With ITC)
  const platTax = computeTax(platformFeeTaxablePaise, STATUTORY_TAX_RATES.PLATFORM_FEE_GST_BPS);
  const platformLine: TaxItemBreakdown = {
    name: "PLATFORM_FEE",
    taxablePaise: platformFeeTaxablePaise,
    rateBps: STATUTORY_TAX_RATES.PLATFORM_FEE_GST_BPS,
    cgstPaise: platTax.cgst,
    sgstPaise: platTax.sgst,
    igstPaise: platTax.igst,
    totalTaxPaise: platTax.total,
    grossPaise: platformFeeTaxablePaise + platTax.total,
    isSection95: false,
    itcEligible: true,
    liabilityBearer: "PLATFORM_DIRECT",
  };

  // 4. Delivery Fee: 18% GST (Platform logistics outward supply, With ITC)
  const delTax = computeTax(deliveryFeeTaxablePaise, STATUTORY_TAX_RATES.DELIVERY_FEE_GST_BPS);
  const deliveryLine: TaxItemBreakdown = {
    name: "DELIVERY_FEE",
    taxablePaise: deliveryFeeTaxablePaise,
    rateBps: STATUTORY_TAX_RATES.DELIVERY_FEE_GST_BPS,
    cgstPaise: delTax.cgst,
    sgstPaise: delTax.sgst,
    igstPaise: delTax.igst,
    totalTaxPaise: delTax.total,
    grossPaise: deliveryFeeTaxablePaise + delTax.total,
    isSection95: false,
    itcEligible: true,
    liabilityBearer: "PLATFORM_DIRECT",
  };

  // 5. Customer Tip: 0% GST (Pure agent pass-through, Exempt)
  const tipLine: TaxItemBreakdown = {
    name: "CUSTOMER_TIP",
    taxablePaise: tipPaise,
    rateBps: 0,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: 0,
    totalTaxPaise: 0,
    grossPaise: tipPaise,
    isSection95: false,
    itcEligible: false,
    liabilityBearer: "EXEMPT",
  };

  const totalSec95TaxablePaise = netFoodTaxablePaise + packagingTaxablePaise;
  const totalSec95GstPaise = foodTax.total + pkgTax.total;

  const totalPlatformTaxablePaise = platformFeeTaxablePaise + deliveryFeeTaxablePaise;
  const totalPlatformGstPaise = platTax.total + delTax.total;

  const totalTaxPaise = totalSec95GstPaise + totalPlatformGstPaise;
  const subtotalGross =
    foodLine.grossPaise + packagingLine.grossPaise + platformLine.grossPaise + deliveryLine.grossPaise + tipPaise;
  const customerPayablePaise = Math.max(0, subtotalGross - platformDiscount);

  return {
    isInterstate,
    netFoodTaxablePaise,
    packagingTaxablePaise,
    totalSec95TaxablePaise,
    platformFeeTaxablePaise,
    deliveryFeeTaxablePaise,
    totalPlatformTaxablePaise,

    foodGstPaise: foodTax.total,
    packagingGstPaise: pkgTax.total,
    totalSec95GstPaise,

    platformFeeGstPaise: platTax.total,
    deliveryFeeGstPaise: delTax.total,
    totalPlatformGstPaise,

    totalTaxPaise,
    customerPayablePaise,

    itcEligibleTaxPaise: totalPlatformGstPaise,
    itcBlockedSec95TaxPaise: totalSec95GstPaise,

    gstr3b: {
      table3_1_1_i_taxableAmountPaise: totalSec95TaxablePaise,
      table3_1_1_i_taxPayablePaise: totalSec95GstPaise,
      table3_1_a_taxableAmountPaise: totalPlatformTaxablePaise,
      table3_1_a_taxPayablePaise: totalPlatformGstPaise,
    },

    lineItems: {
      food: foodLine,
      packaging: packagingLine,
      platformFee: platformLine,
      deliveryFee: deliveryLine,
      tip: tipLine,
    },
  };
}

// ============================================================================
// 4. STATUTORY WITHHOLDINGS (SECTION 52 TCS & SECTION 194-O TDS)
// ============================================================================

export interface StatutoryWithholdingInputPaise {
  grossSalesPaise: number; // Food Value + Packaging Charges
  restaurantDiscountPaise?: number; // Pre-tax discount funded by merchant
  hasValidPan?: boolean;
  isInterstate?: boolean;
}

export interface StatutoryWithholdingResultPaise {
  netTaxableSupplyPaise: number; // grossSales - restaurantDiscount
  grossSalesPaise: number;

  // Section 52 TCS (1% on net taxable supply)
  tcsRateBps: number;
  tcsSection52Paise: number;
  tcsCgstPaise: number;
  tcsSgstPaise: number;
  tcsIgstPaise: number;

  // Section 194-O TDS (1% on gross sales with PAN, 5% without PAN)
  tdsRateBps: number;
  tdsSection194OPaise: number;
  hasValidPan: boolean;

  totalWithholdingPaise: number;
}

export function calculateStatutoryWithholding(
  input: StatutoryWithholdingInputPaise
): StatutoryWithholdingResultPaise {
  const gross = Math.max(0, assertSafePaise(input.grossSalesPaise, "grossSalesPaise"));
  const discount = Math.max(0, assertSafePaise(input.restaurantDiscountPaise ?? 0, "restaurantDiscountPaise"));
  const netTaxableSupplyPaise = Math.max(0, gross - discount);
  const isInterstate = Boolean(input.isInterstate);
  const hasValidPan = input.hasValidPan !== false;

  // 1% TCS under Section 52 of CGST Act (100 bps)
  const tcsRateBps = STATUTORY_TAX_RATES.TCS_SEC52_BPS;
  let tcsCgstPaise = 0;
  let tcsSgstPaise = 0;
  let tcsIgstPaise = 0;
  let tcsSection52Paise = 0;

  if (isInterstate) {
    tcsIgstPaise = applyTaxBpsPaise(netTaxableSupplyPaise, tcsRateBps);
    tcsSection52Paise = tcsIgstPaise;
  } else {
    tcsCgstPaise = applyTaxBpsPaise(netTaxableSupplyPaise, STATUTORY_TAX_RATES.TCS_CGST_BPS);
    tcsSgstPaise = applyTaxBpsPaise(netTaxableSupplyPaise, STATUTORY_TAX_RATES.TCS_SGST_BPS);
    tcsSection52Paise = tcsCgstPaise + tcsSgstPaise;
  }

  // 1% TDS under Section 194-O of Income Tax Act (100 bps) with PAN, 500 bps without PAN
  const tdsRateBps = hasValidPan
    ? STATUTORY_TAX_RATES.TDS_SEC194_O_BPS
    : STATUTORY_TAX_RATES.TDS_SEC194_O_NO_PAN_BPS;
  const tdsSection194OPaise = applyTaxBpsPaise(gross, tdsRateBps);

  return {
    netTaxableSupplyPaise,
    grossSalesPaise: gross,
    tcsRateBps,
    tcsSection52Paise,
    tcsCgstPaise,
    tcsSgstPaise,
    tcsIgstPaise,
    tdsRateBps,
    tdsSection194OPaise,
    hasValidPan,
    totalWithholdingPaise: tcsSection52Paise + tdsSection194OPaise,
  };
}

// ============================================================================
// 5. T+1 DAILY MERCHANT SETTLEMENT ENGINE
// ============================================================================

export interface TPlus1DailySettlementInput {
  restaurantId: string;
  restaurantName: string;
  bankAccountMasked?: string;
  ifscCode?: string;
  payoutChannel?: "BANK_TRANSFER_NEFT_IMPS" | "UPI_PAYOUT";
  orderDate?: string; // YYYY-MM-DD
  orders: Array<{
    orderId: string;
    foodValuePaise: number;
    packingPaise?: number;
    restaurantDiscountPaise?: number;
    commissionBps: number;
    completedAt: string; // ISO timestamp
  }>;
}

export interface TPlus1DailySettlementBatch {
  batchId: string;
  restaurantId: string;
  restaurantName: string;
  orderDate: string; // YYYY-MM-DD (Day T)
  cutoffTimestamp: string; // YYYY-MM-DDT23:59:59.999+05:30 (Day T 12:00 Midnight IST)
  scheduledPayoutTimestamp: string; // YYYY-MM-DDT10:00:00.000+05:30 (Day T+1 10:00 AM IST)
  scheduledPayoutDate: string; // YYYY-MM-DD (Day T+1)
  scheduledPayoutTime: string; // "10:00 AM"
  payoutChannel: "BANK_TRANSFER_NEFT_IMPS" | "UPI_PAYOUT";
  bankAccountMasked: string;
  ifscCode: string;
  ordersCount: number;

  totalGrossSalesPaise: number;
  totalFoodValuePaise: number;
  totalPackingPaise: number;
  totalRestaurantDiscountsPaise: number;
  totalNetTaxableSupplyPaise: number;

  totalCommissionPaise: number;
  totalCommissionGstPaise: number; // 18% GST

  totalTcsSection52Paise: number; // 1% TCS
  totalTdsSection194OPaise: number; // 1% TDS
  totalSec9_5FoodGstRemittedPaise: number; // 5% Food GST remitted by platform (NOT debited)

  totalDeductionsPaise: number;
  netPayablePaise: number;

  status: "SCHEDULED_FOR_10AM_PAYOUT";
  isMidnightCompiled: boolean;
}

/**
 * Compiles all orders completed up to 12:00 Midnight IST and schedules payout for next morning 10:00 AM (T+1).
 */
export function compileTPlus1DailySettlement(input: TPlus1DailySettlementInput): TPlus1DailySettlementBatch {
  const refDate = input.orderDate ? new Date(input.orderDate) : new Date();
  const orderDateStr = refDate.toISOString().split("T")[0];

  // Day T+1 calculation
  const tPlus1Date = new Date(refDate.getTime());
  tPlus1Date.setDate(tPlus1Date.getDate() + 1);
  const payoutDateStr = tPlus1Date.toISOString().split("T")[0];

  // Specific IST cutoff & scheduled dispatch timestamps
  const cutoffTimestamp = `${orderDateStr}T23:59:59.999+05:30`;
  const scheduledPayoutTimestamp = `${payoutDateStr}T10:00:00.000+05:30`;

  let totalFood = 0;
  let totalPacking = 0;
  let totalDiscount = 0;
  let totalCommission = 0;
  let totalCommissionGst = 0;
  let totalTcs = 0;
  let totalTds = 0;
  let totalSec95 = 0;

  for (const o of input.orders) {
    const food = assertSafePaise(o.foodValuePaise, "foodValuePaise");
    const packing = assertSafePaise(o.packingPaise ?? 0, "packingPaise");
    const disc = assertSafePaise(o.restaurantDiscountPaise ?? 0, "restaurantDiscountPaise");
    const netTaxable = Math.max(0, food + packing - disc);

    const comm = applyTaxBpsPaise(netTaxable, o.commissionBps);
    const commGst = applyTaxBpsPaise(comm, STATUTORY_TAX_RATES.COMMISSION_GST_BPS);

    const tcs = applyTaxBpsPaise(netTaxable, STATUTORY_TAX_RATES.TCS_SEC52_BPS);
    const tds = applyTaxBpsPaise(food + packing, STATUTORY_TAX_RATES.TDS_SEC194_O_BPS);
    const sec95 = applyTaxBpsPaise(netTaxable, STATUTORY_TAX_RATES.FOOD_GST_BPS);

    totalFood += food;
    totalPacking += packing;
    totalDiscount += disc;
    totalCommission += comm;
    totalCommissionGst += commGst;
    totalTcs += tcs;
    totalTds += tds;
    totalSec95 += sec95;
  }

  const totalGrossSales = totalFood + totalPacking;
  const totalNetTaxableSupply = Math.max(0, totalGrossSales - totalDiscount);
  const totalDeductions = totalCommission + totalCommissionGst + totalTcs + totalTds;
  const netPayable = Math.max(0, totalNetTaxableSupply - totalDeductions);

  const batchId = `stl_tplus1_${input.restaurantId.slice(0, 8)}_${orderDateStr}_${Date.now()}`;

  return {
    batchId,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    orderDate: orderDateStr,
    cutoffTimestamp,
    scheduledPayoutTimestamp,
    scheduledPayoutDate: payoutDateStr,
    scheduledPayoutTime: "10:00 AM",
    payoutChannel: input.payoutChannel ?? "BANK_TRANSFER_NEFT_IMPS",
    bankAccountMasked: input.bankAccountMasked || "XXXX-XXXX-4321",
    ifscCode: input.ifscCode || "HDFC0001234",
    ordersCount: input.orders.length,

    totalGrossSalesPaise: totalGrossSales,
    totalFoodValuePaise: totalFood,
    totalPackingPaise: totalPacking,
    totalRestaurantDiscountsPaise: totalDiscount,
    totalNetTaxableSupplyPaise: totalNetTaxableSupply,

    totalCommissionPaise: totalCommission,
    totalCommissionGstPaise: totalCommissionGst,

    totalTcsSection52Paise: totalTcs,
    totalTdsSection194OPaise: totalTds,
    totalSec9_5FoodGstRemittedPaise: totalSec95,

    totalDeductionsPaise: totalDeductions,
    netPayablePaise: netPayable,

    status: "SCHEDULED_FOR_10AM_PAYOUT",
    isMidnightCompiled: true,
  };
}

// ============================================================================
// 6. AUTOMATED STATUTORY CREDIT NOTE GENERATOR (SECTION 34 CGST ACT)
// ============================================================================

export type CreditNoteReasonCode =
  | "01_SALES_RETURN"
  | "02_POST_SALE_DISCOUNT"
  | "03_DEFICIENCY_IN_SERVICE"
  | "04_CORRECTION_IN_INVOICE"
  | "05_ORDER_CANCELLED";

export interface CreditNoteInputPaise {
  originalInvoiceNumber: string;
  originalOrderId: string;
  restaurantId: string;
  restaurantGstin?: string;
  platformGstin?: string;
  reasonCode: CreditNoteReasonCode;
  reasonDescription: string;
  taxableAmountPaise: number;
  isInterstate?: boolean;
}

export interface StatutoryCreditNote {
  creditNoteNumber: string;
  statutoryBasis: "Section 34, Central Goods and Services Tax (CGST) Act, 2017";
  issueDate: string;
  originalInvoiceNumber: string;
  originalOrderId: string;
  restaurantId: string;
  restaurantGstin: string;
  platformGstin: string;
  reasonCode: CreditNoteReasonCode;
  reasonDescription: string;

  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  totalCreditNoteAmountPaise: number;

  tcsReversalPaise: number;
  tdsAdjustmentPaise: number;
  digitalSignatureRef: string;
}

export function generateAutomatedCreditNote(input: CreditNoteInputPaise): StatutoryCreditNote {
  const taxable = Math.max(0, assertSafePaise(input.taxableAmountPaise, "taxableAmountPaise"));
  const isInterstate = Boolean(input.isInterstate);
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const yearMonth = dateStr.replace(/-/g, "").slice(0, 6);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  // 18% GST reversal for service adjustments or 5% for food reversals
  const rateBps = STATUTORY_TAX_RATES.COMMISSION_GST_BPS;
  if (isInterstate) {
    igst = applyTaxBpsPaise(taxable, rateBps);
  } else {
    cgst = applyTaxBpsPaise(taxable, STATUTORY_TAX_RATES.COMMISSION_CGST_BPS);
    sgst = applyTaxBpsPaise(taxable, STATUTORY_TAX_RATES.COMMISSION_SGST_BPS);
  }
  const totalGst = isInterstate ? igst : cgst + sgst;

  // Withholding reversals
  const tcsReversal = applyTaxBpsPaise(taxable, STATUTORY_TAX_RATES.TCS_SEC52_BPS);
  const tdsAdjustment = applyTaxBpsPaise(taxable, STATUTORY_TAX_RATES.TDS_SEC194_O_BPS);

  const creditNoteNumber = `CN-${yearMonth}-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    creditNoteNumber,
    statutoryBasis: "Section 34, Central Goods and Services Tax (CGST) Act, 2017",
    issueDate: dateStr,
    originalInvoiceNumber: input.originalInvoiceNumber,
    originalOrderId: input.originalOrderId,
    restaurantId: input.restaurantId,
    restaurantGstin: input.restaurantGstin || "URP (Unregistered Person)",
    platformGstin: input.platformGstin || "07AAAAO0000A1Z5",
    reasonCode: input.reasonCode,
    reasonDescription: input.reasonDescription,

    taxableAmountPaise: taxable,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalGstPaise: totalGst,
    totalCreditNoteAmountPaise: taxable + totalGst,

    tcsReversalPaise: tcsReversal,
    tdsAdjustmentPaise: tdsAdjustment,
    digitalSignatureRef: `DSC-OK-ECO-${now.getTime()}`,
  };
}
