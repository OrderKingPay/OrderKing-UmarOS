// @ts-nocheck
/**
 * Founder cash-flow scenario calculator using caller-supplied reconciled inputs
 * Confidential: Restricted solely to Platform Owner / CEO
 * 
 * Important:
 * - This module performs calculations only from supplied inputs.
 * - It does not establish ownership of bank funds, legal compliance, tax rates, or withdrawable profit.
 */

export type FounderVaultInput = {
  periodLabel: string;
  totalOrdersCount: number;
  grossCustomerInflowPaise: number; // Caller-supplied inflow scenario; not independently verified by this module
  foodGrossPaise: number;
  restaurantDiscountsPaise: number;
  platformCommissionBps: number; // e.g. 1500 for 15%
  packagingChargesPaise: number;
  riderBasePaise: number;
  riderDistancePaise: number;
  riderSurgePaise: number;
  riderMilestoneBonusPaise: number;
  customerTipsPaise: number;
  cashCollectedCodPaise: number;
  unclaimedWalletFloatPaise?: number;
  breakageAndGlitchFloatPaise?: number; // Overpayments, round-off surpluses, expired credits, customer cancellation forfeits, unallocated deposits
  eligibleInputTaxCreditPaise?: number; // Caller-supplied eligible-ITC scenario; tax eligibility is not independently verified
  platformConvenienceFeesPaise?: number; // Platform fees charged to customers
};

export type FounderVaultSummary = {
  periodLabel: string;
  totalOrdersCount: number;
  grossCustomerInflowPaise: number;
  netDisbursedToRestaurantsPaise: number;
  netDisbursedToRidersPaise: number;
  statutoryTaxReservePaise: number;
  gstReserveSection95Paise: number; // Illustrative scenario reserve based on the module's configured rate; not legal advice
  tdsReserveSection194OPaise: number; // Illustrative scenario reserve; current withholding rules must be verified
  tcsReserveSection52Paise: number;  // Illustrative scenario reserve; current collection rules must be verified
  retainedPlatformFloatPaise: number; // Calculated residual from supplied scenario inputs; not an owner-bank balance
  pureOwnerNetProfitPaise: number;   // Calculated scenario residual; not a confirmed withdrawable amount
  breakageAndUnusedFloatPaise: number;
  breakageAndGlitchFloatPaise: number; // Calculated from supplied inputs; distribution/retention rights require separate verification
  ownerNetMarginPercentage: string;
  gstItcOffsetAndArbitrage: {
    grossGstCollectedFromCommissionsPaise: number;
    grossGstCollectedFromPlatformFeesPaise: number;
    totalOutwardGstCollectedPaise: number;
    eligibleInputTaxCreditPaise: number;
    netCashGstLiabilityPaise: number; // Minimized legally via CGST Act Section 16 & 17
    retainedGstWorkingCapitalPaise: number; // Cash GST collected that stays in owner account via ITC set-off
    section95GstEscrowFloatYieldPaise: number; // 6.5% p.a. yield on 30-day average 5% GST escrow float
  };
  competitiveZomatoComparison: {
    zomatoAverageCommissionBps: number; // 2500 (25%)
    orderKingCommissionBps: number; // 1500 (15%)
    restaurantSavingsVsZomatoPaise: number;
    restaurantTakeHomeUpliftPercentage: string;
    zomatoOnboardingFeeSavedPaise: number;
    orderKingVolumeMultiplier: string;
  };
  disbursementRules: {
    restaurantDisbursementRule: string;
    riderDisbursementRule: string;
    glitchMoneyRetentionRule: string;
  };
  legalComplianceStatus: {
    itActSection79Intermediary: string;
    incomeTaxSection194O: string;
    cgstActSection95: string;
    cgstActSection16And17Itc: string;
    disputeJurisdiction: string;
  };
  generatedAt: string;
};

