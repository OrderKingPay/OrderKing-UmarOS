/**
 * 👑 UMAR OS / ORDERKING - AUTHENTIC INDIAN RESTAURANT OPERATIONS, ECONOMICS & GROWTH STRATEGY ENGINE
 * 
 * Location: src/lib/orderking/merchants/zomato-merchant-engine.ts
 * 
 * Modeled after real-world Tier-1 restaurant operational economics in India:
 * 1. 3-Tier Commission Structure:
 *    - High Volume / Anchor Brands (McDonald's, Domino's, Haldiram's, Burger King): 16% - 18% (1600 - 1800 bps)
 *    - Standard Standalone Restaurants (Dine-in, Casual dining, Local heroes): 22% - 25% (2200 - 2500 bps)
 *    - Cloud Kitchens / Delivery-Only (Rebel Foods, Faasos, Biryani By Kilo, Ghost Kitchens): 20% - 22% (2000 - 2200 bps)
 *    - Dynamic volume rebates and statutory floor protection (min 8%, max 35%).
 * 
 * 2. Mandatory CGST Section 9(5) 5% Non-ITC Food Tax Compliance:
 *    - Electronic Commerce Operator (ECO / platform) pays 5% GST without ITC on restaurant food orders.
 *    - 18% GST on platform commission fees (SAC 9985) with ITC eligibility for merchant.
 *    - 1% TCS under Section 52 CGST Act (0.5% CGST + 0.5% SGST or 1% IGST).
 *    - 1% TDS under Section 194-O Income Tax Act 1961.
 * 
 * 3. Packaging Fee Policy (CCPA Consumer Protection Enforcement):
 *    - Strictly enforces Central Consumer Protection Authority guidelines.
 *    - Packaging fee capped at ₹35.00 max (3,500 paise) OR 10% of food item price (whichever is lower).
 * 
 * 4. Co-Funded Discount Sharing Mechanics:
 *    - Authentic 60/40 co-funded promotions (e.g., "60% off up to ₹120" with 60% merchant / 40% platform split).
 *    - Mathematical zero-paise leakage guarantee: Merchant Absorption + Platform Absorption === Total Discount.
 * 
 * 5. Restaurant Health & Hygiene Score:
 *    - Exponential time-decay rating algorithm weighting recent reviews significantly over historical reviews.
 *    - Kitchen Preparation Time (KPT) SLA delay penalty.
 *    - Hygiene compliance and FSSAI status weighting.
 * 
 * 6. Full Universal Customization & Self-Tuning:
 *    - Every commission rate, statutory parameter, packaging cap, and discount rule can be overridden manually or self-tuned.
 */

import {
  toPaise,
  fromPaise,
  safeAdd,
  safeSubtract,
  percentOf,
  formatPaise,
} from "../money.ts";

// ============================================================================
// 1. STATUTORY CONSTANTS & 3-TIER COMMISSION MATRIX
// ============================================================================

export type RestaurantCategoryTier =
  | "HIGH_VOLUME_ANCHOR"    // McDonald's, Domino's, Haldiram's, Burger King (16% - 18%)
  | "STANDARD_STANDALONE"   // Dine-in restaurants, casual dining, independent outlets (22% - 25%)
  | "CLOUD_KITCHEN";        // Delivery-only, ghost kitchens, internet restaurants (20% - 22%)

export interface CommissionTierDefinition {
  tier: RestaurantCategoryTier;
  name: string;
  minCommissionBps: number;
  maxCommissionBps: number;
  defaultCommissionBps: number;
  description: string;
  exampleBrands: string[];
}

export const INDIAN_RESTAURANT_COMMISSION_TIERS: Record<RestaurantCategoryTier, CommissionTierDefinition> = {
  HIGH_VOLUME_ANCHOR: {
    tier: "HIGH_VOLUME_ANCHOR",
    name: "High Volume / Anchor Brands",
    minCommissionBps: 1600, // 16.00%
    maxCommissionBps: 1800, // 18.00%
    defaultCommissionBps: 1700, // 17.00%
    description: "High volume enterprise anchors with immense organic consumer pull",
    exampleBrands: ["McDonald's", "Domino's Pizza", "Haldiram's", "Burger King", "KFC", "Subway"],
  },
  STANDARD_STANDALONE: {
    tier: "STANDARD_STANDALONE",
    name: "Standard Standalone Restaurants",
    minCommissionBps: 2200, // 22.00%
    maxCommissionBps: 2500, // 25.00%
    defaultCommissionBps: 2400, // 24.00%
    description: "Brick-and-mortar dine-in and standalone eateries requiring high marketplace discoverability",
    exampleBrands: ["Local Biryani Houses", "Family Dhabas", "Independent Bistros", "Regional Cafes"],
  },
  CLOUD_KITCHEN: {
    tier: "CLOUD_KITCHEN",
    name: "Cloud Kitchens / Delivery-Only",
    minCommissionBps: 2000, // 20.00%
    maxCommissionBps: 2200, // 22.00%
    defaultCommissionBps: 2100, // 21.00%
    description: "Dedicated delivery-only commercial ghost kitchens operating without storefronts",
    exampleBrands: ["Rebel Foods (Faasos/Behrouz)", "Box8", "Biryani By Kilo", "Kitchens@"],
  },
};

export interface VolumeRebateTier {
  minWeeklyOrders: number;
  rebateBps: number; // e.g. 100 bps = 1.00% reduction
  label: string;
}

export const DEFAULT_VOLUME_REBATES: VolumeRebateTier[] = [
  { minWeeklyOrders: 500, rebateBps: 300, label: "Enterprise Volume (>= 500 orders/wk: -3.00%)" },
  { minWeeklyOrders: 300, rebateBps: 200, label: "High Volume (>= 300 orders/wk: -2.00%)" },
  { minWeeklyOrders: 100, rebateBps: 100, label: "Growth Volume (>= 100 orders/wk: -1.00%)" },
  { minWeeklyOrders: 0, rebateBps: 0, label: "Baseline Volume (0-99 orders/wk: 0.00%)" },
];

// ============================================================================
// 2. UNIVERSAL ENGINE CONFIGURATION & DEFAULTS
// ============================================================================

export interface ZomatoMerchantEngineConfig {
  // Commission settings
  tiers: Record<RestaurantCategoryTier, CommissionTierDefinition>;
  statutoryCommissionFloorBps: number; // e.g. 800 (8.00%)
  statutoryCommissionCeilingBps: number; // e.g. 3500 (35.00%)
  volumeRebates: VolumeRebateTier[];

  // Statutory Tax Rates
  foodGstBps: number;             // 500 (5.00% under Section 9(5) CGST Act, non-ITC)
  commissionGstBps: number;       // 1800 (18.00% on platform commission, SAC 9985)
  tcsBps: number;                 // 100 (1.00% under Section 52 CGST Act)
  tdsBps: number;                 // 100 (1.00% under Section 194-O Income Tax Act)
  paymentGatewayFeeBps: number;   // 180 (1.80% standard PG rate)

  // CCPA Packaging Fee Policy
  maxPackagingFeeCapPaise: number; // 3500 (₹35.00 max)
  maxPackagingPercentage: number;  // 10 (10% of food item price)

  // Co-funded Promotions
  defaultDiscountMerchantSharePercent: number; // 60%
  defaultDiscountPlatformSharePercent: number; // 40%

