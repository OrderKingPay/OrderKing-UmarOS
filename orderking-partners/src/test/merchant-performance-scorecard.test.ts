import { describe, it, expect } from "vitest";
import {
  calculateMerchantScorecard,
  type MerchantScorecardInput,
} from "../components/dashboard/merchant-performance-scorecard";

describe("MerchantPerformanceScorecard - Zomato Restaurant Partner Benchmark Parity", () => {
  it("calculates optimal scorecard and approves promoted search boost eligibility", () => {
    const input: MerchantScorecardInput = {
      totalOrders: 100,
      acceptedOrders: 99,
      cancelledOrders: 0,
      avgPrepMinutes: 12,
      rating: 4.8,
      ratingCount: 150,
    };

    const sc = calculateMerchantScorecard(input);

    expect(sc.acceptanceRatePct).toBe(99.0);
    expect(sc.acceptanceStatus).toBe("OPTIMAL");

    expect(sc.cancellationRatePct).toBe(0.0);
    expect(sc.cancellationStatus).toBe("EXCELLENT");

    expect(sc.avgPrepMinutes).toBe(12);
    expect(sc.prepTimeStatus).toBe("FAST");

    expect(sc.rating).toBe(4.8);
    expect(sc.ratingStatus).toBe("TOP_RATED");

    expect(sc.overallHealthScore).toBeGreaterThanOrEqual(90);
    expect(sc.isEligibleForPromotedPlacement).toBe(true);
  });

  it("triggers warning and alert thresholds when acceptance is low or cancellations are high", () => {
    // 92% acceptance (< 95% alert), 2% cancellation (>= 1% warning), 28m prep (>25m delayed)
    const degradedInput: MerchantScorecardInput = {
      totalOrders: 100,
      acceptedOrders: 92,
      cancelledOrders: 2,
      avgPrepMinutes: 28,
      rating: 3.8,
    };

    const sc = calculateMerchantScorecard(degradedInput);

    expect(sc.acceptanceRatePct).toBe(92.0);
    expect(sc.acceptanceStatus).toBe("ALERT");

    expect(sc.cancellationRatePct).toBe(2.0);
    expect(sc.cancellationStatus).toBe("WARNING");

    expect(sc.prepTimeStatus).toBe("DELAYED");
    expect(sc.ratingStatus).toBe("NEEDS_IMPROVEMENT");

    expect(sc.isEligibleForPromotedPlacement).toBe(false);
  });

  it("handles zero total orders gracefully without NaN or divide-by-zero", () => {
    const emptyInput: MerchantScorecardInput = {
      totalOrders: 0,
      acceptedOrders: 0,
      cancelledOrders: 0,
    };

    const sc = calculateMerchantScorecard(emptyInput);

    expect(sc.acceptanceRatePct).toBe(100.0);
    expect(sc.cancellationRatePct).toBe(0.0);
    expect(sc.acceptanceStatus).toBe("OPTIMAL");
    expect(sc.cancellationStatus).toBe("EXCELLENT");
    expect(Number.isNaN(sc.overallHealthScore)).toBe(false);
  });

  it("detects borderline attention status (95% - 97.9% acceptance, 0.5% - 0.99% cancellation)", () => {
    const borderlineInput: MerchantScorecardInput = {
      totalOrders: 1000,
      acceptedOrders: 965, // 96.5% -> ATTENTION
      cancelledOrders: 7, // 0.7% -> ACCEPTABLE
      avgPrepMinutes: 18, // 18m -> NORMAL
      rating: 4.3, // 4.3 -> GOOD
    };

    const sc = calculateMerchantScorecard(borderlineInput);

    expect(sc.acceptanceRatePct).toBe(96.5);
    expect(sc.acceptanceStatus).toBe("ATTENTION");

    expect(sc.cancellationRatePct).toBe(0.7);
    expect(sc.cancellationStatus).toBe("ACCEPTABLE");

    expect(sc.prepTimeStatus).toBe("NORMAL");
    expect(sc.ratingStatus).toBe("GOOD");
    expect(sc.isEligibleForPromotedPlacement).toBe(false); // misses 98% acceptance and 4.5 rating
  });
});
