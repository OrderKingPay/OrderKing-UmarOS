import { describe, it, expect } from "vitest";
import {
  STATUTORY_RATES,
  createMerchantContract,
  evaluateEffectiveCommissionRate,
  getWeeklySettlementCycle,
  getPreviousWeeklySettlementCycle,
  generateMerchantWeeklySettlementStatement,
  generatePayoutLedgerEntries,
  generateComprehensiveSettlementJournal,
  postMerchantSettlementToLedger,
  type MerchantContract,
  type VolumeCommissionTier,
} from "./merchant-contracts.ts";
import type { CanonicalLedger, LedgerTransaction } from "./canonical-ledger.ts";

describe("Merchant Contracts & Negotiated Commission Agreements", () => {
  it("creates valid merchant contracts with negotiated rates between 8% and 35%", () => {
    // 8% floor rate
    const contract8 = createMerchantContract({
      restaurantId: "rest_anchor_01",
      restaurantName: "Domino's Pizza Anchor",
      baseCommissionBps: 800, // 8.00%
      panNumber: "AAACD1234E",
      gstin: "27AAACD1234E1Z5",
    });
    expect(contract8.baseCommissionBps).toBe(800);
    expect(contract8.status).toBe("ACTIVE");

    // Standard 18% rate
    const contract18 = createMerchantContract({
      restaurantId: "rest_cloud_02",
      restaurantName: "Behrouz Biryani Cloud Kitchen",
      baseCommissionBps: 1800, // 18.00%
    });
    expect(contract18.baseCommissionBps).toBe(1800);

    // 35% maximum cap rate
    const contract35 = createMerchantContract({
      restaurantId: "rest_boutique_03",
      restaurantName: "High-Cost Boutique Diner",
      baseCommissionBps: 3500, // 35.00%
    });
    expect(contract35.baseCommissionBps).toBe(3500);
  });

  it("strictly rejects contracts with commission rates below 8% (800 bps)", () => {
    expect(() => {
      createMerchantContract({
        restaurantId: "rest_invalid_low",
        restaurantName: "Below Floor Restaurant",
        baseCommissionBps: 799, // 7.99% - below statutory 8%
      });
    }).toThrow(/Negotiated commission rate must be an integer between 8% \(800 bps\) and 35%/);
  });

  it("strictly rejects contracts with commission rates above 35% (3500 bps)", () => {
    expect(() => {
      createMerchantContract({
        restaurantId: "rest_invalid_high",
        restaurantName: "Above Cap Restaurant",
        baseCommissionBps: 3501, // 35.01% - above 35%
      });
    }).toThrow(/Negotiated commission rate must be an integer between 8% \(800 bps\) and 35%/);
  });

  it("rejects non-integer commission rates or negative tier discounts", () => {
    expect(() => {
      createMerchantContract({
        restaurantId: "rest_fractional",
        restaurantName: "Fractional Rate",
        baseCommissionBps: 1550.5,
      });
    }).toThrow(/must be an integer/);

    expect(() => {
      createMerchantContract({
        restaurantId: "rest_negative_tier",
        restaurantName: "Negative Tier",
        baseCommissionBps: 1800,
        volumeTiers: [
          { tierId: "t1", name: "Bad Tier", discountBps: -50 },
        ],
      });
    }).toThrow(/Volume tier discount cannot be negative/);
  });
});

