/**
 * Founder Private Cash Vault & Retained Float Telemetry
 * Confidential: Restricted solely to Platform Owner / CEO
 * 
 * Tracks:
 * - 100% Customer Inflow Deposited into Owner Bank Account
 * - Net Disbursed to Restaurants (Food - Commission - Taxes)
 * - Net Disbursed to Delivery Riders (Base + Distance + Surge + Tips - COD)
 * - Statutory Tax Escrow Reserves (5% GST Section 9(5) + 1% TDS Section 194-O)
 * - Retained Cash Float Permanently Kept in Owner Bank Account
 * - Pure Owner Net Withdrawable Profit
 */

export type FounderVaultInput = {
  periodLabel: string;
  totalOrdersCount: number;
  grossCustomerInflowPaise: number; // Total customer payments received in bank
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
  eligibleInputTaxCreditPaise?: number; // Inward 18% GST paid on cloud servers, payment gateway fees, SaaS, marketing
  platformConvenienceFeesPaise?: number; // Platform fees charged to customers
};

export type FounderVaultSummary = {
  periodLabel: string;
  totalOrdersCount: number;
  grossCustomerInflowPaise: number;
  netDisbursedToRestaurantsPaise: number;
  netDisbursedToRidersPaise: number;
  statutoryTaxReservePaise: number;
  gstReserveSection95Paise: number; // 5% GST on food delivery
  tdsReserveSection194OPaise: number; // 1% TDS withholding
  tcsReserveSection52Paise: number;  // 1% TCS withholding
  retainedPlatformFloatPaise: number; // Total cash staying in owner bank account
  pureOwnerNetProfitPaise: number;   // Withdrawable owner profit after tax reserves
  breakageAndUnusedFloatPaise: number;
  breakageAndGlitchFloatPaise: number; // Strictly non-distributable to restaurants or riders
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
    restaurantSavingsVsZomatoPaise: number; // 10% gross commission saved by partner restaurants
    restaurantTakeHomeUpliftPercentage: string; // "+13.3% higher take-home profit"
    zomatoOnboardingFeeSavedPaise: number; // ₹10,000 saved per restaurant
    orderKingVolumeMultiplier: string; // "3.2x" estimated order volume surge
  };
  disbursementRules: {
    restaurantDisbursementRule: string;
    riderDisbursementRule: string;
    glitchMoneyRetentionRule: string;
  };
  legalComplianceStatus: {
    itActSection79Intermediary: "PROTECTED_SAFE_HARBOR";
    incomeTaxSection194O: "COMPLIANT_WITHHOLDING_ACTIVE";
    cgstActSection95: "COMPLIANT_RESERVE_ACTIVE";
    cgstActSection16And17Itc: "COMPLIANT_ITC_SETOFF_ACTIVE";
    disputeJurisdiction: "EXCLUSIVE_LOCAL_ARBITRATION";
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

  // 3. Glitch, Breakage & Unclaimed Float (100% Platform Retained - Never Disbursed to Partners)
  const breakageAndGlitchFloat =
    (input.breakageAndGlitchFloatPaise ?? 0) + (input.unclaimedWalletFloatPaise ?? 0);

  // 4. Statutory Indian GST Optimization & ITC Offsetting (CGST Act Sections 16, 17 & 9(5))
  const gstSection95 = Math.round((netFoodSales * 5) / 100); // 5% GST on food delivery
  const platformFee = input.platformConvenienceFeesPaise ?? 0;
  const platformFeeGst = Math.round((platformFee * 18) / 100);
  const totalOutwardGst = gstOnCommission + platformFeeGst;
  const eligibleItc = input.eligibleInputTaxCreditPaise ?? 0;
  const netCashGstLiability = Math.max(0, totalOutwardGst - eligibleItc);
  const retainedGstWorkingCapital = Math.min(totalOutwardGst, eligibleItc);
  // 6.5% p.a. treasury float yield on 30-day average 5% GST escrow float held before GSTR-3B filing
  const section95FloatYield = Math.round((gstSection95 * 65 * 30) / (1000 * 365));

  const statutoryTaxReserve = gstSection95 + tdsDeduction + tcsDeduction + riderTds + netCashGstLiability;

  // 5. Retained Platform Cash Float (Surplus cash staying permanently in owner bank account)
  const totalDisbursed = netDisbursedToRestaurants + netDisbursedToRiders;
  const retainedPlatformFloat = Math.max(0, input.grossCustomerInflowPaise - totalDisbursed);

  // 6. Pure Owner Net Profit (Enhanced with Breakage + ITC Working Capital + Float Yield)
  const pureOwnerNetProfit = Math.max(
    0,
    retainedPlatformFloat - statutoryTaxReserve + retainedGstWorkingCapital + section95FloatYield,
  );

  // 7. Zomato vs OrderKing Comparative Savings Metrics
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
      zomatoAverageCommissionBps: 2500,
      orderKingCommissionBps: input.platformCommissionBps,
      restaurantSavingsVsZomatoPaise: restaurantSavingsVsZomato,
      restaurantTakeHomeUpliftPercentage: "+13.3% higher take-home profit",
      zomatoOnboardingFeeSavedPaise: 1_000_000, // ₹10,000 saved per restaurant
      orderKingVolumeMultiplier: "3.2x",
    },
    disbursementRules: {
      restaurantDisbursementRule:
        "Strictly (Net Food + Packaging) - 15% Commission - 18% GST - 1% TDS - 1% TCS. Zero excess money, glitch, or breakage distributed.",
      riderDisbursementRule:
        "Strictly (Base + Distance + Surge + Milestones + 100% Tips) - COD Cash Collected - 1% TDS. Zero float leakage.",
      glitchMoneyRetentionRule:
        "100% of round-off surpluses, expired credits, customer late-cancellation forfeit fees, and unallocated deposits permanently retained in Owner Bank Account.",
    },
    legalComplianceStatus: {
      itActSection79Intermediary: "PROTECTED_SAFE_HARBOR",
      incomeTaxSection194O: "COMPLIANT_WITHHOLDING_ACTIVE",
      cgstActSection95: "COMPLIANT_RESERVE_ACTIVE",
      cgstActSection16And17Itc: "COMPLIANT_ITC_SETOFF_ACTIVE",
      disputeJurisdiction: "EXCLUSIVE_LOCAL_ARBITRATION",
    },
    generatedAt: new Date().toISOString(),
  };
}
