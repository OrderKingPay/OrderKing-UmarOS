/**
 * Zomato-Style Generalized Second-Price (GSP) Ad Auction Engine
 *
 * Implements real-time ad ranking and pricing for sponsored restaurants:
 * - Quality Score = f(Restaurant Rating, Historical CTR, Distance to Customer)
 * - Ad Rank = Max Bid (Paise) * Quality Score
 * - Effective CPC = (Next Highest Ad Rank / Current Quality Score) + 1 Paise
 * - Daily Budget tracking with automated campaign throttling
 *
 * @module ad-auction-engine
 */

export type AdCandidate = {
  restaurantId: string;
  restaurantName: string;
  maxBidCpcPaise: number;     // Maximum willing to pay per click in paise
  dailyBudgetPaise: number;   // Daily budget in paise
  spentTodayPaise: number;    // Already spent today in paise
  rating: number;             // 1.0 to 5.0
  historicalCtr: number;      // e.g. 0.035 for 3.5%
  distanceKm: number;         // Distance from searching customer
};

export type AdAuctionResult = {
  restaurantId: string;
  restaurantName: string;
  rank: number;
  adRankScore: number;
  qualityScore: number;
  effectiveCpcPaise: number;
  sponsoredBadge: boolean;
  remainingDailyBudgetPaise: number;
};

/**
 * Calculates quality score (0.5 to 2.5 multiplier) based on customer relevance
 */
export function calculateQualityScore(candidate: {
  rating: number;
  historicalCtr: number;
  distanceKm: number;
}): number {
  // 1. Rating factor (4.5+ gives bonus, below 3.5 penalizes)
  const ratingFactor = Math.max(0.6, candidate.rating / 4.0);

  // 2. CTR factor (expected baseline is ~2.5% = 0.025)
  const ctrFactor = Math.max(0.5, Math.min(2.0, candidate.historicalCtr / 0.025));

  // 3. Distance penalty (customers prefer closer restaurants, max 10km)
  const distanceFactor = Math.max(0.5, 1.0 - candidate.distanceKm * 0.05);

  const rawScore = ratingFactor * 0.4 + ctrFactor * 0.4 + distanceFactor * 0.2;
  return Math.round(rawScore * 100) / 100;
}

/**
 * Runs a Generalized Second-Price (GSP) ad auction among active campaigns
 */
export function runAdAuction(
  candidates: AdCandidate[],
  slotsToFill = 3
): AdAuctionResult[] {
  // 1. Filter out campaigns that exhausted their daily budget
  const eligible = candidates.filter(
    (c) => c.dailyBudgetPaise - c.spentTodayPaise >= c.maxBidCpcPaise && c.distanceKm <= 12.0
  );

  if (!eligible.length) return [];

  // 2. Compute Quality Score and Ad Rank
  const scored = eligible.map((c) => {
    const qs = calculateQualityScore(c);
    const adRankScore = Math.round(c.maxBidCpcPaise * qs);
    return {
      candidate: c,
      qualityScore: qs,
      adRankScore,
    };
  });

  // 3. Sort descending by Ad Rank
  scored.sort((a, b) => b.adRankScore - a.adRankScore);

  // 4. Fill slots and calculate effective CPC using GSP
  const results: AdAuctionResult[] = [];
  const topWinners = scored.slice(0, slotsToFill);

  for (let i = 0; i < topWinners.length; i++) {
    const current = topWinners[i];
    const next = scored[i + 1];

    let effectiveCpcPaise = current.candidate.maxBidCpcPaise;

    if (next && current.qualityScore > 0) {
      // Second price rule: Price = (Next Ad Rank / Current QS) + 1 paise
      const secondPrice = Math.ceil(next.adRankScore / current.qualityScore) + 1;
      effectiveCpcPaise = Math.min(current.candidate.maxBidCpcPaise, secondPrice);
    } else {
      // Reserve price floor: 80% of max bid or at least 200 paise (₹2.00)
      effectiveCpcPaise = Math.max(200, Math.round(current.candidate.maxBidCpcPaise * 0.8));
    }

    results.push({
      restaurantId: current.candidate.restaurantId,
      restaurantName: current.candidate.restaurantName,
      rank: i + 1,
      adRankScore: current.adRankScore,
      qualityScore: current.qualityScore,
      effectiveCpcPaise,
      sponsoredBadge: true,
      remainingDailyBudgetPaise: Math.max(
        0,
        current.candidate.dailyBudgetPaise - (current.candidate.spentTodayPaise + effectiveCpcPaise)
      ),
    });
  }

  return results;
}
