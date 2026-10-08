export type BidType = 'CPC' | 'CPM';

export interface Campaign {
  id: string;
  restaurantId: string;
  keywords: string[];
  bidAmount: number; // in cents
  bidType: BidType;
  budgetRemaining: number;
  qualityScore: number; // 0.0 to 10.0
  active: boolean;
}

export interface AdRequest {
  keyword: string;
  userLocation: { lat: number; lng: number };
  slots: number; // Number of sponsored slots to fill
}

export interface AdImpression {
  campaignId: string;
  restaurantId: string;
  rankScore: number;
  cost: number;
  bidType: BidType;
}

export class SponsoredRankBiddingEngine {
  private activeCampaigns: Map<string, Campaign> = new Map();

  constructor() {}

  public registerCampaign(campaign: Campaign) {
    this.activeCampaigns.set(campaign.id, campaign);
  }

  public updateCampaignBudget(campaignId: string, amountSpent: number) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign) {
      campaign.budgetRemaining -= amountSpent;
      if (campaign.budgetRemaining <= 0) {
        campaign.active = false;
      }
    }
  }

  /**
   * Run the auction to select the top sponsored restaurants for a given keyword.
   * Ranks by Ad Rank = Bid * QualityScore.
   * Implements a generalized Second-Price Auction (Vickrey–Clarke–Groves inspired)
   * where Price = (Bid_next * QualityScore_next) / QualityScore_current + 0.01
   */
  public runAuction(request: AdRequest): AdImpression[] {
    const keywordLower = request.keyword.toLowerCase();
    
    // 1. Filter eligible campaigns
    const eligibleCampaigns = Array.from(this.activeCampaigns.values()).filter(c => 
      c.active && 
      c.budgetRemaining >= c.bidAmount &&
      c.keywords.map(k => k.toLowerCase()).includes(keywordLower)
    );

    // 2. Calculate Ad Rank for each campaign
    // Ad Rank = Bid * QualityScore
    const rankedCampaigns = eligibleCampaigns.map(campaign => ({
      campaign,
      adRank: campaign.bidAmount * campaign.qualityScore
    })).sort((a, b) => b.adRank - a.adRank); // Sort descending by Ad Rank

    const winners: AdImpression[] = [];
    
    // 3. Determine winners and pricing (Second-Price Auction)
    for (let i = 0; i < Math.min(request.slots, rankedCampaigns.length); i++) {
      const current = rankedCampaigns[i];
      let costToPay = current.campaign.bidAmount; // Default to full bid (first price)

      // If there is a next highest bidder, calculate second price
      if (i + 1 < rankedCampaigns.length) {
        const next = rankedCampaigns[i + 1];
        // Second price formula: (Next Ad Rank / Current Quality Score) + 1 cent
        // This ensures the current winner pays just enough to beat the next best competitor.
        if (current.campaign.qualityScore > 0) {
           costToPay = Math.ceil((next.adRank / current.campaign.qualityScore) + 1);
        }
        
        // Ensure they never pay more than their actual bid
        costToPay = Math.min(costToPay, current.campaign.bidAmount);
      }

      winners.push({
        campaignId: current.campaign.id,
        restaurantId: current.campaign.restaurantId,
        rankScore: current.adRank,
        cost: costToPay,
        bidType: current.campaign.bidType
      });
    }

    return winners;
  }

  /**
   * Process a click event for a CPC ad
   */
  public recordClick(campaignId: string, costPaid: number) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.bidType === 'CPC') {
      this.updateCampaignBudget(campaignId, costPaid);
    }
  }

  /**
   * Process an impression event for a CPM ad
   * Note: CPM is usually cost per 1000 impressions, so we charge a fraction of the bid
   */
  public recordImpression(campaignId: string, costPaid: number) {
    const campaign = this.activeCampaigns.get(campaignId);
    if (campaign && campaign.bidType === 'CPM') {
      // Cost paid is per 1000 impressions, so for 1 impression we divide by 1000
      this.updateCampaignBudget(campaignId, costPaid / 1000);
    }
  }
}
