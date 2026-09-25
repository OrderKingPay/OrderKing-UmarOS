/**
 * KingCoins Loyalty & Tier Progression Ecosystem
 * Handles cashback percentages, manages tier statuses (Silver, Gold, King),
 * and handles point redemption logic.
 *
 * All monetary values are in integer paise to prevent financial leakage.
 * KingCoins (points) are stored as integers (1 KingCoin = 1 Paisa for redemption, or whatever exchange rate).
 *
 * @module loyalty-engine
 */

export type LoyaltyTier = "SILVER" | "GOLD" | "KING";

export type LoyaltyTierConfig = {
  tier: LoyaltyTier;
  label: string;
  minLifetimeCoinsToQualify: number;
  cashbackBps: number; // Cashback earned per 10000 paise spent
  burnRateBps: number; // Paise redeemed per 10000 KingCoins burned (e.g., 10000 = 1:1)
  maxBurnPerOrderPaise: number;
  freeDeliveryAbovePaise: number;
  prioritySupport: boolean;
  exclusiveOffers: boolean;
};

export const LOYALTY_TIERS: LoyaltyTierConfig[] = [
  {
    tier: "SILVER",
    label: "Silver",
    minLifetimeCoinsToQualify: 0,
    cashbackBps: 200, // 2% cashback
    burnRateBps: 10000, // 1 KingCoin = 1 Paisa
    maxBurnPerOrderPaise: 10000, // Max ₹100 burn per order
    freeDeliveryAbovePaise: 49900, // Free delivery above ₹499
    prioritySupport: false,
    exclusiveOffers: false,
  },
  {
    tier: "GOLD",
    label: "Gold",
    minLifetimeCoinsToQualify: 5000, // 5000 KingCoins earned lifetime
    cashbackBps: 500, // 5% cashback
    burnRateBps: 10000, // 1 KingCoin = 1 Paisa
    maxBurnPerOrderPaise: 25000, // Max ₹250 burn per order
    freeDeliveryAbovePaise: 29900, // Free delivery above ₹299
    prioritySupport: true,
    exclusiveOffers: true,
  },
  {
    tier: "KING",
    label: "King",
    minLifetimeCoinsToQualify: 20000, // 20000 KingCoins earned lifetime
    cashbackBps: 1000, // 10% cashback
    burnRateBps: 10000, // 1 KingCoin = 1 Paisa
    maxBurnPerOrderPaise: 50000, // Max ₹500 burn per order
    freeDeliveryAbovePaise: 0, // Always free delivery
    prioritySupport: true,
    exclusiveOffers: true,
  },
];

export function getTierConfig(tier: LoyaltyTier): LoyaltyTierConfig {
  return LOYALTY_TIERS.find((t) => t.tier === tier) ?? LOYALTY_TIERS[0];
}

export function determineTier(lifetimeCoins: number): LoyaltyTier {
  let resolved: LoyaltyTierConfig = LOYALTY_TIERS[0];
  for (const config of LOYALTY_TIERS) {
    if (lifetimeCoins >= config.minLifetimeCoinsToQualify) {
      resolved = config;
    }
  }
  return resolved.tier;
}

export type EarnResult = {
  coinsEarned: number;
  tier: LoyaltyTier;
  cashbackBps: number;
  bonusApplied: string | null;
};

/**
 * Calculate KingCoins earned from an order.
 * Assumes 1 KingCoin = 1 Paisa in value for simplicity.
 */
export function calculateEarn(
  orderTotalPaise: number,
  currentTier: LoyaltyTier,
  options?: { firstOrderBonus?: boolean; birthdayBonus?: boolean; campaignMultiplierBps?: number }
): EarnResult {
  const config = getTierConfig(currentTier);
  let rateBps = config.cashbackBps;
  let bonusApplied: string | null = null;

  if (options?.campaignMultiplierBps && options.campaignMultiplierBps > 0) {
    rateBps = Math.floor((rateBps * options.campaignMultiplierBps) / 10000);
    bonusApplied = "CAMPAIGN_MULTIPLIER";
  }

  if (options?.firstOrderBonus) {
    rateBps *= 3;
    bonusApplied = "FIRST_ORDER_3X";
  }

  if (options?.birthdayBonus && !options?.firstOrderBonus) {
    rateBps *= 2;
    bonusApplied = "BIRTHDAY_2X";
  }

  // Calculate coins. E.g. 10000 paise * 200 bps / 10000 = 200 KingCoins.
  const coinsEarned = Math.floor((orderTotalPaise * rateBps) / 10000);

  return {
    coinsEarned: Math.max(0, coinsEarned),
    tier: currentTier,
    cashbackBps: rateBps,
    bonusApplied,
  };
}

export type BurnResult = {
  coinsBurned: number;
  discountPaise: number;
  remainingCoins: number;
  maxBurnableCoins: number;
  tier: LoyaltyTier;
};

/**
 * Calculate KingCoins burn (redemption) for an order.
 */
export function calculateBurn(
  requestedCoins: number,
  availableCoins: number,
  orderTotalPaise: number,
  currentTier: LoyaltyTier,
  dailyBurnCount: number,
  dailyBurnCap: number
): BurnResult {
  const config = getTierConfig(currentTier);

  if (dailyBurnCount >= dailyBurnCap) {
    return {
      coinsBurned: 0,
      discountPaise: 0,
      remainingCoins: availableCoins,
      maxBurnableCoins: 0,
      tier: currentTier,
    };
  }

  const maxDiscountPaise = config.maxBurnPerOrderPaise;
  const maxDiscountFromOrder = Math.floor(orderTotalPaise * 0.5); // Max 50% of order value
  const effectiveMaxDiscount = Math.min(maxDiscountPaise, maxDiscountFromOrder);

  // How many KingCoins needed for max discount?
  const coinsForMaxDiscount = Math.ceil((effectiveMaxDiscount * 10000) / config.burnRateBps);

  const coinsToBurn = Math.min(requestedCoins, availableCoins, coinsForMaxDiscount);

  // Calculate discount in paise
  const discountPaise = Math.floor((coinsToBurn * config.burnRateBps) / 10000);

  return {
    coinsBurned: coinsToBurn,
    discountPaise: Math.min(discountPaise, effectiveMaxDiscount),
    remainingCoins: availableCoins - coinsToBurn,
    maxBurnableCoins: Math.min(availableCoins, coinsForMaxDiscount),
    tier: currentTier,
  };
}

export function qualifiesForFreeDelivery(orderTotalPaise: number, currentTier: LoyaltyTier): boolean {
  const config = getTierConfig(currentTier);
  return orderTotalPaise >= config.freeDeliveryAbovePaise;
}

export function getTierProgress(
  currentTier: LoyaltyTier,
  lifetimeCoins: number
): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  coinsToNextTier: number;
  progressPercent: number;
} {
  const currentIdx = LOYALTY_TIERS.findIndex((t) => t.tier === currentTier);
  const nextConfig = LOYALTY_TIERS[currentIdx + 1];

  if (!nextConfig) {
    return { currentTier, nextTier: null, coinsToNextTier: 0, progressPercent: 100 };
  }

  const currentThreshold = LOYALTY_TIERS[currentIdx].minLifetimeCoinsToQualify;
  const nextThreshold = nextConfig.minLifetimeCoinsToQualify;
  const range = nextThreshold - currentThreshold;
  const progress = lifetimeCoins - currentThreshold;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((progress / range) * 100)));

  return {
    currentTier,
    nextTier: nextConfig.tier,
    coinsToNextTier: Math.max(0, nextThreshold - lifetimeCoins),
    progressPercent,
  };
}
