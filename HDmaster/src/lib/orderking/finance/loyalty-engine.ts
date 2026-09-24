/**
 * Customer Loyalty & Rewards Engine — Zomato-parity loyalty system with
 * tiered rewards, point earning/burning, abuse caps, and tier upgrade logic.
 *
 * All monetary values are in integer paise. Points are integers.
 *
 * @module loyalty-engine
 */

export type LoyaltyTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export type LoyaltyTierConfig = {
  tier: LoyaltyTier;
  label: string;
  minLifetimePointsToQualify: number;
  earnRateBps: number; // Points earned per 10000 paise spent
  burnRateBps: number; // Paise redeemed per 10000 points burned
  maxBurnPerOrderPaise: number;
  freeDeliveryAbovePaise: number;
  prioritySupport: boolean;
  exclusiveOffers: boolean;
};

export const LOYALTY_TIERS: LoyaltyTierConfig[] = [
  {
    tier: "BRONZE",
    label: "Bronze",
    minLifetimePointsToQualify: 0,
    earnRateBps: 100, // 1%
    burnRateBps: 2500, // 1 point = ₹0.25
    maxBurnPerOrderPaise: 5000,
    freeDeliveryAbovePaise: 99900,
    prioritySupport: false,
    exclusiveOffers: false,
  },
  {
    tier: "SILVER",
    label: "Silver",
    minLifetimePointsToQualify: 500,
    earnRateBps: 200, // 2%
    burnRateBps: 3000, // 1 point = ₹0.30
    maxBurnPerOrderPaise: 10000,
    freeDeliveryAbovePaise: 49900,
    prioritySupport: false,
    exclusiveOffers: false,
  },
  {
    tier: "GOLD",
    label: "Gold",
    minLifetimePointsToQualify: 2000,
    earnRateBps: 350, // 3.5%
    burnRateBps: 4000, // 1 point = ₹0.40
    maxBurnPerOrderPaise: 20000,
    freeDeliveryAbovePaise: 29900,
    prioritySupport: true,
    exclusiveOffers: true,
  },
  {
    tier: "PLATINUM",
    label: "Platinum",
    minLifetimePointsToQualify: 5000,
    earnRateBps: 500, // 5%
    burnRateBps: 5000, // 1 point = ₹0.50
    maxBurnPerOrderPaise: 40000,
    freeDeliveryAbovePaise: 19900,
    prioritySupport: true,
    exclusiveOffers: true,
  },
  {
    tier: "DIAMOND",
    label: "Diamond",
    minLifetimePointsToQualify: 15000,
    earnRateBps: 750, // 7.5%
    burnRateBps: 7500, // 1 point = ₹0.75
    maxBurnPerOrderPaise: 75000,
    freeDeliveryAbovePaise: 0,
    prioritySupport: true,
    exclusiveOffers: true,
  },
];

export function getTierConfig(tier: LoyaltyTier): LoyaltyTierConfig {
  return LOYALTY_TIERS.find((t) => t.tier === tier) ?? LOYALTY_TIERS[0];
}

export function determineTier(lifetimePoints: number): LoyaltyTier {
  let resolved: LoyaltyTierConfig = LOYALTY_TIERS[0];
  for (const config of LOYALTY_TIERS) {
    if (lifetimePoints >= config.minLifetimePointsToQualify) {
      resolved = config;
    }
  }
  return resolved.tier;
}

export type EarnResult = {
  pointsEarned: number;
  tier: LoyaltyTier;
  earnRateBps: number;
  bonusApplied: string | null;
};

/**
 * Calculate points earned from an order.
 */
