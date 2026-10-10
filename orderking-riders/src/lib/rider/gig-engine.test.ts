import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRiderTier,
  calculateDailyMilestoneProgress,
  calculateStreakBonus,
  calculateCourierPerformance,
  calculateCompositeSurge,
  RIDER_TIERS,
} from "./gig-engine.ts";

describe("OrderKing Gamified Gig Engine", () => {
  describe("Rider Tiers", () => {
    it("returns BRONZE for new couriers", () => {
      const tier = getRiderTier(0);
      assert.equal(tier.tier, "BRONZE");
      assert.equal(tier.surgeMultiplier, 1.0);
    });

    it("advances through SILVER, GOLD, and PLATINUM with verified trips", () => {
      assert.equal(getRiderTier(55).tier, "SILVER");
      assert.equal(getRiderTier(210).tier, "GOLD");
      assert.equal(getRiderTier(505).tier, "PLATINUM");
      assert.equal(getRiderTier(505).priorityDispatch, true);
    });
  });

  describe("Daily Incentive Milestones", () => {
    it("correctly identifies initial target at 0 trips", () => {
      const progress = calculateDailyMilestoneProgress(0);
      assert.equal(progress.completedOrders, 0);
      assert.equal(progress.nextMilestone?.orders, 4);
      assert.equal(progress.remainingToNext, 4);
      assert.equal(progress.unlockedBonusPaise, 0);
      assert.equal(progress.progressPct, 0);
    });

    it("correctly updates progress after completing 4 trips", () => {
      const progress = calculateDailyMilestoneProgress(4);
      assert.equal(progress.unlockedBonusPaise, 6000);
      assert.equal(progress.nextMilestone?.orders, 8);
      assert.equal(progress.remainingToNext, 4);
      assert.equal(progress.progressPct, 50); // 4 out of 8 target
    });

    it("marks all milestones complete when maximum daily target met", () => {
      const progress = calculateDailyMilestoneProgress(16);
      assert.equal(progress.unlockedBonusPaise, 40000);
      assert.equal(progress.nextMilestone, null);
      assert.equal(progress.remainingToNext, 0);
      assert.equal(progress.progressPct, 100);
    });
  });

  describe("Streak Calculations", () => {
    it("applies graduated multipliers for active work streaks", () => {
      assert.equal(calculateStreakBonus(1).streakBonusMultiplier, 1.0);
      assert.equal(calculateStreakBonus(3).streakBonusMultiplier, 1.15);
      assert.equal(calculateStreakBonus(5).streakBonusMultiplier, 1.25);
      assert.equal(calculateStreakBonus(7).streakBonusMultiplier, 1.35);
    });
  });

  describe("Courier Performance Scorecard", () => {
    it("evaluates high quality couriers as EXCELLENT", () => {
      const score = calculateCourierPerformance({
        acceptanceRate: 98,
        completionRate: 99.5,
        customerRating: 4.95,
        onTimeDeliveryRate: 98,
        thermalComplianceRate: 100,
      });
      assert.equal(score.standing, "EXCELLENT");
    });
  });

  describe("Composite Surge Multiplier", () => {
    it("accurately composites base, tier, streak, and peak hour boosts", () => {
      const surge = calculateCompositeSurge("GOLD", 5, true);
      // Base: 1.0 + Gold tier (0.25) + 5-day streak (0.25) + Peak hour (0.30) = 1.80
      assert.equal(surge.multiplier, 1.8);
      assert.equal(surge.breakdown.tierBoost, 0.25);
      assert.equal(surge.breakdown.streakBoost, 0.25);
      assert.equal(surge.breakdown.peakBoost, 0.3);
    });
  });
});
