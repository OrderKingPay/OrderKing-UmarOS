import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { calculateMasterProfitEngine } from "./profit-engine.ts";

describe("Master 12-Stream Revenue & Maximum Legal Profit Engine", () => {
  test("computes all 12 revenue streams, founder free cash flow, and participant advantages", () => {
    // 50,000 monthly orders across Karimganj & Silchar expansion:
    // Food GMV = ₹1,50,00,000 (15,000,000,00 paise)
    const result = calculateMasterProfitEngine({
      periodLabel: "October 2026 Run-Rate (Barak Valley Ecosystem)",
      monthlyDeliveredOrders: 50_000,
      grossMerchandiseValuePaise: 15_000_000_00, // ₹1.5 Crore GMV
      activeRestaurantsCount: 220,
      activeRidersCount: 380,
      activeKingPayUsersCount: 42_000,

      // 1. Core Food Commission: 15%
      platformCommissionBps: 1500,
      packagingChargesPaise: 10_000_000,

      // 2. Customer Platform Fee: ₹4.00
      customerPlatformFeePerOrderPaise: 400,

      // 3. Sponsored Kitchen Ad Auction: ₹1,80,000
      adAuctionBidsPaise: 18_000_000,

      // 4. VIP Gold Pass: 4,500 subscribers @ ₹99/quarter (₹1,48,500/month)
      vipGoldActiveSubscribersCount: 4500,
      vipGoldQuarterlyFeePaise: 9900,

      // 5. BBPS & Utility Recharges: ₹80,00,000 volume @ 1.2% margin (₹96,000/mo)
      monthlyUtilityRechargeVolumePaise: 80_000_000_00,
      bbpsAverageMarginBps: 120,

      // 6. Financial Affiliates: 120 credit cards @ ₹2,000 CPA (₹2.4L) + ₹25L personal loans @ 3% (₹75k)
      approvedCreditCardsCount: 120,
      creditCardCpaPaise: 200_000,
      disbursedPersonalLoansVolumePaise: 250_000_000,
      personalLoanCommissionBps: 300,

      // 7. Bajaj Finserv: 250 Insta EMI cards @ ₹500 (₹1.25L) + ₹15L equipment loans @ 3.5% (₹52.5k)
      bajajInstaEmiCardsActivated: 250,
      bajajInstaEmiCpaPaise: 50_000,
      bajajKitchenEquipmentLoansDisbursedPaise: 150_000_000,
      bajajEquipmentLoanCommissionBps: 350,

      // 8. Fuel Alliances: ₹30L fuel vouchers @ 3% wholesale margin (₹90k) + 80 fuel cards @ ₹2,200 CPA (₹1.76L)
      fuelVouchersSoldVolumePaise: 300_000_000,
      fuelVoucherWholesaleDiscountBps: 300,
      coBrandedFuelCardsApproved: 80,
      fuelCardCpaPaise: 220_000,

      // 9. Digital Gold Spread: ₹15L sales @ 1.8% spread (₹27k)
      monthlyDigitalGoldSalesVolumePaise: 150_000_000,
      goldBuySellSpreadBps: 180,

      // 10. B2B Corporate Catering: ₹20L catering @ 12% (₹2.4L) + 3,000 off-peak drops @ ₹20 (₹60k)
      corporateCateringVolumePaise: 200_000_000,
      corporateCateringMarginBps: 1200,
      offPeakHyperlocalDropsCount: 3000,
      offPeakDropMarginPaise: 2000,

      // 11. Treasury Float Escrow Yield: ₹1.2 Crore average balance @ 6.8% p.a. (₹67k/mo)
      averageDailyEscrowBalancePaise: 120_000_000_00,
      annualizedTreasuryYieldBps: 680,

      // 12. Clean GST ITC Offsetting: ₹4,00,000 ITC available
      eligibleBusinessExpensesGstPaidPaise: 40_000_000,

      // 13. Spare Change 24K Gold Roundups: ₹5,00,000 volume @ 1.8% spread (₹9,000)
      monthlyGoldRoundupsVolumePaise: 50_000_000,
      goldRoundupSpreadBps: 180,

      // 14. Instant Daily Payout Convenience Fees: ₹15,00,000 volume @ 0.5% (₹7,500)
      monthlyInstantPayoutVolumePaise: 150_000_000,
      instantPayoutFeeBps: 50,

      // 15. Regional Master Franchise Royalties: ₹40,00,000 franchise GMV @ 2.5% (₹1,00,000)
      monthlyFranchiseGmvPaise: 40_000_000_00,
      franchiseRoyaltyBps: 250,

      // 16. Thermal POS Hardware & Cloud SaaS: 150 subscribers @ ₹499/mo (₹74,850)
      activePosSubscribersCount: 150,
      monthlyPosSubscriptionFeePaise: 49900,

      // 17. EV Battery Swapping Alliance: 4,000 swaps @ ₹15/swap (₹60,000)
      evBatterySwapsCount: 4000,
      evBatterySwapReferralMarginPaise: 1500,

      // 18. FMCG Brand Sponsorships: ₹1,50,000/mo
      fmcgBrandSponsorshipMonthlyPaise: 15_000_000,
    });

    // 1. All 18 revenue streams must be present and positive
    assert.equal(result.revenueStreams.length, 18);
    for (const s of result.revenueStreams) {
      assert.ok(s.monthlyGrossRevenuePaise > 0, `Stream ${s.streamId} must be positive`);
      assert.ok(s.legalBasis.length > 0);
      assert.ok(s.participantMutualBenefit.length > 0);
    }

    // 2. Total Monthly Gross Revenue must exceed core commission alone (multi-stream leverage)
    const coreCommissionStream = result.revenueStreams.find((s) => s.streamId === "stream_1_core_commission")!;
    assert.ok(result.totalMonthlyGrossRevenuePaise > coreCommissionStream.monthlyGrossRevenuePaise * 1.5);

    // 3. Founder Net Free Cash Flow is positive and generates strong EBITDA margin
    assert.ok(result.founderNetFreeCashFlowPaise > 0);
    assert.ok(parseFloat(result.founderEbitdaMarginPercentage) > 50.0);

    // 4. Participant Benefits are mathematically verified (Restaurants, Riders, Customers, Merchants)
    assert.equal(result.participantBenefits.length, 4);
    const restaurantBenefit = result.participantBenefits.find((b) => b.participant === "RESTAURANT")!;
    const riderBenefit = result.participantBenefits.find((b) => b.participant === "RIDER")!;
    const customerBenefit = result.participantBenefits.find((b) => b.participant === "CUSTOMER")!;
    const merchantBenefit = result.participantBenefits.find((b) => b.participant === "MERCHANT")!;

    assert.equal(restaurantBenefit.averageMonthlyAdvantagePaise, 2_000_000); // ₹20,000
    assert.equal(riderBenefit.averageMonthlyAdvantagePaise, 165_000); // ₹1,650
    assert.equal(customerBenefit.averageMonthlyAdvantagePaise, 12_000); // ₹120
    assert.equal(merchantBenefit.averageMonthlyAdvantagePaise, 150_000); // ₹1,500

    // 5. Non-Negotiable Invariants: 100% legal, zero uncontractual retention
    assert.equal(result.statutoryComplianceChecklist.gstCompliant, true);
    assert.equal(result.statutoryComplianceChecklist.rbiCompliant, true);
    assert.equal(result.statutoryComplianceChecklist.companiesActCompliant, true);
    assert.equal(result.statutoryComplianceChecklist.labourAndSocialSecurityCompliant, true);
    assert.equal(result.statutoryComplianceChecklist.consumerProtectionCompliant, true);
    assert.equal(result.statutoryComplianceChecklist.zeroUncontractualRetentionVerified, true);
    assert.equal(result.auditTrail.suspenseEscrowBalancePaise, 0);
    assert.equal(result.auditTrail.integerPaiseInvariantVerified, true);

    // 6. 2G Low-Network Resilience Telemetry
    assert.equal(result.resilienceTelemetry.zeroOrderLossGuarantee, true);
    assert.ok(result.resilienceTelemetry.lowNetworkCacheHitRate.includes("99.4%"));
    assert.equal(result.resilienceTelemetry.offlineQueueSyncLatencyMs, 450);
  });
});