export function calculateFounderRetainedCashVault(input: FounderVaultInput): FounderVaultSummary {
  const netFoodSales = Math.max(0, input.foodGrossPaise - input.restaurantDiscountsPaise);
  
  // 1. Restaurant Net Settlement Calculation (Strictly Contractual & Legal)
  const commission = Math.round((netFoodSales * input.platformCommissionBps) / 10000);
  const gstOnCommission = Math.round((commission * 18) / 100);
  const tcsDeduction = Math.round((netFoodSales * 100) / 10000); // 1% TCS
  const tdsDeduction = Math.round((netFoodSales * 100) / 10000); // 1% TDS
  const totalRestaurantDeductions = commission + gstOnCommission + tcsDeduction + tdsDeduction;
  const netDisbursedToRestaurants = Math.max(
    0,
    netFoodSales + input.packagingChargesPaise - totalRestaurantDeductions,
  );

  // 2. Rider Net Settlement Calculation (Strictly Contractual & Legal)
  const riderGross =
    input.riderBasePaise +
    input.riderDistancePaise +
    input.riderSurgePaise +
    input.riderMilestoneBonusPaise +
    input.customerTipsPaise;
  const riderTds = Math.round((riderGross * 100) / 10000); // 1% TDS
  const netDisbursedToRiders = Math.max(
    0,
    riderGross - input.cashCollectedCodPaise - riderTds,
  );

  // 3. Glitch, breakage and unclaimed amounts are calculated from supplied inputs; legal treatment and ownership must be verified.
  const breakageAndGlitchFloat =
    (input.breakageAndGlitchFloatPaise ?? 0) + (input.unclaimedWalletFloatPaise ?? 0);

  // 4. Tax/ITC scenario calculation from supplied rates and inputs; legal treatment must be independently reviewed.
  const gstSection95 = Math.round((netFoodSales * 5) / 100); // 5% GST on food delivery
  const platformFee = input.platformConvenienceFeesPaise ?? 0;
  const platformFeeGst = Math.round((platformFee * 18) / 100);
  const totalOutwardGst = gstOnCommission + platformFeeGst;
  const eligibleItc = input.eligibleInputTaxCreditPaise ?? 0;
  const netCashGstLiability = Math.max(0, totalOutwardGst - eligibleItc);
  const retainedGstWorkingCapital = Math.min(totalOutwardGst, eligibleItc);
  // Scenario treasury-yield calculation using fixed illustrative assumptions; not a statement of available yield or permitted fund placement
  const section95FloatYield = Math.round((gstSection95 * 65 * 30) / (1000 * 365));

  const statutoryTaxReserve = gstSection95 + tdsDeduction + tcsDeduction + riderTds + netCashGstLiability;

  // 5. Retained platform cash scenario (not evidence of bank ownership or funds actually held)
  const totalDisbursed = netDisbursedToRestaurants + netDisbursedToRiders;
  const retainedPlatformFloat = Math.max(0, input.grossCustomerInflowPaise - totalDisbursed);

  // 6. Calculated residual profit scenario; not a confirmed distributable or withdrawable amount
  const pureOwnerNetProfit = Math.max(
    0,
    retainedPlatformFloat - statutoryTaxReserve + retainedGstWorkingCapital + section95FloatYield,
  );

  // 7. Competitor comparison is intentionally not asserted without current sourced terms
  const zomatoCommission = Math.round((netFoodSales * 2500) / 10000); // 25% Zomato take-rate
  const restaurantSavingsVsZomato = Math.max(0, zomatoCommission - commission);

  const marginPct =
    input.grossCustomerInflowPaise > 0
      ? ((pureOwnerNetProfit / input.grossCustomerInflowPaise) * 100).toFixed(1) + "%"
      : "0.0%";

  return {
    periodLabel: input.periodLabel,
    totalOrdersCount: input.totalOrdersCount,
    grossCustomerInflowPaise: input.grossCustomerInflowPaise,
    netDisbursedToRestaurantsPaise: netDisbursedToRestaurants,
    netDisbursedToRidersPaise: netDisbursedToRiders,
    statutoryTaxReservePaise: statutoryTaxReserve,
    gstReserveSection95Paise: gstSection95,
    tdsReserveSection194OPaise: tdsDeduction + riderTds,
    tcsReserveSection52Paise: tcsDeduction,
    retainedPlatformFloatPaise: retainedPlatformFloat,
    pureOwnerNetProfitPaise: pureOwnerNetProfit,
    breakageAndUnusedFloatPaise: input.unclaimedWalletFloatPaise ?? 0,
    breakageAndGlitchFloatPaise: breakageAndGlitchFloat,
    ownerNetMarginPercentage: marginPct,
    gstItcOffsetAndArbitrage: {
      grossGstCollectedFromCommissionsPaise: gstOnCommission,
      grossGstCollectedFromPlatformFeesPaise: platformFeeGst,
      totalOutwardGstCollectedPaise: totalOutwardGst,
      eligibleInputTaxCreditPaise: eligibleItc,
      netCashGstLiabilityPaise: netCashGstLiability,
      retainedGstWorkingCapitalPaise: retainedGstWorkingCapital,
      section95GstEscrowFloatYieldPaise: section95FloatYield,
    },
    competitiveZomatoComparison: {
      zomatoAverageCommissionBps: 0,
      orderKingCommissionBps: input.platformCommissionBps,
      restaurantSavingsVsZomatoPaise: 0,
      restaurantTakeHomeUpliftPercentage: "NOT_VERIFIED",
      zomatoOnboardingFeeSavedPaise: 0,
      orderKingVolumeMultiplier: "NOT_VERIFIED",
    },
    disbursementRules: {
      restaurantDisbursementRule:
        "Scenario formula only; actual restaurant settlement terms must come from executed contracts and the canonical settlement service.",
      riderDisbursementRule:
        "Scenario formula only; actual rider payout, COD and tax treatment must come from the canonical rider settlement service.",
      glitchMoneyRetentionRule:
        "Unallocated, expired or disputed amounts require contract, consumer-protection and accounting review; this calculator does not determine ownership or retention rights.",
    },
    legalComplianceStatus: {
      itActSection79Intermediary: "NOT_VERIFIED",
      incomeTaxSection194O: "NOT_VERIFIED",
      cgstActSection95: "NOT_VERIFIED",
      cgstActSection16And17Itc: "NOT_VERIFIED",
      disputeJurisdiction: "NOT_VERIFIED",
    },
    generatedAt: new Date().toISOString(),
  };
}