  // Health & Hygiene Score Parameters
  ratingDecayHalfLifeDays: number; // 30 days
  ratingBayesianPriorWeight: number; // 10 reviews
  ratingBayesianPriorMean: number; // 4.0 out of 5.0
  targetKptMinutes: number; // 15.0 minutes
  kptDelayPenaltyPerMinute: number; // 2.5 points per minute over target
  kptDelayRatePenaltyFactor: number; // 0.3 points per % of delayed orders
  maxKptPenaltyPoints: number; // 35 points max deduction
  weights: {
    decayedRatingWeight: number; // 0.45
    kptOperationalWeight: number; // 0.35
    hygieneComplianceWeight: number; // 0.20
  };
}

export const DEFAULT_ZOMATO_MERCHANT_CONFIG: ZomatoMerchantEngineConfig = {
  tiers: { ...INDIAN_RESTAURANT_COMMISSION_TIERS },
  statutoryCommissionFloorBps: 800,  // 8.00%
  statutoryCommissionCeilingBps: 3500, // 35.00%
  volumeRebates: [...DEFAULT_VOLUME_REBATES],

  foodGstBps: 500, // 5% GST under Sec 9(5) CGST Act
  commissionGstBps: 1800, // 18% GST on platform commission
  tcsBps: 100, // 1% TCS under Sec 52
  tdsBps: 100, // 1% TDS under Sec 194-O
  paymentGatewayFeeBps: 180, // 1.80%

  maxPackagingFeeCapPaise: 3500, // ₹35.00 CCPA ceiling
  maxPackagingPercentage: 10,   // 10% CCPA percentage ceiling

  defaultDiscountMerchantSharePercent: 60, // 60% Merchant
  defaultDiscountPlatformSharePercent: 40, // 40% Platform

  ratingDecayHalfLifeDays: 30,
  ratingBayesianPriorWeight: 10,
  ratingBayesianPriorMean: 4.0,
  targetKptMinutes: 15.0,
  kptDelayPenaltyPerMinute: 2.5,
  kptDelayRatePenaltyFactor: 0.3,
  maxKptPenaltyPoints: 35,
  weights: {
    decayedRatingWeight: 0.45,
    kptOperationalWeight: 0.35,
    hygieneComplianceWeight: 0.20,
  },
};

// ============================================================================
// 3. PACKAGING FEE POLICY ENGINE (CCPA CONSUMER PROTECTION)
// ============================================================================

export interface PackagingFeeInput {
  foodItemPricePaise: number;
  requestedPackagingFeePaise: number;
  itemCount?: number;
  customMaxCapPaise?: number;
  customMaxPercent?: number;
}

export type PackagingCapRule = 
  | "COMPLIANT_NO_CAP" 
  | "ITEM_PERCENTAGE_CAP" 
  | "ABSOLUTE_CEILING_CAP";

export interface PackagingFeeResult {
  isCompliant: boolean;
  requestedPackagingFeePaise: number;
  approvedPackagingFeePaise: number;
  excessPackagingFeePaise: number;
  percentageCapPaise: number;
  absoluteCapPaise: number;
  appliedRule: PackagingCapRule;
  rationale: string;
}

/**
 * Enforces Central Consumer Protection Authority (CCPA) packaging fee guidelines:
 * - Packaging fee is capped at ₹35.00 max (3,500 paise) OR 10% of food item price (whichever is lower).
 * - Eliminates predatory packaging fee markups while compensating merchants for legitimate food containers.
 */
export function evaluatePackagingFeePolicy(
  input: PackagingFeeInput,
  config: ZomatoMerchantEngineConfig = DEFAULT_ZOMATO_MERCHANT_CONFIG
): PackagingFeeResult {
  const foodPrice = Math.max(0, input.foodItemPricePaise);
  const requested = Math.max(0, input.requestedPackagingFeePaise);
  const maxCapPaise = input.customMaxCapPaise ?? config.maxPackagingFeeCapPaise;
  const maxPct = input.customMaxPercent ?? config.maxPackagingPercentage;

  // 1. Percentage of food price cap: e.g. 10% of ₹200 = ₹20 (2,000 paise)
  const percentageCapPaise = Math.round((foodPrice * maxPct) / 100);

  // 2. Absolute ceiling cap: ₹35.00 (3,500 paise)
  const absoluteCapPaise = maxCapPaise;

  // 3. The statutory upper limit is the lower of the two caps
  const effectiveMaxAllowedPaise = Math.min(percentageCapPaise, absoluteCapPaise);

  if (requested <= effectiveMaxAllowedPaise) {
    return {
      isCompliant: true,
      requestedPackagingFeePaise: requested,
      approvedPackagingFeePaise: requested,
      excessPackagingFeePaise: 0,
      percentageCapPaise,
      absoluteCapPaise,
      appliedRule: "COMPLIANT_NO_CAP",
      rationale: `Requested packaging fee ₹${fromPaise(requested).toFixed(2)} is within CCPA guidelines (max ₹${fromPaise(effectiveMaxAllowedPaise).toFixed(2)}).`,
    };
  }

  // Cap exceeded
  const approvedPackagingFeePaise = effectiveMaxAllowedPaise;
  const excessPackagingFeePaise = requested - approvedPackagingFeePaise;
  const appliedRule: PackagingCapRule = 
    percentageCapPaise < absoluteCapPaise ? "ITEM_PERCENTAGE_CAP" : "ABSOLUTE_CEILING_CAP";

  const rationale = appliedRule === "ITEM_PERCENTAGE_CAP"
    ? `Packaging fee reduced from ₹${fromPaise(requested).toFixed(2)} to ₹${fromPaise(approvedPackagingFeePaise).toFixed(2)} under CCPA 10% item price cap (10% of ₹${fromPaise(foodPrice).toFixed(2)} = ₹${fromPaise(percentageCapPaise).toFixed(2)}).`
    : `Packaging fee reduced from ₹${fromPaise(requested).toFixed(2)} to ₹${fromPaise(approvedPackagingFeePaise).toFixed(2)} under CCPA statutory ceiling of ₹${fromPaise(absoluteCapPaise).toFixed(2)}.`;

  return {
    isCompliant: false,
    requestedPackagingFeePaise: requested,
    approvedPackagingFeePaise,
    excessPackagingFeePaise,
    percentageCapPaise,
    absoluteCapPaise,
    appliedRule,
    rationale,
  };
}

// ============================================================================
// 4. AUTHENTIC CO-FUNDED DISCOUNT SHARING MECHANICS (60/40)
// ============================================================================

export interface CoFundedPromotionInput {
  orderSubtotalPaise: number;
  campaignCode: string; // e.g. "TRYNEW", "KING60", "WELCOME60"
  discountPercentage: number; // e.g. 60 for 60%
  maxDiscountCapPaise: number; // e.g. 12000 for ₹120.00
  minOrderValuePaise?: number; // e.g. 19900 for ₹199.00
  merchantSharePercent?: number; // default 60%
  platformSharePercent?: number; // default 40%
  maxMerchantSubsidyCapPaise?: number; // optional statutory cap on merchant
  maxPlatformSubsidyCapPaise?: number; // optional platform budget cap
}

export interface CoFundedPromotionResult {
  campaignCode: string;
  orderSubtotalPaise: number;
  qualifiesForPromotion: boolean;
  minOrderValuePaise: number;
  nominalDiscountPaise: number;
  appliedDiscountPaise: number;
  isDiscountCapped: boolean;

