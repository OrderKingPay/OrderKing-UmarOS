/**
 * 👑 UMAR OS / ORDERKING - AUTHENTIC INDIAN RESTAURANT OPERATIONS & GROWTH ENGINE TEST SUITE
 * 
 * Location: src/lib/orderking/merchants/tier1-merchant-engine.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Tier1MerchantEngine,
  tier1MerchantEngine,
  evaluatePackagingFeePolicy,
  calculateCoFundedPromotion,
  calculateRestaurantHealthScore,
  calculateTier1OrderSettlement,
  analyzeMenuItemEconomics,
  INDIAN_RESTAURANT_COMMISSION_TIERS,
  DEFAULT_TIER1_MERCHANT_CONFIG,
  type RestaurantCategoryTier,
} from "./tier1-merchant-engine.ts";
import { toPaise, fromPaise } from "../money.ts";

describe("Tier1MerchantEngine - Indian Restaurant Operations & Growth Suite", () => {
  beforeEach(() => {
    tier1MerchantEngine.resetConfig();
  });

  // ==========================================================================
  // 1. 3-TIER COMMISSION MATRIX TESTS
  // ==========================================================================
  describe("3-Tier Commission Structure", () => {
    it("should define authentic 3-tier commission ranges matching Tier-1 industry standards", () => {
      // 1. High Volume / Anchor Brands: 16-18% (1600-1800 bps)
      const anchor = INDIAN_RESTAURANT_COMMISSION_TIERS.HIGH_VOLUME_ANCHOR;
      expect(anchor.minCommissionBps).toBe(1600);
      expect(anchor.maxCommissionBps).toBe(1800);
      expect(anchor.defaultCommissionBps).toBe(1700);
      expect(anchor.exampleBrands).toContain("McDonald's");
      expect(anchor.exampleBrands).toContain("Domino's Pizza");
      expect(anchor.exampleBrands).toContain("Haldiram's");

      // 2. Standard Standalone Restaurants: 22-25% (2200-2500 bps)
      const standalone = INDIAN_RESTAURANT_COMMISSION_TIERS.STANDARD_STANDALONE;
      expect(standalone.minCommissionBps).toBe(2200);
      expect(standalone.maxCommissionBps).toBe(2500);
      expect(standalone.defaultCommissionBps).toBe(2400);

      // 3. Cloud Kitchens / Delivery-Only: 20-22% (2000-2200 bps)
      const cloud = INDIAN_RESTAURANT_COMMISSION_TIERS.CLOUD_KITCHEN;
      expect(cloud.minCommissionBps).toBe(2000);
      expect(cloud.maxCommissionBps).toBe(2200);
      expect(cloud.defaultCommissionBps).toBe(2100);
      expect(cloud.exampleBrands).toContain("Rebel Foods (Faasos/Behrouz)");
    });

    it("should apply volume rebates for high-volume merchants while respecting statutory floor", () => {
      // Standalone baseline = 2400 bps (24%)
      // 100+ orders -> -100 bps (23%)
      // 300+ orders -> -200 bps (22%)
      // 500+ orders -> -300 bps (21%)

      const res0 = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-VOL-0",
        restaurantId: "REST-STANDALONE-1",
        restaurantName: "Pind Balluchi",
        categoryTier: "STANDARD_STANDALONE",
        itemSubtotalPaise: toPaise(500),
        requestedPackagingFeePaise: toPaise(25),
        weeklyOrdersCount: 50,
      });
      expect(res0.merchantSettlement.effectiveCommissionBps).toBe(2400); // 24%

      const res100 = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-VOL-100",
        restaurantId: "REST-STANDALONE-1",
        restaurantName: "Pind Balluchi",
        categoryTier: "STANDARD_STANDALONE",
        itemSubtotalPaise: toPaise(500),
        requestedPackagingFeePaise: toPaise(25),
        weeklyOrdersCount: 150,
      });
      expect(res100.merchantSettlement.effectiveCommissionBps).toBe(2300); // 23%
      expect(res100.merchantSettlement.volumeRebateBps).toBe(100);

      const res500 = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-VOL-500",
        restaurantId: "REST-STANDALONE-1",
        restaurantName: "Pind Balluchi",
        categoryTier: "STANDARD_STANDALONE",
        itemSubtotalPaise: toPaise(500),
        requestedPackagingFeePaise: toPaise(25),
        weeklyOrdersCount: 600,
      });
      expect(res500.merchantSettlement.effectiveCommissionBps).toBe(2100); // 21%
      expect(res500.merchantSettlement.volumeRebateBps).toBe(300);
    });

    it("should enforce statutory floor (8%) and ceiling (35%) on custom commission overrides", () => {
      // Extremely low custom commission should be clamped to floor (800 bps)
      const resLow = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-FLOOR",
        restaurantId: "REST-LOW",
        restaurantName: "Sweet Shop",
        categoryTier: "HIGH_VOLUME_ANCHOR",
        itemSubtotalPaise: toPaise(1000),
        requestedPackagingFeePaise: 0,
        customCommissionBps: 400, // 4% attempt
      });
      expect(resLow.merchantSettlement.effectiveCommissionBps).toBe(800); // clamped to 8%

      // Predatory high custom commission should be clamped to ceiling (3500 bps)
      const resHigh = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-CEILING",
        restaurantId: "REST-HIGH",
        restaurantName: "Luxury Dining",
        categoryTier: "STANDARD_STANDALONE",
        itemSubtotalPaise: toPaise(1000),
        requestedPackagingFeePaise: 0,
        customCommissionBps: 4500, // 45% attempt
      });
      expect(resHigh.merchantSettlement.effectiveCommissionBps).toBe(3500); // clamped to 35%
    });
  });

  // ==========================================================================
  // 2. CCPA PACKAGING FEE POLICY TESTS
  // ==========================================================================
  describe("CCPA Packaging Fee Policy Enforcement", () => {
    it("should enforce CCPA 10% item price cap when food value is low", () => {
      // Food price = ₹200. 10% = ₹20.
      // Restaurant requests ₹50 packaging fee -> MUST BE CAPPED AT ₹20!
      const result = evaluatePackagingFeePolicy({
        foodItemPricePaise: toPaise(200),
        requestedPackagingFeePaise: toPaise(50),
      });

      expect(result.isCompliant).toBe(false);
      expect(result.requestedPackagingFeePaise).toBe(toPaise(50));
      expect(result.approvedPackagingFeePaise).toBe(toPaise(20)); // ₹20
      expect(result.excessPackagingFeePaise).toBe(toPaise(30)); // ₹30 shaved off
      expect(result.appliedRule).toBe("ITEM_PERCENTAGE_CAP");
      expect(result.percentageCapPaise).toBe(toPaise(20));
      expect(result.absoluteCapPaise).toBe(toPaise(35));
    });

    it("should enforce CCPA ₹35.00 absolute ceiling when 10% exceeds ₹35", () => {
      // Food price = ₹600. 10% = ₹60.
      // Absolute cap = ₹35.
      // Restaurant requests ₹50 packaging fee -> MUST BE CAPPED AT ₹35!
      const result = evaluatePackagingFeePolicy({
        foodItemPricePaise: toPaise(600),
        requestedPackagingFeePaise: toPaise(50),
      });

      expect(result.isCompliant).toBe(false);
      expect(result.requestedPackagingFeePaise).toBe(toPaise(50));
      expect(result.approvedPackagingFeePaise).toBe(toPaise(35)); // ₹35
      expect(result.excessPackagingFeePaise).toBe(toPaise(15)); // ₹15 shaved off
      expect(result.appliedRule).toBe("ABSOLUTE_CEILING_CAP");
    });

    it("should approve packaging fee when it complies with both caps", () => {
      // Food price = ₹400. 10% = ₹40. Absolute cap = ₹35.
      // Restaurant requests ₹25 packaging fee -> Fully compliant!
      const result = evaluatePackagingFeePolicy({
        foodItemPricePaise: toPaise(400),
        requestedPackagingFeePaise: toPaise(25),
      });

      expect(result.isCompliant).toBe(true);
      expect(result.requestedPackagingFeePaise).toBe(toPaise(25));
      expect(result.approvedPackagingFeePaise).toBe(toPaise(25));
      expect(result.excessPackagingFeePaise).toBe(0);
      expect(result.appliedRule).toBe("COMPLIANT_NO_CAP");
    });

    it("should handle ₹0 packaging fee gracefully", () => {
      const result = evaluatePackagingFeePolicy({
        foodItemPricePaise: toPaise(300),
        requestedPackagingFeePaise: 0,
      });

      expect(result.isCompliant).toBe(true);
      expect(result.approvedPackagingFeePaise).toBe(0);
      expect(result.excessPackagingFeePaise).toBe(0);
    });
  });

  // ==========================================================================
  // 3. CO-FUNDED DISCOUNT PROMOTION (60/40) TESTS
  // ==========================================================================
  describe("Co-Funded Discount Sharing Mechanics (60/40)", () => {
    it("should accurately compute 60% off up to ₹120 promotion with 60/40 merchant/platform co-funding", () => {
      // Customer orders ₹300 of food.
      // Voucher: "60% off up to ₹120"
      // Nominal 60% of ₹300 = ₹180.
      // Capped discount = ₹120 (12,000 paise).
      // Merchant share (60%): 60% of ₹120 = ₹72.00 (7,200 paise).
      // OrderKing platform share (40%): 40% of ₹120 = ₹48.00 (4,800 paise).

      const result = calculateCoFundedPromotion({
        orderSubtotalPaise: toPaise(300),
        campaignCode: "WELCOME60",
        discountPercentage: 60,
        maxDiscountCapPaise: toPaise(120),
        minOrderValuePaise: toPaise(199),
        merchantSharePercent: 60,
        platformSharePercent: 40,
      });

      expect(result.qualifiesForPromotion).toBe(true);
      expect(result.nominalDiscountPaise).toBe(toPaise(180));
      expect(result.appliedDiscountPaise).toBe(toPaise(120));
      expect(result.isDiscountCapped).toBe(true);

      expect(result.merchantDiscountPaise).toBe(toPaise(72)); // ₹72.00
      expect(result.platformDiscountPaise).toBe(toPaise(48)); // ₹48.00
      expect(result.effectiveMerchantSharePercent).toBe(60.0);
      expect(result.effectivePlatformSharePercent).toBe(40.0);

      // Mathematical zero-paise leakage guarantee
      expect(result.merchantDiscountPaise + result.platformDiscountPaise).toBe(result.appliedDiscountPaise);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("should compute uncapped discount when order discount is below ceiling", () => {
      // Order: ₹150.
      // Voucher: 50% off up to ₹100.
      // 50% of ₹150 = ₹75.00 (7,500 paise).
      // Merchant 60% = ₹45.00 (4,500 paise).
      // Platform 40% = ₹30.00 (3,000 paise).

      const result = calculateCoFundedPromotion({
        orderSubtotalPaise: toPaise(150),
        campaignCode: "SAVE50",
        discountPercentage: 50,
        maxDiscountCapPaise: toPaise(100),
        merchantSharePercent: 60,
        platformSharePercent: 40,
      });

      expect(result.appliedDiscountPaise).toBe(toPaise(75));
      expect(result.isDiscountCapped).toBe(false);
      expect(result.merchantDiscountPaise).toBe(toPaise(45));
      expect(result.platformDiscountPaise).toBe(toPaise(30));
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("should disqualify order when subtotal is below minimum order value (MOV)", () => {
      const result = calculateCoFundedPromotion({
        orderSubtotalPaise: toPaise(149),
        campaignCode: "BIGFEAST",
        discountPercentage: 60,
        maxDiscountCapPaise: toPaise(120),
        minOrderValuePaise: toPaise(199),
      });

      expect(result.qualifiesForPromotion).toBe(false);
      expect(result.appliedDiscountPaise).toBe(0);
      expect(result.merchantDiscountPaise).toBe(0);
      expect(result.platformDiscountPaise).toBe(0);
      expect(result.disqualificationReason).toContain("below minimum order value");
    });

    it("should handle odd paise divisions without losing a single integer paise", () => {
      // Odd subtotal: ₹137.33 (13,733 paise) with 60% merchant / 40% platform
      const result = calculateCoFundedPromotion({
        orderSubtotalPaise: 13733,
        campaignCode: "ODDPAISE",
        discountPercentage: 33,
        maxDiscountCapPaise: 10000,
        merchantSharePercent: 60,
        platformSharePercent: 40,
      });

      expect(result.merchantDiscountPaise + result.platformDiscountPaise).toBe(result.appliedDiscountPaise);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });
  });

  // ==========================================================================
  // 4. RESTAURANT HEALTH & HYGIENE SCORE (RATING DECAY + KPT DELAY)
  // ==========================================================================
  describe("Restaurant Health & Hygiene Score", () => {
    it("should weight recent ratings significantly more than old ratings via exponential decay", () => {
      // Restaurant had poor ratings (2.0 stars) 90 days ago, but excellent ratings (5.0 stars) recently (today)
      const ratings = [
        { rating: 2.0, ageInDays: 90 },
        { rating: 2.0, ageInDays: 80 },
        { rating: 2.0, ageInDays: 70 },
        { rating: 5.0, ageInDays: 2 },
        { rating: 5.0, ageInDays: 1 },
        { rating: 5.0, ageInDays: 0 },
      ];

      const scoreResult = calculateRestaurantHealthScore({
        restaurantId: "REST-RECOVERY",
        ratings,
        kitchenOps: {
          actualAvgKptMinutes: 14.0, // under 15 min SLA
          promisedKptMinutes: 15.0,
          delayedOrdersCount: 2,
          totalOrdersCount: 100,
        },
        hygiene: {
          isFssaiValid: true,
          fssaiDaysToExpiry: 180,
          foodQualityIncidentsCount: 0,
          hygieneAuditScoreOutOf100: 98,
        },
      });

      // Decayed average rating should be much higher than raw arithmetic average
      expect(scoreResult.decayedAverageRating).toBeGreaterThan(scoreResult.rawArithmeticAverageRating);
      expect(scoreResult.decayedAverageRating).toBeGreaterThan(4.0);
      expect(scoreResult.kptPenaltyPoints).toBeLessThan(5);
      expect(scoreResult.compositeScore).toBeGreaterThan(85.0);
      expect(scoreResult.badge).toBe("COMMENDED");
    });

    it("should award PLATINUM_HYGIENE badge when score exceeds 90 points", () => {
      const ratings = Array.from({ length: 20 }, (_, i) => ({ rating: 5.0, ageInDays: i }));
      const scoreResult = calculateRestaurantHealthScore({
        restaurantId: "REST-ELITE",
        ratings,
        kitchenOps: {
          actualAvgKptMinutes: 12.0, // well under 15 min SLA
          promisedKptMinutes: 15.0,
          delayedOrdersCount: 0,
          totalOrdersCount: 150,
        },
        hygiene: {
          isFssaiValid: true,
          fssaiDaysToExpiry: 300,
          foodQualityIncidentsCount: 0,
          hygieneAuditScoreOutOf100: 100,
        },
      });

      expect(scoreResult.compositeScore).toBeGreaterThanOrEqual(90.0);
      expect(scoreResult.badge).toBe("PLATINUM_HYGIENE");
      expect(scoreResult.actionablePrescriptions.some(p => p.includes("Gourmet Club / Gold Featured banner"))).toBe(true);
    });

    it("should heavily penalize kitchen preparation delays and SLA breaches", () => {
      const scoreResult = calculateRestaurantHealthScore({
        restaurantId: "REST-SLOW-KITCHEN",
        ratings: [
          { rating: 4.5, ageInDays: 5 },
          { rating: 4.8, ageInDays: 3 },
        ],
        kitchenOps: {
          actualAvgKptMinutes: 24.5, // 9.5 mins above 15 min SLA!
          promisedKptMinutes: 15.0,
          delayedOrdersCount: 45, // 45% delay rate!
          totalOrdersCount: 100,
        },
        hygiene: {
          isFssaiValid: true,
          hygieneAuditScoreOutOf100: 90,
        },
      });

      // Check KPT penalty points
      // Delay = 9.5 mins * 2.5 pts = 23.75 pts
      // Delay rate = 45% * 0.3 = 13.5 pts
      // Total raw = 37.25 pts, capped at 35 pts!
      expect(scoreResult.kptDelayMinutes).toBe(9.5);
      expect(scoreResult.kptPenaltyPoints).toBe(35); // capped at maxKptPenaltyPoints
      expect(scoreResult.kptScoreOutOf100).toBe(65);
      expect(scoreResult.actionablePrescriptions.some(p => p.includes("Kitchen Prep Time"))).toBe(true);
      expect(scoreResult.actionablePrescriptions.some(p => p.includes("High delay rate"))).toBe(true);
    });

    it("should flag critical risk when FSSAI food license is invalid", () => {
      const scoreResult = calculateRestaurantHealthScore({
        restaurantId: "REST-NO-FSSAI",
        ratings: [{ rating: 4.5, ageInDays: 1 }],
        kitchenOps: {
          actualAvgKptMinutes: 15.0,
          delayedOrdersCount: 0,
          totalOrdersCount: 50,
        },
        hygiene: {
          isFssaiValid: false, // Invalid FSSAI license!
          foodQualityIncidentsCount: 2,
        },
      });

      expect(scoreResult.isFssaiCompliant).toBe(false);
      expect(scoreResult.hygieneScoreOutOf100).toBeLessThanOrEqual(30);
      expect(scoreResult.actionablePrescriptions.some(p => p.includes("CRITICAL ALERT: FSSAI"))).toBe(true);
    });
  });

  // ==========================================================================
  // 5. STATUTORY TAX & COMPREHENSIVE SETTLEMENT STATEMENT TESTS
  // ==========================================================================
  describe("Statutory CGST 9(5), 18% Commission GST, and Settlement Reconciliation", () => {
    it("should calculate complete Tier-1 industry order economics for an Anchor Brand (Domino's Pizza)", () => {
      // Order scenario:
      // Domino's Pizza (HIGH_VOLUME_ANCHOR)
      // Food subtotal: ₹800.00 (80,000 paise)
      // Requested packaging: ₹50.00 -> Capped to ₹35.00 (3,500 paise)
      // Customer voucher: 60% off up to ₹120 (12,000 paise discount)
      // Merchant bears 60% (₹72 = 7,200 paise), Platform bears 40% (₹48 = 4,800 paise)
      // Commission: 17% (1700 bps)
      // Weekly orders: 800 (qualifies for 300 bps rebate -> 14% effective commission!)
      // Customer Platform fee: ₹5.00 (500 paise)
      // Delivery fee: ₹30.00 (3,000 paise)

      const result = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-DOMINOS-001",
        restaurantId: "REST-DOMINOS",
        restaurantName: "Domino's Pizza Sector 18",
        categoryTier: "HIGH_VOLUME_ANCHOR",
        itemSubtotalPaise: toPaise(800),
        requestedPackagingFeePaise: toPaise(50),
        weeklyOrdersCount: 800,
        customerPlatformFeePaise: toPaise(5),
        customerDeliveryFeePaise: toPaise(30),
        promotion: {
          code: "DOMINOS60",
          discountPercentage: 60,
          maxDiscountCapPaise: toPaise(120),
          merchantSharePercent: 60,
          platformSharePercent: 40,
        },
      });

      // 1. Packaging audit check
      expect(result.packagingAudit.isCompliant).toBe(false);
      expect(result.packagingAudit.approvedPackagingFeePaise).toBe(toPaise(35)); // ₹35 cap

      // 2. Promotion check
      expect(result.customerBill.totalDiscountPaise).toBe(toPaise(120));
      expect(result.merchantSettlement.merchantDiscountPaise).toBe(toPaise(72)); // ₹72
      expect(result.platformEconomics.platformDiscountAbsorptionPaise).toBe(toPaise(48)); // ₹48

      // 3. Net Food Sales to restaurant
      // ₹800 food - ₹72 merchant discount = ₹728.00 (72,800 paise)
      expect(result.merchantSettlement.netFoodSalesPaise).toBe(toPaise(728));

      // 4. Effective commission calculation
      // Anchor default = 1700 bps. 800 weekly orders -> -300 bps rebate = 1400 bps (14.00%)
      expect(result.merchantSettlement.baseCommissionBps).toBe(1700);
      expect(result.merchantSettlement.volumeRebateBps).toBe(300);
      expect(result.merchantSettlement.effectiveCommissionBps).toBe(1400);

      // Commission amount = 14% of ₹728 = ₹101.92 -> 10,192 paise
      expect(result.merchantSettlement.commissionAmountPaise).toBe(10192);

      // 18% GST on platform commission = 18% of 10,192 = 1,835 paise (₹18.35)
      expect(result.merchantSettlement.commissionGstPaise).toBe(1835);
      expect(result.merchantSettlement.totalCommissionWithGstPaise).toBe(10192 + 1835);

      // 5. Statutory deductions:
      // Total taxable merchant sales = ₹728 (food) + ₹35 (packaging) = ₹763.00 (76,300 paise)
      expect(result.merchantSettlement.totalMerchantTaxableSalesPaise).toBe(76300);

      // 1% TCS under Section 52 = 1% of 76,300 = 763 paise (₹7.63)
      expect(result.merchantSettlement.tcsPaise).toBe(763);

      // 1% TDS under Section 194-O = 1% of 76,300 = 763 paise (₹7.63)
      expect(result.merchantSettlement.tdsPaise).toBe(763);

      // 6. Net Restaurant Remittance Payout:
      // Total merchant gross earnings = ₹728 (food) + ₹35 (packaging) = 76,300 paise
      // Deductions = Commission (10,192) + Comm GST (1,835) + TCS (763) + TDS (763) = 13,553 paise
      // Net Remitted = 76,300 - 13,553 = 62,747 paise (₹627.47)
      expect(result.merchantSettlement.netPayableToRestaurantPaise).toBe(62747);
      expect(result.merchantSettlement.isSettlementReconciled).toBe(true);

      // 7. CGST Section 9(5) 5% Food Tax Verification:
      // Customer discounted food = ₹800 - ₹120 = ₹680.00 (68,000 paise)
      // 5% Food GST = 5% of 68,000 = 3,400 paise (₹34.00)
      expect(result.customerBill.foodGstSec95Paise).toBe(3400);
      expect(result.statutorySummary.itcBlockedFoodGstPaise).toBe(3400);

      // Intrastate split: 2.5% CGST (1,700 paise) + 2.5% SGST (1,700 paise)
      expect(result.statutorySummary.cgstSec95Paise).toBe(1700);
      expect(result.statutorySummary.sgstSec95Paise).toBe(1700);

      // 8. Platform Contribution Margin Check:
      expect(result.platformEconomics.commissionRevenuePaise).toBe(10192);
      expect(result.platformEconomics.isProfitableOrder).toBe(true);
    });

    it("should calculate settlement for a Cloud Kitchen / Delivery-Only partner (Rebel Foods)", () => {
      // Cloud kitchen tier (21% base commission)
      const result = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-CLOUD-001",
        restaurantId: "REST-FAASOS",
        restaurantName: "Faasos Cloud Kitchen",
        categoryTier: "CLOUD_KITCHEN",
        itemSubtotalPaise: toPaise(350),
        requestedPackagingFeePaise: toPaise(25), // ₹25 is within 10% (₹35) and within ₹35 cap
        weeklyOrdersCount: 200, // 100 bps volume rebate -> 20% effective commission
      });

      expect(result.packagingAudit.isCompliant).toBe(true);
      expect(result.merchantSettlement.effectiveCommissionBps).toBe(2000); // 20%
      expect(result.merchantSettlement.isSettlementReconciled).toBe(true);
    });

    it("should accurately reflect interstate IGST when isInterstate flag is true", () => {
      const result = tier1MerchantEngine.calculateSettlement({
        orderId: "ORD-INTERSTATE-001",
        restaurantId: "REST-SWEETS",
        restaurantName: "Bhikharam Chandmal",
        categoryTier: "STANDARD_STANDALONE",
        itemSubtotalPaise: toPaise(1000),
        requestedPackagingFeePaise: toPaise(35),
        isInterstate: true,
      });

      // Interstate: 5% IGST on food
      expect(result.statutorySummary.igstSec95Paise).toBe(toPaise(50));
      expect(result.statutorySummary.cgstSec95Paise).toBe(0);
      expect(result.statutorySummary.sgstSec95Paise).toBe(0);
    });
  });

  // ==========================================================================
  // 6. MENU ENGINEERING & GROWTH STRATEGY TESTS
  // ==========================================================================
  describe("Menu Engineering & Growth Strategy", () => {
    it("should classify menu items into BCG matrix (Stars, Plowhorses, Puzzles, Dogs)", () => {
      const benchmarks = {
        medianOrders: 50,
        medianProfitPaise: toPaise(100),
      };

      // 1. Star item: High volume, high profit
      const star = analyzeMenuItemEconomics(
        {
          itemId: "ITEM-BIRYANI",
          itemName: "Hyderabadi Dum Biryani",
          costPricePaise: toPaise(120),
          sellingPricePaise: toPaise(350),
          ordersCount: 120,
          restaurantCategoryTier: "STANDARD_STANDALONE",
        },
        benchmarks
      );
      expect(star.category).toBe("STAR");
      expect(star.unitProfitPaise).toBeGreaterThan(toPaise(100));

      // 2. Plowhorse item: High volume, low profit
      const plowhorse = analyzeMenuItemEconomics(
        {
          itemId: "ITEM-ROTI",
          itemName: "Butter Roti",
          costPricePaise: toPaise(18),
          sellingPricePaise: toPaise(30),
          ordersCount: 300,
          restaurantCategoryTier: "STANDARD_STANDALONE",
        },
        benchmarks
      );
      expect(plowhorse.category).toBe("PLOWHORSE");

      // 3. Puzzle item: Low volume, high profit
      const puzzle = analyzeMenuItemEconomics(
        {
          itemId: "ITEM-PLATTER",
          itemName: "Gourmet Kebab Platter",
          costPricePaise: toPaise(250),
          sellingPricePaise: toPaise(650),
          ordersCount: 20,
          restaurantCategoryTier: "STANDARD_STANDALONE",
        },
        benchmarks
      );
      expect(puzzle.category).toBe("PUZZLE");

      // 4. Dog item: Low volume, low profit
      const dog = analyzeMenuItemEconomics(
        {
          itemId: "ITEM-SOUP",
          itemName: "Clear Veg Soup",
          costPricePaise: toPaise(60),
          sellingPricePaise: toPaise(80),
          ordersCount: 15,
          restaurantCategoryTier: "STANDARD_STANDALONE",
        },
        benchmarks
      );
      expect(dog.category).toBe("DOG");
    });

    it("should simulate recommended menu price for desired profit margin accounting for commission & tax", () => {
      const item = analyzeMenuItemEconomics(
        {
          itemId: "ITEM-THALI",
          itemName: "Deluxe Thali",
          costPricePaise: toPaise(150),
          sellingPricePaise: toPaise(250),
          ordersCount: 40,
          restaurantCategoryTier: "STANDARD_STANDALONE",
          targetProfitMarginPercent: 25, // target 25% net profit margin
        },
        { medianOrders: 30, medianProfitPaise: toPaise(80) }
      );

      expect(item.recommendedPricePaise).toBeGreaterThan(item.costPricePaise);
      expect(item.recommendedPricePaise).toBeGreaterThan(item.sellingPricePaise);
    });
  });

  // ==========================================================================
  // 7. UNIVERSAL CUSTOMIZATION & SELF-TUNING TESTS
  // ==========================================================================
  describe("Universal Customization & Self-Tuning via UmarOS", () => {
    it("should allow runtime updates to commission rates, caps, and tax parameters", () => {
      const engine = new Tier1MerchantEngine();

      // Custom configuration override
      engine.updateConfig({
        maxPackagingFeeCapPaise: toPaise(25), // lowered to ₹25 max
        defaultDiscountMerchantSharePercent: 70, // 70/30 split
        defaultDiscountPlatformSharePercent: 30,
        tiers: {
          ...DEFAULT_TIER1_MERCHANT_CONFIG.tiers,
          STANDARD_STANDALONE: {
            ...DEFAULT_TIER1_MERCHANT_CONFIG.tiers.STANDARD_STANDALONE,
            defaultCommissionBps: 2300, // 23%
          },
        },
      });

      const config = engine.getConfig();
      expect(config.maxPackagingFeeCapPaise).toBe(toPaise(25));
      expect(config.defaultDiscountMerchantSharePercent).toBe(70);
      expect(config.defaultDiscountPlatformSharePercent).toBe(30);
      expect(config.tiers.STANDARD_STANDALONE.defaultCommissionBps).toBe(2300);

      // Verify new packaging cap is enforced
      const packResult = engine.validatePackaging({
        foodItemPricePaise: toPaise(500),
        requestedPackagingFeePaise: toPaise(30),
      });
      expect(packResult.approvedPackagingFeePaise).toBe(toPaise(25));
    });

    it("should self-tune recommendations for high-volume and emerging merchants", () => {
      const engine = new Tier1MerchantEngine();

      // High volume merchant telemetry
      const highVolumeTune = engine.selfTune({
        averageWeeklyOrders: 650,
        averageKptMinutes: 14.2,
        fssaiValid: true,
        averageRating: 4.6,
      });

      expect(highVolumeTune.recommendedTier).toBe("HIGH_VOLUME_ANCHOR");
      expect(highVolumeTune.recommendedCommissionBps).toBeLessThanOrEqual(1600); // 17% - 3% rebate = 14%
      expect(highVolumeTune.promotionalStrategy.campaignName).toBe("WELCOME60");

      // Emerging merchant with prep delays
      const emergingTune = engine.selfTune({
        averageWeeklyOrders: 40,
        averageKptMinutes: 21.5,
        fssaiValid: true,
        averageRating: 4.1,
      });

      expect(emergingTune.recommendedTier).toBe("STANDARD_STANDALONE");
      expect(emergingTune.promotionalStrategy.recommendedMerchantSharePercent).toBe(50); // 50/50 support for launch
      expect(emergingTune.operationalPrescription).toContain("High KPT delay");
    });
  });
});