describe("Volume-Based Commission Tier Discounts & Floor Protection", () => {
  const standardContract = createMerchantContract({
    restaurantId: "rest_biryani_darbar",
    restaurantName: "Royal Biryani Darbar",
    baseCommissionBps: 2000, // 20.00% base
  });

  it("applies 0 discount when weekly volume is below first tier threshold", () => {
    const rate = evaluateEffectiveCommissionRate(standardContract, {
      weeklyOrdersCount: 50,
      weeklyGrossSalesPaise: 25_000_00, // ₹25,000 GMV
    });
    expect(rate.appliedDiscountBps).toBe(0);
    expect(rate.effectiveCommissionBps).toBe(2000);
    expect(rate.effectiveRatePercent).toBe(20.0);
    expect(rate.appliedTier?.tierId).toBe("starter");
  });

  it("applies Silver tier (100 bps discount) for >= 100 orders or >= ₹50,000 GMV", () => {
    const rate = evaluateEffectiveCommissionRate(standardContract, {
      weeklyOrdersCount: 150,
      weeklyGrossSalesPaise: 75_000_00, // ₹75,000 GMV
    });
    expect(rate.appliedDiscountBps).toBe(100);
    expect(rate.effectiveCommissionBps).toBe(1900); // 20% - 1% = 19%
    expect(rate.effectiveRatePercent).toBe(19.0);
    expect(rate.appliedTier?.tierId).toBe("silver");
  });

  it("applies Gold tier (200 bps discount) for >= 300 orders or >= ₹2,00,000 GMV", () => {
    const rate = evaluateEffectiveCommissionRate(standardContract, {
      weeklyOrdersCount: 350,
      weeklyGrossSalesPaise: 250_000_00, // ₹2,50,000 GMV
    });
    expect(rate.appliedDiscountBps).toBe(200);
    expect(rate.effectiveCommissionBps).toBe(1800); // 20% - 2% = 18%
    expect(rate.effectiveRatePercent).toBe(18.0);
    expect(rate.appliedTier?.tierId).toBe("gold");
  });

  it("applies Platinum tier (300 bps discount) for >= 500 orders or >= ₹5,00,000 GMV", () => {
    const rate = evaluateEffectiveCommissionRate(standardContract, {
      weeklyOrdersCount: 550,
      weeklyGrossSalesPaise: 600_000_00, // ₹6,00,000 GMV
    });
    expect(rate.appliedDiscountBps).toBe(300);
    expect(rate.effectiveCommissionBps).toBe(1700); // 20% - 3% = 17%
    expect(rate.effectiveRatePercent).toBe(17.0);
    expect(rate.appliedTier?.tierId).toBe("platinum");
  });

  it("strictly enforces 8% (800 bps) statutory floor even with high tier discounts", () => {
    // Low base rate anchor restaurant at 9.50% (950 bps)
    const lowRateContract = createMerchantContract({
      restaurantId: "rest_mcdonalds",
      restaurantName: "McDonald's Anchor Outlet",
      baseCommissionBps: 950, // 9.50% base
    });

    // 600 orders qualifies for Platinum (300 bps discount), which would make it 6.50%
    const rate = evaluateEffectiveCommissionRate(lowRateContract, {
      weeklyOrdersCount: 600,
      weeklyGrossSalesPaise: 800_000_00,
    });

    // Must be clamped to STATUTORY_RATES.MIN_COMMISSION_BPS = 800 (8.00%)
    expect(rate.effectiveCommissionBps).toBe(800);
    expect(rate.effectiveRatePercent).toBe(8.0);
    expect(rate.appliedDiscountBps).toBe(150); // Only 150 bps allowed before hitting floor
  });

  it("supports custom merchant-specific volume tiers", () => {
    const customTiers: VolumeCommissionTier[] = [
      {
        tierId: "custom_tier_1",
        name: "Custom Super Tier",
        minWeeklyOrders: 50,
        discountBps: 150, // 1.5% discount
      },
    ];

    const customContract = createMerchantContract({
      restaurantId: "rest_custom_tiers",
      restaurantName: "Bespoke Diner",
      baseCommissionBps: 1500, // 15%
      volumeTiers: customTiers,
    });

    const rate = evaluateEffectiveCommissionRate(customContract, {
      weeklyOrdersCount: 60,
      weeklyGrossSalesPaise: 30_000_00,
    });

    expect(rate.appliedDiscountBps).toBe(150);
    expect(rate.effectiveCommissionBps).toBe(1350); // 13.5%
    expect(rate.appliedTier?.tierId).toBe("custom_tier_1");
  });
});

