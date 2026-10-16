import { describe, it, expect } from "vitest";
import {
  ECONOMIC_CONSTANTS,
  calculateOrderContributionMargin,
  calculateElasticitySurge,
  allocateCoFundedDiscount,
  optimizeMarketplaceOrderEconomics,
  type OrderContributionMarginInput,
  type SurgePricingInput,
  type CoFundedDiscountInput,
} from "./profit-engine.ts";

describe("👑 Mathematical Economics & Profit Optimization Engine for UmarOS", () => {
  // ==========================================================================
  // 1. ORDER CONTRIBUTION MARGIN (NET PLATFORM PROFIT)
  // ==========================================================================
  describe("1. Order Contribution Margin Formula", () => {
    it("strictly verifies the mathematical formula: Net Platform Profit = Gross Order Value - Food Cost to Restaurant - Rider Payout - PG Fee - Platform Tax", () => {
      // Order Scenario:
      // Gross Order Value = ₹550.00 (55,000 paise)
      // Food Cost to Restaurant = ₹380.00 (38,000 paise)
      // Rider Payout = ₹60.00 (6,000 paise)
      // Payment Gateway Fee = ₹10.00 (1,000 paise)
      // Platform Tax = ₹25.00 (2,500 paise)
      const input: OrderContributionMarginInput = {
        orderId: "ord_barak_001",
        grossOrderValuePaise: 55_000,
        foodCostToRestaurantPaise: 38_000,
        riderPayoutPaise: 6_000,
        paymentGatewayFeePaise: 1_000,
        platformTaxPaise: 2_500,
      };

      const result = calculateOrderContributionMargin(input);

      // Expected Net Platform Profit: 55,000 - 38,000 - 6,000 - 1,000 - 2,500 = 7,500 paise (₹75.00)
      expect(result.grossOrderValuePaise).toBe(55_000);
      expect(result.foodCostToRestaurantPaise).toBe(38_000);
      expect(result.riderPayoutPaise).toBe(6_000);
      expect(result.paymentGatewayFeePaise).toBe(1_000);
      expect(result.platformTaxPaise).toBe(2_500);

      expect(result.totalDeductionsPaise).toBe(47_500);
      expect(result.netPlatformProfitPaise).toBe(7_500);
      expect(result.isContributionPositive).toBe(true);

      // Margin % = (7,500 / 55,000) * 100 = 13.64% -> HEALTHY tier
      expect(result.contributionMarginPercentage).toBe(13.64);
      expect(result.profitabilityTier).toBe("HEALTHY");
    });

    it("evaluates HIGH_MARGIN orders (>= 15% contribution margin)", () => {
      const result = calculateOrderContributionMargin({
        grossOrderValuePaise: 100_000, // ₹1,000
        foodCostToRestaurantPaise: 65_000, // ₹650
        riderPayoutPaise: 8_000, // ₹80
        paymentGatewayFeePaise: 1_800, // ₹18
        platformTaxPaise: 5_200, // ₹52
      });

      // Net profit = 100,000 - 80,000 = 20,000 paise (20.00%)
      expect(result.netPlatformProfitPaise).toBe(20_000);
      expect(result.contributionMarginPercentage).toBe(20.0);
      expect(result.profitabilityTier).toBe("HIGH_MARGIN");
      expect(result.isContributionPositive).toBe(true);
    });

    it("evaluates BREAK_EVEN orders where net profit is exactly 0 paise", () => {
      const result = calculateOrderContributionMargin({
        grossOrderValuePaise: 50_000,
        foodCostToRestaurantPaise: 35_000,
        riderPayoutPaise: 10_000,
        paymentGatewayFeePaise: 1_000,
        platformTaxPaise: 4_000,
      });

      expect(result.netPlatformProfitPaise).toBe(0);
      expect(result.contributionMarginPercentage).toBe(0);
      expect(result.profitabilityTier).toBe("BREAK_EVEN");
      expect(result.isContributionPositive).toBe(false);
    });

    it("evaluates LOSS_MAKING orders where platform subsidies cause negative profit", () => {
      const result = calculateOrderContributionMargin({
        grossOrderValuePaise: 30_000, // ₹300 customer paid (heavy subsidy)
        foodCostToRestaurantPaise: 28_000, // ₹280 food cost
        riderPayoutPaise: 5_000, // ₹50 rider payout
        paymentGatewayFeePaise: 600, // ₹6 PG fee
        platformTaxPaise: 1_200, // ₹12 tax
      });

      // Total deductions: 28,000 + 5,000 + 600 + 1,200 = 34,800 paise
      // Net profit: 30,000 - 34,800 = -4,800 paise (-₹48.00)
      expect(result.netPlatformProfitPaise).toBe(-4_800);
      expect(result.contributionMarginPercentage).toBe(-16.0);
      expect(result.profitabilityTier).toBe("LOSS_MAKING");
      expect(result.isContributionPositive).toBe(false);
    });

    it("throws descriptive errors when inputs contain negative amounts", () => {
      expect(() => {
        calculateOrderContributionMargin({
          grossOrderValuePaise: -100,
          foodCostToRestaurantPaise: 100,
          riderPayoutPaise: 100,
          paymentGatewayFeePaise: 10,
          platformTaxPaise: 10,
        });
      }).toThrow(/Gross Order Value cannot be negative/);

      expect(() => {
        calculateOrderContributionMargin({
          grossOrderValuePaise: 1000,
          foodCostToRestaurantPaise: -50,
          riderPayoutPaise: 100,
          paymentGatewayFeePaise: 10,
          platformTaxPaise: 10,
        });
      }).toThrow(/Food Cost to Restaurant cannot be negative/);
    });
  });

  // ==========================================================================
  // 2. DEMAND / SUPPLY ELASTICITY SURGE PRICING ALGORITHM
  // ==========================================================================
  describe("2. Demand/Supply Elasticity Surge Pricing Algorithm", () => {
    it("is a pure deterministic mathematical function with sub-millisecond execution", () => {
      const start = performance.now();
      const result1 = calculateElasticitySurge({ activeOrders: 10, availableRiders: 10 });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10); // Well under 10ms
      const result2 = calculateElasticitySurge({ activeOrders: 10, availableRiders: 10 });
      expect(result1).toEqual(result2); // Pure and deterministic
    });

    it("evaluates balanced equilibrium zone (demand equals supply)", () => {
      const result = calculateElasticitySurge({
        activeOrders: 20,
        availableRiders: 20,
        baseDeliveryFeePaise: 3_000,
      });

      expect(result.demandSupplyRatio).toBe(1.0);
      expect(result.zoneStatus).toBe("EQUILIBRIUM");
      expect(result.surgeMultiplier).toBe(1.0);
      expect(result.surgeAmountPaise).toBe(0);
      expect(result.effectiveDeliveryFeePaise).toBe(3_000);
      expect(result.riderSurgePayoutPaise).toBe(0);
      expect(result.platformSurgeRetainedPaise).toBe(0);
    });

    it("evaluates oversupply zone and applies mild demand stimulation discount", () => {
      const result = calculateElasticitySurge({
        activeOrders: 4,
        availableRiders: 20, // 0.2 ratio -> high idle fleet
        baseDeliveryFeePaise: 4_000,
        minMultiplier: 0.8,
      });

      expect(result.demandSupplyRatio).toBe(0.2);
      expect(result.zoneStatus).toBe("OVERSUPPLY");
      expect(result.surgeMultiplier).toBeLessThan(1.0);
      expect(result.surgeMultiplier).toBeGreaterThanOrEqual(0.8);
      expect(result.effectiveDeliveryFeePaise).toBeLessThan(4_000);
    });

    it("evaluates moderate and high demand zones with smooth elasticity scaling", () => {
      // Moderate: 15 orders, 10 riders (ratio = 1.5)
      const moderate = calculateElasticitySurge({
        activeOrders: 15,
        availableRiders: 10,
        baseDeliveryFeePaise: 3_000,
      });
      expect(moderate.demandSupplyRatio).toBe(1.5);
      expect(moderate.zoneStatus).toBe("MODERATE_SURGE");
      expect(moderate.surgeMultiplier).toBeGreaterThan(1.0);
      expect(moderate.surgeAmountPaise).toBeGreaterThan(0);

      // High: 25 orders, 10 riders (ratio = 2.5)
      const high = calculateElasticitySurge({
        activeOrders: 25,
        availableRiders: 10,
        baseDeliveryFeePaise: 3_000,
      });
      expect(high.demandSupplyRatio).toBe(2.5);
      expect(high.zoneStatus).toBe("HIGH_SURGE");
      expect(high.surgeMultiplier).toBeGreaterThan(moderate.surgeMultiplier);
    });

    it("handles critical scarcity when demand vastly outstrips supply", () => {
      const result = calculateElasticitySurge({
        activeOrders: 40,
        availableRiders: 10, // ratio = 4.0
        baseDeliveryFeePaise: 3_000,
        maxMultiplier: 3.5,
      });

      expect(result.zoneStatus).toBe("CRITICAL_SCARCITY");
      expect(result.surgeMultiplier).toBeGreaterThan(2.0);
      expect(result.surgeMultiplier).toBeLessThanOrEqual(3.5);
    });

    it("handles zero available riders safely without divide-by-zero, engaging max surge cap", () => {
      const result = calculateElasticitySurge({
        activeOrders: 12,
        availableRiders: 0,
        baseDeliveryFeePaise: 3_000,
        maxMultiplier: 3.5,
        riderSurgeSharePercent: 80,
      });

      expect(result.demandSupplyRatio).toBe(Infinity);
      expect(result.zoneStatus).toBe("CRITICAL_SCARCITY");
      expect(result.surgeMultiplier).toBe(3.5);
      expect(result.effectiveDeliveryFeePaise).toBe(10_500); // 3,000 * 3.5
      expect(result.surgeAmountPaise).toBe(7_500); // 10,500 - 3,000
      expect(result.riderSurgePayoutPaise).toBe(6_000); // 80% of 7,500
      expect(result.platformSurgeRetainedPaise).toBe(1_500); // 20% of 7,500
    });

    it("handles zero active orders with zero available riders", () => {
      const result = calculateElasticitySurge({
        activeOrders: 0,
        availableRiders: 0,
      });

      expect(result.demandSupplyRatio).toBe(0);
      expect(result.zoneStatus).toBe("EQUILIBRIUM");
      expect(result.surgeMultiplier).toBe(1.0);
      expect(result.surgeAmountPaise).toBe(0);
    });

    it("incorporates environmental (weather) and temporal peak multipliers", () => {
      const baseline = calculateElasticitySurge({
        activeOrders: 18,
        availableRiders: 10,
        baseDeliveryFeePaise: 3_000,
      });

      const rainyPeak = calculateElasticitySurge({
        activeOrders: 18,
        availableRiders: 10,
        baseDeliveryFeePaise: 3_000,
        weatherMultiplier: 1.25, // monsoon rain
        timeOfDayPeakMultiplier: 1.2, // dinner peak
      });

      expect(rainyPeak.surgeMultiplier).toBeGreaterThan(baseline.surgeMultiplier);
      expect(rainyPeak.effectiveDeliveryFeePaise).toBeGreaterThan(baseline.effectiveDeliveryFeePaise);
    });

    it("splits surge amount accurately between rider and platform according to agreed share", () => {
      const result = calculateElasticitySurge({
        activeOrders: 30,
        availableRiders: 10,
        baseDeliveryFeePaise: 5_000,
        riderSurgeSharePercent: 85, // 85% to rider
      });

      expect(result.surgeAmountPaise).toBe(result.effectiveDeliveryFeePaise - result.baseDeliveryFeePaise);
      expect(result.riderSurgePayoutPaise + result.platformSurgeRetainedPaise).toBe(result.surgeAmountPaise);
    });

    it("validates input ranges and rejects invalid configurations", () => {
      expect(() => {
        calculateElasticitySurge({ activeOrders: -5, availableRiders: 10 });
      }).toThrow(/Active orders cannot be negative/);

      expect(() => {
        calculateElasticitySurge({ activeOrders: 5, availableRiders: -1 });
      }).toThrow(/Available riders cannot be negative/);

      expect(() => {
        calculateElasticitySurge({ activeOrders: 5, availableRiders: 5, minMultiplier: 3.0, maxMultiplier: 2.0 });
      }).toThrow(/minMultiplier .* cannot exceed maxMultiplier/);
    });
  });

  // ==========================================================================
  // 3. CO-FUNDED DISCOUNT ALLOCATION (PLATFORM % VS MERCHANT %)
  // ==========================================================================
  describe("3. Co-Funded Discount Allocation Formula", () => {
    it("allocates standard 50-50 promotional discount with zero paise leakage", () => {
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 10_000, // ₹100.00
        platformSharePercent: 50,
        merchantSharePercent: 50,
        campaignCode: "WELCOME50",
      });

      expect(result.platformDiscountPaise).toBe(5_000);
      expect(result.merchantDiscountPaise).toBe(5_000);
      expect(result.effectivePlatformSharePercent).toBe(50.0);
      expect(result.effectiveMerchantSharePercent).toBe(50.0);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
      expect(result.isPlatformCapTriggered).toBe(false);
      expect(result.isMerchantCapTriggered).toBe(false);
    });

    it("allocates asymmetric 40% Platform / 60% Merchant discount", () => {
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 15_000, // ₹150.00
        platformSharePercent: 40,
        merchantSharePercent: 60,
        campaignCode: "FESTIVE60",
      });

      expect(result.platformDiscountPaise).toBe(6_000); // 40% of 15,000
      expect(result.merchantDiscountPaise).toBe(9_000); // 60% of 15,000
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("guarantees exact integer paise preservation even with fractional split numbers", () => {
      // 3,333 paise on a 33% / 67% split
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 3_333,
        platformSharePercent: 33,
        merchantSharePercent: 67,
      });

      // 3,333 * 0.33 = 1099.89 -> rounds to 1,100 paise
      // Merchant gets remainder: 3,333 - 1,100 = 2,233 paise
      expect(result.platformDiscountPaise).toBe(1_100);
      expect(result.merchantDiscountPaise).toBe(2_233);
      expect(result.platformDiscountPaise + result.merchantDiscountPaise).toBe(3_333);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("enforces maximum platform subsidy cap and shifts excess to merchant", () => {
      // Total discount: ₹150 (15,000 paise)
      // Agreed: 50% Platform (₹75), 50% Merchant (₹75)
      // But Platform Cap is ₹50 (5,000 paise)
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 15_000,
        platformSharePercent: 50,
        merchantSharePercent: 50,
        maxPlatformSubsidyCapPaise: 5_000,
      });

      expect(result.isPlatformCapTriggered).toBe(true);
      expect(result.platformDiscountPaise).toBe(5_000); // Capped at ₹50
      expect(result.merchantDiscountPaise).toBe(10_000); // Merchant absorbs the remaining ₹100
      expect(result.effectivePlatformSharePercent).toBe(33.33);
      expect(result.effectiveMerchantSharePercent).toBe(66.67);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("enforces maximum merchant subsidy cap and shifts excess to platform", () => {
      // Total discount: ₹100 (10,000 paise)
      // Agreed: 30% Platform, 70% Merchant (₹70)
      // Merchant Cap is ₹40 (4,000 paise)
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 10_000,
        platformSharePercent: 30,
        merchantSharePercent: 70,
        maxMerchantSubsidyCapPaise: 4_000,
      });

      expect(result.isMerchantCapTriggered).toBe(true);
      expect(result.merchantDiscountPaise).toBe(4_000); // Capped at ₹40
      expect(result.platformDiscountPaise).toBe(6_000); // Platform absorbs remaining ₹60
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("handles zero discount amount gracefully", () => {
      const result = allocateCoFundedDiscount({
        totalDiscountPaise: 0,
        platformSharePercent: 50,
        merchantSharePercent: 50,
      });

      expect(result.totalDiscountPaise).toBe(0);
      expect(result.platformDiscountPaise).toBe(0);
      expect(result.merchantDiscountPaise).toBe(0);
      expect(result.isZeroPaiseLeakageVerified).toBe(true);
    });

    it("throws when platform and merchant shares do not sum to 100%", () => {
      expect(() => {
        allocateCoFundedDiscount({
          totalDiscountPaise: 5_000,
          platformSharePercent: 40,
          merchantSharePercent: 40, // Sums to 80%
        });
      }).toThrow(/Co-funded discount share must sum to 100%/);
    });

    it("rejects negative shares or negative discount values", () => {
      expect(() => {
        allocateCoFundedDiscount({
          totalDiscountPaise: -500,
          platformSharePercent: 50,
          merchantSharePercent: 50,
        });
      }).toThrow(/Total discount cannot be negative/);

      expect(() => {
        allocateCoFundedDiscount({
          totalDiscountPaise: 1000,
          platformSharePercent: -10,
          merchantSharePercent: 110,
        });
      }).toThrow(/Platform share percent must be between 0 and 100/);
    });
  });

  // ==========================================================================
  // 4. HOLISTIC MARKETPLACE ORDER ECONOMICS SYNTHESIS
  // ==========================================================================
  describe("4. Comprehensive Marketplace Order Economics Synthesis", () => {
    it("synthesizes surge pricing, co-funded discounts, and statutory taxes into exact contribution margin", () => {
      const order = optimizeMarketplaceOrderEconomics({
        orderId: "ord_synthesis_001",
        restaurantId: "rest_biryani_express",
        zoneId: "zone_karimganj_central",
        itemTotalPaise: 50_000, // ₹500 food bill
        packagingChargePaise: 2_000, // ₹20 packaging
        baseDeliveryFeePaise: 3_000, // ₹30 base delivery
        customerPlatformFeePaise: 400, // ₹4 platform fee
        activeOrdersInZone: 25,
        availableRidersInZone: 10, // Surge ratio 2.5
        commissionRateBps: 1800, // 18% restaurant commission
        discountCoupon: {
          code: "TASTY100",
          totalDiscountPaise: 10_000, // ₹100 discount
          platformSharePercent: 40, // Platform funds ₹40
          merchantSharePercent: 60, // Merchant funds ₹60
          maxPlatformSubsidyCapPaise: 5_000,
        },
        pgFeeBps: 180, // 1.8% PG fee
      });

      // 1. Surge Telemetry Verified
      expect(order.surgeTelemetry.demandSupplyRatio).toBe(2.5);
      expect(order.surgeTelemetry.surgeMultiplier).toBeGreaterThan(1.0);
      expect(order.surgeTelemetry.effectiveDeliveryFeePaise).toBeGreaterThan(3_000);

      // 2. Co-funded Discount Telemetry Verified
      expect(order.discountTelemetry).toBeDefined();
      expect(order.discountTelemetry?.platformDiscountPaise).toBe(4_000);
      expect(order.discountTelemetry?.merchantDiscountPaise).toBe(6_000);
      expect(order.discountTelemetry?.isZeroPaiseLeakageVerified).toBe(true);

      // 3. Customer Facing Gross Order Value Verified
      expect(order.customerBill.grossOrderValuePaise).toBeGreaterThan(0);
      expect(order.customerBill.totalDiscountPaise).toBe(10_000);

      // 4. Food Cost to Restaurant Verified
      expect(order.merchantSettlement.foodCostToRestaurantPaise).toBeGreaterThan(0);
      expect(order.merchantSettlement.merchantDiscountAbsorptionPaise).toBe(6_000);

      // 5. Rider Payout Verified
      expect(order.fulfillmentCosts.totalRiderPayoutPaise).toBe(
        order.fulfillmentCosts.riderBasePayoutPaise + order.fulfillmentCosts.riderSurgePayoutPaise
      );

      // 6. Order Contribution Margin Verified
      const cm = order.contributionMargin;
      expect(cm.netPlatformProfitPaise).toBe(
        cm.grossOrderValuePaise -
        cm.foodCostToRestaurantPaise -
        cm.riderPayoutPaise -
        cm.paymentGatewayFeePaise -
        cm.platformTaxPaise
      );
      expect(cm.totalDeductionsPaise).toBe(
        cm.foodCostToRestaurantPaise +
        cm.riderPayoutPaise +
        cm.paymentGatewayFeePaise +
        cm.platformTaxPaise
      );
    });

    it("detects loss-making order when excessive platform subsidy is applied and emits alert", () => {
      const order = optimizeMarketplaceOrderEconomics({
        orderId: "ord_loss_002",
        restaurantId: "rest_cafe_delight",
        zoneId: "zone_silchar_club",
        itemTotalPaise: 20_000, // ₹200 food bill
        packagingChargePaise: 1_000,
        baseDeliveryFeePaise: 3_000,
        customerPlatformFeePaise: 400,
        activeOrdersInZone: 5,
        availableRidersInZone: 15, // Oversupply
        commissionRateBps: 1000, // 10% commission
        discountCoupon: {
          code: "DEEPLOSS150",
          totalDiscountPaise: 15_000, // ₹150 discount
          platformSharePercent: 90, // Platform funds 90% (₹135 subsidy!)
          merchantSharePercent: 10,
        },
      });

      expect(order.contributionMargin.netPlatformProfitPaise).toBeLessThan(0);
      expect(order.contributionMargin.profitabilityTier).toBe("LOSS_MAKING");
      expect(order.optimizationAction).toContain("ALERT: Transaction is loss-making");
    });
  });
});
