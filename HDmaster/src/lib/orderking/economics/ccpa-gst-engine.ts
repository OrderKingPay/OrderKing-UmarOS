/**
 * 👑 OrderKing CCPA & Statutory Indian GST/TDS/TCS Integer-Paise Settlement Engine
 * 
 * Complies strictly with:
 * 1. CGST Act Section 9(5) & Notification 17/2021-Central Tax (Rate):
 *    - E-Commerce Operator (ECO) liable to pay 5% GST (2.5% CGST + 2.5% SGST) on restaurant services.
 * 2. CBIC Circular No. 167/23/2021-GST:
 *    - Strictly 0% Section 52 TCS on Section 9(5) restaurant supplies facilitated by ECO.
 * 3. Income Tax Act Section 194-O:
 *    - Strictly 0.1% (10 bps) TDS on gross merchant base.
 * 4. CGST Act Section 52:
 *    - Strictly 0.5% (50 bps) TCS ONLY on non-9(5) goods for GST-registered merchants.
 * 5. CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023:
 *    - Anti-Basket-Sneaking: Rider tip must default to 0 paise (0% GST pass-through).
 *    - Packaging fee capped at lower of ₹35 (3500 paise) or 10% of net food value.
 * 6. 100% Integer-Paise Arithmetic:
 *    - Zero floating-point drift across all calculations via roundDivPaise.
 */

export const STATUTORY_TAX_CONSTANTS = {
  PACKAGING_CAP_PAISE: 3500,           // ₹35.00 CCPA statutory hard ceiling
  PACKAGING_PERCENT_BPS: 1000,         // 10.00% (1000 bps) proportional ceiling
  SMALL_CART_THRESHOLD_PAISE: 14900,   // ₹149.00 minimum cart threshold
  SMALL_CART_FEE_PAISE: 2500,          // ₹25.00 small cart fee
  DEFAULT_PLATFORM_FEE_PAISE: 600,     // ₹6.00 standard platform fee
  SEC95_CGST_BPS: 250,                 // 2.50% CGST
  SEC95_SGST_BPS: 250,                 // 2.50% SGST
  SEC95_TOTAL_GST_BPS: 500,            // 5.00% total Sec 9(5) GST
  PLATFORM_CGST_BPS: 900,              // 9.00% CGST
  PLATFORM_SGST_BPS: 900,              // 9.00% SGST
  PLATFORM_TOTAL_GST_BPS: 1800,        // 18.00% total Platform Services GST
  COMMISSION_GST_BPS: 1800,            // 18.00% GST on marketplace commission
  TDS_SEC_194O_BPS: 10,                // 0.10% (10 bps) Income Tax Section 194-O TDS
  TCS_SEC_52_BPS: 50,                  // 0.50% (50 bps) CGST Section 52 TCS
} as const;

export const PACKAGING_CAP_PAISE = STATUTORY_TAX_CONSTANTS.PACKAGING_CAP_PAISE;
export const SMALL_CART_THRESHOLD_PAISE = STATUTORY_TAX_CONSTANTS.SMALL_CART_THRESHOLD_PAISE;
export const SMALL_CART_FEE_PAISE = STATUTORY_TAX_CONSTANTS.SMALL_CART_FEE_PAISE;
export const DEFAULT_PLATFORM_FEE_PAISE = STATUTORY_TAX_CONSTANTS.DEFAULT_PLATFORM_FEE_PAISE;

export interface OrderTaxInputPaise {
  foodGrossPaise: number;            // Sum of restaurant menu items (under Sec 9(5))
  non95GoodsPaise?: number;          // Pre-packed MRP items not under Sec 9(5) (default 0)
  merchantDiscountPaise?: number;    // Restaurant-funded promo discount
  platformDiscountPaise?: number;    // OrderKing-funded promo discount
  packagingFeePaise?: number;        // Requested packaging fee (subject to CCPA cap)
  platformFeePaise?: number;         // Standard ₹6 (600 paise)
  deliveryFeePaise: number;          // Distance-based delivery charge
  riderTipPaise?: number;            // MUST default to 0 (CCPA Anti-Basket-Sneaking)
  commissionBps: number;             // e.g., 1800 = 18.00%, 2200 = 22.00%
  merchantHasGstin: boolean;         // Required for Sec 52 TCS on non-9(5) goods
  slaPenaltyPaise?: number;          // Validated kitchen delay/rejection penalty
  riderPayoutPaise: number;          // Calculated distance + wait + surge pay to rider
  gatewayFeePaise?: number;          // 0 for Direct UPI, ~2% for cards
}

