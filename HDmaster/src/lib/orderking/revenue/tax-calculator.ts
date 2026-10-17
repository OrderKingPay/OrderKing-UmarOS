/**
 * Indian Statutory Tax Engine for OrderKing
 * 
 * Strict Indian Statutory Compliance:
 * 1. Section 9(5) CGST Act 2017:
 *    5% GST on restaurant food bills collected by the e-commerce operator (OrderKing)
 *    from the customer and remitted directly to the Government under OrderKing GSTIN.
 *    The restaurant does not pay output tax on delivery orders and does NOT collect this tax.
 * 
 * 2. Section 52 CGST Act 2017:
 *    1% Tax Collected at Source (TCS) (0.5% CGST + 0.5% SGST, or 1% IGST) deducted
 *    from net restaurant sales (gross sales minus restaurant-funded discounts).
 * 
 * 3. Section 194-O Income Tax Act 1961:
 *    1% Tax Deducted at Source (TDS) deducted on gross sales for registered PANs
 *    (5% if PAN is absent/invalid under Section 206AA). Form 16A issued quarterly.
 * 
 * 4. Section 9(1) CGST Act 2017 (SAC 9985):
 *    18% GST on all platform service revenue (commissions, customer platform fees,
 *    onboarding fees, delivery fee margin, early liquidity express fees, and gateway markups).
 * 
 * All monetary calculations use SafeInteger paise math (100 paise = 1 INR).
 * Zero floating-point rounding drift.
 */

export const STATUTORY_TAX_RATES = {
  /** Section 9(5) CGST Act: 5% GST on restaurant food delivery (SAC 99633) */
  SEC_9_5_FOOD_GST_BPS: 500,
  SEC_9_5_CGST_BPS: 250,
  SEC_9_5_SGST_BPS: 250,
  SEC_9_5_IGST_BPS: 500,

  /** Section 52 CGST Act: 0.5% TCS on net taxable supply (CBIC Notification No. 15/2024-CT w.e.f. 10-Jul-2024) */
  SEC_52_TCS_BPS: 50,
  SEC_52_TCS_CGST_BPS: 25,
  SEC_52_TCS_SGST_BPS: 25,
  SEC_52_TCS_IGST_BPS: 50,

  /** Section 194-O Income Tax Act: 0.1% TDS on gross sales with PAN (Finance Act 2024 w.e.f. 01-Oct-2024) */
  SEC_194O_TDS_PAN_BPS: 10,
  /** Section 206AA Income Tax Act: Higher 5% TDS if PAN is missing / invalid */
  SEC_194O_TDS_NO_PAN_BPS: 500,

  /** 18% GST on Platform Service Revenue (SAC 9985) */
  PLATFORM_SERVICE_GST_BPS: 1800,
  PLATFORM_SERVICE_CGST_BPS: 900,
  PLATFORM_SERVICE_SGST_BPS: 900,
  PLATFORM_SERVICE_IGST_BPS: 1800,

  /** Express Daily Cycle (T+1) nominal early-liquidity fee: 0.5% */
  EXPRESS_DAILY_EARLY_LIQUIDITY_FEE_BPS: 50,

  /** Standard Payment Gateway processing fee: 1.8% */
  STANDARD_PAYMENT_GATEWAY_FEE_BPS: 180,
} as const;

export class TaxMathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaxMathError";
  }
}

export function assertSafePaise(value: unknown, label = "amountPaise"): number {
  if (typeof value !== "number" || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new TaxMathError(`${label} must be a safe integer number of paise, received ${String(value)}`);
  }
  return value;
}

/**
 * Calculates basis points application with banker's / half-away-from-zero integer rounding.
 * e.g. amountPaise * bps / 10000.
 */