describe("Zomato-Class Weekly Settlement Cycle", () => {
  it("generates Monday to Sunday cycle with Wednesday payout (3 days post-Sunday)", () => {
    // Reference date: Wednesday, 2026-10-07
    const cycle = getWeeklySettlementCycle("2026-10-07T12:00:00Z");

    expect(cycle.cycleId).toBe("cycle_2026-10-05_to_2026-10-11");
    expect(cycle.startDate).toBe("2026-10-05"); // Monday
    expect(cycle.endDate).toBe("2026-10-11");   // Sunday
    expect(cycle.payoutDate).toBe("2026-10-14"); // Following Wednesday

    // Verify exact day difference between Sunday close and Wednesday payout
    const sundayDate = new Date(cycle.endDate);
    const payoutWednesdayDate = new Date(cycle.payoutDate);
    const diffDays = Math.round(
      (payoutWednesdayDate.getTime() - sundayDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(3);
  });

  it("calculates cycle consistently for Sunday reference dates", () => {
    // Reference date: Sunday, 2026-10-11 (midday UTC is Sunday evening IST)
    const cycle = getWeeklySettlementCycle("2026-10-11T12:00:00Z");
    expect(cycle.startDate).toBe("2026-10-05"); // Same Monday
    expect(cycle.endDate).toBe("2026-10-11");   // Same Sunday
    expect(cycle.payoutDate).toBe("2026-10-14"); // Wednesday
  });

  it("calculates cycle consistently for Monday reference dates", () => {
    // Reference date: Monday, 2026-10-05
    const cycle = getWeeklySettlementCycle("2026-10-05T08:00:00Z");
    expect(cycle.startDate).toBe("2026-10-05"); // Monday
    expect(cycle.endDate).toBe("2026-10-11");   // Sunday
  });

  it("retrieves previous weekly settlement cycle correctly", () => {
    // If today is Wednesday, 2026-10-14
    const prevCycle = getPreviousWeeklySettlementCycle("2026-10-14T10:00:00Z");
    expect(prevCycle.startDate).toBe("2026-10-05");
    expect(prevCycle.endDate).toBe("2026-10-11");
    expect(prevCycle.payoutDate).toBe("2026-10-14");
  });
});

describe("Exact Statutory Indian Tax Deductions & Merchant Statements", () => {
  const contract = createMerchantContract({
    restaurantId: "rest_punjabi_tadka",
    restaurantName: "Punjabi Tadka Express",
    baseCommissionBps: 2000, // 20.00%
    paymentGatewayFeeBps: 180, // 1.80%
    isPgFeeDeducted: true,
  });

  it("verifies 5% Food GST under Section 9(5) CGST Act (Platform Remitted)", () => {
    // Gross sales: ₹1,00,000 (10,000,000 paise), Restaurant discount: ₹10,000 (1,000,000 paise)
    // Net food sales = ₹90,000 (9,000,000 paise)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 80, // Base tier applies (20% commission)
      grossSalesPaise: 10_000_000,
      restaurantDiscountsPaise: 1_000_000,
      packagingChargesPaise: 50_000,
      platformReimbursementsPaise: 20_000,
    });

    expect(statement.financials.netFoodSalesPaise).toBe(9_000_000); // ₹90,000

    // 5% GST under Section 9(5): 5% of 9,000,000 = 450,000 paise (₹4,500)
    const foodGst = statement.statutoryTaxes.foodGstSec9_5;
    expect(foodGst.rateBps).toBe(500); // 5%
    expect(foodGst.totalTaxPaise).toBe(450_000);
    expect(foodGst.cgstPaise).toBe(225_000); // 2.5%
    expect(foodGst.sgstPaise).toBe(225_000); // 2.5%
    expect(foodGst.remittedByPlatform).toBe(true);
    expect(foodGst.legalSection).toContain("Section 9(5)");
  });

  it("verifies 18% GST on Platform Commission fee (SAC 9985)", () => {
    // Net food sales: 9,000,000 paise
    // Commission: 20% of 9,000,000 = 1,800,000 paise (₹18,000)
    // 18% GST on Commission: 18% of 1,800,000 = 324,000 paise (₹3,240)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 80,
      grossSalesPaise: 10_000_000,
      restaurantDiscountsPaise: 1_000_000,
    });

    expect(statement.financials.platformCommissionPaise).toBe(1_800_000);

    const commGst = statement.statutoryTaxes.commissionGst18;
    expect(commGst.rateBps).toBe(1800); // 18%
    expect(commGst.totalTaxPaise).toBe(324_000);
    expect(commGst.cgstPaise).toBe(162_000); // 9%
    expect(commGst.sgstPaise).toBe(162_000); // 9%
    expect(commGst.sacCode).toBe("9985");
    expect(statement.financials.commissionGstPaise).toBe(324_000);
  });

  it("verifies 1% TCS deduction under Section 52 of CGST Act", () => {
    // Net food sales: 9,000,000 paise
    // 1% TCS: 1% of 9,000,000 = 90,000 paise (₹900)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 80,
      grossSalesPaise: 10_000_000,
      restaurantDiscountsPaise: 1_000_000,
    });

    const tcs = statement.statutoryTaxes.tcsSec52;
    expect(tcs.rateBps).toBe(100); // 1%
    expect(tcs.totalTaxPaise).toBe(90_000);
    expect(tcs.cgstPaise).toBe(45_000); // 0.5%
    expect(tcs.sgstPaise).toBe(45_000); // 0.5%
    expect(tcs.remittanceChannel).toBe("GSTR-8");
    expect(statement.financials.tcsDeductionPaise).toBe(90_000);
  });

  it("verifies 1% TDS deduction under Section 194-O of Income Tax Act", () => {
    // Net food sales: 9,000,000 paise
    // 1% TDS: 1% of 9,000,000 = 90,000 paise (₹900)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 80,
      grossSalesPaise: 10_000_000,
      restaurantDiscountsPaise: 1_000_000,
    });

    const tds = statement.statutoryTaxes.tdsSec194O;
    expect(tds.rateBps).toBe(100); // 1%
    expect(tds.totalTaxPaise).toBe(90_000);
    expect(tds.complianceCertificate).toBe("Form 16A");
    expect(statement.financials.tdsDeductionPaise).toBe(90_000);
  });

  it("verifies 1.8% PG fee & 18% GST on PG fee", () => {
    // Gross sales: 10,000,000 paise
    // PG Fee 1.8%: 1.8% of 10,000,000 = 180,000 paise (₹1,800)
    // 18% GST on PG Fee: 18% of 180,000 = 32,400 paise (₹324)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 80,
      grossSalesPaise: 10_000_000,
      restaurantDiscountsPaise: 1_000_000,
    });

    expect(statement.financials.pgFeePaise).toBe(180_000);
    expect(statement.financials.pgFeeGstPaise).toBe(32_400);
    expect(statement.statutoryTaxes.paymentGatewayTax?.feePaise).toBe(180_000);
    expect(statement.statutoryTaxes.paymentGatewayTax?.gstPaise).toBe(32_400);
  });
});

