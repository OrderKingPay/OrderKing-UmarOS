import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { calculateFounderRetainedCashVault } from "./founder-vault.ts";

describe("Founder Private Cash Vault & Retained Float Engine", () => {
  test("computes exact bank inflow, restaurant payouts, rider payouts, and retained cash", () => {
    // 1,000 orders: Gross Customer Inflow = ₹5,00,000 (50,000,000 paise)
    // Food Gross = ₹4,00,000 (40,000,000 paise)
    // Restaurant Discounts = ₹20,000 (2,00,000 paise)
    // Net Food = ₹3,80,000 (38,000,000 paise)
    // Commission = 15% (1500 bps)
    const result = calculateFounderRetainedCashVault({
      periodLabel: "Week 38 (Karimganj & Silchar)",
      totalOrdersCount: 1000,
      grossCustomerInflowPaise: 50_000_000, // ₹5,00,000 in owner bank account
      foodGrossPaise: 40_000_000,
      restaurantDiscountsPaise: 2_000_000,
      platformCommissionBps: 1500, // 15%
      packagingChargesPaise: 2_000_000, // ₹20,000
      riderBasePaise: 3_500_000, // ₹35,000
      riderDistancePaise: 2_800_000, // ₹28,000
      riderSurgePaise: 1_500_000, // ₹15,000
      riderMilestoneBonusPaise: 500_000, // ₹5,000
      customerTipsPaise: 2_000_000, // ₹20,000
      cashCollectedCodPaise: 1_000_000, // ₹10,000 COD holding
      unclaimedWalletFloatPaise: 450_000, // ₹4,500
      breakageAndGlitchFloatPaise: 350_000, // ₹3,500 overpayment round-offs & cancellation forfeits
      eligibleInputTaxCreditPaise: 800_000, // ₹8,000 ITC from AWS servers, payment gateway & SaaS
      platformConvenienceFeesPaise: 500_000, // ₹5,000 platform convenience fees
    });

    // 1. Gross Customer Inflow matches 100% of money in bank
    assert.equal(result.grossCustomerInflowPaise, 50_000_000);

    // 2. Net Food = 38,000,000 paise. Commission = 15% = 5,700,000 paise
    // Net restaurant payout must be positive and properly deducted
    assert.ok(result.netDisbursedToRestaurantsPaise > 0);
    assert.ok(result.netDisbursedToRestaurantsPaise < 40_000_000);

    // 3. Rider Gross = 35k + 28k + 15k + 5k + 20k = 103,000 paise (₹1,03,000)
    // Less COD 10k, less 1% TDS (1,030) = ~91,970 paise
    assert.ok(result.netDisbursedToRidersPaise > 0);

    // 4. Retained Platform Float must remain in owner account
    assert.ok(result.retainedPlatformFloatPaise > 0);
    assert.ok(result.retainedPlatformFloatPaise < result.grossCustomerInflowPaise);

    // 5. Statutory Tax Reserves (5% GST + 1% TDS/TCS + net cash GST)
    assert.ok(result.statutoryTaxReservePaise > 0);

    // 6. Breakage and Glitch Float (₹4,500 + ₹3,500 = ₹8,000 / 800,000 paise)
    assert.equal(result.breakageAndGlitchFloatPaise, 800_000);

    // 7. Indian GST ITC Offsetting (CGST Act Sections 16, 17 & 9(5))
    assert.ok(result.gstItcOffsetAndArbitrage.totalOutwardGstCollectedPaise > 0);
    assert.ok(result.gstItcOffsetAndArbitrage.retainedGstWorkingCapitalPaise > 0);
    assert.ok(result.gstItcOffsetAndArbitrage.section95GstEscrowFloatYieldPaise > 0);

    // 8. Zomato vs OrderKing Comparative Savings
    // Net Food = 380,000,000 paise. 25% Zomato vs 15% OrderKing = 10% savings = 3,800,000 paise (₹38,000)
    assert.equal(result.competitiveZomatoComparison.zomatoAverageCommissionBps, 2500);
    assert.equal(result.competitiveZomatoComparison.restaurantSavingsVsZomatoPaise, 3_800_000);
    assert.equal(result.competitiveZomatoComparison.zomatoOnboardingFeeSavedPaise, 1_000_000);

    // 9. Pure Owner Net Profit is positive and enhanced
    assert.ok(result.pureOwnerNetProfitPaise > 0);

    // 10. Legal compliance flags are set
    assert.equal(result.legalComplianceStatus.itActSection79Intermediary, "PROTECTED_SAFE_HARBOR");
    assert.equal(result.legalComplianceStatus.incomeTaxSection194O, "COMPLIANT_WITHHOLDING_ACTIVE");
    assert.equal(result.legalComplianceStatus.cgstActSection95, "COMPLIANT_RESERVE_ACTIVE");
    assert.equal(result.legalComplianceStatus.cgstActSection16And17Itc, "COMPLIANT_ITC_SETOFF_ACTIVE");
    assert.equal(result.legalComplianceStatus.disputeJurisdiction, "EXCLUSIVE_LOCAL_ARBITRATION");
  });
});
