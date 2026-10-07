import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { runAdAuction, calculateQualityScore, type AdCandidate } from "./ad-auction-engine.ts";

describe("Zomato Generalized Second-Price Ad Auction Engine", () => {
  test("calculates quality score based on rating, CTR, and distance", () => {
    const highQuality = calculateQualityScore({
      rating: 4.8,
      historicalCtr: 0.04,
      distanceKm: 2.0,
    });
    const lowQuality = calculateQualityScore({
      rating: 3.2,
      historicalCtr: 0.015,
      distanceKm: 9.0,
    });
    assert.ok(highQuality > lowQuality);
    assert.ok(highQuality > 1.0);
    assert.ok(lowQuality < 1.0);
  });

  test("ranks candidates by Ad Rank and charges Generalized Second Price", () => {
    const candidates: AdCandidate[] = [
      {
        restaurantId: "rest_a",
        restaurantName: "Biryani Express",
        maxBidCpcPaise: 1500, // ₹15 max bid
        dailyBudgetPaise: 100_000, // ₹1,000 budget
        spentTodayPaise: 20_000,
        rating: 4.6,
        historicalCtr: 0.035,
        distanceKm: 2.5,
      },
      {
        restaurantId: "rest_b",
        restaurantName: "Rolls & Bowls",
        maxBidCpcPaise: 1000, // ₹10 max bid
        dailyBudgetPaise: 50_000,
        spentTodayPaise: 10_000,
        rating: 4.2,
        historicalCtr: 0.028,
        distanceKm: 3.0,
      },
      {
        restaurantId: "rest_c",
        restaurantName: "Burger Hub",
        maxBidCpcPaise: 600, // ₹6 max bid
        dailyBudgetPaise: 30_000,
        spentTodayPaise: 5_000,
        rating: 3.8,
        historicalCtr: 0.02,
        distanceKm: 4.0,
      },
    ];

    const results = runAdAuction(candidates, 2);
    assert.equal(results.length, 2);
    // Rank 1 must have higher ad rank score than Rank 2
    assert.ok(results[0].adRankScore >= results[1].adRankScore);
    assert.equal(results[0].rank, 1);
    assert.equal(results[1].rank, 2);
    assert.equal(results[0].restaurantId, "rest_a");

    // Rank 1 effective CPC must be <= maxBid and > 0
    assert.ok(results[0].effectiveCpcPaise <= 1500);
    assert.ok(results[0].effectiveCpcPaise > 0);
  });

  test("filters out campaigns exceeding daily budget", () => {
    const candidates: AdCandidate[] = [
      {
        restaurantId: "rest_exhausted",
        restaurantName: "Exhausted Budget Kitchen",
        maxBidCpcPaise: 1000,
        dailyBudgetPaise: 25_000, // ₹250 budget
        spentTodayPaise: 24_500,  // Only 500 paise left, less than 1000 max bid
        rating: 4.5,
        historicalCtr: 0.03,
        distanceKm: 1.0,
      },
    ];
    const results = runAdAuction(candidates);
    assert.equal(results.length, 0);
  });
});
