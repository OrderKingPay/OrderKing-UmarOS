import { describe, it, expect } from "vitest";
import {
  STATUTORY_TAX_CONSTANTS,
  PACKAGING_CAP_PAISE,
  SMALL_CART_THRESHOLD_PAISE,
  SMALL_CART_FEE_PAISE,
  DEFAULT_PLATFORM_FEE_PAISE,
  roundDivPaise,
  calculateCcpaPackagingFee,
  calculateSmallCartFeePaise,
  calculateSec95GstPaise,
  calculatePlatformGstPaise,
  calculateSec194OTdsPaise,
  calculateSec52TcsPaise,
  calculateOrderEconomicsPaise,
  verifyConservationOfPaise,
  type OrderTaxInputPaise,
} from "./ccpa-gst-engine.ts";

describe("👑 Supreme Indian Statutory Tax & CCPA Settlement Engine", () => {
  // ==========================================================================
  // 1. EXACT INTEGER-PAISE ARITHMETIC (roundDivPaise)
  // ==========================================================================
  describe("1. Exact Integer-Paise Arithmetic (roundDivPaise)", () => {
    it("strictly follows roundDivPaise(n, d) = Math.floor((n + Math.floor(d / 2)) / d)", () => {
      // Basic integer division
      expect(roundDivPaise(100, 10)).toBe(10);
      expect(roundDivPaise(0, 100)).toBe(0);
      expect(roundDivPaise(1000, 100)).toBe(10);

      // Half-up rounding ties
      expect(roundDivPaise(49, 100)).toBe(0); // 49 + 50 = 99 / 100 -> 0
      expect(roundDivPaise(50, 100)).toBe(1); // 50 + 50 = 100 / 100 -> 1 (half-up)
      expect(roundDivPaise(149, 100)).toBe(1); // 149 + 50 = 199 / 100 -> 1
      expect(roundDivPaise(150, 100)).toBe(2); // 150 + 50 = 200 / 100 -> 2

      // Odd denominator (e.g. 3, floor(3/2) = 1)
      expect(roundDivPaise(1, 3)).toBe(0); // 1 + 1 = 2 / 3 -> 0
      expect(roundDivPaise(2, 3)).toBe(1); // 2 + 1 = 3 / 3 -> 1

      // 2.5% calculations (25 / 1000)
      // ₹100.00 = 10000 paise -> 250 paise
      expect(roundDivPaise(10000 * 25, 1000)).toBe(250);
      // ₹137.43 = 13743 paise -> 13743 * 25 = 343575 -> (343575 + 500) / 1000 = 344 paise
      expect(roundDivPaise(13743 * 25, 1000)).toBe(344);
    });

    it("throws errors on non-safe integers or invalid denominators", () => {
      expect(() => roundDivPaise(10.5, 100)).toThrow("Invalid integer paise operands");
      expect(() => roundDivPaise(100, 0)).toThrow("Invalid integer paise operands");
      expect(() => roundDivPaise(100, -5)).toThrow("Invalid integer paise operands");
      expect(() => roundDivPaise(NaN, 100)).toThrow("Invalid integer paise operands");
    });
  });

  // ==========================================================================
  // 2. CCPA PACKAGING CAP ENFORCEMENT
  // ==========================================================================
  describe("2. CCPA Packaging Cap: min(3500, 10% of Net Food)", () => {
    it("enforces 10% cap when below ₹35 (3500 paise)", () => {
      // Small order: ₹100.00 net food (10,000 paise)
      // 10% = 1,000 paise (₹10.00) < ₹35.00
      expect(calculateCcpaPackagingFee(10_000)).toBe(1_000);

      // Order ₹200.00 net food (20,000 paise)
      // 10% = 2,000 paise (₹20.00) < ₹35.00
      expect(calculateCcpaPackagingFee(20_000)).toBe(2_000);

      // Order ₹300.00 net food (30,000 paise)
      // 10% = 3,000 paise (₹30.00) < ₹35.00
      expect(calculateCcpaPackagingFee(30_000)).toBe(3_000);
    });

    it("strictly caps at ₹35.00 (3500 paise) for large food orders", () => {
      // Exactly ₹350.00 (35,000 paise) -> 10% = 3,500 paise
      expect(calculateCcpaPackagingFee(35_000)).toBe(3_500);

      // Large order: ₹500.00 (50,000 paise) -> 10% is ₹50 (5000 paise), capped at ₹35 (3500 paise)
      expect(calculateCcpaPackagingFee(50_000)).toBe(PACKAGING_CAP_PAISE);
      expect(calculateCcpaPackagingFee(50_000)).toBe(3_500);

      // Premium order: ₹1,500.00 (150,000 paise) -> capped at ₹35
      expect(calculateCcpaPackagingFee(150_000)).toBe(3_500);

      // Mega banquet order: ₹10,000.00 (1,000,000 paise) -> capped at ₹35
      expect(calculateCcpaPackagingFee(1_000_000)).toBe(3_500);
    });

    it("respects requested packaging fee if lower than CCPA statutory ceiling", () => {
      // Food net = ₹500.00 (50,000 paise), statutory cap is ₹35.00 (3,500 paise)
      // Restaurant only requests ₹15.00 (1,500 paise) packaging fee
      expect(calculateCcpaPackagingFee(50_000, 1_500)).toBe(1_500);

      // Restaurant requests ₹0.00 packaging fee
      expect(calculateCcpaPackagingFee(50_000, 0)).toBe(0);

      // Restaurant requests ₹50.00 (5,000 paise) on ₹500 order -> capped to ₹35.00 (3,500 paise)
      expect(calculateCcpaPackagingFee(50_000, 5_000)).toBe(3_500);

      // Restaurant requests ₹50.00 on ₹200 order -> 10% limit is ₹20.00 (2,000 paise)
      expect(calculateCcpaPackagingFee(20_000, 5_000)).toBe(2_000);
    });

    it("enforces packaging cap in complete calculateOrderEconomicsPaise", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 80_000, // ₹800.00
        deliveryFeePaise: 4_000,
        commissionBps: 2000,
        merchantHasGstin: true,
        riderPayoutPaise: 5_000,
      };

      const result = calculateOrderEconomicsPaise(input);
      // ₹800 food -> 10% is ₹80 (8000 paise), but must be capped at ₹35 (3500 paise)
      expect(result.customerBill.packagingFeePaise).toBe(3_500);
      expect(result.merchantSettlement.merchantBaseRevenuePaise).toBe(80_000 + 3_500);
    });
  });

  // ==========================================================================
  // 3. SMALL CART FEE (< ₹149) & PLATFORM SERVICES GST (18%)
  // ==========================================================================
  describe("3. Small Cart Fee (< ₹149) & Platform Services GST (18%)", () => {
    it("applies 2500 paise (₹25) small cart fee if foodNetPaise < 14900 (₹149)", () => {
      // ₹100 order (< ₹149)
      expect(calculateSmallCartFeePaise(10_000)).toBe(SMALL_CART_FEE_PAISE);
      expect(calculateSmallCartFeePaise(10_000)).toBe(2_500);

      // Boundary: ₹148.99 (14,899 paise) (< ₹149)
      expect(calculateSmallCartFeePaise(14_899)).toBe(2_500);

      // Boundary: ₹149.00 (14,900 paise) (NOT < ₹149) -> 0 fee
      expect(calculateSmallCartFeePaise(14_900)).toBe(0);

      // Large order: ₹250.00 (25,000 paise) -> 0 fee
      expect(calculateSmallCartFeePaise(25_000)).toBe(0);

      // Empty food cart -> 0 fee
      expect(calculateSmallCartFeePaise(0)).toBe(0);
    });

    it("levies strictly 18% GST (9% CGST + 9% SGST) on (platformFee + smallCartFee + deliveryFee)", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 10_000, // ₹100.00 (< ₹149 -> ₹25 small cart fee)
        platformFeePaise: 600,  // ₹6.00
        deliveryFeePaise: 4_000, // ₹40.00
        commissionBps: 1800,
        merchantHasGstin: true,
        riderPayoutPaise: 4_000,
      };

      const result = calculateOrderEconomicsPaise(input);

      // Small cart fee applied
      expect(result.customerBill.smallCartFeePaise).toBe(2_500);

      // Platform taxable base = 600 + 2500 + 4000 = 7,100 paise (₹71.00)
      const expectedPlatformBase = 600 + 2_500 + 4_000;
      expect(expectedPlatformBase).toBe(7_100);

      // 9% CGST = 7100 * 9 / 100 = 639 paise (₹6.39)
      // 9% SGST = 639 paise (₹6.39)
      // Total 18% GST = 1,278 paise (₹12.78)
      expect(result.customerBill.platformCgstPaise).toBe(639);
      expect(result.customerBill.platformSgstPaise).toBe(639);
      expect(result.customerBill.platformTotalGstPaise).toBe(1_278);
    });
  });

  // ==========================================================================
  // 4. CGST SECTION 9(5) 5% ON (FOOD NET + PACKAGING)
  // ==========================================================================
  describe("4. CGST Section 9(5) 5% (2.5% CGST + 2.5% SGST)", () => {
    it("levies 2.5% CGST + 2.5% SGST on (foodNet + packaging)", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 50_000, // ₹500.00
        packagingFeePaise: 3_500, // ₹35.00 CCPA capped
        deliveryFeePaise: 3_000,
        commissionBps: 2000,
        merchantHasGstin: true,
        riderPayoutPaise: 3_000,
      };

      const result = calculateOrderEconomicsPaise(input);

      // Sec 9(5) Taxable Base = 50,000 + 3,500 = 53,500 paise (₹535.00)
      // 2.5% CGST = 53,500 * 25 / 1000 = 1,337.5 -> 1,338 paise (half-up)
      // 2.5% SGST = 1,338 paise
      // Total 5% GST = 2,676 paise
      expect(result.customerBill.sec95CgstPaise).toBe(1_338);
      expect(result.customerBill.sec95SgstPaise).toBe(1_338);
      expect(result.customerBill.sec95TotalGstPaise).toBe(2_676);

      // Escrow holds this Sec 9(5) GST
      expect(result.founderTreasury.escrowBreakdown.sec95GstPaise).toBe(2_676);
    });
  });

  // ==========================================================================
  // 5. STATUTORY TDS 0.1% vs TCS 0.5% DISTINCTION (CBIC CIRCULAR 167/23/2021)
  // ==========================================================================
  describe("5. Statutory TDS 0.1% vs TCS 0.5% (Zero TCS on Sec 9(5) Restaurant Food)", () => {
    it("strictly charges 0% TCS on Sec 9(5) restaurant food even for GST-registered merchant", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 100_000, // ₹1,000.00 restaurant food (Section 9(5))
        non95GoodsPaise: 0,      // No pre-packed items
        deliveryFeePaise: 4_000,
        commissionBps: 2000,     // 20%
        merchantHasGstin: true,  // GST registered!
        riderPayoutPaise: 4_000,
      };

      const result = calculateOrderEconomicsPaise(input);

      // Packaging = min(3500, 10000) = 3500
      // Merchant Base = 100,000 + 3,500 = 103,500 paise
      expect(result.merchantSettlement.merchantBaseRevenuePaise).toBe(103_500);

      // Section 194-O Income Tax TDS: strictly 0.1% (10 bps) = 103500 * 10 / 10000 = 104 paise (₹1.04)
      expect(result.merchantSettlement.tdsSec194OPaise).toBe(104);

      // Section 52 TCS: strictly 0 paise per CBIC Circular 167/23/2021-GST!
      expect(result.merchantSettlement.tcsSec52Paise).toBe(0);
      expect(result.founderTreasury.escrowBreakdown.tcsSec52Paise).toBe(0);
    });

    it("applies 0.5% (50 bps) TCS ONLY on non-9(5) goods when merchant has GSTIN", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 50_000,    // ₹500.00 restaurant food (Section 9(5))
        non95GoodsPaise: 20_000,   // ₹200.00 pre-packed MRP non-9(5) goods
        deliveryFeePaise: 4_000,
        commissionBps: 2000,
        merchantHasGstin: true,    // GST registered merchant
        riderPayoutPaise: 4_000,
      };

      const result = calculateOrderEconomicsPaise(input);

      // Packaging = 3,500 paise
      // Merchant Base = 50,000 + 3,500 + 20,000 = 73,500 paise
      expect(result.merchantSettlement.merchantBaseRevenuePaise).toBe(73_500);

      // TDS Sec 194-O: 0.1% on entire merchant base (73,500 * 10 / 10,000 = 73.5 -> 74 paise)
      expect(result.merchantSettlement.tdsSec194OPaise).toBe(74);

      // TCS Sec 52: strictly 0.5% ONLY on non95GoodsPaise (20,000 * 50 / 10,000 = 100 paise = ₹1.00)
      expect(result.merchantSettlement.tcsSec52Paise).toBe(100);
      expect(result.founderTreasury.escrowBreakdown.tcsSec52Paise).toBe(100);
    });

    it("charges 0 paise TCS on non-9(5) goods if merchant does NOT have GSTIN", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 50_000,
        non95GoodsPaise: 20_000,
        deliveryFeePaise: 4_000,
        commissionBps: 2000,
        merchantHasGstin: false,   // Unregistered merchant
        riderPayoutPaise: 4_000,
      };

      const result = calculateOrderEconomicsPaise(input);

      // TDS still applies under 194-O
      expect(result.merchantSettlement.tdsSec194OPaise).toBe(74);
      // TCS is strictly 0 for non-GSTIN merchant
      expect(result.merchantSettlement.tcsSec52Paise).toBe(0);
    });
  });

  // ==========================================================================
  // 6. CCPA ANTI-BASKET-SNEAKING (RIDER TIP DEFAULT & PASS-THROUGH)
  // ==========================================================================
  describe("6. CCPA Anti-Basket-Sneaking (Rider Tip)", () => {
    it("strictly defaults rider tip to 0 paise when omitted (no dark pattern pre-selection)", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 30_000,
        deliveryFeePaise: 3_000,
        commissionBps: 1800,
        merchantHasGstin: true,
        riderPayoutPaise: 3_000,
        // riderTipPaise omitted!
      };

      const result = calculateOrderEconomicsPaise(input);

      expect(result.customerBill.riderTipPaise).toBe(0);
      expect(result.founderTreasury.riderTotalPayoutPaise).toBe(3_000); // 100% base pay only
    });

    it("passes through 100% of voluntary tip to rider with 0% GST and 0 platform deductions", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 30_000,
        deliveryFeePaise: 3_000,
        riderTipPaise: 5_000, // ₹50.00 customer tip
        commissionBps: 1800,
        merchantHasGstin: true,
        riderPayoutPaise: 3_500,
      };

      const result = calculateOrderEconomicsPaise(input);

      // Customer bill has tip
      expect(result.customerBill.riderTipPaise).toBe(5_000);

      // Tip has 0% GST: Platform GST base is platformFee + deliveryFee only
      const platformBase = 600 + 3_000;
      expect(result.customerBill.platformTotalGstPaise).toBe(roundDivPaise(platformBase * 18, 100));

      // 100% of tip goes to rider: 3,500 base + 5,000 tip = 8,500 paise
      expect(result.founderTreasury.riderTotalPayoutPaise).toBe(8_500);

      // Platform commission does not touch rider tip
      expect(result.merchantSettlement.commissionPaise).toBe(
        roundDivPaise((30_000 + 3_000) * 1800, 10000)
      );
    });
  });

  // ==========================================================================
  // 7. COMPREHENSIVE SETTLEMENT BREAKDOWN & MONEY CONSERVATION
  // ==========================================================================
  describe("7. Full Order Settlement & Treasury Escrow Integrity", () => {
    it("computes complete financial breakdown and verifies 100% mathematical conservation", () => {
      const input: OrderTaxInputPaise = {
        foodGrossPaise: 45_000,         // ₹450.00
        non95GoodsPaise: 5_000,         // ₹50.00
        merchantDiscountPaise: 5_000,   // ₹50.00 merchant promo
        platformDiscountPaise: 2_000,   // ₹20.00 OrderKing promo
        platformFeePaise: 600,          // ₹6.00
        deliveryFeePaise: 3_500,        // ₹35.00
        riderTipPaise: 2_000,           // ₹20.00
        commissionBps: 2000,            // 20%
        merchantHasGstin: true,
        slaPenaltyPaise: 1_000,         // ₹10.00 delay penalty
        riderPayoutPaise: 4_500,        // ₹45.00 base pay
        gatewayFeePaise: 500,           // ₹5.00 PG charge
      };

      const result = calculateOrderEconomicsPaise(input);

      // 1. Food Net: 45000 - 5000 - 2000 = 38000 paise (₹380.00)
      expect(result.customerBill.foodNetPaise).toBe(38_000);

      // 2. Packaging: min(3500, 3800) = 3500 paise (₹35.00)
      expect(result.customerBill.packagingFeePaise).toBe(3_500);

      // 3. Small Cart: 38000 >= 14900 -> 0 paise
      expect(result.customerBill.smallCartFeePaise).toBe(0);

      // 4. Sec 9(5) GST: (38000 + 3500) = 41500 paise base
      // CGST 2.5% = 41500 * 25 / 1000 = 1037.5 -> 1038 paise
      // SGST 2.5% = 1038 paise
      // Total = 2076 paise
      expect(result.customerBill.sec95CgstPaise).toBe(1_038);
      expect(result.customerBill.sec95SgstPaise).toBe(1_038);
      expect(result.customerBill.sec95TotalGstPaise).toBe(2_076);

      // 5. Platform GST: (600 + 0 + 3500) = 4100 paise base
      // CGST 9% = 4100 * 9 / 100 = 369 paise
      // SGST 9% = 369 paise
      // Total = 738 paise
      expect(result.customerBill.platformCgstPaise).toBe(369);
      expect(result.customerBill.platformSgstPaise).toBe(369);
      expect(result.customerBill.platformTotalGstPaise).toBe(738);

      // 6. Total Customer Payable:
      // (38000 + 3500) + 5000 + 2076 + (600 + 0 + 3500) + 738 + 2000 = 55,414 paise
      expect(result.customerBill.totalCustomerPayablePaise).toBe(55_414);

      // 7. Merchant Base: (45000 - 5000) + 3500 + 5000 = 48,500 paise
      expect(result.merchantSettlement.merchantBaseRevenuePaise).toBe(48_500);

      // 8. Commission: 48,500 * 2000 / 10000 = 9,700 paise (20%)
      expect(result.merchantSettlement.commissionPaise).toBe(9_700);

      // 9. Commission GST: 9% CGST (873) + 9% SGST (873) = 1,746 paise
      expect(result.merchantSettlement.commissionGstPaise).toBe(1_746);

      // 10. TDS 194-O: 48,500 * 10 / 10000 = 49 paise (0.1%)
      expect(result.merchantSettlement.tdsSec194OPaise).toBe(49);

      // 11. TCS Sec 52: 5000 * 50 / 10000 = 25 paise (0.5% on non-9(5) goods)
      expect(result.merchantSettlement.tcsSec52Paise).toBe(25);

      // 12. Net Merchant Payout:
      // 48500 - 9700 - 1746 - 49 - 25 - 1000 = 35,980 paise
      expect(result.merchantSettlement.netMerchantPayoutPaise).toBe(35_980);

      // 13. Tax Escrow:
      // 2076 (sec 95) + 738 (plat) + 1746 (comm gst) + 49 (tds) + 25 (tcs) = 4,634 paise
      expect(result.founderTreasury.govtTaxEscrowPaise).toBe(4_634);

      // 14. Rider Total Payout: 4500 base + 2000 tip = 6,500 paise
      expect(result.founderTreasury.riderTotalPayoutPaise).toBe(6_500);

      // 15. Net Founder Profit:
      // Gross Founder Revenue: comm (9700) + plat (600) + delivery (3500) + sla (1000) = 14,800 paise
      // Deductions: rider base (4500) + plat disc (2000) + gateway (500) = 7,000 paise
      // Net Profit: 14800 - 7000 = 7,800 paise
      expect(result.founderTreasury.netFounderProfitPaise).toBe(7_800);

      // Conservation check: Total Customer Inflow == Total Outflows + Retained Profit
      const audit = verifyConservationOfPaise(result, 500);
      expect(audit.isBalanced).toBe(true);
      expect(audit.discrepancyPaise).toBe(0);
      expect(audit.totalInflowPaise).toBe(55_414);
    });
  });

  // ==========================================================================
  // 8. ZERO FLOATING-POINT DRIFT (DETERMINISTIC & STRESS INVARIANCE)
  // ==========================================================================
  describe("8. Zero Floating-Point Drift Across Deterministic Grid", () => {
    it("guarantees 100% integer safety across 200 randomized & prime-valued order variations", () => {
      // Deterministic pseudo-random seed generator
      let seed = 123456789;
      const nextRand = (min: number, max: number) => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return Math.floor(min + (seed / 4294967296) * (max - min));
      };

      for (let i = 0; i < 200; i++) {
        const foodGrossPaise = nextRand(5_000, 200_000);
        const non95GoodsPaise = nextRand(0, 50_000);
        const merchantDiscountPaise = nextRand(0, Math.floor(foodGrossPaise * 0.3));
        const platformDiscountPaise = nextRand(0, 3_000);
        const deliveryFeePaise = nextRand(2_000, 8_000);
        const riderTipPaise = nextRand(0, 5_000);
        const commissionBps = nextRand(1200, 2500);
        const merchantHasGstin = i % 2 === 0;
        const slaPenaltyPaise = nextRand(0, 2_000);
        const riderPayoutPaise = nextRand(2_500, 9_000);
        const gatewayFeePaise = nextRand(0, 1_000);

        const input: OrderTaxInputPaise = {
          foodGrossPaise,
          non95GoodsPaise,
          merchantDiscountPaise,
          platformDiscountPaise,
          deliveryFeePaise,
          riderTipPaise,
          commissionBps,
          merchantHasGstin,
          slaPenaltyPaise,
          riderPayoutPaise,
          gatewayFeePaise,
        };

        const result = calculateOrderEconomicsPaise(input);

        // Verify every customer bill property is a safe integer
        expect(Number.isSafeInteger(result.customerBill.foodNetPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.packagingFeePaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.non95GoodsPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.smallCartFeePaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.platformFeePaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.deliveryFeePaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.sec95CgstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.sec95SgstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.sec95TotalGstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.platformCgstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.platformSgstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.platformTotalGstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.riderTipPaise)).toBe(true);
        expect(Number.isSafeInteger(result.customerBill.totalCustomerPayablePaise)).toBe(true);

        // Verify every merchant settlement property is a safe integer
        expect(Number.isSafeInteger(result.merchantSettlement.merchantBaseRevenuePaise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.commissionPaise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.commissionGstPaise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.tdsSec194OPaise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.tcsSec52Paise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.slaPenaltyPaise)).toBe(true);
        expect(Number.isSafeInteger(result.merchantSettlement.netMerchantPayoutPaise)).toBe(true);

        // Verify every treasury property is a safe integer
        expect(Number.isSafeInteger(result.founderTreasury.govtTaxEscrowPaise)).toBe(true);
        expect(Number.isSafeInteger(result.founderTreasury.riderTotalPayoutPaise)).toBe(true);
        expect(Number.isSafeInteger(result.founderTreasury.netFounderProfitPaise)).toBe(true);

        // Conservation of Paise Invariance Test: Discrepancy must be exactly ZERO!
        const audit = verifyConservationOfPaise(result, gatewayFeePaise);
        expect(audit.isBalanced).toBe(true);
        expect(audit.discrepancyPaise).toBe(0);
      }
    });
  });
});