  // Split mechanics
  agreedMerchantSharePercent: number;
  agreedPlatformSharePercent: number;
  merchantDiscountPaise: number;
  platformDiscountPaise: number;
  effectiveMerchantSharePercent: number;
  effectivePlatformSharePercent: number;

  isMerchantCapTriggered: boolean;
  isPlatformCapTriggered: boolean;
  isZeroPaiseLeakageVerified: boolean;
  disqualificationReason?: string;
}

/**
 * Calculates authentic Indian aggregator co-funded promotional discount sharing.
 * Formula:
 * - Applied Discount = min(orderSubtotal * discount%, maxDiscountCap)
 * - Merchant Absorption = Applied Discount * merchantShare% (default 60%)
 * - Platform Absorption = Applied Discount - Merchant Absorption (default 40%)
 * - Strict Invariant: merchantDiscountPaise + platformDiscountPaise === appliedDiscountPaise.
 */
export function calculateCoFundedPromotion(
  input: CoFundedPromotionInput,
  config: ZomatoMerchantEngineConfig = DEFAULT_ZOMATO_MERCHANT_CONFIG
): CoFundedPromotionResult {
  const {
    orderSubtotalPaise,
    campaignCode,
    discountPercentage,
    maxDiscountCapPaise,
    minOrderValuePaise = 0,
    merchantSharePercent = config.defaultDiscountMerchantSharePercent,
    platformSharePercent = config.defaultDiscountPlatformSharePercent,
    maxMerchantSubsidyCapPaise,
    maxPlatformSubsidyCapPaise,
  } = input;

  if (orderSubtotalPaise < 0) {
    throw new Error(`Order subtotal cannot be negative: ${orderSubtotalPaise} paise`);
  }
  if (discountPercentage < 0 || discountPercentage > 100) {
    throw new Error(`Discount percentage must be between 0 and 100: ${discountPercentage}%`);
  }
  if (maxDiscountCapPaise < 0) {
    throw new Error(`Max discount cap cannot be negative: ${maxDiscountCapPaise} paise`);
  }

  const shareSum = merchantSharePercent + platformSharePercent;
  if (Math.abs(shareSum - 100) > 0.001) {
    throw new Error(
      `Co-funded discount share must sum to 100%. Provided Merchant: ${merchantSharePercent}%, Platform: ${platformSharePercent}% (Sum: ${shareSum}%)`
    );
  }

  // Check Minimum Order Value (MOV)
  if (orderSubtotalPaise < minOrderValuePaise) {
    return {
      campaignCode,
      orderSubtotalPaise,
      qualifiesForPromotion: false,
      minOrderValuePaise,
      nominalDiscountPaise: 0,
      appliedDiscountPaise: 0,
      isDiscountCapped: false,
      agreedMerchantSharePercent: merchantSharePercent,
      agreedPlatformSharePercent: platformSharePercent,
      merchantDiscountPaise: 0,
      platformDiscountPaise: 0,
      effectiveMerchantSharePercent: 0,
      effectivePlatformSharePercent: 0,
      isMerchantCapTriggered: false,
      isPlatformCapTriggered: false,
      isZeroPaiseLeakageVerified: true,
      disqualificationReason: `Order subtotal ₹${fromPaise(orderSubtotalPaise).toFixed(2)} is below minimum order value of ₹${fromPaise(minOrderValuePaise).toFixed(2)}`,
    };
  }

  // Compute nominal discount before cap
  const nominalDiscountPaise = Math.round((orderSubtotalPaise * discountPercentage) / 100);
  const appliedDiscountPaise = Math.min(nominalDiscountPaise, maxDiscountCapPaise);
  const isDiscountCapped = nominalDiscountPaise > maxDiscountCapPaise;

  if (appliedDiscountPaise === 0) {
    return {
      campaignCode,
      orderSubtotalPaise,
      qualifiesForPromotion: true,
      minOrderValuePaise,
      nominalDiscountPaise: 0,
      appliedDiscountPaise: 0,
      isDiscountCapped: false,
      agreedMerchantSharePercent: merchantSharePercent,
      agreedPlatformSharePercent: platformSharePercent,
      merchantDiscountPaise: 0,
      platformDiscountPaise: 0,
      effectiveMerchantSharePercent: merchantSharePercent,
      effectivePlatformSharePercent: platformSharePercent,
      isMerchantCapTriggered: false,
      isPlatformCapTriggered: false,
      isZeroPaiseLeakageVerified: true,
    };
  }

  // Base pro-rata allocation
  let merchantDiscountPaise = Math.round(appliedDiscountPaise * (merchantSharePercent / 100));
  let platformDiscountPaise = appliedDiscountPaise - merchantDiscountPaise; // Guarantees exact sum

  let isMerchantCapTriggered = false;
  let isPlatformCapTriggered = false;

  // Handle Merchant Cap if specified
  if (
    maxMerchantSubsidyCapPaise !== undefined &&
    maxMerchantSubsidyCapPaise >= 0 &&
    merchantDiscountPaise > maxMerchantSubsidyCapPaise
  ) {
    merchantDiscountPaise = maxMerchantSubsidyCapPaise;
    platformDiscountPaise = appliedDiscountPaise - merchantDiscountPaise;
    isMerchantCapTriggered = true;
  }
  // Handle Platform Cap if specified
  else if (
    maxPlatformSubsidyCapPaise !== undefined &&
    maxPlatformSubsidyCapPaise >= 0 &&
    platformDiscountPaise > maxPlatformSubsidyCapPaise
  ) {
    platformDiscountPaise = maxPlatformSubsidyCapPaise;
    merchantDiscountPaise = appliedDiscountPaise - platformDiscountPaise;
    isPlatformCapTriggered = true;
  }

  // Zero paise leakage assertion
  const isZeroPaiseLeakageVerified = (merchantDiscountPaise + platformDiscountPaise) === appliedDiscountPaise;
  if (!isZeroPaiseLeakageVerified) {
    throw new Error(
      `Zero paise leakage invariant violated: ${merchantDiscountPaise} + ${platformDiscountPaise} !== ${appliedDiscountPaise}`
    );
  }

  const effectiveMerchantSharePercent = parseFloat(
    ((merchantDiscountPaise / appliedDiscountPaise) * 100).toFixed(2)
  );
  const effectivePlatformSharePercent = parseFloat(
    ((platformDiscountPaise / appliedDiscountPaise) * 100).toFixed(2)
  );

  return {
    campaignCode,
    orderSubtotalPaise,
    qualifiesForPromotion: true,
    minOrderValuePaise,
    nominalDiscountPaise,
    appliedDiscountPaise,
    isDiscountCapped,
    agreedMerchantSharePercent: merchantSharePercent,
    agreedPlatformSharePercent: platformSharePercent,
    merchantDiscountPaise,
    platformDiscountPaise,
    effectiveMerchantSharePercent,
    effectivePlatformSharePercent,
    isMerchantCapTriggered,
    isPlatformCapTriggered,
    isZeroPaiseLeakageVerified,
  };
}

// ============================================================================
// 5. RESTAURANT HEALTH & HYGIENE SCORE (RATING DECAY + KITCHEN PREP DELAY)
// ============================================================================

export interface CustomerRatingRecord {
  rating: number; // 1.0 to 5.0
  ageInDays: number; // 0 = today, 30 = 30 days ago
  reviewWeight?: number; // optional multiplier for verified orders
}

