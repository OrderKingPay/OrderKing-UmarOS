// @ts-nocheck
/**
 * Master 12-Stream Revenue & Maximum Legal Profit Engine
 * OrderKing (Food Delivery) + KingPay (Fintech Layer)
 * 
 * Non-Negotiable Invariants:
 * 1. 100% legal under Indian Law (CGST Act, Income Tax Act, RBI PPI / Digital Lending, Companies Act, Code on Social Security 2020).
 * 2. Zero retention of any money that is not contractually or legally ours (unallocated funds held in suspense escrow, never recognized as revenue).
 * 3. Every revenue stream has a realistic, sustainable commercial rationale.
 * 4. Mutual benefit first: All participants (restaurants, riders, customers, merchants) earn or save more than on competitor platforms.
 */

export type ProfitEngineInput = {
  periodLabel: string;
  monthlyDeliveredOrders: number;
  grossMerchandiseValuePaise: number; // Food GMV (paise)
  activeRestaurantsCount: number;
  activeRidersCount: number;
  activeKingPayUsersCount: number;

  // 1. Core Food Delivery Take-Rate
  platformCommissionBps: number; // e.g. 1500 for 15%
  packagingChargesPaise: number;

  // 2. Customer Platform Convenience Fee
  customerPlatformFeePerOrderPaise: number; // e.g. 400 for ₹4.00

  // 3. In-App Ad Auction (Sponsored Kitchen Listings)
  adAuctionBidsPaise: number; // Total CPC/CPM spent by restaurants on sponsored listings

  // 4. VIP Gold Pass Subscriptions
  vipGoldActiveSubscribersCount: number;
  vipGoldQuarterlyFeePaise: number; // e.g. 9900 for ₹99/quarter

  // 5. BBPS & Utility Recharges (Electricity, Mobile, DTH, Water, FASTag)
  monthlyUtilityRechargeVolumePaise: number;
  bbpsAverageMarginBps: number; // e.g. 120 for 1.2%

  // 6. Financial Affiliates & Lead Generation (Credit Cards & Instant Loans)
  approvedCreditCardsCount: number;
  creditCardCpaPaise: number; // e.g. 200000 for ₹2,000 CPA
  disbursedPersonalLoansVolumePaise: number;
  personalLoanCommissionBps: number; // e.g. 300 for 3.0%

  // 7. Bajaj Finserv Ecosystem
  bajajInstaEmiCardsActivated: number;
  bajajInstaEmiCpaPaise: number; // e.g. 50000 for ₹500
  bajajKitchenEquipmentLoansDisbursedPaise: number;
  bajajEquipmentLoanCommissionBps: number; // e.g. 350 for 3.5%

  // 8. Fuel Alliances (HPCL, IndianOil, BPCL)
  fuelVouchersSoldVolumePaise: number;
  fuelVoucherWholesaleDiscountBps: number; // e.g. 300 for 3.0% wholesale discount
  coBrandedFuelCardsApproved: number;
  fuelCardCpaPaise: number; // e.g. 220000 for ₹2,200 CPA

  // 9. Digital Gold Bullion Spread (Augmont / MMTC-PAMP)
  monthlyDigitalGoldSalesVolumePaise: number;
  goldBuySellSpreadBps: number; // e.g. 180 for 1.8%

  // 10. B2B Corporate Catering & Off-Peak Logistics
  corporateCateringVolumePaise: number;
  corporateCateringMarginBps: number; // e.g. 1200 for 12%
  offPeakHyperlocalDropsCount: number;
  offPeakDropMarginPaise: number; // e.g. 2000 for ₹20/drop

  // 11. Treasury Float Arbitrage (RBI Regulated Liquid Escrow Sweep-in)
  averageDailyEscrowBalancePaise: number;
  annualizedTreasuryYieldBps: number; // e.g. 680 for 6.8% p.a.

  // 12. Clean Input Tax Credit (ITC) Offsetting
  eligibleBusinessExpensesGstPaidPaise: number; // GST paid on AWS, payment gateways, marketing, hardware

  // 13. Spare Change 24K Gold Roundups (Jar/Cred model)
  monthlyGoldRoundupsVolumePaise?: number;
  goldRoundupSpreadBps?: number; // e.g. 180 for 1.8%

  // 14. Instant Daily Payout Convenience Fees (IMPS/UPI)
  monthlyInstantPayoutVolumePaise?: number;
  instantPayoutFeeBps?: number; // e.g. 50 for 0.5%

  // 15. Regional Master Franchise & White-Label District Royalties (Tier-2/3 District Hubs)
  monthlyFranchiseGmvPaise?: number;
  franchiseRoyaltyBps?: number; // e.g. 250 for 2.5%

  // 16. Thermal POS Hardware Lease & Cloud SaaS Subscriptions
  activePosSubscribersCount?: number;
  monthlyPosSubscriptionFeePaise?: number; // e.g. 49900 for ₹499/month

  // 17. EV Battery Swapping Fleet Alliance (Sun Mobility / Battery Smart)
  evBatterySwapsCount?: number;
  evBatterySwapReferralMarginPaise?: number; // e.g. 1500 for ₹15/swap

  // 18. FMCG & Brand Category Sponsorships
  fmcgBrandSponsorshipMonthlyPaise?: number;

  // Real operating costs. No hard-coded infrastructure/payment costs are assumed.
  paymentGatewayFeeBps?: number;
  monthlyCloudAndServerCostPaise?: number;
  monthlySmsSupportCostPaise?: number;
};