export interface OrderFinancialBreakdownPaise {
  customerBill: {
    foodNetPaise: number;
    packagingFeePaise: number;       // Capped at min(3500, 10% of foodNetPaise)
    non95GoodsPaise: number;         // Pre-packed non-9(5) goods
    smallCartFeePaise: number;       // 2500 paise if foodNetPaise < 14900, else 0
    platformFeePaise: number;
    deliveryFeePaise: number;
    sec95CgstPaise: number;          // 2.5% on (foodNet + packaging)
    sec95SgstPaise: number;          // 2.5% on (foodNet + packaging)
    sec95TotalGstPaise: number;      // 5.0% total Sec 9(5) GST
    platformCgstPaise: number;       // 9.0% on (platformFee + smallCartFee + deliveryFee)
    platformSgstPaise: number;       // 9.0% on (platformFee + smallCartFee + deliveryFee)
    platformTotalGstPaise: number;   // 18.0% total Platform GST
    riderTipPaise: number;           // 0% GST pass-through
    totalCustomerPayablePaise: number;
  };
  merchantSettlement: {
    merchantBaseRevenuePaise: number;
    commissionPaise: number;
    commissionGstPaise: number;      // 18% GST on commission
    tdsSec194OPaise: number;         // 0.1% (10 bps) Income Tax TDS
    tcsSec52Paise: number;           // 0.5% (50 bps) ONLY on non-9(5) taxable goods
    slaPenaltyPaise: number;
    netMerchantPayoutPaise: number;
  };
  founderTreasury: {
    govtTaxEscrowPaise: number;      // Sec 9(5) GST + Platform GST + Commission GST + TDS + TCS
    escrowBreakdown: {
      sec95GstPaise: number;
      platformGstPaise: number;
      commissionGstPaise: number;
      tdsSec194OPaise: number;
      tcsSec52Paise: number;
    };
    riderTotalPayoutPaise: number;   // Rider base/distance pay + 100% of customer tip
    netFounderProfitPaise: number;   // Pure OrderKing net profit after rider, discount & gateway fees
  };
}

/**
 * Exact integer division with half-up rounding:
 * roundDivPaise(n, d) = Math.floor((n + Math.floor(d / 2)) / d)
 */
export function roundDivPaise(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error(`Invalid integer paise operands: ${numerator} / ${denominator}`);
  }
  if (numerator <= 0) return 0;
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

/**
 * CCPA Packaging Cap: min(3500, roundDivPaise(foodNetPaise * 10, 100))
 * Lower of ₹35 (3500 paise) or 10% of net food value.
 * If requested packaging fee is specified, capped at min(requested, CCPA cap).
 */
export function calculateCcpaPackagingFee(
  foodNetPaise: number,
  requestedPackagingFeePaise?: number
): number {
  const safeFoodNet = Math.max(0, Math.trunc(foodNetPaise));
  const tenPercentCap = roundDivPaise(safeFoodNet * 10, 100);
  const statutoryCap = Math.min(PACKAGING_CAP_PAISE, tenPercentCap);

  if (requestedPackagingFeePaise !== undefined) {
    const requested = Math.max(0, Math.trunc(requestedPackagingFeePaise));
    return Math.min(requested, statutoryCap);
  }
  return statutoryCap;
}

/**
 * Small Cart Fee: 2500 paise (₹25) if foodNetPaise < 14900 (₹149).
 */
export function calculateSmallCartFeePaise(foodNetPaise: number): number {
  const safeFoodNet = Math.max(0, Math.trunc(foodNetPaise));
  return safeFoodNet > 0 && safeFoodNet < SMALL_CART_THRESHOLD_PAISE
    ? SMALL_CART_FEE_PAISE
    : 0;
}

/**
 * CGST Section 9(5) 5% (2.5% CGST + 2.5% SGST) on (foodNet + packaging).
 */
export function calculateSec95GstPaise(taxableBasePaise: number): {
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
} {
  const base = Math.max(0, Math.trunc(taxableBasePaise));
  const cgstPaise = roundDivPaise(base * 25, 1000);
  const sgstPaise = cgstPaise;
  const totalGstPaise = cgstPaise + sgstPaise;
  return { cgstPaise, sgstPaise, totalGstPaise };
}

