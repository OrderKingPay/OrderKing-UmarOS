// File: src/lib/finance/ccpa-gst-engine.ts
// 100% Integer-Paise Arithmetic (Zero Floating-Point Drift)

export interface OrderTaxInputPaise {
  foodGrossPaise: number;            // Sum of restaurant menu items (under Sec 9(5))
  non95GoodsPaise?: number;          // Pre-packed MRP items not under Sec 9(5) (default 0)
  merchantDiscountPaise?: number;    // Restaurant-funded promo discount
  platformDiscountPaise?: number;    // OrderKing-funded promo discount
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
    riderTotalPayoutPaise: number;   // Rider base/distance pay + 100% of customer tip
    netFounderProfitPaise: number;   // Pure OrderKing net profit after rider, discount & gateway fees
  };
}

const PACKAGING_CAP_PAISE = 3500;          // ₹35.00 CCPA hard cap
const SMALL_CART_THRESHOLD_PAISE = 14900;  // ₹149.00
const SMALL_CART_FEE_PAISE = 2500;         // ₹25.00
const DEFAULT_PLATFORM_FEE_PAISE = 600;    // ₹6.00

/**
 * Exact integer division with half-up rounding: floor((n + floor(d/2)) / d)
 */
export function roundDivPaise(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new Error(`Invalid integer paise operands: ${numerator} / ${denominator}`);
  }
  if (numerator <= 0) return 0;
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

export function calculateOrderEconomicsPaise(
  input: OrderTaxInputPaise
): OrderFinancialBreakdownPaise {
  const foodGross = Math.max(0, Math.trunc(input.foodGrossPaise));
  const non95Goods = Math.max(0, Math.trunc(input.non95GoodsPaise ?? 0));
  const merchDisc = Math.max(0, Math.trunc(input.merchantDiscountPaise ?? 0));
  const platDisc = Math.max(0, Math.trunc(input.platformDiscountPaise ?? 0));
  const platformFee = Math.max(0, Math.trunc(input.platformFeePaise ?? DEFAULT_PLATFORM_FEE_PAISE));
  const deliveryFee = Math.max(0, Math.trunc(input.deliveryFeePaise));
  const riderTip = Math.max(0, Math.trunc(input.riderTipPaise ?? 0));
  const slaPenalty = Math.max(0, Math.trunc(input.slaPenaltyPaise ?? 0));
  const riderBasePay = Math.max(0, Math.trunc(input.riderPayoutPaise));
  const gatewayFee = Math.max(0, Math.trunc(input.gatewayFeePaise ?? 0));

  // 1. Net Food Value & CCPA Packaging Cap (min of ₹35 or 10% of net food value)
  const foodNetPaise = Math.max(0, foodGross - merchDisc - platDisc);
  const packagingTenPercent = roundDivPaise(foodNetPaise * 10, 100);
  const packagingFeePaise = Math.min(PACKAGING_CAP_PAISE, packagingTenPercent);

  // 2. Small Cart Fee (< ₹149)
  const smallCartFeePaise =
    foodNetPaise > 0 && foodNetPaise < SMALL_CART_THRESHOLD_PAISE
      ? SMALL_CART_FEE_PAISE
      : 0;

  // 3. CGST Section 9(5) Tax: 5% (2.5% CGST + 2.5% SGST) on (foodNet + packaging)
  const sec95TaxableBase = foodNetPaise + packagingFeePaise;
  const sec95CgstPaise = roundDivPaise(sec95TaxableBase * 25, 1000);
  const sec95SgstPaise = sec95CgstPaise;
  const sec95TotalGstPaise = sec95CgstPaise + sec95SgstPaise;

  // 4. Platform Services GST: 18% (9% CGST + 9% SGST) on (platformFee + smallCartFee + deliveryFee)
  const platformTaxableBase = platformFee + smallCartFeePaise + deliveryFee;
  const platformCgstPaise = roundDivPaise(platformTaxableBase * 9, 100);
  const platformSgstPaise = platformCgstPaise;
  const platformTotalGstPaise = platformCgstPaise + platformSgstPaise;

  // 5. Total Customer Payable
  const totalCustomerPayablePaise =
    sec95TaxableBase +
    non95Goods +
    sec95TotalGstPaise +
    platformTaxableBase +
    platformTotalGstPaise +
    riderTip;

  // 6. Merchant Settlement Base (Platform-funded discount does NOT reduce merchant base!)
  const merchantBaseRevenuePaise =
    Math.max(0, foodGross - merchDisc) + packagingFeePaise + non95Goods;

  // 7. OrderKing Commission + 18% GST on Commission
  const commissionPaise = roundDivPaise(
    merchantBaseRevenuePaise * input.commissionBps,
    10000
  );
  const commissionCgstPaise = roundDivPaise(commissionPaise * 9, 100);
  const commissionGstPaise = commissionCgstPaise * 2;

  // 8. Income Tax Act Sec 194-O TDS: 0.1% (10 bps) on Merchant Base
  const tdsSec194OPaise = roundDivPaise(merchantBaseRevenuePaise * 10, 10000);

  // 9. CGST Sec 52 TCS: 0.5% (50 bps) ONLY on non-9(5) goods if merchant is GST-registered
  // (Sec 9(5) restaurant food is strictly exempt from Sec 52 TCS per Circular 167/23/2021-GST)
  const tcsSec52Paise =
    input.merchantHasGstin && non95Goods > 0
      ? roundDivPaise(non95Goods * 50, 10000)
      : 0;

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
      riderTotalPayoutPaise,
      netFounderProfitPaise,
    },
  };
}
