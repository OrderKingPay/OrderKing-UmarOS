/**
 * OrderKing / Umar OS — Promotion Unit Economics & Profitability Engine
 *
 * Implements strict Indian marketplace unit economics with real integer paise arithmetic.
 * Calculates Net Contribution Margin per order:
 *   Revenue = (Order Value * Commission %) + Platform Fee
 *   Costs = Rider Payout + Payment Gateway Cost + Platform-funded Discount
 *   Net Profit = Revenue - Costs
 *
 * Enforces mandatory loss warnings when platform subsidies exceed transaction yield.
 */

export interface PromoUnitEconomicsInput {
  /** Average Order Value in paise (e.g., 35000 = ₹350.00) */
  aovPaise: number;
  /** Partner Commission Take-Rate in basis points (e.g., 1500 bps = 15%) */
  commissionBps: number;
  /** Platform Convenience Fee in paise (e.g., 1000 = ₹10.00) */
  platformFeePaise: number;
  /** Promotional Subsidy Discount Type */
  discountKind: "PERCENT" | "FLAT";
  /** Discount in basis points if PERCENT (e.g., 1500 bps = 15%) */
  discountPercentBps?: number;
  /** Maximum Discount Cap in paise if PERCENT (e.g., 8000 = ₹80.00) */
  maxDiscountPaise?: number;
  /** Flat Discount in paise if FLAT (e.g., 5000 = ₹50.00) */
  flatDiscountPaise?: number;
  /**
   * Goibibo-style Post-Booking Wallet Cashback option.
   * If true, discount is credited into the customer's KingPay wallet on completion,
   * preserving immediate bank treasury float and driving repeat ordering.
   */
  isPostBookingCashback: boolean;
  /** Courier / Rider Delivery Payout in paise (default ₹35.00 = 3500) */
  riderPayoutPaise?: number;
  /** Payment Gateway processing fee in basis points (default 100 bps = 1.0%) */
  paymentGatewayBps?: number;
}

export interface PromoUnitEconomicsResult {
  aovPaise: number;
  commissionBps: number;
  platformFeePaise: number;

  // Platform Inflow
  commissionRevenuePaise: number;
  grossRevenuePaise: number;

  // Discount & Subsidy
  nominalSubsidyPaise: number;
  effectiveUpfrontSubsidyPaise: number;
  walletCashbackLiabilityPaise: number;

  // Costs
  riderPayoutPaise: number;
  paymentGatewayCostPaise: number;
  totalCostsPaise: number;
  immediateCashOutflowPaise: number;

  // Margins
  netUnitMarginPaise: number;
  netUnitMarginImmediatePaise: number;
  netYieldPercent: number;

  // Indicators
  isProfitable: boolean;
  isLossMaking: boolean;
  lossAmountPaise: number;
  breakEvenAovPaise: number | null;

  // Alerts
  warningMessage: string | null;
  successMessage: string | null;
}