export interface KitchenOpsMetrics {
  actualAvgKptMinutes: number; // actual average kitchen prep time
  promisedKptMinutes?: number; // target or promised KPT (e.g. 15 min)
  delayedOrdersCount: number; // number of orders delayed past SLA threshold
  totalOrdersCount: number; // total orders in evaluation window
  averageDelayMinutesWhenDelayed?: number;
}

export interface HygieneAuditMetrics {
  isFssaiValid: boolean;
  fssaiDaysToExpiry?: number;
  foodQualityIncidentsCount?: number; // foreign body, spoiled food reports
  hygieneAuditScoreOutOf100?: number; // on-site physical inspection score
}

export interface RestaurantHealthScoreInput {
  restaurantId: string;
  ratings: CustomerRatingRecord[];
  kitchenOps: KitchenOpsMetrics;
  hygiene: HygieneAuditMetrics;
  customConfig?: Partial<ZomatoMerchantEngineConfig>;
}

export type RestaurantHealthBadge =
  | "PLATINUM_HYGIENE"   // 90 - 100: Top tier, featured badge, lower platform scrutiny
  | "COMMENDED"          // 80 - 89.9: High quality, standard featured placement
  | "SATISFACTORY"       // 65 - 79.9: Acceptable performance, monitoring active
  | "NEEDS_IMPROVEMENT"  // 50 - 64.9: SLA warnings, merchant coaching required
  | "CRITICAL_RISK";     // < 50: Temporary kitchen throttling or suspension risk

export interface RestaurantHealthScoreResult {
  restaurantId: string;
  compositeScore: number; // 0 to 100
  badge: RestaurantHealthBadge;

  // Rating decay breakdown
  decayedAverageRating: number; // e.g. 4.28 / 5.00
  rawArithmeticAverageRating: number;
  totalRatingsCount: number;
  effectiveRatingsWeightSum: number;
  ratingScoreContribution: number; // out of 100 scaled by weight

  // Kitchen ops breakdown
  targetKptMinutes: number;
  actualAvgKptMinutes: number;
  kptDelayMinutes: number;
  delayRatePercent: number;
  kptPenaltyPoints: number;
  kptScoreOutOf100: number;
  kptScoreContribution: number;

  // Hygiene breakdown
  isFssaiCompliant: boolean;
  hygieneScoreOutOf100: number;
  hygieneScoreContribution: number;

  actionablePrescriptions: string[];
}

/**
 * Calculates Restaurant Health & Hygiene Score using:
 * 1. Exponential rating decay: $w_i = 2^{-\Delta t_i / t_{1/2}}$ (half-life of 30 days).
 * 2. Bayesian prior smoothing: Prevents low-sample volatility.
 * 3. Kitchen Prep Time (KPT) delay penalty: Penalizes merchants exceeding promised prep SLAs.
 * 4. FSSAI & Food Hygiene compliance weighting.
 */
export function calculateRestaurantHealthScore(
  input: RestaurantHealthScoreInput,
  baseConfig: ZomatoMerchantEngineConfig = DEFAULT_ZOMATO_MERCHANT_CONFIG
): RestaurantHealthScoreResult {
  const config = { ...baseConfig, ...input.customConfig };
  const { ratings, kitchenOps, hygiene, restaurantId } = input;

  // --------------------------------------------------------------------------
  // Step 1: Exponential Rating Decay with Bayesian Prior
  // --------------------------------------------------------------------------
  const halfLife = Math.max(1, config.ratingDecayHalfLifeDays);
  const priorWeight = config.ratingBayesianPriorWeight;
  const priorMean = config.ratingBayesianPriorMean;

  let weightedRatingSum = priorWeight * priorMean;
  let totalWeights = priorWeight;
  let rawRatingSum = 0;

  for (const r of ratings) {
    const clampedRating = Math.min(5.0, Math.max(1.0, r.rating));
    const age = Math.max(0, r.ageInDays);
    // Exponential decay: 2^(-age / halfLife)
    const decayFactor = Math.pow(2, -age / halfLife);
    const weight = decayFactor * (r.reviewWeight ?? 1.0);

    weightedRatingSum += clampedRating * weight;
    totalWeights += weight;
    rawRatingSum += clampedRating;
  }

  const decayedAverageRating = parseFloat((weightedRatingSum / totalWeights).toFixed(2));
  const rawArithmeticAverageRating = ratings.length > 0
    ? parseFloat((rawRatingSum / ratings.length).toFixed(2))
    : priorMean;

  // Normalize rating from [1.0, 5.0] to [0.0, 100.0]
  // 1.0 -> 0 points, 5.0 -> 100 points
  const normalizedRatingScore = Math.max(0, Math.min(100, ((decayedAverageRating - 1.0) / 4.0) * 100));

  // --------------------------------------------------------------------------
  // Step 2: Kitchen Preparation Time (KPT) Delay Penalty
  // --------------------------------------------------------------------------
  const targetKpt = kitchenOps.promisedKptMinutes ?? config.targetKptMinutes;
  const actualKpt = Math.max(0, kitchenOps.actualAvgKptMinutes);
  const kptDelayMinutes = Math.max(0, actualKpt - targetKpt);

  const totalOrders = Math.max(1, kitchenOps.totalOrdersCount);
  const delayedOrders = Math.min(totalOrders, Math.max(0, kitchenOps.delayedOrdersCount));
  const delayRatePercent = parseFloat(((delayedOrders / totalOrders) * 100).toFixed(1));

  // Penalty formula: (delay_mins * penalty_per_min) + (delay_rate_% * delay_rate_factor)
  const minutePenalty = kptDelayMinutes * config.kptDelayPenaltyPerMinute;
  const ratePenalty = delayRatePercent * config.kptDelayRatePenaltyFactor;
  const rawKptPenalty = minutePenalty + ratePenalty;
  const kptPenaltyPoints = parseFloat(Math.min(config.maxKptPenaltyPoints, rawKptPenalty).toFixed(1));

  const kptScoreOutOf100 = Math.max(0, parseFloat((100 - kptPenaltyPoints).toFixed(1)));

  // --------------------------------------------------------------------------
  // Step 3: Hygiene & FSSAI Food Safety Compliance
  // --------------------------------------------------------------------------
  let hygieneBase = hygiene.hygieneAuditScoreOutOf100 ?? 95;
  if (!hygiene.isFssaiValid) {
    hygieneBase = Math.min(hygieneBase, 30); // Immediate severe penalty for invalid FSSAI
  } else if (hygiene.fssaiDaysToExpiry !== undefined && hygiene.fssaiDaysToExpiry <= 15) {
    hygieneBase -= 15; // Warning penalty for impending expiry
  }

  const qualityIncidents = hygiene.foodQualityIncidentsCount ?? 0;
  hygieneBase = Math.max(0, hygieneBase - (qualityIncidents * 20)); // -20 points per customer food illness/foreign object report
  const hygieneScoreOutOf100 = Math.min(100, Math.max(0, hygieneBase));

  // --------------------------------------------------------------------------
  // Step 4: Composite Weighted Score
  // --------------------------------------------------------------------------
  const wRating = config.weights.decayedRatingWeight;
  const wKpt = config.weights.kptOperationalWeight;
  const wHygiene = config.weights.hygieneComplianceWeight;

  const ratingContribution = normalizedRatingScore * wRating;
  const kptContribution = kptScoreOutOf100 * wKpt;
  const hygieneContribution = hygieneScoreOutOf100 * wHygiene;

  const compositeScore = parseFloat((ratingContribution + kptContribution + hygieneContribution).toFixed(1));

  // --------------------------------------------------------------------------
  // Step 5: Badge Determination & Operational Prescriptions
  // --------------------------------------------------------------------------
  let badge: RestaurantHealthBadge;
  if (compositeScore >= 90.0) {
    badge = "PLATINUM_HYGIENE";
  } else if (compositeScore >= 80.0) {
    badge = "COMMENDED";
  } else if (compositeScore >= 65.0) {
    badge = "SATISFACTORY";
  } else if (compositeScore >= 50.0) {
    badge = "NEEDS_IMPROVEMENT";
  } else {
    badge = "CRITICAL_RISK";
  }

  const actionablePrescriptions: string[] = [];
  if (kptDelayMinutes > 2.0) {
    actionablePrescriptions.push(
      `Kitchen Prep Time is averaging ${actualKpt.toFixed(1)} mins vs ${targetKpt.toFixed(1)} mins SLA (+${kptDelayMinutes.toFixed(1)} mins delay), incurring a ${kptPenaltyPoints} point operational penalty. Optimize peak hour batch prep.`
    );
  }
  if (delayRatePercent > 20.0) {
    actionablePrescriptions.push(
      `High delay rate of ${delayRatePercent}% orders exceeding SLA. Assign dedicated packaging station during rush hours.`
    );
  }
  if (decayedAverageRating < 4.0) {
    actionablePrescriptions.push(
      `Recent customer ratings decayed average is ${decayedAverageRating.toFixed(2)} / 5.00. Focus on food temperature preservation and garnish freshness.`
    );
  }
  if (!hygiene.isFssaiValid) {
    actionablePrescriptions.push(
      `CRITICAL ALERT: FSSAI registration is invalid or unverified. Order King policy mandates suspension if not rectified within 48 hours.`
    );
  } else if (hygiene.fssaiDaysToExpiry !== undefined && hygiene.fssaiDaysToExpiry <= 30) {
    actionablePrescriptions.push(
      `FSSAI license expires in ${hygiene.fssaiDaysToExpiry} days. Submit renewal application on FoSCoS portal immediately.`
    );
  }
  if (qualityIncidents > 0) {
    actionablePrescriptions.push(
      `${qualityIncidents} customer food quality incident(s) reported. Initiate internal kitchen sanitation audit.`
    );
  }
  if (actionablePrescriptions.length === 0) {
    actionablePrescriptions.push(
      `Exemplary kitchen operations and food quality. Restaurant qualifies for Gourmet Club / Gold Featured banner.`
    );
  }

  return {
    restaurantId,
    compositeScore,
    badge,
    decayedAverageRating,
    rawArithmeticAverageRating,
    totalRatingsCount: ratings.length,
    effectiveRatingsWeightSum: parseFloat(totalWeights.toFixed(2)),
    ratingScoreContribution: parseFloat(ratingContribution.toFixed(2)),
    targetKptMinutes: targetKpt,
    actualAvgKptMinutes: actualKpt,
    kptDelayMinutes,
    delayRatePercent,
    kptPenaltyPoints,
    kptScoreOutOf100,
    kptScoreContribution: parseFloat(kptContribution.toFixed(2)),
    isFssaiCompliant: hygiene.isFssaiValid,
    hygieneScoreOutOf100,
    hygieneScoreContribution: parseFloat(hygieneContribution.toFixed(2)),
    actionablePrescriptions,
  };
}