/**
 * Platform Services 18% GST (9% CGST + 9% SGST) on (platformFee + smallCartFee + deliveryFee).
 */
export function calculatePlatformGstPaise(taxableBasePaise: number): {
  cgstPaise: number;
  sgstPaise: number;
  totalGstPaise: number;
} {
  const base = Math.max(0, Math.trunc(taxableBasePaise));
  const cgstPaise = roundDivPaise(base * 9, 100);
  const sgstPaise = cgstPaise;
  const totalGstPaise = cgstPaise + sgstPaise;
  return { cgstPaise, sgstPaise, totalGstPaise };
}

/**
 * Section 194-O Income Tax TDS: strictly 0.1% (10 bps) on merchant base.
 */
export function calculateSec194OTdsPaise(merchantBasePaise: number): number {
  const base = Math.max(0, Math.trunc(merchantBasePaise));
  return roundDivPaise(base * 10, 10000);
}

/**
 * Section 52 TCS: strictly 0.5% (50 bps) ONLY on non-9(5) goods for GST-registered merchants;
 * strictly 0% on Sec 9(5) restaurant food per CBIC Circular 167/23/2021-GST.
 */
export function calculateSec52TcsPaise(
  non95GoodsPaise: number,
  merchantHasGstin: boolean
): number {
  if (!merchantHasGstin) return 0;
  const base = Math.max(0, Math.trunc(non95GoodsPaise));
  return roundDivPaise(base * 50, 10000);
}

/**
 * Main settlement and tax calculation engine in pure integer paise.
 */
