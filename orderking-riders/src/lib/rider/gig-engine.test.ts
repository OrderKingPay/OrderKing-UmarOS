import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getRiderTier,
  calculateDailyMilestoneProgress,
  calculateMultiDayTouchpointProgress,
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

    it("incorporates rain surge bonus and dynamic weather boost", () => {
      const surge = calculateCompositeSurge("PLATINUM", 7, true, { isRainSurge: true, rainSurgeBonusPaise: 3500 });
      // Base: 1.0 + Plat (0.50) + 7-day streak (0.35) + Peak hour (0.30) + Rain boost (0.20) = 2.35
      assert.equal(surge.multiplier, 2.35);
      assert.equal(surge.rainSurgeBonusPaise, 3500); // ₹35 rain bonus
    });
  });

  describe("Multi-Day Touchpoint Targets (Weekend Sprint & Weekly Marathon)", () => {
    it("tracks progress through 3-day weekend sprint targets", () => {
      // 0 trips on Friday morning
      const p0 = calculateMultiDayTouchpointProgress(0, "WEEKEND_3_DAY");
      assert.equal(p0.completedOrders, 0);
      assert.equal(p0.unlockedBonusPaise, 0);
      assert.equal(p0.activeTarget?.requiredOrders, 25);
      assert.equal(p0.remainingToNext, 25);

      // 25 trips completed by Saturday afternoon -> unlocks ₹500
      const p25 = calculateMultiDayTouchpointProgress(25, "WEEKEND_3_DAY");
      assert.equal(p25.unlockedBonusPaise, 50000); // ₹500
      assert.equal(p25.activeTarget?.requiredOrders, 40);
      assert.equal(p25.remainingToNext, 15);

      // 40 trips completed -> unlocks ₹1,000
      const p40 = calculateMultiDayTouchpointProgress(40, "WEEKEND_3_DAY");
      assert.equal(p40.unlockedBonusPaise, 100000); // ₹1,000
      assert.equal(p40.activeTarget?.requiredOrders, 60);

      // 60 trips completed -> unlocks full ₹1,800 weekend champion target
      const p60 = calculateMultiDayTouchpointProgress(60, "WEEKEND_3_DAY");
      assert.equal(p60.unlockedBonusPaise, 180000); // ₹1,800
      assert.equal(p60.activeTarget, null);
      assert.equal(p60.progressPct, 100);
    });

    it("tracks progress through 7-day weekly marathon targets", () => {
      // 50 orders in a week -> ₹1,200 bonus
      const p50 = calculateMultiDayTouchpointProgress(50, "WEEKLY_7_DAY");
      assert.equal(p50.unlockedBonusPaise, 120000);
      assert.equal(p50.activeTarget?.requiredOrders, 80);

      // 110 orders in a week -> ₹3,800 Crown Master bonus
      const p110 = calculateMultiDayTouchpointProgress(110, "WEEKLY_7_DAY");
      assert.equal(p110.unlockedBonusPaise, 380000); // ₹3,800
      assert.equal(p110.activeTarget, null);
    });
  });
});
