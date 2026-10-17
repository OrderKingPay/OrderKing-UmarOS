import { describe, expect, it } from "vitest";
import {
  Tier1RiderAlgorithmEngine,
  DEFAULT_TIER1_CONFIG,
  resolveCityTier,
} from "./tier1-rider-algorithm";

describe("Tier-1 Grade Logistics & Rider Algorithm Engine (OrderKing Core)", () => {
  it("initializes with authentic Indian food delivery pricing configuration", () => {
    const engine = new Tier1RiderAlgorithmEngine();
    const config = engine.getConfig();

    expect(config.rider.basePayPaise).toBe(2000); // ₹20.00 base pay
    expect(config.rider.firstMileThresholdKm).toBe(1.0); // 1.0 km first mile threshold
    expect(config.rider.lastMileBand1RatePaisePerKm).toBe(700); // ₹7.00/km
    expect(config.customer.platformFeePaise).toBe(600); // ₹6.00 platform fee
    expect(config.geoTiering.enabled).toBe(true);
    expect(config.surge.maxSurgeMultiplier).toBe(2.4);
    expect(config.temporal.lunchPeak.speedDecayPct).toBe(25.0);
  });

  // ==========================================================================
  // 1. REAL-WORLD EXACT PAYOUT MATHEMATICAL PROOFS
  //    (₹28.50, ₹34, ₹42, ₹46.50, ₹63.50, ₹74, ₹78, ₹84.50, ₹135.00)
  // ==========================================================================
  describe("Mathematical Calculation of Real-World Indian Food Delivery Payouts", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("calculates exact ₹28.50 for a short trip (1.2 km with 6 min kitchen wait)", () => {
      const calibratedEngine = new Tier1RiderAlgorithmEngine({
        rider: {
          ...DEFAULT_TIER1_CONFIG.rider,
          basePayPaise: 1850,
        },
      });

      const res = calibratedEngine.calculateRiderPay({
        firstMileDistanceKm: 0.8,
        lastMileDistanceKm: 1.2,
        kitchenWaitTimeMinutes: 6,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(28.5);
      expect(res.payoutPaise).toBe(2850);
    });

    it("calculates exact ₹34.00 for a standard daylight 2.0 km order", () => {
      // 2.0 km delivery, 0.9 km first mile (within 1km threshold), 4 min wait (within grace)
      // Base: ₹20.00
      // Last-mile: 2.0 km * ₹7.00 = ₹14.00
      // Wait: 0 (under grace)
      // Total: ₹20.00 + ₹14.00 = ₹34.00!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 0.9,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 4,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(34.0);
      expect(res.payoutPaise).toBe(3400);
    });

    it("calculates exact ₹42.00 for a 2.8 km order with slight wait time", () => {
      // 2.8 km last-mile, 1.2 km first-mile (0.2km excess * ₹5.50 = ₹1.10)
      // Base: ₹20.00
      // First-mile: ₹1.10
      // Last-mile (Band 1 + Band 2): (2.0 * ₹7.00) + (0.8 * ₹8.50) = ₹14.00 + ₹6.80 = ₹20.80
      // Wait: 5 min (within grace)
      // Total: 20.00 + 1.10 + 20.80 = ₹41.90 -> rounded to nearest 50 paise = ₹42.00!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 1.2,
        lastMileDistanceKm: 2.8,
        kitchenWaitTimeMinutes: 5,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(42.0);
      expect(res.payoutPaise).toBe(4200);
    });

    it("calculates exact ₹46.50 for a 2.4 km order in Tier-1 Metro (Delhi NCR)", () => {
      // Tier-1 Metro base pay: ₹25.00
      // First-mile (1.2 km): 0.2 km excess * ₹5.50 = ₹1.10
      // Last-mile (2.4 km): (2.0 * ₹7.00) + (0.4 * ₹8.50) = ₹14.00 + ₹3.40 = ₹17.40
      // Wait: 7 min -> (7 - 5) * ₹1.50 = ₹3.00
      // Total: 25.00 + 1.10 + 17.40 + 3.00 = ₹46.50!
      const res = engine.calculateRiderPay({
        cityName: "Delhi NCR",
        firstMileDistanceKm: 1.2,
        lastMileDistanceKm: 2.4,
        kitchenWaitTimeMinutes: 7,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(46.5);
      expect(res.payoutPaise).toBe(4650);
      expect(res.metrics.cityTier).toBe("TIER_1");
    });

    it("calculates exact ₹63.50 for a 4.2 km mid-distance order with wait time", () => {
      // 4.2 km last-mile, 1.3 km first-mile (0.3 excess * ₹5.50 = ₹1.65)
      // Base: ₹20.00
      // Last-mile: (2.0 * ₹7.00) + (2.2 * ₹8.50) = ₹14.00 + ₹18.70 = ₹32.70
      // Wait time: 11 mins -> (11 - 5) * ₹1.50 = ₹9.00
      // Total: 20.00 + 1.65 + 32.70 + 9.00 = ₹63.35 -> rounded to nearest 50 paise = ₹63.50!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 1.3,
        lastMileDistanceKm: 4.2,
        kitchenWaitTimeMinutes: 11,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(63.5);
    });

    it("calculates exact ₹74.00 for a 3.4 km delivery during drizzle rain", () => {
      // Base: ₹20.00
      // Last-mile (3.4 km): 14.00 + (1.4 * 8.50 = 11.90) = ₹25.90
      // First-mile (1.5 km): (1.5 - 1.0) * 5.50 = ₹2.75
      // Weather (DRIZZLE): +₹15.00
      // Wait time (12 min): (12 - 5) * 1.50 = ₹10.50
      // Total: 20.00 + 2.75 + 25.90 + 15.00 + 10.50 = ₹74.15 -> rounds to nearest 50 paise = ₹74.00!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 1.5,
        lastMileDistanceKm: 3.4,
        kitchenWaitTimeMinutes: 12,
        weatherCondition: "DRIZZLE",
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(74.0);
    });

    it("calculates exact ₹78.00 for a 4.8 km delivery under moderate surge", () => {
      // Base: ₹20.00
      // Last-mile (4.8 km): 14.00 + (2.8 * 8.50 = 23.80) = ₹37.80
      // First-mile (1.8 km): 0.8 * 5.50 = ₹4.40
      // Demand surge (ratio 1.57): (1.57 - 1.0) * 20.00 = ₹11.40
      // Wait time (8 mins): (8 - 5) * 1.50 = ₹4.50
      // Total: 20.00 + 4.40 + 37.80 + 11.40 + 4.50 = ₹78.10 -> rounds to nearest 50 paise = ₹78.00!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 1.8,
        lastMileDistanceKm: 4.8,
        kitchenWaitTimeMinutes: 8,
        zoneDemandSupplyRatio: 1.57,
      });

      expect(res.payoutRupees).toBe(78.0);
    });

    it("calculates exact ₹84.50 for a 4.0 km order during dinner peak with surge & wait", () => {
      // Base: ₹20.00
      // Last-mile (4.0 km): (2 * 7.00) + (2 * 8.50) = 14.00 + 17.00 = ₹31.00
      // First-mile (1.0 km): ₹0.00
      // Wait time (11 mins): (11 - 5) * 1.50 = ₹9.00
      // Dinner Peak Bonus (20:30): +₹15.00
      // Demand surge (ratio 1.48): (1.48 - 1.0) * 20.00 = ₹9.60
      // Total: 20.00 + 31.00 + 9.00 + 15.00 + 9.60 = ₹84.60 -> rounds to ₹84.50!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 1.0,
        lastMileDistanceKm: 4.0,
        kitchenWaitTimeMinutes: 11,
        zoneDemandSupplyRatio: 1.48,
        orderTimestampIso: "2026-10-16T20:30:00+05:30", // 20:30 Dinner Peak (IST)
        applyPeakHourBonus: true,
      });

      expect(res.payoutRupees).toBe(84.5);
      expect(res.components.peakBonusPaise).toBe(1500);
      expect(res.metrics.temporalSlot).toBe("DINNER_PEAK");
    });

    it("calculates exact ₹135.00 for long-distance 9.5 km order with ₹20 return allowance", () => {
      // Base: ₹20.00
      // Last-mile (9.5 km):
      //  Band 1 (0-2 km): 2 * 7.00 = 14.00
      //  Band 2 (2-5 km): 3 * 8.50 = 25.50
      //  Band 3 (5-8 km): 3 * 11.00 = 33.00
      //  Band 4 (>8 km): 1.5 * 15.00 = 22.50
      //  Return trip allowance: ₹20.00
      //  Total Last-Mile = 14 + 25.50 + 33 + 22.50 + 20 = ₹115.00
      // Total: 20.00 + 115.00 = ₹135.00!
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 0.8,
        lastMileDistanceKm: 9.5,
        kitchenWaitTimeMinutes: 4,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(res.payoutRupees).toBe(135.0);
      expect(res.payoutPaise).toBe(13500);
      expect(res.components.lastMilePayPaise).toBe(11500);
    });
  });

  // ==========================================================================
  // 2. GEOLOCATION & AUTHENTIC CITY TIERING
  // ==========================================================================
  describe("Geolocation & City Tiering (Tier-1 Metros vs Tier-2/3)", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("resolves city names into correct authentic Indian market tiers", () => {
      expect(resolveCityTier("Delhi NCR")).toBe("TIER_1");
      expect(resolveCityTier("Mumbai")).toBe("TIER_1");
      expect(resolveCityTier("Bengaluru")).toBe("TIER_1");
      expect(resolveCityTier("Guwahati")).toBe("TIER_2");
      expect(resolveCityTier("Patna")).toBe("TIER_2");
      expect(resolveCityTier("Silchar")).toBe("TIER_3");
      expect(resolveCityTier("Dibrugarh")).toBe("TIER_3");
    });

    it("resolves GPS coordinates to city tiers accurately", () => {
      // Delhi NCR coordinates (Connaught Place: 28.63, 77.21)
      expect(engine.resolveCityTier({ lat: 28.63, lon: 77.21 })).toBe("TIER_1");
      // Mumbai BKC coordinates (19.06, 72.86)
      expect(engine.resolveCityTier({ lat: 19.06, lon: 72.86 })).toBe("TIER_1");
      // Silchar coordinates (24.83, 92.77)
      expect(engine.resolveCityTier({ lat: 24.83, lon: 92.77 })).toBe("TIER_3");
      // Guwahati coordinates (26.14, 91.73)
      expect(engine.resolveCityTier({ lat: 26.14, lon: 91.73 })).toBe("TIER_2");
      // Patna coordinates (25.59, 85.13)
      expect(engine.resolveCityTier({ lat: 25.59, lon: 85.13 })).toBe("TIER_2");
    });

    it("applies Tier-1 Metro base pickup pay (₹25.00) vs Tier-3 (₹18.00)", () => {
      // Tier-1: Mumbai (2.0 km order -> ₹25.00 base + ₹14.00 distance = ₹39.00)
      const metroPay = engine.calculateRiderPay({
        cityName: "Mumbai",
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 3,
        zoneDemandSupplyRatio: 1.0,
      });
      expect(metroPay.components.basePayPaise).toBe(2500);
      expect(metroPay.payoutRupees).toBe(39.0);

      // Tier-3: Silchar (2.0 km order -> ₹18.00 base + ₹14.00 distance = ₹32.00)
      const tier3Pay = engine.calculateRiderPay({
        cityName: "Silchar",
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 3,
        zoneDemandSupplyRatio: 1.0,
      });
      expect(tier3Pay.components.basePayPaise).toBe(1800);
      expect(tier3Pay.payoutRupees).toBe(32.0);
    });

    it("scales distance payout with Fuel Index multiplier when configured", () => {
      // Tier-1 fuel index = 1.08 (8% fuel overhead in heavy metro congestion)
      // 2.0 km last-mile @ Band 1 (700 * 1.08 = 756 paise/km) = 1512 paise (₹15.12)
      // First-mile (1.5 km -> 0.5 excess @ 550 * 1.08 = 594 paise/km) = 297 paise
      // Base: ₹25.00
      // Raw: 2500 + 1512 + 297 = 4309 paise -> rounds to ₹43.00!
      const res = engine.calculateRiderPay({
        cityTier: "TIER_1",
        firstMileDistanceKm: 1.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 4,
        zoneDemandSupplyRatio: 1.0,
        applyCityTierMultipliers: true,
      });

      expect(res.components.basePayPaise).toBe(2500);
      expect(res.components.firstMilePayPaise).toBe(297);
      expect(res.components.lastMilePayPaise).toBe(1512);
      expect(res.payoutRupees).toBe(43.0);
    });
  });

  // ==========================================================================
  // 3. DYNAMIC H3 / GEOHASH ZONE DENSITY & CONTINUOUS SURGE (1.0x to 2.4x)
  // ==========================================================================
  describe("Dynamic H3/Geohash Zone Density & Continuous Surge Curve", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("computes exact continuous surge multipliers bounded strictly from 1.0x to 2.4x", () => {
      // Equilibrium (R <= 1.0)
      expect(engine.calculateDynamicSurgeMultiplier(0.75)).toBe(1.0);
      expect(engine.calculateDynamicSurgeMultiplier(1.0)).toBe(1.0);

      // Mild surge (1.0 < R <= 1.2) -> 1.0x to 1.1x
      expect(engine.calculateDynamicSurgeMultiplier(1.1)).toBe(1.05);
      expect(engine.calculateDynamicSurgeMultiplier(1.2)).toBe(1.1);

      // High surge (1.2 < R <= 1.8) -> 1.1x to 1.7x
      expect(engine.calculateDynamicSurgeMultiplier(1.5)).toBe(1.4);
      expect(engine.calculateDynamicSurgeMultiplier(1.8)).toBe(1.7);

      // Critical shortage (1.8 < R <= 2.5) -> 1.7x to 2.4x
      expect(engine.calculateDynamicSurgeMultiplier(2.15)).toBe(2.05);
      expect(engine.calculateDynamicSurgeMultiplier(2.5)).toBe(2.4);

      // Absolute statutory / platform ceiling cap (R > 2.5) -> 2.4x
      expect(engine.calculateDynamicSurgeMultiplier(3.2)).toBe(2.4);
      expect(engine.calculateDynamicSurgeMultiplier(5.0)).toBe(2.4);
    });

    it("calculates zone density surge metrics for H3 hexagonal grid cells", () => {
      const h3Cluster = engine.calculateZoneDensitySurge({
        h3Index: "IND-HEX-R2.5-14-22--36",
        activeOrders: 45,
        availableRiders: 25, // Ratio = 1.80
      });

      expect(h3Cluster.demandSupplyRatio).toBe(1.8);
      expect(h3Cluster.surgeMultiplier).toBe(1.7);
      expect(h3Cluster.surgeIntensity).toBe("CRITICAL_SHORTAGE");
      expect(h3Cluster.riderSurgePayPaise).toBe(1600); // (1.8 - 1.0) * ₹20 = ₹16.00
      expect(h3Cluster.customerSurgeFeePaise).toBe(1200); // (1.8 - 1.0) * ₹15 = ₹12.00
      expect(h3Cluster.explanation).toContain("IND-HEX-R2.5-14-22--36");
    });

    it("automatically computes ratio from order and rider counts in payout calculations", () => {
      const res = engine.calculateRiderPay({
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 3,
        zoneDemandSupplyRatio: 1.0, // Should be overridden by counts below
        zoneActiveOrdersCount: 30,
        zoneIdleRidersCount: 15, // Ratio = 2.0 -> Critical Shortage
      });

      expect(res.metrics.surgeMultiplier).toBeGreaterThan(1.8);
      expect(res.components.demandSurgePayPaise).toBe(2000); // (2.0 - 1.0) * ₹20 = ₹20.00
    });
  });

  // ==========================================================================
  // 4. TEMPORAL FRICTION MATRIX & TRAFFIC SPEED DECAY
  // ==========================================================================
  describe("Temporal Friction Matrix & Traffic Speed Decay", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("accurately detects Lunch Peak (12:00-15:30) and applies 25% speed decay", () => {
      const friction = engine.calculateTemporalFriction("2026-10-16T13:15:00+05:30");

      expect(friction.slot).toBe("LUNCH_PEAK");
      expect(friction.isPeakHour).toBe(true);
      expect(friction.decayPct).toBe(25.0);
      expect(friction.effectiveSpeedKmh).toBe(21.0); // 28 * 0.75 = 21 km/h
      expect(friction.frictionMultiplier).toBe(1.333);
      expect(friction.recommendedIncentivePaise).toBe(1000); // ₹10.00 incentive
    });

    it("accurately detects Dinner Peak (19:30-23:30) and applies 35% speed decay", () => {
      const friction = engine.calculateTemporalFriction("2026-10-16T21:00:00+05:30");

      expect(friction.slot).toBe("DINNER_PEAK");
      expect(friction.isPeakHour).toBe(true);
      expect(friction.decayPct).toBe(35.0);
      expect(friction.effectiveSpeedKmh).toBe(18.2); // 28 * 0.65 = 18.2 km/h
      expect(friction.frictionMultiplier).toBe(1.538);
      expect(friction.recommendedIncentivePaise).toBe(1500); // ₹15.00 incentive
    });

    it("accurately detects Late Night (23:30-05:00) with clear traffic speed boost", () => {
      const nightFriction = engine.calculateTemporalFriction("2026-10-16T00:30:00+05:30");
      expect(nightFriction.slot).toBe("LATE_NIGHT");
      expect(nightFriction.effectiveSpeedKmh).toBe(32.2); // 28 * 1.15 = 32.2 km/h
      expect(nightFriction.recommendedIncentivePaise).toBe(1800); // ₹18.00 night bonus

      const graveyardFriction = engine.calculateTemporalFriction("2026-10-16T03:30:00+05:30");
      expect(graveyardFriction.slot).toBe("GRAVEYARD");
      expect(graveyardFriction.recommendedIncentivePaise).toBe(3200); // ₹32.00 graveyard bonus
    });

    it("accurately estimates delivery duration considering peak congestion", () => {
      // 4.2 km delivery during dinner peak (18.2 km/h transit) vs off-peak (28 km/h)
      const dinnerEstimate = engine.estimateDeliveryDurationMinutes(
        4.2,
        "2026-10-16T20:30:00+05:30",
        15, // 15 min kitchen prep
        1.0 // 1 km first mile
      );

      // (4.2 / 18.2) * 60 = 13.8 mins transit
      // (1.0 / 18.2) * 60 = 3.3 mins first mile
      // 15 + 13.8 + 3.3 = 32.1 mins total
      expect(dinnerEstimate.frictionResult.slot).toBe("DINNER_PEAK");
      expect(dinnerEstimate.transitDurationMinutes).toBe(13.8);
      expect(dinnerEstimate.totalDurationMinutes).toBe(32.1);
    });
  });

  // ==========================================================================
  // 5. WEATHER & ENVIRONMENTAL BONUSES
  // ==========================================================================
  describe("Weather & Environmental Allowances", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("awards correct allowances for Drizzle (₹15), Heavy Rain (₹30), and Waterlogged (₹45)", () => {
      const drizzle = engine.calculateRiderPay({
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 2,
        zoneDemandSupplyRatio: 1.0,
        weatherCondition: "DRIZZLE",
      });
      expect(drizzle.components.weatherBonusPaise).toBe(1500); // ₹15.00

      const heavyRain = engine.calculateRiderPay({
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 2,
        zoneDemandSupplyRatio: 1.0,
        weatherCondition: "HEAVY_RAIN",
      });
      expect(heavyRain.components.weatherBonusPaise).toBe(3000); // ₹30.00

      const waterlogged = engine.calculateRiderPay({
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 2,
        zoneDemandSupplyRatio: 1.0,
        weatherCondition: "WATERLOGGED",
      });
      expect(waterlogged.components.weatherBonusPaise).toBe(4500); // ₹45.00
    });
  });

  // ==========================================================================
  // 6. CUSTOMER DELIVERY & PLATFORM FEES (TIER-1 BENCHMARK MODEL)
  // ==========================================================================
  describe("Customer Delivery & Platform Fee Breakdown", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("calculates authentic customer fees with ₹6.00 platform fee", () => {
      const fees = engine.calculateCustomerFees({
        distanceKm: 3.5,
        cartValuePaise: 35000, // ₹350 cart
        isGoldMember: false,
      });

      expect(fees.components.platformFeePaise).toBe(600); // ₹6.00
      expect(fees.components.deliveryFeePaise).toBeGreaterThanOrEqual(2500); // Base ₹25 + extra km
      expect(fees.components.gst18PctPaise).toBeGreaterThan(0); // 18% GST on services
    });

    it("waives customer delivery fee for Gold / Pass members on qualifying orders", () => {
      const fees = engine.calculateCustomerFees({
        distanceKm: 4.0,
        cartValuePaise: 25000, // ₹250 (above ₹199 threshold)
        isGoldMember: true,
      });

      expect(fees.components.deliveryFeePaise).toBe(0); // Waived!
      expect(fees.components.platformFeePaise).toBe(600); // Platform fee remains!
    });
  });

  // ==========================================================================
  // 7. UNIVERSAL CUSTOMIZATION CONTROLS (UMAROS GOVERNANCE)
  // ==========================================================================
  describe("Universal Customization from UmarOS", () => {
    it("allows the founder to increase or decrease any parameter manually in real-time", () => {
      const engine = new Tier1RiderAlgorithmEngine();

      // Founder increases base pay from ₹20 to ₹25, and rain bonus to ₹40
      engine.updateConfig({
        rider: {
          ...DEFAULT_TIER1_CONFIG.rider,
          basePayPaise: 2500,
          heavyRainBonusPaise: 4000,
        },
      });

      expect(engine.getConfig().rider.basePayPaise).toBe(2500);
      expect(engine.getConfig().rider.heavyRainBonusPaise).toBe(4000);

      // Verify that payout recalculates immediately with updated parameters
      const payout = engine.calculateRiderPay({
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 2,
        zoneDemandSupplyRatio: 1.0,
        weatherCondition: "HEAVY_RAIN",
      });

      expect(payout.components.basePayPaise).toBe(2500); // Updated!
      expect(payout.components.weatherBonusPaise).toBe(4000); // Updated!
    });

    it("allows customizing city tier definitions and dynamic surge ceilings in real-time", () => {
      const engine = new Tier1RiderAlgorithmEngine();

      engine.updateConfig({
        surge: {
          ...DEFAULT_TIER1_CONFIG.surge,
          maxSurgeMultiplier: 3.0, // Increase surge cap to 3.0x
        },
        geoTiering: {
          ...DEFAULT_TIER1_CONFIG.geoTiering,
          tiers: {
            ...DEFAULT_TIER1_CONFIG.geoTiering.tiers,
            TIER_1: {
              ...DEFAULT_TIER1_CONFIG.geoTiering.tiers.TIER_1,
              basePayPaise: 3000, // ₹30.00 base pay in Tier 1
            },
          },
        },
      });

      expect(engine.getConfig().surge.maxSurgeMultiplier).toBe(3.0);
      expect(engine.calculateDynamicSurgeMultiplier(4.0)).toBe(3.0);

      const t1Payout = engine.calculateRiderPay({
        cityName: "Delhi NCR",
        firstMileDistanceKm: 0.5,
        lastMileDistanceKm: 2.0,
        kitchenWaitTimeMinutes: 2,
        zoneDemandSupplyRatio: 1.0,
      });

      expect(t1Payout.components.basePayPaise).toBe(3000);
    });
  });

  // ==========================================================================
  // 8. EMPLOYEE-LESS AUTONOMOUS OPERATIONS
  // ==========================================================================
  describe("Employee-less Autonomous Operations", () => {
    const engine = new Tier1RiderAlgorithmEngine();

    it("autonomously pre-allocates dispatch so rider arrives exactly as food is packed", () => {
      const plan = engine.calculatePreAllocationDispatchTime(15, 4);

      expect(plan.dispatchLeadMinutes).toBe(11);
      expect(plan.recommendedDispatchStatus).toBe("HOLD_FOR_KITCHEN_PROGRESS");

      const imminentPlan = engine.calculatePreAllocationDispatchTime(4, 3);
      expect(imminentPlan.recommendedDispatchStatus).toBe("DISPATCH_IMMEDIATELY");
    });

    it("autonomously triggers automated voice alert to restaurant when kitchen is delayed", () => {
      const exception = engine.evaluateAutonomousException({
        orderId: "ord_1048",
        elapsedMinutes: 25,
        quotedDeliveryMinutes: 30,
        kitchenPrepElapsedMinutes: 24,
        kitchenQuotedPrepMinutes: 15,
        foodReadyMarked: false,
      });

      expect(exception.actionRequired).toBe("VOICE_CALL_RESTAURANT");
      expect(exception.automatedPayload.voiceScript).toContain("delayed by 9 minutes");
    });

    it("autonomously compensates customer with ₹50 KingPay Wallet credit on severe delivery delay", () => {
      const exception = engine.evaluateAutonomousException({
        orderId: "ord_2091",
        elapsedMinutes: 50,
        quotedDeliveryMinutes: 30,
        kitchenPrepElapsedMinutes: 15,
        kitchenQuotedPrepMinutes: 15,
        foodReadyMarked: true,
      });

      expect(exception.actionRequired).toBe("AUTO_COMPENSATE_CUSTOMER");
      expect(exception.automatedPayload.walletCreditPaise).toBe(5000); // ₹50.00
    });
  });
});
