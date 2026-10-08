/**
 * ReferralRewardCalculator.ts
 * Strictly balances acquisition cost against lifetime value, ensuring the Founder never loses money.
 */

export interface CustomerLTVStats {
  averageOrderValue: number;
  averageOrdersPerMonth: number;
  expectedLifespanMonths: number;
  grossMarginPercentage: number;
}

export interface RestaurantLTVStats {
  averageMonthlyRevenue: number;
  platformFeePercentage: number;
  expectedLifespanMonths: number;
}

export interface RiderLTVStats {
  averageDeliveriesPerMonth: number;
  averageFeePerDelivery: number;
  expectedLifespanMonths: number;
  platformMarginPerDelivery: number;
}

export class ReferralRewardCalculator {
  // We require the Customer Acquisition Cost (CAC) to be no more than a certain % of LTV
  private static readonly MAX_CAC_LTV_RATIO = 0.3; // max 30% of LTV can be spent on referral
  private static readonly FOUNDER_SAFETY_MARGIN = 0.1; // Extra 10% safety margin

  public calculateCustomerReferralBudget(stats: CustomerLTVStats): number {
    const ltv = stats.averageOrderValue * stats.averageOrdersPerMonth * stats.expectedLifespanMonths * stats.grossMarginPercentage;
    const maxBudget = ltv * ReferralRewardCalculator.MAX_CAC_LTV_RATIO * (1 - ReferralRewardCalculator.FOUNDER_SAFETY_MARGIN);
    return Math.max(0, parseFloat(maxBudget.toFixed(2)));
  }

  public calculateRestaurantReferralBudget(stats: RestaurantLTVStats): number {
    const ltv = stats.averageMonthlyRevenue * stats.platformFeePercentage * stats.expectedLifespanMonths;
    const maxBudget = ltv * ReferralRewardCalculator.MAX_CAC_LTV_RATIO * (1 - ReferralRewardCalculator.FOUNDER_SAFETY_MARGIN);
    return Math.max(0, parseFloat(maxBudget.toFixed(2)));
  }

  public calculateRiderReferralBudget(stats: RiderLTVStats): number {
    const ltv = stats.averageDeliveriesPerMonth * stats.platformMarginPerDelivery * stats.expectedLifespanMonths;
    const maxBudget = ltv * ReferralRewardCalculator.MAX_CAC_LTV_RATIO * (1 - ReferralRewardCalculator.FOUNDER_SAFETY_MARGIN);
    return Math.max(0, parseFloat(maxBudget.toFixed(2)));
  }

  public determineRewardSplit(totalBudget: number, referrerShare: number = 0.5): { referrerReward: number, refereeReward: number } {
    if (referrerShare < 0 || referrerShare > 1) {
      throw new Error("Referrer share must be between 0 and 1");
    }
    return {
      referrerReward: parseFloat((totalBudget * referrerShare).toFixed(2)),
      refereeReward: parseFloat((totalBudget * (1 - referrerShare)).toFixed(2))
    };
  }
}