describe("Reconciled Net Merchant Payout & Weekly Statement Generation", () => {
  it("accurately computes reconciled net merchant payout with all deductions and additions", () => {
    // Contract: 22% base commission, standard tiers
    const contract = createMerchantContract({
      restaurantId: "rest_paradise_biryani",
      restaurantName: "Paradise Biryani Flagship",
      baseCommissionBps: 2200, // 22%
      paymentGatewayFeeBps: 180, // 1.8%
      isPgFeeDeducted: true,
    });

    // High volume week: 320 orders, Gross ₹4,00,000 (40,000,000 paise)
    // Restaurant discounts: ₹20,000 (2,000,000 paise)
    // Net food sales = ₹3,80,000 (38,000,000 paise)
    // Packaging: ₹10,000 (1,000,000 paise)
    // Platform reimbursements: ₹5,000 (500,000 paise)
    // Orders count: 320 -> Gold Tier applies (200 bps discount)
    // Effective commission = 2200 - 200 = 2000 bps (20.00%)
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 320,
      grossSalesPaise: 40_000_000,
      restaurantDiscountsPaise: 2_000_000,
      packagingChargesPaise: 1_000_000,
      platformReimbursementsPaise: 500_000,
    });

    // Verification of Tier & Effective Commission
    expect(statement.commissionDetails.baseCommissionBps).toBe(2200);
    expect(statement.commissionDetails.volumeDiscountBps).toBe(200);
    expect(statement.commissionDetails.effectiveCommissionBps).toBe(2000);
    expect(statement.commissionDetails.appliedTierName).toBe("Gold Volume Tier");

    // Earnings:
    // Net Food = 38,000,000
    // Packaging = 1,000,000
    // Reimbursements = 500,000
    // Total Credits = 39,500,000 paise
    expect(statement.financials.totalCreditsPaise).toBe(39_500_000);

    // Deductions:
    // Commission = 20% of 38,000,000 = 7,600,000 paise
    // GST on commission (18%) = 1,368,000 paise
    // PG fee (1.8% of gross 40,000,000) = 720,000 paise
    // GST on PG fee (18% of 720,000) = 129,600 paise
    // TCS (1% of net food 38,000,000) = 380,000 paise
    // TDS (1% of net food 38,000,000) = 380,000 paise
    // Total Deductions = 7,600,000 + 1,368,000 + 720,000 + 129,600 + 380,000 + 380,000 = 10,577,600 paise
    expect(statement.financials.platformCommissionPaise).toBe(7_600_000);
    expect(statement.financials.commissionGstPaise).toBe(1_368_000);
    expect(statement.financials.pgFeePaise).toBe(720_000);
    expect(statement.financials.pgFeeGstPaise).toBe(129_600);
    expect(statement.financials.tcsDeductionPaise).toBe(380_000);
    expect(statement.financials.tdsDeductionPaise).toBe(380_000);
    expect(statement.financials.totalDeductionsPaise).toBe(10_577_600);

    // Reconciled Net Payout = 39,500,000 - 10,577,600 = 28,922,400 paise (₹2,89,224.00)
    expect(statement.reconciledNetPayoutPaise).toBe(28_922_400);
    expect(statement.reconciledNetPayoutInr).toBe(289224.0);
    expect(statement.financials.netPayablePaise).toBe(28_922_400);
  });

  it("handles zero or negative payable scenario gracefully (bounded to 0)", () => {
    const contract = createMerchantContract({
      restaurantId: "rest_low_sales",
      restaurantName: "Low Sales Outlet",
      baseCommissionBps: 2500,
    });

    // Zero sales with high adjustments/penalties
    const statement = generateMerchantWeeklySettlementStatement({
      contract,
      deliveredOrdersCount: 0,
      grossSalesPaise: 0,
      restaurantDiscountsPaise: 0,
      otherDeductionsPaise: 50_000, // ₹500 penalty
    });

    expect(statement.reconciledNetPayoutPaise).toBe(0);
    expect(statement.financials.netPayablePaise).toBe(0);
  });
});