export function calculatePromoUnitEconomics(
  input: PromoUnitEconomicsInput,
): PromoUnitEconomicsResult {
  const safeAov = Math.max(0, Math.round(input.aovPaise || 0));
  const safeCommissionBps = Math.max(0, Math.round(input.commissionBps || 0));
  const safePlatformFee = Math.max(0, Math.round(input.platformFeePaise || 0));
  const riderPayout = Math.max(0, Math.round(input.riderPayoutPaise ?? 3500));
  const pgBps = Math.max(0, Math.round(input.paymentGatewayBps ?? 100));

  // 1. Platform Inflow
  const commissionRevenue = Math.round((safeAov * safeCommissionBps) / 10000);
  const grossRevenue = commissionRevenue + safePlatformFee;

  // 2. Subsidy
  let nominalSubsidy = 0;
  if (input.discountKind === "PERCENT") {
    const rawDiscount = Math.round(
      (safeAov * Math.max(0, input.discountPercentBps ?? 0)) / 10000,
    );
    if (input.maxDiscountPaise && input.maxDiscountPaise > 0) {
      nominalSubsidy = Math.min(rawDiscount, input.maxDiscountPaise);
    } else {
      nominalSubsidy = rawDiscount;
    }
  } else {
    nominalSubsidy = Math.max(0, Math.round(input.flatDiscountPaise ?? 0));
  }

  // 3. Post-Booking Cashback vs Instant Cash Discount
  const effectiveUpfrontSubsidy = input.isPostBookingCashback
    ? 0
    : nominalSubsidy;
  const walletCashbackLiability = input.isPostBookingCashback
    ? nominalSubsidy
    : 0;

  // 4. Payment Gateway Cost
  const pgCost = Math.round((safeAov * pgBps) / 10000);

  // 5. Total Costs
  const totalCosts = riderPayout + pgCost + nominalSubsidy;
  const immediateCashOutflow = riderPayout + pgCost + effectiveUpfrontSubsidy;

  // 6. Net Profit / Margin
  const netUnitMargin = grossRevenue - totalCosts;
  const netUnitMarginImmediate = grossRevenue - immediateCashOutflow;
  const netYieldPercent =
    safeAov > 0 ? Number(((netUnitMargin / safeAov) * 100).toFixed(2)) : 0;

  // 7. Break-even Order Value
  let breakEvenAovPaise: number | null = null;
  const netTakeBps = safeCommissionBps - pgBps;
  if (netTakeBps > 0) {
    const fixedDeficit = riderPayout + nominalSubsidy - safePlatformFee;
    if (fixedDeficit > 0) {
      breakEvenAovPaise = Math.ceil((fixedDeficit * 10000) / netTakeBps);
    } else {
      breakEvenAovPaise = 0;
    }
  }

  // 8. Warning & Success
  const isLossMaking = netUnitMargin < 0;
  const isProfitable = netUnitMargin >= 0;
  const lossAmount = isLossMaking ? Math.abs(netUnitMargin) : 0;

  const subsidyRupees = (nominalSubsidy / 100).toFixed(2);
  const revenueRupees = (grossRevenue / 100).toFixed(2);
  const lossRupees = (lossAmount / 100).toFixed(2);
  const profitRupees = (netUnitMargin / 100).toFixed(2);

  let warningMessage: string | null = null;
  let successMessage: string | null = null;

  if (isLossMaking) {
    warningMessage = `⚠️ MANDATORY LOSS WARNING: NEGATIVE UNIT ECONOMICS DETECTED. Subsidy of ₹${subsidyRupees} exceeds revenue of ₹${revenueRupees}. Platform treasury will lose ₹${lossRupees} per order.${
      breakEvenAovPaise !== null
        ? ` Minimum break-even order value needed: ₹${(breakEvenAovPaise / 100).toFixed(2)}.`
        : ""
    } Adjustment required.`;
  } else {
    successMessage = `✅ PROFITABLE CAMPAIGN: Net platform margin of ₹${profitRupees} per transaction (${netYieldPercent.toFixed(1)}% net yield).`;
  }

  return {
    aovPaise: safeAov,
    commissionBps: safeCommissionBps,
    platformFeePaise: safePlatformFee,
    commissionRevenuePaise: commissionRevenue,
    grossRevenuePaise: grossRevenue,
    nominalSubsidyPaise: nominalSubsidy,
    effectiveUpfrontSubsidyPaise: effectiveUpfrontSubsidy,
    walletCashbackLiabilityPaise: walletCashbackLiability,
    riderPayoutPaise: riderPayout,
    paymentGatewayCostPaise: pgCost,
    totalCostsPaise: totalCosts,
    immediateCashOutflowPaise: immediateCashOutflow,
    netUnitMarginPaise: netUnitMargin,
    netUnitMarginImmediatePaise: netUnitMarginImmediate,
    netYieldPercent,
    isProfitable,
    isLossMaking,
    lossAmountPaise: lossAmount,
    breakEvenAovPaise,
    warningMessage,
    successMessage,
  };
}