// ============================================================================
// 6. END-TO-END INDIAN RESTAURANT ORDER SETTLEMENT & ECONOMICS ENGINE
// ============================================================================

export interface ZomatoOrderSettlementInput {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  categoryTier: RestaurantCategoryTier;

  // Food & Packaging Charges
  itemSubtotalPaise: number;
  requestedPackagingFeePaise: number;
  itemCount?: number;

  // Customer Convenience & Delivery (for holistic platform margin)
  customerDeliveryFeePaise?: number;
  customerPlatformFeePaise?: number;
  customerTipPaise?: number;

  // Custom commission rate or auto-derive from category tier + volume
  customCommissionBps?: number;
  weeklyOrdersCount?: number;

  // Co-funded Promotion Voucher
  promotion?: {
    code: string;
    discountPercentage: number;
    maxDiscountCapPaise: number;
    minOrderValuePaise?: number;
    merchantSharePercent?: number;
    platformSharePercent?: number;
  };

  // Statutory Flags
  isInterstate?: boolean; // default false (Intrastate: CGST + SGST)
  packagingRetainedByMerchant?: boolean; // default true
  paymentGatewayFeeBps?: number; // default 180 (1.80%)
  riderPayoutPaise?: number; // actual or estimated rider fee
}

export interface ZomatoOrderSettlementResult {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  categoryTier: RestaurantCategoryTier;

  // Packaging Policy Enforcement
  packagingAudit: PackagingFeeResult;

  // Co-Funded Promotion Breakdown
  promotionBreakdown?: CoFundedPromotionResult;

  // Customer Bill Statement
  customerBill: {
    itemSubtotalPaise: number;
    packagingChargePaise: number;
    customerDeliveryFeePaise: number;
    customerPlatformFeePaise: number;
    customerTipPaise: number;
    totalDiscountPaise: number;
    foodGstSec95Paise: number; // 5% GST on food (collected from customer, paid by OrderKing)
    platformFeeGstPaise: number; // 18% GST on customer platform fee
    grossOrderValuePaise: number; // Total amount paid by customer at checkout
  };

  // Restaurant Settlement (Payout) Statement
  merchantSettlement: {
    grossFoodSalesPaise: number;
    merchantDiscountPaise: number; // Merchant's 60% share of voucher
    netFoodSalesPaise: number;     // grossFoodSales - merchantDiscount
    approvedPackagingPaise: number;
    totalMerchantTaxableSalesPaise: number; // netFoodSales + approvedPackaging

    // Commission
    baseCommissionBps: number;
    volumeRebateBps: number;
    effectiveCommissionBps: number;
    commissionAmountPaise: number;
    commissionGstPaise: number; // 18% GST on platform commission fee (SAC 9985)
    totalCommissionWithGstPaise: number;

    // Statutory Withholdings
    tcsPaise: number; // 1% under Section 52 CGST Act
    tdsPaise: number; // 1% under Section 194-O Income Tax Act
    totalStatutoryWithholdingsPaise: number;

    // Net Remittance
    netPayableToRestaurantPaise: number;
    isSettlementReconciled: boolean;
  };

  // OrderKing Platform Economics & Contribution Margin
  platformEconomics: {
    commissionRevenuePaise: number;
    customerPlatformFeePaise: number;
    platformDiscountAbsorptionPaise: number; // Platform's 40% share of voucher
    netPlatformTakeRevenuePaise: number;    // commission + platform fee - discount absorption
    
    // External Costs
    riderPayoutPaise: number;
    paymentGatewayFeePaise: number;
    sec95FoodGstLiabilityPaise: number;
    commissionGstLiabilityPaise: number;

    netContributionMarginPaise: number;
    contributionMarginPercentage: number;
    isProfitableOrder: boolean;
  };