export function applyTaxBps(amountPaise: number, bps: number): number {
  assertSafePaise(amountPaise, "amountPaise");
  if (!Number.isInteger(bps)) {
    throw new TaxMathError(`bps must be an integer, received ${bps}`);
  }
  const prod = amountPaise * bps;
  if (!Number.isSafeInteger(prod)) {
    throw new TaxMathError("Paise multiplication overflow during statutory tax calculation");
  }
  const abs = Math.abs(prod);
  const q = Math.floor(abs / 10000);
  const r = abs % 10000;
  const rounded = q + (r >= 5000 ? 1 : 0);
  return prod < 0 ? -rounded : rounded;
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface Section9_5FoodGSTBreakdown {
  foodTaxablePaise: number;
  rateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  remittanceGstin: string;
  liabilityEntity: "ORDERKING_PLATFORM";
  isInterstate: boolean;
  statutoryNote: string;
}

export interface Section52TCSBreakdown {
  netSalesPaise: number;
  rateBps: number;
  cgstTcsPaise: number;
  sgstTcsPaise: number;
  igstTcsPaise: number;
  totalTcsPaise: number;
  isInterstate: boolean;
  statutorySection: "CGST_ACT_SECTION_52";
  monthlyGstr8Reporting: boolean;
}

export interface Section194OTDSBreakdown {
  grossSalesPaise: number;
  rateBps: number;
  tdsPaise: number;
  panProvided: boolean;
  panNumber?: string;
  statutorySection: "INCOME_TAX_ACT_SECTION_194O";
  quarterlyForm16A: boolean;
}

export interface PlatformServiceGSTBreakdown {
  serviceRevenuePaise: number;
  rateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  sacCode: "9985";
  isInterstate: boolean;
}

export interface ComprehensiveStatutoryTaxInput {
  foodValuePaise: number;
  packagingPaise?: number;
  restaurantDiscountPaise?: number;
  platformDiscountPaise?: number;
  commissionBps: number;
  platformFeePaise?: number;
  deliveryFeeMarginPaise?: number;
  onboardingFeePaise?: number;
  gatewayFeePaise?: number;
  expressLiquidityFeePaise?: number;
  panNumber?: string;
  isInterstate?: boolean;
}

export interface ComprehensiveStatutoryTaxResult {
  grossSalesPaise: number;
  netTaxableSupplyPaise: number;
  sec9_5FoodGST: Section9_5FoodGSTBreakdown;
  sec52TCS: Section52TCSBreakdown;
  sec194OTDS: Section194OTDSBreakdown;
  platformCommissionPaise: number;
  platformCommissionGST: PlatformServiceGSTBreakdown;
  platformServiceRevenuePaise: number;
  platformServiceTotalGST: PlatformServiceGSTBreakdown;
  totalStatutoryWithholdingsPaise: number; // TCS + TDS debited from merchant
  merchantPayablePaise: number;
}

/**
 * Calculates Section 9(5) CGST Act 5% Food GST.
 * Collected from customer and remitted to the Government under OrderKing GSTIN.
 * The restaurant does not pay output tax on delivery orders and does NOT collect this tax.
 */
export function calculateSection9_5FoodGST(
  foodTaxablePaise: number,
  isInterstate: boolean = false
): Section9_5FoodGSTBreakdown {
  assertSafePaise(foodTaxablePaise, "foodTaxablePaise");
  const base = Math.max(0, foodTaxablePaise);
  const totalGst = applyTaxBps(base, STATUTORY_TAX_RATES.SEC_9_5_FOOD_GST_BPS);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = totalGst;
  } else {
    cgst = Math.floor(totalGst / 2);
    sgst = totalGst - cgst;
  }

  return {
    foodTaxablePaise: base,
    rateBps: STATUTORY_TAX_RATES.SEC_9_5_FOOD_GST_BPS,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalGstPaise: totalGst,
    remittanceGstin: "ORDERKING_GSTIN",
    liabilityEntity: "ORDERKING_PLATFORM",
    isInterstate,
    statutoryNote: "Section 9(5) CGST Act 2017: 5% GST collected from customer and remitted directly to Government under OrderKing GSTIN.",
  };
}

/**
 * Calculates Section 52 CGST Act 1% TCS.
 * Deducted from net restaurant sales (gross sales minus restaurant-funded discounts).
 */