export type RevenueStreamBreakdown = {
  streamId: string;
  name: string;
  category: "CORE_DELIVERY" | "CUSTOMER_FINTECH" | "MERCHANT_B2B" | "AFFILIATE_ALLIANCE" | "TREASURY_TAX" | "FRANCHISE_ECOSYSTEM";
  monthlyGrossRevenuePaise: number;
  grossMarginPercentage: string;
  legalBasis: string;
  participantMutualBenefit: string;
};

export type ParticipantBenefitAudit = {
  participant: "RESTAURANT" | "RIDER" | "CUSTOMER" | "MERCHANT";
  orderKingValueProposition: string;
  competitorComparison: string;
  averageMonthlyAdvantagePaise: number | null;
  verifiedSafeHarbor: string;
};

export type ProfitEngineSummary = {
  periodLabel: string;
  totalMonthlyGrossRevenuePaise: number;
  totalOperatingCostsPaise: number;
  founderNetFreeCashFlowPaise: number;
  founderEbitdaMarginPercentage: string;
  competitorBurnMultiplier: string; // "NOT_MEASURED" until comparable external cost data is supplied
  revenueStreams: RevenueStreamBreakdown[];
  participantBenefits: ParticipantBenefitAudit[];
  statutoryComplianceChecklist: {
    gstCompliant: boolean | null;
    rbiCompliant: boolean | null;
    companiesActCompliant: boolean | null;
    labourAndSocialSecurityCompliant: boolean | null;
    consumerProtectionCompliant: boolean | null;
    zeroUncontractualRetentionVerified: boolean | null;
  };
  resilienceTelemetry: {
    lowNetworkCacheHitRate: string;
    zeroOrderLossGuarantee: boolean | null;
    offlineQueueSyncLatencyMs: number | null;
  };
  auditTrail: {
    suspenseEscrowBalancePaise: number | null;
    integerPaiseInvariantVerified: boolean | null;
    generatedAt: string;
  };
};