  statutorySummary: {
    cgstSec95Paise: number;
    sgstSec95Paise: number;
    igstSec95Paise: number;
    itcEligibleCommissionGstPaise: number;
    itcBlockedFoodGstPaise: number;
    gstr3bTable3_1_1_i_taxablePaise: number;
    gstr3bTable3_1_1_i_taxPaise: number;
  };
}

/**
 * Calculates complete Indian restaurant order settlement adhering to Tier-1 industry economics:
 * 1. Enforces CCPA Packaging Cap (₹35 or 10%).
 * 2. Applies 60/40 Co-funded Promotions.
 * 3. Applies 3-Tier Commission (Anchor 16-18%, Standalone 22-25%, Cloud Kitchen 20-22%).
 * 4. Deducts 18% GST on Commission, 1% TCS (Sec 52), and 1% TDS (Sec 194-O).
 * 5. Models 5% CGST Section 9(5) Food Tax (Non-ITC) collected and remitted by OrderKing.
 */
export function calculateZomatoOrderSettlement(
  input: ZomatoOrderSettlementInput,
  config: ZomatoMerchantEngineConfig = DEFAULT_ZOMATO_MERCHANT_CONFIG
): ZomatoOrderSettlementResult {
  const {
    orderId,
    restaurantId,
    restaurantName,
    categoryTier,
    itemSubtotalPaise,
    requestedPackagingFeePaise,
    itemCount = 1,
    customerDeliveryFeePaise = 3000, // ₹30
    customerPlatformFeePaise = 500,  // ₹5
    customerTipPaise = 0,
    weeklyOrdersCount = 0,
    isInterstate = false,
    packagingRetainedByMerchant = true,
    paymentGatewayFeeBps = config.paymentGatewayFeeBps,
    riderPayoutPaise = customerDeliveryFeePaise,
  } = input;

  if (itemSubtotalPaise < 0) {
    throw new Error(`Item subtotal cannot be negative: ${itemSubtotalPaise} paise`);
  }

  // --------------------------------------------------------------------------
  // Step 1: CCPA Packaging Fee Validation
  // --------------------------------------------------------------------------
  const packagingAudit = evaluatePackagingFeePolicy(
    {
      foodItemPricePaise: itemSubtotalPaise,
      requestedPackagingFeePaise,
      itemCount,
    },
    config
  );
  const approvedPackagingPaise = packagingAudit.approvedPackagingFeePaise;

  // --------------------------------------------------------------------------
  // Step 2: Co-funded Discount Promotion (e.g. 60% merchant / 40% platform)
  // --------------------------------------------------------------------------
  let promotionBreakdown: CoFundedPromotionResult | undefined;
  let totalDiscountPaise = 0;
  let merchantDiscountPaise = 0;
  let platformDiscountPaise = 0;

  if (input.promotion) {
    promotionBreakdown = calculateCoFundedPromotion(
      {
        orderSubtotalPaise: itemSubtotalPaise,
        campaignCode: input.promotion.code,
        discountPercentage: input.promotion.discountPercentage,
        maxDiscountCapPaise: input.promotion.maxDiscountCapPaise,
        minOrderValuePaise: input.promotion.minOrderValuePaise,
        merchantSharePercent: input.promotion.merchantSharePercent,
        platformSharePercent: input.promotion.platformSharePercent,
      },
      config
    );

    if (promotionBreakdown.qualifiesForPromotion) {
      totalDiscountPaise = promotionBreakdown.appliedDiscountPaise;
      merchantDiscountPaise = promotionBreakdown.merchantDiscountPaise;
      platformDiscountPaise = promotionBreakdown.platformDiscountPaise;
    }
  }

  // --------------------------------------------------------------------------
  // Step 3: Food Tax under Section 9(5) CGST Act (5% Non-ITC)
  // --------------------------------------------------------------------------
  // Customer discount reduces food taxable base
  const netFoodCustomerPaise = Math.max(0, itemSubtotalPaise - totalDiscountPaise);
  const foodGstSec95Paise = Math.round((netFoodCustomerPaise * config.foodGstBps) / 10000);

  // 18% GST on customer platform fee
  const platformFeeGstPaise = Math.round((customerPlatformFeePaise * config.commissionGstBps) / 10000);

  // Gross Order Value collected from customer at checkout
  const grossOrderValuePaise = 
    itemSubtotalPaise +
    approvedPackagingPaise +
    customerDeliveryFeePaise +
    customerPlatformFeePaise +
    customerTipPaise +
    foodGstSec95Paise +
    platformFeeGstPaise -
    totalDiscountPaise;

  // --------------------------------------------------------------------------
  // Step 4: 3-Tier Commission & Volume Rebates
  // --------------------------------------------------------------------------
  const tierDef = config.tiers[categoryTier] ?? config.tiers.STANDARD_STANDALONE;
  const baseCommissionBps = input.customCommissionBps ?? tierDef.defaultCommissionBps;

  // Determine volume rebate
  let volumeRebateBps = 0;
  for (const vr of config.volumeRebates) {
    if (weeklyOrdersCount >= vr.minWeeklyOrders) {
      volumeRebateBps = vr.rebateBps;
      break;
    }
  }

  // Clamp effective commission rate within statutory bounds
  const effectiveCommissionBps = Math.min(
    config.statutoryCommissionCeilingBps,
    Math.max(config.statutoryCommissionFloorBps, baseCommissionBps - volumeRebateBps)
  );

  // Food sales after merchant-funded discount absorption
  const netFoodSalesPaise = Math.max(0, itemSubtotalPaise - merchantDiscountPaise);
  const totalMerchantTaxableSalesPaise = packagingRetainedByMerchant
    ? netFoodSalesPaise + approvedPackagingPaise
    : netFoodSalesPaise;

  // Platform commission is levied on net taxable food sales
  const commissionAmountPaise = Math.round((netFoodSalesPaise * effectiveCommissionBps) / 10000);

  // 18% GST on platform commission (SAC 9985)
  const commissionGstPaise = Math.round((commissionAmountPaise * config.commissionGstBps) / 10000);
  const totalCommissionWithGstPaise = commissionAmountPaise + commissionGstPaise;

  // 1% TCS under Section 52 CGST Act
  const tcsPaise = Math.round((totalMerchantTaxableSalesPaise * config.tcsBps) / 10000);

  // 1% TDS under Section 194-O Income Tax Act
  const tdsPaise = Math.round((totalMerchantTaxableSalesPaise * config.tdsBps) / 10000);

  const totalStatutoryWithholdingsPaise = tcsPaise + tdsPaise;

  // --------------------------------------------------------------------------
  // Step 5: Net Payout Remittance to Restaurant
  // --------------------------------------------------------------------------
  // Total merchant earnings = Net Food Sales + Approved Packaging Fee
  // Net Remitted = Earnings - Commission - Commission GST - TCS - TDS
  const totalMerchantGrossEarningsPaise = netFoodSalesPaise + approvedPackagingPaise;
  const totalMerchantDeductionsPaise = totalCommissionWithGstPaise + totalStatutoryWithholdingsPaise;

  const netPayableToRestaurantPaise = Math.max(0, totalMerchantGrossEarningsPaise - totalMerchantDeductionsPaise);

  const isSettlementReconciled = 
    (netPayableToRestaurantPaise + totalMerchantDeductionsPaise) === totalMerchantGrossEarningsPaise;

  // --------------------------------------------------------------------------
  // Step 6: Platform Economics & Contribution Margin
  // --------------------------------------------------------------------------
  const commissionRevenuePaise = commissionAmountPaise;
  const netPlatformTakeRevenuePaise = commissionRevenuePaise + customerPlatformFeePaise - platformDiscountPaise;

  // Payment gateway fee on gross collections
  const paymentGatewayFeePaise = Math.round((grossOrderValuePaise * paymentGatewayFeeBps) / 10000);

  // Total Platform Direct Costs for this order:
  // Net Food Remitted + Rider Payout + PG Fee + Platform Outward Tax Liabilities (Food GST + Platform GST)
  const totalOrderOutflowsPaise = 
    netPayableToRestaurantPaise +
    riderPayoutPaise +
    customerTipPaise +
    paymentGatewayFeePaise +
    foodGstSec95Paise +
    platformFeeGstPaise;

  const netContributionMarginPaise = grossOrderValuePaise - totalOrderOutflowsPaise;
  const contributionMarginPercentage = grossOrderValuePaise > 0
    ? parseFloat(((netContributionMarginPaise / grossOrderValuePaise) * 100).toFixed(2))
    : 0;

  // --------------------------------------------------------------------------
  // Step 7: Statutory GST Breakdown (Intrastate vs Interstate)
  // --------------------------------------------------------------------------
  let cgstSec95Paise = 0;
  let sgstSec95Paise = 0;
  let igstSec95Paise = 0;

  if (isInterstate) {
    igstSec95Paise = foodGstSec95Paise;
  } else {
    cgstSec95Paise = Math.floor(foodGstSec95Paise / 2);
    sgstSec95Paise = foodGstSec95Paise - cgstSec95Paise;
  }

  return {
    orderId,
    restaurantId,
    restaurantName,
    categoryTier,
    packagingAudit,
    promotionBreakdown,
    customerBill: {
      itemSubtotalPaise,
      packagingChargePaise: approvedPackagingPaise,
      customerDeliveryFeePaise,
      customerPlatformFeePaise,
      customerTipPaise,
      totalDiscountPaise,
      foodGstSec95Paise,
      platformFeeGstPaise,
      grossOrderValuePaise,
    },
    merchantSettlement: {
      grossFoodSalesPaise: itemSubtotalPaise,
      merchantDiscountPaise,
      netFoodSalesPaise,
      approvedPackagingPaise,
      totalMerchantTaxableSalesPaise,
      baseCommissionBps,
      volumeRebateBps,
      effectiveCommissionBps,
      commissionAmountPaise,
      commissionGstPaise,
      totalCommissionWithGstPaise,
      tcsPaise,
      tdsPaise,
      totalStatutoryWithholdingsPaise,
      netPayableToRestaurantPaise,
      isSettlementReconciled,
    },
    platformEconomics: {
      commissionRevenuePaise,
      customerPlatformFeePaise,
      platformDiscountAbsorptionPaise: platformDiscountPaise,
      netPlatformTakeRevenuePaise,
      riderPayoutPaise,
      paymentGatewayFeePaise,
      sec95FoodGstLiabilityPaise: foodGstSec95Paise,
      commissionGstLiabilityPaise: commissionGstPaise,
      netContributionMarginPaise,
      contributionMarginPercentage,
      isProfitableOrder: netContributionMarginPaise > 0,
    },
    statutorySummary: {
      cgstSec95Paise,
      sgstSec95Paise,
      igstSec95Paise,
      itcEligibleCommissionGstPaise: commissionGstPaise,
      itcBlockedFoodGstPaise: foodGstSec95Paise,
      gstr3bTable3_1_1_i_taxablePaise: netFoodCustomerPaise,
      gstr3bTable3_1_1_i_taxPaise: foodGstSec95Paise,
    },
  };
}