export function calculateSection52TCS(
  netSalesPaise: number,
  isInterstate: boolean = false
): Section52TCSBreakdown {
  assertSafePaise(netSalesPaise, "netSalesPaise");
  const base = Math.max(0, netSalesPaise);
  const totalTcs = applyTaxBps(base, STATUTORY_TAX_RATES.SEC_52_TCS_BPS);

  let cgstTcs = 0;
  let sgstTcs = 0;
  let igstTcs = 0;

  if (isInterstate) {
    igstTcs = totalTcs;
  } else {
    cgstTcs = Math.floor(totalTcs / 2);
    sgstTcs = totalTcs - cgstTcs;
  }

  return {
    netSalesPaise: base,
    rateBps: STATUTORY_TAX_RATES.SEC_52_TCS_BPS,
    cgstTcsPaise: cgstTcs,
    sgstTcsPaise: sgstTcs,
    igstTcsPaise: igstTcs,
    totalTcsPaise: totalTcs,
    isInterstate,
    statutorySection: "CGST_ACT_SECTION_52",
    monthlyGstr8Reporting: true,
  };
}

/**
 * Calculates Section 194-O Income Tax Act 1% TDS.
 * Deducted on gross sales for registered PANs (5% under Section 206AA if PAN is invalid/missing).
 */
export function calculateSection194OTDS(
  grossSalesPaise: number,
  hasValidPan: boolean = true,
  panNumber?: string
): Section194OTDSBreakdown {
  assertSafePaise(grossSalesPaise, "grossSalesPaise");
  const base = Math.max(0, grossSalesPaise);
  const rateBps = hasValidPan
    ? STATUTORY_TAX_RATES.SEC_194O_TDS_PAN_BPS
    : STATUTORY_TAX_RATES.SEC_194O_TDS_NO_PAN_BPS;

  const tds = applyTaxBps(base, rateBps);

  return {
    grossSalesPaise: base,
    rateBps,
    tdsPaise: tds,
    panProvided: hasValidPan,
    panNumber,
    statutorySection: "INCOME_TAX_ACT_SECTION_194O",
    quarterlyForm16A: true,
  };
}

/**
 * Calculates 18% GST on platform service revenue (SAC 9985).
 * Applies to commissions, platform fees, onboarding, delivery margins, and early liquidity fees.
 */
export function calculatePlatformServiceGST(
  serviceRevenuePaise: number,
  isInterstate: boolean = false
): PlatformServiceGSTBreakdown {
  assertSafePaise(serviceRevenuePaise, "serviceRevenuePaise");
  const base = Math.max(0, serviceRevenuePaise);
  const totalGst = applyTaxBps(base, STATUTORY_TAX_RATES.PLATFORM_SERVICE_GST_BPS);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = totalGst;
  } else {
    cgst = Math.floor(totalGst / 2);
    sgst = totalGst - cgst;
  }

  return {
    serviceRevenuePaise: base,
    rateBps: STATUTORY_TAX_RATES.PLATFORM_SERVICE_GST_BPS,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalGstPaise: totalGst,
    sacCode: "9985",
    isInterstate,
  };
}

/**
 * Computes comprehensive statutory tax and settlement withholdings for an order or batch.
 */