export function calculateOrderEconomicsPaise(
  input: OrderTaxInputPaise
): OrderFinancialBreakdownPaise {
  const foodGross = Math.max(0, Math.trunc(input.foodGrossPaise));
  const non95Goods = Math.max(0, Math.trunc(input.non95GoodsPaise ?? 0));
  const merchDisc = Math.max(0, Math.trunc(input.merchantDiscountPaise ?? 0));
  const platDisc = Math.max(0, Math.trunc(input.platformDiscountPaise ?? 0));
  const platformFee = Math.max(0, Math.trunc(input.platformFeePaise ?? DEFAULT_PLATFORM_FEE_PAISE));
  const deliveryFee = Math.max(0, Math.trunc(input.deliveryFeePaise));
  // Anti-Basket-Sneaking: Rider tip must default to 0 paise
  const riderTip = Math.max(0, Math.trunc(input.riderTipPaise ?? 0));
  const slaPenalty = Math.max(0, Math.trunc(input.slaPenaltyPaise ?? 0));
  const riderBasePay = Math.max(0, Math.trunc(input.riderPayoutPaise));
  const gatewayFee = Math.max(0, Math.trunc(input.gatewayFeePaise ?? 0));

  // 1. Net Food Value & CCPA Packaging Cap (min of ₹35 or 10% of net food value)
  const foodNetPaise = Math.max(0, foodGross - merchDisc - platDisc);
  const packagingFeePaise = calculateCcpaPackagingFee(foodNetPaise, input.packagingFeePaise);

  // 2. Small Cart Fee (< ₹149)
  const smallCartFeePaise = calculateSmallCartFeePaise(foodNetPaise);

  // 3. CGST Section 9(5) Tax: 5% (2.5% CGST + 2.5% SGST) on (foodNet + packaging)
  const sec95TaxableBase = foodNetPaise + packagingFeePaise;
  const {
    cgstPaise: sec95CgstPaise,
    sgstPaise: sec95SgstPaise,
    totalGstPaise: sec95TotalGstPaise,
  } = calculateSec95GstPaise(sec95TaxableBase);

  // 4. Platform Services GST: 18% (9% CGST + 9% SGST) on (platformFee + smallCartFee + deliveryFee)
  const platformTaxableBase = platformFee + smallCartFeePaise + deliveryFee;
  const {
    cgstPaise: platformCgstPaise,
    sgstPaise: platformSgstPaise,
    totalGstPaise: platformTotalGstPaise,
  } = calculatePlatformGstPaise(platformTaxableBase);

  // 5. Total Customer Payable
  const totalCustomerPayablePaise =
    sec95TaxableBase +
    non95Goods +
    sec95TotalGstPaise +
    platformTaxableBase +
    platformTotalGstPaise +
    riderTip;

  // 6. Merchant Settlement Base (Platform-funded discount does NOT reduce merchant base)
  const merchantBaseRevenuePaise =
    Math.max(0, foodGross - merchDisc) + packagingFeePaise + non95Goods;

  // 7. OrderKing Commission + 18% GST on Commission (9% CGST + 9% SGST)
  const commissionPaise = roundDivPaise(
    merchantBaseRevenuePaise * Math.max(0, Math.trunc(input.commissionBps)),
    10000
  );
  const commissionCgstPaise = roundDivPaise(commissionPaise * 9, 100);
  const commissionSgstPaise = commissionCgstPaise;
  const commissionGstPaise = commissionCgstPaise + commissionSgstPaise;

  // 8. Income Tax Act Sec 194-O TDS: 0.1% (10 bps) on Merchant Base
  const tdsSec194OPaise = calculateSec194OTdsPaise(merchantBaseRevenuePaise);

  // 9. CGST Sec 52 TCS: 0.5% (50 bps) ONLY on non-9(5) goods if merchant is GST-registered
  // (Sec 9(5) restaurant food is strictly exempt from Sec 52 TCS per Circular 167/23/2021-GST)
  const tcsSec52Paise = calculateSec52TcsPaise(non95Goods, input.merchantHasGstin);

  const netMerchantPayoutPaise = Math.max(
    0,
    merchantBaseRevenuePaise -
      commissionPaise -
      commissionGstPaise -
      tdsSec194OPaise -
      tcsSec52Paise -
      slaPenalty
  );

  // 10. Founder Treasury & Statutory Escrow Split
  const govtTaxEscrowPaise =
    sec95TotalGstPaise +
    platformTotalGstPaise +
    commissionGstPaise +
    tdsSec194OPaise +
    tcsSec52Paise;

  const riderTotalPayoutPaise = riderBasePay + riderTip;

  const grossFounderRevenuePaise =
    commissionPaise +
    platformFee +
    smallCartFeePaise +
    deliveryFee +
    slaPenalty;

  const netFounderProfitPaise =
    grossFounderRevenuePaise - riderBasePay - platDisc - gatewayFee;

  return {
    customerBill: {
      foodNetPaise,
      packagingFeePaise,
      non95GoodsPaise: non95Goods,
      smallCartFeePaise,
      platformFeePaise: platformFee,
      deliveryFeePaise: deliveryFee,
      sec95CgstPaise,
      sec95SgstPaise,
      sec95TotalGstPaise,
      platformCgstPaise,
      platformSgstPaise,
      platformTotalGstPaise,
      riderTipPaise: riderTip,
      totalCustomerPayablePaise,
    },
    merchantSettlement: {
      merchantBaseRevenuePaise,
      commissionPaise,
      commissionGstPaise,
      tdsSec194OPaise,
      tcsSec52Paise,
      slaPenaltyPaise: slaPenalty,
      netMerchantPayoutPaise,
    },
    founderTreasury: {
      govtTaxEscrowPaise,
      escrowBreakdown: {
        sec95GstPaise: sec95TotalGstPaise,
        platformGstPaise: platformTotalGstPaise,
        commissionGstPaise,
        tdsSec194OPaise,
        tcsSec52Paise,
      },
      riderTotalPayoutPaise,
      netFounderProfitPaise,
    },
  };
}

/**
 * Audit tool to mathematically verify the conservation of paise across:
 * Customer Inflow == Merchant Payout + Rider Payout + Tax Escrow + PG Fee + Net Founder Profit
 */
export function verifyConservationOfPaise(
  breakdown: OrderFinancialBreakdownPaise,
  gatewayFeePaise: number = 0
): {
  isBalanced: boolean;
  totalInflowPaise: number;
  totalOutflowAndRetainedPaise: number;
  discrepancyPaise: number;
} {
  const safeGatewayFee = Math.max(0, Math.trunc(gatewayFeePaise));

  const totalInflowPaise = breakdown.customerBill.totalCustomerPayablePaise;

  const totalOutflowAndRetainedPaise =
    breakdown.merchantSettlement.netMerchantPayoutPaise +
    breakdown.founderTreasury.riderTotalPayoutPaise +
    breakdown.founderTreasury.govtTaxEscrowPaise +
    safeGatewayFee +
    breakdown.founderTreasury.netFounderProfitPaise;

  const discrepancyPaise = totalInflowPaise - totalOutflowAndRetainedPaise;

  return {
    isBalanced: discrepancyPaise === 0,
    totalInflowPaise,
    totalOutflowAndRetainedPaise,
    discrepancyPaise,
  };
}