// ============================================================================
// 7. RESTAURANT GROWTH STRATEGY & MENU ENGINEERING
// ============================================================================

export type MenuEngineeringCategory = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

export interface MenuItemEngineeringInput {
  itemId: string;
  itemName: string;
  costPricePaise: number; // raw ingredient/prep cost to restaurant
  sellingPricePaise: number; // menu price
  ordersCount: number; // units sold in period
  restaurantCategoryTier: RestaurantCategoryTier;
  targetProfitMarginPercent?: number; // e.g. 20%
}

export interface MenuItemEngineeringResult {
  itemId: string;
  itemName: string;
  costPricePaise: number;
  sellingPricePaise: number;
  ordersCount: number;
  commissionBps: number;
  commissionPaise: number;
  commissionGstPaise: number;
  sec95FoodGstPaise: number;
  netRevenueToRestaurantPaise: number;
  unitProfitPaise: number;
  profitMarginPercent: number;
  totalGrossProfitPaise: number;
  category: MenuEngineeringCategory;
  strategicAdvice: string;
  recommendedPricePaise: number;
}

/**
 * Menu Engineering Matrix (Stars, Plowhorses, Puzzles, Dogs) tailored to Indian Aggregators:
 * Computes net restaurant profit per dish after taking into account 3-tier commission, 18% GST on commission,
 * and 5% Sec 9(5) GST.
 */
export function analyzeMenuItemEconomics(
  item: MenuItemEngineeringInput,
  benchmarks: { medianOrders: number; medianProfitPaise: number },
  config: ZomatoMerchantEngineConfig = DEFAULT_ZOMATO_MERCHANT_CONFIG
): MenuItemEngineeringResult {
  const tierDef = config.tiers[item.restaurantCategoryTier] ?? config.tiers.STANDARD_STANDALONE;
  const commissionBps = tierDef.defaultCommissionBps;

  // Platform commission
  const commissionPaise = Math.round((item.sellingPricePaise * commissionBps) / 10000);
  // 18% GST on platform commission
  const commissionGstPaise = Math.round((commissionPaise * config.commissionGstBps) / 10000);
  // 5% GST under Sec 9(5) (collected from customer, so doesn't reduce merchant menu price directly, but affects pricing elasticity)
  const sec95FoodGstPaise = Math.round((item.sellingPricePaise * config.foodGstBps) / 10000);

  // Net revenue to restaurant = Selling Price - Commission - Commission GST
  const netRevenueToRestaurantPaise = item.sellingPricePaise - commissionPaise - commissionGstPaise;
  const unitProfitPaise = netRevenueToRestaurantPaise - item.costPricePaise;
  const profitMarginPercent = item.sellingPricePaise > 0
    ? parseFloat(((unitProfitPaise / item.sellingPricePaise) * 100).toFixed(1))
    : 0;

  const totalGrossProfitPaise = unitProfitPaise * item.ordersCount;

  // BCG / Menu Engineering Matrix Classification
  const isHighVolume = item.ordersCount >= benchmarks.medianOrders;
  const isHighProfit = unitProfitPaise >= benchmarks.medianProfitPaise;

  let category: MenuEngineeringCategory;
  let strategicAdvice: string;

  if (isHighVolume && isHighProfit) {
    category = "STAR";
    strategicAdvice = "Star Item: High profit and high volume. Feature prominently in banner carousels, bundle into high-value combos, and maintain strict recipe consistency.";
  } else if (isHighVolume && !isHighProfit) {
    category = "PLOWHORSE";
    strategicAdvice = "Plowhorse Item: Popular customer favorite with low margin. Slightly increase price (₹10-₹20) or re-engineer recipe portions to improve contribution margin.";
  } else if (!isHighVolume && isHighProfit) {
    category = "PUZZLE";
    strategicAdvice = "Puzzle Item: High profit margin but sluggish volume. Run a targeted 60/40 co-funded voucher, enhance appetizing food photography, or feature as 'Chef's Special'.";
  } else {
    category = "DOG";
    strategicAdvice = "Dog Item: Low volume and low margin. Consider removing from menu or reinventing as a combo side to eliminate kitchen inventory waste.";
  }

  // Recommended Price Simulator:
  // Formula for desired profit margin P%:
  // Net Revenue = Price * (1 - Commission*(1 + 0.18))
  // Price = Cost / ( (1 - Commission*(1 + 0.18)) - TargetMargin )
  const targetMargin = (item.targetProfitMarginPercent ?? 20) / 100;
  const commissionFactor = (commissionBps / 10000) * (1 + (config.commissionGstBps / 10000));
  const denominator = (1 - commissionFactor) - targetMargin;
  const recommendedPricePaise = denominator > 0
    ? Math.round(item.costPricePaise / denominator)
    : item.sellingPricePaise;

  return {
    itemId: item.itemId,
    itemName: item.itemName,
    costPricePaise: item.costPricePaise,
    sellingPricePaise: item.sellingPricePaise,
    ordersCount: item.ordersCount,
    commissionBps,
    commissionPaise,
    commissionGstPaise,
    sec95FoodGstPaise,
    netRevenueToRestaurantPaise,
    unitProfitPaise,
    profitMarginPercent,
    totalGrossProfitPaise,
    category,
    strategicAdvice,
    recommendedPricePaise,
  };
}