export function calculateEarn(
  orderTotalPaise: number,
  currentTier: LoyaltyTier,
  options?: { firstOrderBonus?: boolean; birthdayBonus?: boolean; campaignMultiplierBps?: number }
): EarnResult {
  const config = getTierConfig(currentTier);
  let rateBps = config.earnRateBps;
  let bonusApplied: string | null = null;

  // Campaign multiplier (e.g., "2x points weekend")
  if (options?.campaignMultiplierBps && options.campaignMultiplierBps > 0) {
    rateBps = Math.floor((rateBps * options.campaignMultiplierBps) / 10000);
    bonusApplied = "CAMPAIGN_MULTIPLIER";
  }

  // First order bonus: 3x base rate
  if (options?.firstOrderBonus) {
    rateBps *= 3;
    bonusApplied = "FIRST_ORDER_3X";
  }

  // Birthday bonus: 2x
  if (options?.birthdayBonus && !options?.firstOrderBonus) {
    rateBps *= 2;
    bonusApplied = "BIRTHDAY_2X";
  }

  const pointsEarned = Math.floor((orderTotalPaise * rateBps) / (10000 * 100));

  return {
    pointsEarned: Math.max(0, pointsEarned),
    tier: currentTier,
    earnRateBps: rateBps,
    bonusApplied,
  };
}

export type BurnResult = {
  pointsBurned: number;
  discountPaise: number;
  remainingPoints: number;
  maxBurnablePoints: number;
  tier: LoyaltyTier;
};

/**
 * Calculate points burn (redemption) for an order.
 */
export function calculateBurn(
  requestedPoints: number,
  availablePoints: number,
  orderTotalPaise: number,
  currentTier: LoyaltyTier,
  dailyBurnCount: number,
  dailyBurnCap: number
): BurnResult {
  const config = getTierConfig(currentTier);

  // Abuse cap: max burns per day
  if (dailyBurnCount >= dailyBurnCap) {
    return {
      pointsBurned: 0,
      discountPaise: 0,
      remainingPoints: availablePoints,
      maxBurnablePoints: 0,
      tier: currentTier,
    };
  }

  // Calculate max redeemable discount
  const maxDiscountPaise = config.maxBurnPerOrderPaise;
  const maxDiscountFromOrder = Math.floor(orderTotalPaise * 0.5); // Max 50% discount
  const effectiveMaxDiscount = Math.min(maxDiscountPaise, maxDiscountFromOrder);

  // How many points needed for max discount
  const pointsForMaxDiscount = Math.ceil((effectiveMaxDiscount * 10000) / config.burnRateBps);

  // Actual points to burn
  const pointsToBurn = Math.min(requestedPoints, availablePoints, pointsForMaxDiscount);

  // Calculate actual discount
  const discountPaise = Math.floor((pointsToBurn * config.burnRateBps) / 10000);

  return {
    pointsBurned: pointsToBurn,
    discountPaise: Math.min(discountPaise, effectiveMaxDiscount),
    remainingPoints: availablePoints - pointsToBurn,
    maxBurnablePoints: Math.min(availablePoints, pointsForMaxDiscount),
    tier: currentTier,
  };
}

/**
 * Check if a customer qualifies for free delivery based on their tier and order total.
 */
export function qualifiesForFreeDelivery(orderTotalPaise: number, currentTier: LoyaltyTier): boolean {
  const config = getTierConfig(currentTier);
  return orderTotalPaise >= config.freeDeliveryAbovePaise;
}

/**
 * Get tier upgrade progress for a customer.
 */
export function getTierProgress(
  currentTier: LoyaltyTier,
  lifetimePoints: number
): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  progressPercent: number;
} {
  const currentIdx = LOYALTY_TIERS.findIndex((t) => t.tier === currentTier);
  const nextConfig = LOYALTY_TIERS[currentIdx + 1];

  if (!nextConfig) {
    return { currentTier, nextTier: null, pointsToNextTier: 0, progressPercent: 100 };
  }

  const currentThreshold = LOYALTY_TIERS[currentIdx].minLifetimePointsToQualify;
  const nextThreshold = nextConfig.minLifetimePointsToQualify;
  const range = nextThreshold - currentThreshold;
  const progress = lifetimePoints - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));

  return {
    currentTier,
    nextTier: nextConfig.tier,
    pointsToNextTier: Math.max(0, nextThreshold - lifetimePoints),
    progressPercent,
  };
}
