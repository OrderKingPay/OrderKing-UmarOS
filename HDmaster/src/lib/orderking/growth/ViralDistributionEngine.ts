/**
 * ViralDistributionEngine.ts
 * Viral distribution engine for Restaurants, Riders, and Customers.
 */

import { ReferralRewardCalculator, CustomerLTVStats, RestaurantLTVStats, RiderLTVStats } from './ReferralRewardCalculator.ts';
import { DeepLinkGenerator, AffiliateRole } from './DeepLinkGenerator.ts';

export class ViralDistributionEngine {
  private rewardCalculator: ReferralRewardCalculator;
  private deepLinkGenerator: DeepLinkGenerator;

  constructor(baseUrl?: string) {
    this.rewardCalculator = new ReferralRewardCalculator();
    this.deepLinkGenerator = new DeepLinkGenerator(baseUrl);
  }

  public generateCustomerInvite(referrerId: string, stats: CustomerLTVStats, campaignId?: string, channel?: string): { url: string, referrerReward: number, refereeReward: number } {
    const budget = this.rewardCalculator.calculateCustomerReferralBudget(stats);
    const split = this.rewardCalculator.determineRewardSplit(budget, 0.5); // 50-50 split
    
    const url = this.deepLinkGenerator.generateAffiliateLink({
      referrerId,
      role: AffiliateRole.CUSTOMER,
      campaignId,
      channel
    });

    return {
      url,
      ...split
    };
  }

  public generateRestaurantInvite(referrerId: string, stats: RestaurantLTVStats, campaignId?: string, channel?: string): { url: string, referrerReward: number, refereeReward: number } {
    const budget = this.rewardCalculator.calculateRestaurantReferralBudget(stats);
    const split = this.rewardCalculator.determineRewardSplit(budget, 0.7); // 70-30 split for restaurants
    
    const url = this.deepLinkGenerator.generateAffiliateLink({
      referrerId,
      role: AffiliateRole.RESTAURANT,
      campaignId,
      channel
    });

    return {
      url,
      ...split
    };
  }

  public generateRiderInvite(referrerId: string, stats: RiderLTVStats, campaignId?: string, channel?: string): { url: string, referrerReward: number, refereeReward: number } {
    const budget = this.rewardCalculator.calculateRiderReferralBudget(stats);
    const split = this.rewardCalculator.determineRewardSplit(budget, 0.6); // 60-40 split for riders
    
    const url = this.deepLinkGenerator.generateAffiliateLink({
      referrerId,
      role: AffiliateRole.RIDER,
      campaignId,
      channel
    });

    return {
      url,
      ...split
    };
  }
}