// ============================================================================
// 8. UNIFIED ZOMATO MERCHANT ENGINE (WITH SELF-TUNING CAPABILITIES)
// ============================================================================

export interface MerchantHistoricalOpsMetrics {
  averageWeeklyOrders: number;
  averageKptMinutes: number;
  fssaiValid: boolean;
  averageRating: number;
}

export interface SelfTuningRecommendation {
  recommendedTier: RestaurantCategoryTier;
  recommendedCommissionBps: number;
  packagingPolicyAdjustment?: {
    recommendedPackagingCapPaise: number;
    reason: string;
  };
  promotionalStrategy: {
    recommendedDiscountPercent: number;
    recommendedMerchantSharePercent: number;
    recommendedPlatformSharePercent: number;
    campaignName: string;
  };
  operationalPrescription: string;
}

/**
 * Supreme Indian Restaurant Operations, Economics & Growth Strategy Engine.
 */
export class ZomatoMerchantEngine {
  private config: ZomatoMerchantEngineConfig;

  constructor(initialConfig?: Partial<ZomatoMerchantEngineConfig>) {
    this.config = {
      ...DEFAULT_ZOMATO_MERCHANT_CONFIG,
      ...initialConfig,
      tiers: {
        ...DEFAULT_ZOMATO_MERCHANT_CONFIG.tiers,
        ...(initialConfig?.tiers ?? {}),
      },
      weights: {
        ...DEFAULT_ZOMATO_MERCHANT_CONFIG.weights,
        ...(initialConfig?.weights ?? {}),
      },
    };
  }

  /**
   * Retrieves active engine configuration.
   */
  public getConfig(): ZomatoMerchantEngineConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration dynamically via UmarOS manual controls or self-tuning.
   */
  public updateConfig(partial: Partial<ZomatoMerchantEngineConfig>): void {
    this.config = {
      ...this.config,
      ...partial,
      tiers: {
        ...this.config.tiers,
        ...(partial.tiers ?? {}),
      },
      weights: {
        ...this.config.weights,
        ...(partial.weights ?? {}),
      },
    };
  }

  /**
   * Resets engine configuration back to factory default.
   */
  public resetConfig(): void {
    this.config = { ...DEFAULT_ZOMATO_MERCHANT_CONFIG };
  }

  /**
   * Evaluates packaging fee under CCPA consumer protection rules.
   */
  public validatePackaging(input: PackagingFeeInput): PackagingFeeResult {
    return evaluatePackagingFeePolicy(input, this.config);
  }

  /**
   * Calculates 60/40 co-funded promotional discount split with zero paise leakage.
   */
  public calculatePromotion(input: CoFundedPromotionInput): CoFundedPromotionResult {
    return calculateCoFundedPromotion(input, this.config);
  }

  /**
   * Computes restaurant operational health score with rating decay and KPT delay penalties.
   */
  public calculateHealthScore(input: RestaurantHealthScoreInput): RestaurantHealthScoreResult {
    return calculateRestaurantHealthScore(input, this.config);
  }

  /**
   * Computes comprehensive order settlement statement matching Tier-1 Indian economics.
   */
  public calculateSettlement(input: ZomatoOrderSettlementInput): ZomatoOrderSettlementResult {
    return calculateZomatoOrderSettlement(input, this.config);
  }

  /**
   * Analyzes menu item profitability and provides menu engineering recommendations.
   */
  public analyzeMenuItem(
    item: MenuItemEngineeringInput,
    benchmarks: { medianOrders: number; medianProfitPaise: number }
  ): MenuItemEngineeringResult {
    return analyzeMenuItemEconomics(item, benchmarks, this.config);
  }

  /**
   * Self-tuning growth strategy optimizer: Recommends optimal commission, promotions, and operations
   * based on restaurant telemetry.
   */
  public selfTune(metrics: MerchantHistoricalOpsMetrics): SelfTuningRecommendation {
    let recommendedTier: RestaurantCategoryTier = "STANDARD_STANDALONE";
    if (metrics.averageWeeklyOrders >= 500) {
      recommendedTier = "HIGH_VOLUME_ANCHOR";
    }

    const tierDef = this.config.tiers[recommendedTier];
    let recommendedCommissionBps = tierDef.defaultCommissionBps;

    // Apply volume rebates
    for (const vr of this.config.volumeRebates) {
      if (metrics.averageWeeklyOrders >= vr.minWeeklyOrders) {
        recommendedCommissionBps = Math.max(
          this.config.statutoryCommissionFloorBps,
          recommendedCommissionBps - vr.rebateBps
        );
        break;
      }
    }

    // Promotional strategy recommendation
    let campaignName = "WELCOME60";
    let discountPct = 60;
    let merchantShare = 60;
    let platformShare = 40;

    if (metrics.averageWeeklyOrders < 100) {
      // Emerging restaurant needs demand boost -> platform subsidizes more (e.g. 50/50)
      campaignName = "BOOST_LAUNCH_50";
      discountPct = 50;
      merchantShare = 50;
      platformShare = 50;
    }

    let operationalPrescription = "Operations are operating at peak efficiency.";
    if (metrics.averageKptMinutes > this.config.targetKptMinutes + 3.0) {
      operationalPrescription = `High KPT delay (${metrics.averageKptMinutes.toFixed(1)}m). Recommend pre-batching gravies and streamlining kitchen prep lines.`;
    }

    return {
      recommendedTier,
      recommendedCommissionBps,
      promotionalStrategy: {
        recommendedDiscountPercent: discountPct,
        recommendedMerchantSharePercent: merchantShare,
        recommendedPlatformSharePercent: platformShare,
        campaignName,
      },
      operationalPrescription,
    };
  }
}

export const zomatoMerchantEngine = new ZomatoMerchantEngine();