describe("Double-Entry Ledger Integration", () => {
  const contract = createMerchantContract({
    restaurantId: "rest_ledger_test",
    restaurantName: "Ledger Biryani Center",
    baseCommissionBps: 1800,
  });

  const statement = generateMerchantWeeklySettlementStatement({
    contract,
    deliveredOrdersCount: 150,
    grossSalesPaise: 20_000_000, // ₹2,00,000
    restaurantDiscountsPaise: 1_000_000, // ₹10,000
    packagingChargesPaise: 200_000, // ₹2,000
    platformReimbursementsPaise: 100_000, // ₹1,000
  });

  it("generates balanced payout disbursement entries", () => {
    const entries = generatePayoutLedgerEntries(statement);

    expect(entries.length).toBe(2);
    expect(entries[0].account).toBe("RESTAURANT_PAYABLE");
    expect(entries[0].direction).toBe("DEBIT");
    expect(entries[0].amountPaise).toBe(statement.reconciledNetPayoutPaise);

    expect(entries[1].account).toBe("BANK_CLEARING");
    expect(entries[1].direction).toBe("CREDIT");
    expect(entries[1].amountPaise).toBe(statement.reconciledNetPayoutPaise);

    // Sum of debits === sum of credits
    const debits = entries.filter((e) => e.direction === "DEBIT").reduce((s, e) => s + e.amountPaise, 0);
    const credits = entries.filter((e) => e.direction === "CREDIT").reduce((s, e) => s + e.amountPaise, 0);
    expect(debits).toBe(credits);
  });

  it("generates 100% mathematically balanced comprehensive statutory journal voucher", () => {
    const journalEntries = generateComprehensiveSettlementJournal(statement);

    // Must have debits for RESTAURANT_PAYABLE
    const debits = journalEntries.filter((e) => e.direction === "DEBIT");
    const credits = journalEntries.filter((e) => e.direction === "CREDIT");

    const totalDebit = debits.reduce((sum, e) => sum + e.amountPaise, 0);
    const totalCredit = credits.reduce((sum, e) => sum + e.amountPaise, 0);

    expect(totalDebit).toBe(statement.financials.totalCreditsPaise);
    expect(totalCredit).toBe(statement.financials.totalCreditsPaise);
    expect(totalDebit).toBe(totalCredit);

    // Verify statutory accounts exist in credits
    const accounts = credits.map((c) => c.account);
    expect(accounts).toContain("PLATFORM_FEE_REVENUE");
    expect(accounts).toContain("GST_OUTPUT_LIABILITY");
    expect(accounts).toContain("TCS_PAYABLE_LIABILITY");
    expect(accounts).toContain("TDS_PAYABLE_LIABILITY");
    expect(accounts).toContain("BANK_CLEARING");
  });

  it("posts settlement transaction to Canonical Ledger with idempotency key", async () => {
    // Mock CanonicalLedger instance for unit testing isolation
    const postedTransactions: any[] = [];
    const mockLedger = {
      postTransaction: async (params: any): Promise<LedgerTransaction> => {
        postedTransactions.push(params);
        return {
          transactionId: "tx_mock_123",
          idempotencyKey: params.idempotencyKey,
          eventType: params.eventType,
          entries: params.entries,
          totalAmountPaise: params.entries[0].amountPaise,
          timestamp: new Date().toISOString(),
          auditHash: "mock_hash_abc",
          previousHash: "mock_prev_hash",
        };
      },
    } as unknown as CanonicalLedger;

    const result = await postMerchantSettlementToLedger(statement, mockLedger);

    expect(postedTransactions.length).toBe(1);
    expect(postedTransactions[0].idempotencyKey).toBe(
      `payout_stl_${statement.restaurantId}_${statement.cycle.cycleId}`
    );
    expect(postedTransactions[0].eventType).toBe("MERCHANT_SETTLEMENT_DISBURSED");
    expect(postedTransactions[0].entries[0].account).toBe("RESTAURANT_PAYABLE");
    expect(postedTransactions[0].entries[1].account).toBe("BANK_CLEARING");
    expect(result.transactionId).toBe("tx_mock_123");
  });
});