export function calculateComprehensiveStatutoryTax(
  input: ComprehensiveStatutoryTaxInput
): ComprehensiveStatutoryTaxResult {
  const food = assertSafePaise(input.foodValuePaise, "foodValuePaise");
  const packaging = assertSafePaise(input.packagingPaise ?? 0, "packagingPaise");
  const restDiscount = assertSafePaise(input.restaurantDiscountPaise ?? 0, "restaurantDiscountPaise");
  const platDiscount = assertSafePaise(input.platformDiscountPaise ?? 0, "platformDiscountPaise");
  const isInterstate = Boolean(input.isInterstate);

  // 1. Gross sales = Food value + Packaging charges
  const grossSalesPaise = food + packaging;

  // 2. Net taxable supply = Gross sales - Restaurant-funded discounts
  const netTaxableSupplyPaise = Math.max(0, grossSalesPaise - restDiscount);

  // 3. Section 9(5) CGST Act: 5% GST remitted by platform
  const sec9_5FoodGST = calculateSection9_5FoodGST(netTaxableSupplyPaise, isInterstate);

  // 4. Section 52 CGST Act: 1% TCS deducted from net restaurant sales
  const sec52TCS = calculateSection52TCS(netTaxableSupplyPaise, isInterstate);

  // 5. Section 194-O Income Tax Act: 1% TDS deducted on gross sales
  const hasValidPan = Boolean(input.panNumber && input.panNumber.length === 10);
  const sec194OTDS = calculateSection194OTDS(grossSalesPaise, hasValidPan, input.panNumber);

  // 6. Platform Commission on net taxable supply
  const platformCommissionPaise = applyTaxBps(netTaxableSupplyPaise, input.commissionBps);
  const platformCommissionGST = calculatePlatformServiceGST(platformCommissionPaise, isInterstate);

  // 7. Other platform service revenues
  const platformFee = assertSafePaise(input.platformFeePaise ?? 0, "platformFeePaise");
  const deliveryMargin = assertSafePaise(input.deliveryFeeMarginPaise ?? 0, "deliveryFeeMarginPaise");
  const onboardingFee = assertSafePaise(input.onboardingFeePaise ?? 0, "onboardingFeePaise");
  const expressLiquidityFee = assertSafePaise(input.expressLiquidityFeePaise ?? 0, "expressLiquidityFeePaise");
  const totalServiceRevenuePaise =
    platformCommissionPaise + platformFee + deliveryMargin + onboardingFee + expressLiquidityFee;
  const platformServiceTotalGST = calculatePlatformServiceGST(totalServiceRevenuePaise, isInterstate);

  // Gateway fees
  const gatewayFeePaise = assertSafePaise(input.gatewayFeePaise ?? 0, "gatewayFeePaise");
  const gatewayFeeGST = calculatePlatformServiceGST(gatewayFeePaise, isInterstate);

  // Total withholdings debited from merchant
  const totalStatutoryWithholdingsPaise = sec52TCS.totalTcsPaise + sec194OTDS.tdsPaise;

  // Total debited from gross sales:
  // Commission + 18% GST on Commission + Gateway Fee + 18% GST on Gateway + TCS + TDS + Express Fee + 18% GST on Express Fee
  const expressFeeGST = calculatePlatformServiceGST(expressLiquidityFee, isInterstate);
  const totalDeductionsPaise =
    platformCommissionPaise +
    platformCommissionGST.totalGstPaise +
    gatewayFeePaise +
    gatewayFeeGST.totalGstPaise +
    expressLiquidityFee +
    expressFeeGST.totalGstPaise +
    onboardingFee +
    totalStatutoryWithholdingsPaise;

  // Merchant Net Payable = Gross Sales - Restaurant Discount + Platform Subsidy - Deductions
  const merchantPayablePaise = Math.max(
    0,
    grossSalesPaise - restDiscount + platDiscount - totalDeductionsPaise
  );

  return {
    grossSalesPaise,
    netTaxableSupplyPaise,
    sec9_5FoodGST,
    sec52TCS,
    sec194OTDS,
    platformCommissionPaise,
    platformCommissionGST,
    platformServiceRevenuePaise: totalServiceRevenuePaise,
    platformServiceTotalGST,
    totalStatutoryWithholdingsPaise,
    merchantPayablePaise,
  };
}

/**
 * Preserved for backward compatibility across existing calls.
 */
export function calculateGST(amountPaise: number, category: string, isInterstate: boolean = false): TaxBreakdown {
  assertSafePaise(amountPaise, "amountPaise");
  let rate = 0;
  switch (category.toLowerCase()) {
    case "food_delivery":
      rate = 0.05;
      break;
    case "platform_fees":
      rate = 0.18;
      break;
    case "subscription":
      rate = 0.12;
      break;
    default:
      rate = 0.18;
  }

  const totalTax = Math.floor(amountPaise * rate);
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterstate) {
    igst = totalTax;
  } else {
    cgst = Math.floor(totalTax / 2);
    sgst = totalTax - cgst;
  }

  return {
    cgst,
    sgst,
    igst,
    totalTax,
  };
}