export function calculateMasterProfitEngine(input: ProfitEngineInput): ProfitEngineSummary {
  // --- STREAM 1: Core Food Delivery Take-Rate ---
  const coreCommissionPaise = Math.round(
    (input.grossMerchandiseValuePaise * input.platformCommissionBps) / 10000,
  );

  // --- STREAM 2: Customer Platform Convenience Fee (₹3–₹5/order) ---
  const platformFeePaise = input.monthlyDeliveredOrders * input.customerPlatformFeePerOrderPaise;

  // --- STREAM 3: In-App Sponsored Kitchen Ad Auction (GSP model) ---
  const adAuctionRevenuePaise = input.adAuctionBidsPaise;

  // --- STREAM 4: VIP Gold Pass Subscriptions (₹99/quarter) ---
  const monthlyVipRevenuePaise = Math.round(
    (input.vipGoldActiveSubscribersCount * input.vipGoldQuarterlyFeePaise) / 3,
  );

  // --- STREAM 5: BBPS & Utility Recharges (0.5%–2% margin) ---
  const bbpsRevenuePaise = Math.round(
    (input.monthlyUtilityRechargeVolumePaise * input.bbpsAverageMarginBps) / 10000,
  );

  // --- STREAM 6: Financial Affiliates (Credit Cards & Loans via RBI LSPs) ---
  const creditCardAffiliatePaise = input.approvedCreditCardsCount * input.creditCardCpaPaise;
  const loanAffiliatePaise = Math.round(
    (input.disbursedPersonalLoansVolumePaise * input.personalLoanCommissionBps) / 10000,
  );
  const totalFinancialAffiliatesPaise = creditCardAffiliatePaise + loanAffiliatePaise;

  // --- STREAM 7: Bajaj Finserv Ecosystem (Insta EMI & Commercial Equipment) ---
  const bajajInstaEmiRevenuePaise = input.bajajInstaEmiCardsActivated * input.bajajInstaEmiCpaPaise;
  const bajajEquipmentRevenuePaise = Math.round(
    (input.bajajKitchenEquipmentLoansDisbursedPaise * input.bajajEquipmentLoanCommissionBps) / 10000,
  );
  const totalBajajRevenuePaise = bajajInstaEmiRevenuePaise + bajajEquipmentRevenuePaise;

  // --- STREAM 8: Fuel Alliances (Wholesale Vouchers + Fuel Cards) ---
  const fuelVoucherMarginPaise = Math.round(
    (input.fuelVouchersSoldVolumePaise * input.fuelVoucherWholesaleDiscountBps) / 10000,
  );
  const fuelCardAffiliatePaise = input.coBrandedFuelCardsApproved * input.fuelCardCpaPaise;
  const totalFuelRevenuePaise = fuelVoucherMarginPaise + fuelCardAffiliatePaise;

  // --- STREAM 9: Digital Gold Bullion Spread (1.8% buy/sell margin) ---
  const goldSpreadRevenuePaise = Math.round(
    (input.monthlyDigitalGoldSalesVolumePaise * input.goldBuySellSpreadBps) / 10000,
  );

  // --- STREAM 10: B2B Corporate Catering & Off-Peak Logistics ---
  const corporateCateringPaise = Math.round(
    (input.corporateCateringVolumePaise * input.corporateCateringMarginBps) / 10000,
  );
  const offPeakLogisticsPaise = input.offPeakHyperlocalDropsCount * input.offPeakDropMarginPaise;
  const totalB2bRevenuePaise = corporateCateringPaise + offPeakLogisticsPaise;

  // --- STREAM 11: Treasury Float Escrow Yield (RBI Regulated Sweep-in) ---
  const monthlyTreasuryYieldPaise = Math.round(
    (input.averageDailyEscrowBalancePaise * input.annualizedTreasuryYieldBps * 30) / (10000 * 365),
  );

  // --- STREAM 12: Clean GST Input Tax Credit (ITC) Offsetting ---
  // Outward 18% GST collected on Commission + Platform Fee + Ads
  const totalOutwardGstEligibleRevenue = coreCommissionPaise + platformFeePaise + adAuctionRevenuePaise;
  const outwardGstLiabilityPaise = Math.round((totalOutwardGstEligibleRevenue * 18) / 100);
  const cleanGstItcSavingsPaise = Math.min(
    outwardGstLiabilityPaise,
    input.eligibleBusinessExpensesGstPaidPaise,
  );

  // --- STREAM 13: Spare Change 24K Gold Roundups (Jar/Cred model) ---
  const goldRoundupsVolume = input.monthlyGoldRoundupsVolumePaise ?? 0;
  const goldRoundupSpreadBps = input.goldRoundupSpreadBps ?? 0;
  const goldRoundupMarginPaise = Math.round((goldRoundupsVolume * goldRoundupSpreadBps) / 10000);

  // --- STREAM 14: Instant Daily Payout Convenience Fees (IMPS/UPI) ---
  const instantPayoutVolume = input.monthlyInstantPayoutVolumePaise ?? 0;
  const instantPayoutFeeBps = input.instantPayoutFeeBps ?? 0;
  const instantPayoutFeePaise = Math.round((instantPayoutVolume * instantPayoutFeeBps) / 10000);

  // --- STREAM 15: Regional Master Franchise & White-Label Royalties ---
  const franchiseGmv = input.monthlyFranchiseGmvPaise ?? 0; // e.g. ₹40L franchise GMV
  const franchiseRoyaltyBps = input.franchiseRoyaltyBps ?? 0; // 2.5% platform licensing royalty
  const franchiseRoyaltyPaise = Math.round((franchiseGmv * franchiseRoyaltyBps) / 10000);

  // --- STREAM 16: Thermal POS Hardware Lease & Cloud SaaS Subscriptions ---
  const posSubscribers = input.activePosSubscribersCount ?? 0;
  const posFeePerSub = input.monthlyPosSubscriptionFeePaise ?? 0; // ₹499/mo lease + paper rolls
  const posSubscriptionRevenuePaise = posSubscribers * posFeePerSub;

  // --- STREAM 17: EV Battery Swapping Fleet Alliance (Sun Mobility / Battery Smart) ---
  const batterySwaps = input.evBatterySwapsCount ?? 0;
  const swapMargin = input.evBatterySwapReferralMarginPaise ?? 0; // ₹15/swap referral + power margin
  const evBatterySwapRevenuePaise = batterySwaps * swapMargin;

  // --- STREAM 18: FMCG & Brand Category Sponsorships (Amul, Coca-Cola, Red Bull) ---
  const fmcgBrandSponsorshipPaise = input.fmcgBrandSponsorshipMonthlyPaise ?? 0; // ₹1,50,000/mo

  // --- AGGREGATE REVENUE ---
  const totalGrossRevenuePaise =
    coreCommissionPaise +
    platformFeePaise +
    adAuctionRevenuePaise +
    monthlyVipRevenuePaise +
    bbpsRevenuePaise +
    totalFinancialAffiliatesPaise +
    totalBajajRevenuePaise +
    totalFuelRevenuePaise +
    goldSpreadRevenuePaise +
    totalB2bRevenuePaise +
    monthlyTreasuryYieldPaise +
    cleanGstItcSavingsPaise +
    goldRoundupMarginPaise +
    instantPayoutFeePaise +
    franchiseRoyaltyPaise +
    posSubscriptionRevenuePaise +
    evBatterySwapRevenuePaise +
    fmcgBrandSponsorshipPaise;

  // Operating Costs: supplied from real invoices/provider pricing only.
  const paymentGatewayFee = Math.round(
    (input.grossMerchandiseValuePaise * Math.max(0, input.paymentGatewayFeeBps ?? 0)) / 10000,
  );
  const cloudAndServerCost = Math.max(0, input.monthlyCloudAndServerCostPaise ?? 0);
  const smsSupportCost = Math.max(0, input.monthlySmsSupportCostPaise ?? 0);
  const totalOperatingCosts = paymentGatewayFee + cloudAndServerCost + smsSupportCost;

  const founderNetFreeCashFlowPaise = totalGrossRevenuePaise - totalOperatingCosts;
  const ebitdaMarginPct =
    totalGrossRevenuePaise > 0
      ? ((founderNetFreeCashFlowPaise / totalGrossRevenuePaise) * 100).toFixed(1) + "%"
      : "0.0%";

  const streams: RevenueStreamBreakdown[] = [
    {
      streamId: "stream_1_core_commission",
      name: "Core Food Delivery Commission (15% Flat)",
      category: "CORE_DELIVERY",
      monthlyGrossRevenuePaise: coreCommissionPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration.",
      participantMutualBenefit: "Requires current contract, provider and participant data.",
    },
    {
      streamId: "stream_2_platform_convenience_fee",
      name: "Customer Platform Technology Fee (₹4/order)",
      category: "CORE_DELIVERY",
      monthlyGrossRevenuePaise: platformFeePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_3_ad_auction",
      name: "Sponsored Kitchen Ad Auction (GSP Model)",
      category: "MERCHANT_B2B",
      monthlyGrossRevenuePaise: adAuctionRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_4_vip_gold_subscription",
      name: "VIP Gold Pass Subscriptions (₹99/quarter)",
      category: "CUSTOMER_FINTECH",
      monthlyGrossRevenuePaise: monthlyVipRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_5_bbps_recharges",
      name: "BBPS Bill Payments & Mobile Recharges",
      category: "CUSTOMER_FINTECH",
      monthlyGrossRevenuePaise: bbpsRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_6_financial_affiliates",
      name: "Credit Card & Loan Lead Generation",
      category: "AFFILIATE_ALLIANCE",
      monthlyGrossRevenuePaise: totalFinancialAffiliatesPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_7_bajaj_finserv",
      name: "Bajaj Finserv Insta EMI & Kitchen Equipment",
      category: "AFFILIATE_ALLIANCE",
      monthlyGrossRevenuePaise: totalBajajRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_8_fuel_alliances",
      name: "HPCL, IndianOil & BPCL Fuel Alliances",
      category: "AFFILIATE_ALLIANCE",
      monthlyGrossRevenuePaise: totalFuelRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_9_digital_gold",
      name: "24K 99.9% Digital Gold Bullion Spread",
      category: "CUSTOMER_FINTECH",
      monthlyGrossRevenuePaise: goldSpreadRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_10_b2b_logistics",
      name: "B2B Corporate Catering & Off-Peak Logistics",
      category: "MERCHANT_B2B",
      monthlyGrossRevenuePaise: totalB2bRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_11_treasury_yield",
      name: "RBI-Regulated Liquid Escrow Float Yield",
      category: "TREASURY_TAX",
      monthlyGrossRevenuePaise: monthlyTreasuryYieldPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_12_clean_gst_itc",
      name: "Statutory Input Tax Credit (ITC) Working Capital",
      category: "TREASURY_TAX",
      monthlyGrossRevenuePaise: cleanGstItcSavingsPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_13_spare_change_gold_roundup",
      name: "Spare Change 24K Gold Roundups (Jar/Cred Model)",
      category: "CUSTOMER_FINTECH",
      monthlyGrossRevenuePaise: goldRoundupMarginPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_14_instant_payout_convenience_fees",
      name: "Instant Daily Payout Convenience Fees (IMPS/UPI)",
      category: "MERCHANT_B2B",
      monthlyGrossRevenuePaise: instantPayoutFeePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_15_franchise_royalties",
      name: "Regional Master Franchise & District Royalties (2.5%)",
      category: "FRANCHISE_ECOSYSTEM",
      monthlyGrossRevenuePaise: franchiseRoyaltyPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_16_pos_hardware_saas",
      name: "Thermal POS Hardware & Cloud SaaS Subscriptions",
      category: "MERCHANT_B2B",
      monthlyGrossRevenuePaise: posSubscriptionRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_17_ev_battery_swapping",
      name: "EV Battery Swapping Fleet Alliance (Sun Mobility)",
      category: "AFFILIATE_ALLIANCE",
      monthlyGrossRevenuePaise: evBatterySwapRevenuePaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
    {
      streamId: "stream_18_fmcg_brand_sponsorships",
      name: "FMCG Brand Sponsorships & Sampling Campaigns",
      category: "MERCHANT_B2B",
      monthlyGrossRevenuePaise: fmcgBrandSponsorshipPaise,
      grossMarginPercentage: "NOT_CALCULATED",
      legalBasis: "Requires current contract/provider/legal configuration."
      participantMutualBenefit: "Requires current contract, provider and participant data."
    },
  ];

  const participantBenefits: ParticipantBenefitAudit[] = [
    {
      participant: "RESTAURANT",
      orderKingValueProposition:
        "15% flat commission, ₹0 onboarding fee, ₹0 forced ad spend, weekly integer-paise settlement, optional 1-tap instant cashout.",
      competitorComparison: "NOT_BENCHMARKED"
      averageMonthlyAdvantagePaise: null, // ₹20,000 extra profit per ₹2L monthly sales
      verifiedSafeHarbor: "NOT_ASSESSED",
    },
    {
      participant: "RIDER",
      orderKingValueProposition:
        "100% customer tips pass-through, HPCL/IOCL fleet card saving ₹1,650/mo, 40% cheaper EV battery swaps, complimentary ₹2L accident cover.",
      competitorComparison: "NOT_BENCHMARKED"
      averageMonthlyAdvantagePaise: null, // ₹1,650/month petrol savings + insurance
      verifiedSafeHarbor: "NOT_ASSESSED",
    },
    {
      participant: "CUSTOMER",
      orderKingValueProposition:
        "Zero inflated menu prices, ₹4 platform fee, King Coins food burn, spare-change 24K gold accumulation, instant KingPay 1-tap checkout.",
      competitorComparison: "NOT_BENCHMARKED"
      averageMonthlyAdvantagePaise: null, // ₹120 savings per month across 8 orders
      verifiedSafeHarbor: "NOT_ASSESSED",
    },
    {
      participant: "MERCHANT",
      orderKingValueProposition:
        "0% MDR on UPI QR payments, instant bank settlement, BBPS bill payment commission sharing, KingPay local store discoverability.",
      competitorComparison: "NOT_BENCHMARKED"
      averageMonthlyAdvantagePaise: null, // ₹1,500/month saved on soundbox rentals & MDR
      verifiedSafeHarbor: "NOT_ASSESSED",
    },
  ];

  return {
    periodLabel: input.periodLabel,
    totalMonthlyGrossRevenuePaise: totalGrossRevenuePaise,
    totalOperatingCostsPaise: totalOperatingCosts,
    founderNetFreeCashFlowPaise: founderNetFreeCashFlowPaise,
    founderEbitdaMarginPercentage: ebitdaMarginPct,
    competitorBurnMultiplier:
      "NOT_MEASURED",
    revenueStreams: streams,
    participantBenefits,
    statutoryComplianceChecklist: {
      gstCompliant: null,
      rbiCompliant: null,
      companiesActCompliant: null,
      labourAndSocialSecurityCompliant: null,
      consumerProtectionCompliant: null,
      zeroUncontractualRetentionVerified: null,
    },
    resilienceTelemetry: {
      lowNetworkCacheHitRate: "NOT_MEASURED",
      zeroOrderLossGuarantee: null,
      offlineQueueSyncLatencyMs: null,
    },
    auditTrail: {
      suspenseEscrowBalancePaise: null,
      integerPaiseInvariantVerified: null,
      generatedAt: new Date().toISOString(),
    },
  };
}
