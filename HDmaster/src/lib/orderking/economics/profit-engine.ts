/**
 * 👑 UMAR OS / ORDERKING - MATHEMATICAL ECONOMICS & PROFIT OPTIMIZATION ENGINE
 * 
 * Location: src/lib/orderking/economics/profit-engine.ts
 * 
 * Core Marketplace Economic Formulas:
 * 1. Order Contribution Margin:
 *    Net Platform Profit = Gross Order Value - Food Cost to Restaurant - Rider Payout - Payment Gateway Fee Paise - Platform Tax
 * 
 * 2. Demand/Supply Elasticity Surge Pricing Algorithm:
 *    Pure deterministic mathematical function evaluating active orders (demand) vs available riders (supply) in a zone.
 * 
 * 3. Co-funded Discount Allocation:
 *    Platform % vs Merchant % promotional subsidy allocation with zero paise leakage and statutory cap enforcement.
 */

// ============================================================================
// CONSTANTS & STATUTORY DEFAULTS
// ============================================================================

export const ECONOMIC_CONSTANTS = {
  /** 1.80% Standard Payment Gateway processing fee */
  DEFAULT_PG_FEE_BPS: 180,
  /** 18.00% GST on Payment Gateway processing fees */
  DEFAULT_PG_GST_BPS: 1800,
  /** 18.00% GST on Platform Service Fees & Commissions (SAC 9985) */
  DEFAULT_COMMISSION_GST_BPS: 1800,
  /** 5.00% GST on Restaurant Food Orders under Section 9(5) CGST Act */
  DEFAULT_FOOD_GST_BPS: 500,
  /** ₹30.00 Base Delivery Fee (3,000 paise) */
  DEFAULT_BASE_DELIVERY_FEE_PAISE: 3000,
  /** 80% of dynamic surge fee is passed through to the delivery partner */
  DEFAULT_RIDER_SURGE_SHARE_PERCENT: 80,
  /** Minimum surge multiplier floor during extreme oversupply */
  DEFAULT_MIN_SURGE_MULTIPLIER: 0.8,
  /** Maximum statutory/system surge ceiling */
  DEFAULT_MAX_SURGE_MULTIPLIER: 3.5,
  /** Ideal demand-to-supply equilibrium ratio (1.0 order per available rider) */
  DEFAULT_EQUILIBRIUM_RATIO: 1.0,
  /** Elasticity sensitivity coefficient (\kappa) */
  DEFAULT_ELASTICITY_COEFFICIENT: 0.5,
  /** Curvature exponent for nonlinear scarcity elasticity */
  DEFAULT_ELASTICITY_EXPONENT: 0.85,
} as const;

// ============================================================================
// 1. ORDER CONTRIBUTION MARGIN (NET PLATFORM PROFIT)
// ============================================================================

export interface OrderContributionMarginInput {
  /** Gross Order Value (GOV): Total bill paid by the consumer in paise */
  grossOrderValuePaise: number;
  /** Food Cost to Restaurant: Net payout remitted to merchant for food items in paise */
  foodCostToRestaurantPaise: number;
  /** Rider Payout: Total delivery fee + surge incentives remitted to delivery partner in paise */
  riderPayoutPaise: number;
  /** Payment Gateway Fee: Transaction processing fee in paise */
  paymentGatewayFeePaise: number;
  /** Platform Tax: Platform's statutory tax liability (e.g. 18% GST on platform commissions/fees) in paise */
  platformTaxPaise: number;
  /** Optional metadata identifier */
  orderId?: string;
}

export type ProfitabilityTier = 
  | 'HIGH_MARGIN'     // >= 15% contribution margin
  | 'HEALTHY'         // 8% to <15% contribution margin
  | 'LOW_MARGIN'      // 0% to <8% contribution margin
  | 'BREAK_EVEN'      // Exactly 0 paise
  | 'LOSS_MAKING';    // < 0 paise (subsidized / negative contribution)

export interface OrderContributionMarginResult {
  orderId?: string;
  grossOrderValuePaise: number;
  foodCostToRestaurantPaise: number;
  riderPayoutPaise: number;
  paymentGatewayFeePaise: number;
  platformTaxPaise: number;
  /** Total external deductions: Food Cost + Rider Payout + PG Fee + Platform Tax */
  totalDeductionsPaise: number;
  /** Net Platform Profit = Gross Order Value - Food Cost - Rider Payout - PG Fee - Platform Tax */
  netPlatformProfitPaise: number;
  /** Contribution margin as a percentage of Gross Order Value */
  contributionMarginPercentage: number;
  /** Whether the order is net positive for the platform */
  isContributionPositive: boolean;
  profitabilityTier: ProfitabilityTier;
}

/**
 * Evaluates the Core Marketplace Order Contribution Margin.
 * Formula:
 * Net Platform Profit = Gross Order Value - Food Cost to Restaurant - Rider Payout - Payment Gateway Fee Paise - Platform Tax
 */
export function calculateOrderContributionMargin(
  input: OrderContributionMarginInput
): OrderContributionMarginResult {
  const {
    grossOrderValuePaise,
    foodCostToRestaurantPaise,
    riderPayoutPaise,
    paymentGatewayFeePaise,
    platformTaxPaise,
    orderId,
  } = input;

  if (grossOrderValuePaise < 0) {
    throw new Error(`Gross Order Value cannot be negative: ${grossOrderValuePaise} paise`);
  }
  if (foodCostToRestaurantPaise < 0) {
    throw new Error(`Food Cost to Restaurant cannot be negative: ${foodCostToRestaurantPaise} paise`);
  }
  if (riderPayoutPaise < 0) {
    throw new Error(`Rider Payout cannot be negative: ${riderPayoutPaise} paise`);
  }
  if (paymentGatewayFeePaise < 0) {
    throw new Error(`Payment Gateway Fee cannot be negative: ${paymentGatewayFeePaise} paise`);
  }
  if (platformTaxPaise < 0) {
    throw new Error(`Platform Tax cannot be negative: ${platformTaxPaise} paise`);
  }

  const totalDeductionsPaise = 
    foodCostToRestaurantPaise + 
    riderPayoutPaise + 
    paymentGatewayFeePaise + 
    platformTaxPaise;

  const netPlatformProfitPaise = grossOrderValuePaise - totalDeductionsPaise;

  const contributionMarginPercentage = grossOrderValuePaise > 0
    ? parseFloat(((netPlatformProfitPaise / grossOrderValuePaise) * 100).toFixed(2))
    : 0;

  let profitabilityTier: ProfitabilityTier;
  if (netPlatformProfitPaise > 0) {
    if (contributionMarginPercentage >= 15.0) {
      profitabilityTier = 'HIGH_MARGIN';
    } else if (contributionMarginPercentage >= 8.0) {
      profitabilityTier = 'HEALTHY';
    } else {
      profitabilityTier = 'LOW_MARGIN';
    }
  } else if (netPlatformProfitPaise === 0) {
    profitabilityTier = 'BREAK_EVEN';
  } else {
    profitabilityTier = 'LOSS_MAKING';
  }

  return {
    orderId,
    grossOrderValuePaise,
    foodCostToRestaurantPaise,
    riderPayoutPaise,
    paymentGatewayFeePaise,
    platformTaxPaise,
    totalDeductionsPaise,
    netPlatformProfitPaise,
    contributionMarginPercentage,
    isContributionPositive: netPlatformProfitPaise > 0,
    profitabilityTier,
  };
}

// ============================================================================
// 2. DEMAND / SUPPLY ELASTICITY SURGE PRICING ALGORITHM
// ============================================================================

export interface SurgePricingInput {
  /** Active orders awaiting fulfillment / preparing in zone (Demand) */
  activeOrders: number;
  /** Available idle/active delivery riders in zone (Supply) */
  availableRiders: number;
  /** Base delivery fee in paise (default: 3000 paise / ₹30) */
  baseDeliveryFeePaise?: number;
  /** Elasticity sensitivity factor kappa (default: 0.5) */
  elasticityCoefficient?: number;
  /** Minimum surge multiplier floor (default: 0.8) */
  minMultiplier?: number;
  /** Maximum surge multiplier ceiling (default: 3.5) */
  maxMultiplier?: number;
  /** Target demand/supply equilibrium ratio (default: 1.0) */
  targetEquilibriumRatio?: number;
  /** Percentage of surge revenue remitted to rider (default: 80%) */
  riderSurgeSharePercent?: number;
  /** External weather/environmental demand shock multiplier (e.g. 1.25 for torrential rain) */
  weatherMultiplier?: number;
  /** Temporal peak hour multiplier (e.g. 1.2 for lunch/dinner rush) */
  timeOfDayPeakMultiplier?: number;
}

export type ZoneScarcityStatus =
  | 'CRITICAL_SCARCITY'  // Extreme rider shortage (Demand/Supply > 3.0 or 0 riders)
  | 'HIGH_SURGE'          // High demand (Demand/Supply > 2.0)
  | 'MODERATE_SURGE'      // Moderate surge (Demand/Supply > 1.2)
  | 'EQUILIBRIUM'         // Balanced zone (0.8 <= Demand/Supply <= 1.2)
  | 'OVERSUPPLY';         // High idle fleet (Demand/Supply < 0.8)

export interface SurgePricingResult {
  activeOrders: number;
  availableRiders: number;
  demandSupplyRatio: number;
  zoneStatus: ZoneScarcityStatus;
  surgeMultiplier: number;
  baseDeliveryFeePaise: number;
  surgeAmountPaise: number;
  effectiveDeliveryFeePaise: number;
  riderSurgePayoutPaise: number;
  platformSurgeRetainedPaise: number;
}

/**
 * Pure Mathematical Demand/Supply Elasticity Surge Pricing Algorithm.
 * 
 * Evaluates active orders (demand) vs available riders (supply) in a zone
 * without network or database I/O, guaranteeing sub-millisecond execution.
 * 
 * Elasticity Dynamics:
 * - R = activeOrders / availableRiders
 * - When availableRiders === 0 && activeOrders > 0 => Cap at maxMultiplier (Critical Scarcity).
 * - When activeOrders === 0 => Min floor / no surge.
 * - When R <= targetEquilibriumRatio:
 *     Gradual oversupply discount or baseline 1.0x.
 * - When R > targetEquilibriumRatio:
 *     Surge = 1.0 + kappa * ((R - R0) / R0)^gamma * weatherFactor * peakFactor
 *     Bounded strictly within [minMultiplier, maxMultiplier].
 */
export function calculateElasticitySurge(input: SurgePricingInput): SurgePricingResult {
  const {
    activeOrders,
    availableRiders,
    baseDeliveryFeePaise = ECONOMIC_CONSTANTS.DEFAULT_BASE_DELIVERY_FEE_PAISE,
    elasticityCoefficient = ECONOMIC_CONSTANTS.DEFAULT_ELASTICITY_COEFFICIENT,
    minMultiplier = ECONOMIC_CONSTANTS.DEFAULT_MIN_SURGE_MULTIPLIER,
    maxMultiplier = ECONOMIC_CONSTANTS.DEFAULT_MAX_SURGE_MULTIPLIER,
    targetEquilibriumRatio = ECONOMIC_CONSTANTS.DEFAULT_EQUILIBRIUM_RATIO,
    riderSurgeSharePercent = ECONOMIC_CONSTANTS.DEFAULT_RIDER_SURGE_SHARE_PERCENT,
    weatherMultiplier = 1.0,
    timeOfDayPeakMultiplier = 1.0,
  } = input;

  if (activeOrders < 0) {
    throw new Error(`Active orders cannot be negative: ${activeOrders}`);
  }
  if (availableRiders < 0) {
    throw new Error(`Available riders cannot be negative: ${availableRiders}`);
  }
  if (baseDeliveryFeePaise < 0) {
    throw new Error(`Base delivery fee cannot be negative: ${baseDeliveryFeePaise} paise`);
  }
  if (minMultiplier > maxMultiplier) {
    throw new Error(`minMultiplier (${minMultiplier}) cannot exceed maxMultiplier (${maxMultiplier})`);
  }

  // Edge case 1: Zero orders
  if (activeOrders === 0) {
    const rawMultiplier = availableRiders > 0 ? minMultiplier : 1.0;
    const finalMultiplier = parseFloat(Math.min(maxMultiplier, Math.max(minMultiplier, rawMultiplier)).toFixed(2));
    const effectiveDeliveryFeePaise = Math.round(baseDeliveryFeePaise * finalMultiplier);
    const surgeAmountPaise = Math.max(0, effectiveDeliveryFeePaise - baseDeliveryFeePaise);

    return {
      activeOrders: 0,
      availableRiders,
      demandSupplyRatio: 0,
      zoneStatus: availableRiders > 0 ? 'OVERSUPPLY' : 'EQUILIBRIUM',
      surgeMultiplier: finalMultiplier,
      baseDeliveryFeePaise,
      surgeAmountPaise,
      effectiveDeliveryFeePaise,
      riderSurgePayoutPaise: 0,
      platformSurgeRetainedPaise: 0,
    };
  }

  // Edge case 2: Zero riders with pending orders -> Critical Scarcity
  if (availableRiders === 0) {
    const finalMultiplier = maxMultiplier;
    const effectiveDeliveryFeePaise = Math.round(baseDeliveryFeePaise * finalMultiplier);
    const surgeAmountPaise = Math.max(0, effectiveDeliveryFeePaise - baseDeliveryFeePaise);
    const riderSurgePayoutPaise = Math.round(surgeAmountPaise * (riderSurgeSharePercent / 100));
    const platformSurgeRetainedPaise = surgeAmountPaise - riderSurgePayoutPaise;

    return {
      activeOrders,
      availableRiders: 0,
      demandSupplyRatio: Infinity,
      zoneStatus: 'CRITICAL_SCARCITY',
      surgeMultiplier: finalMultiplier,
      baseDeliveryFeePaise,
      surgeAmountPaise,
      effectiveDeliveryFeePaise,
      riderSurgePayoutPaise,
      platformSurgeRetainedPaise,
    };
  }

  // Standard case: Both activeOrders and availableRiders > 0
  const demandSupplyRatio = parseFloat((activeOrders / availableRiders).toFixed(3));
  let zoneStatus: ZoneScarcityStatus;

  if (demandSupplyRatio > 3.0) {
    zoneStatus = 'CRITICAL_SCARCITY';
  } else if (demandSupplyRatio > 2.0) {
    zoneStatus = 'HIGH_SURGE';
  } else if (demandSupplyRatio > 1.2) {
    zoneStatus = 'MODERATE_SURGE';
  } else if (demandSupplyRatio < 0.8) {
    zoneStatus = 'OVERSUPPLY';
  } else {
    zoneStatus = 'EQUILIBRIUM';
  }

  let calculatedMultiplier = 1.0;

  if (demandSupplyRatio > targetEquilibriumRatio) {
    // Excess demand elasticity formula:
    // deltaR = (ratio - target) / target
    const deltaRatio = (demandSupplyRatio - targetEquilibriumRatio) / targetEquilibriumRatio;
    const elasticityComponent = elasticityCoefficient * Math.pow(deltaRatio, ECONOMIC_CONSTANTS.DEFAULT_ELASTICITY_EXPONENT);
    calculatedMultiplier = 1.0 + elasticityComponent;
  } else if (demandSupplyRatio < targetEquilibriumRatio) {
    // Oversupply discount stimulation:
    // Mild reduction to incentivize demand without predatory price drops
    const slack = (targetEquilibriumRatio - demandSupplyRatio) / targetEquilibriumRatio;
    calculatedMultiplier = 1.0 - (0.2 * slack); // up to 20% discount at zero demand
  }

  // Apply environmental and temporal shock factors
  calculatedMultiplier = calculatedMultiplier * weatherMultiplier * timeOfDayPeakMultiplier;

  // Clamp within bounds
  const clampedMultiplier = Math.min(maxMultiplier, Math.max(minMultiplier, calculatedMultiplier));
  const surgeMultiplier = parseFloat(clampedMultiplier.toFixed(2));

  const effectiveDeliveryFeePaise = Math.round(baseDeliveryFeePaise * surgeMultiplier);
  const surgeAmountPaise = Math.max(0, effectiveDeliveryFeePaise - baseDeliveryFeePaise);
  const riderSurgePayoutPaise = Math.round(surgeAmountPaise * (riderSurgeSharePercent / 100));
  const platformSurgeRetainedPaise = surgeAmountPaise - riderSurgePayoutPaise;

  return {
    activeOrders,
    availableRiders,
    demandSupplyRatio,
    zoneStatus,
    surgeMultiplier,
    baseDeliveryFeePaise,
    surgeAmountPaise,
    effectiveDeliveryFeePaise,
    riderSurgePayoutPaise,
    platformSurgeRetainedPaise,
  };
}

// ============================================================================
// 3. CO-FUNDED DISCOUNT ALLOCATION (PLATFORM % VS MERCHANT %)
// ============================================================================

export interface CoFundedDiscountInput {
  /** Total discount amount applied to the order in paise */
  totalDiscountPaise: number;
  /** Platform's agreed funding share percentage (0 to 100) */
  platformSharePercent: number;
  /** Merchant's agreed funding share percentage (0 to 100) */
  merchantSharePercent: number;
  /** Optional maximum cap on platform subsidy in paise */
  maxPlatformSubsidyCapPaise?: number;
  /** Optional maximum cap on merchant subsidy in paise */
  maxMerchantSubsidyCapPaise?: number;
  /** Coupon / campaign code */
  campaignCode?: string;
}

export interface CoFundedDiscountResult {
  campaignCode?: string;
  totalDiscountPaise: number;
  platformSharePercent: number;
  merchantSharePercent: number;
  /** Platform's funded discount absorption in paise */
  platformDiscountPaise: number;
  /** Merchant's funded discount absorption in paise */
  merchantDiscountPaise: number;
  /** Effective percentage borne by platform after caps */
  effectivePlatformSharePercent: number;
  /** Effective percentage borne by merchant after caps */
  effectiveMerchantSharePercent: number;
  /** Whether platform subsidy cap was triggered */
  isPlatformCapTriggered: boolean;
  /** Whether merchant subsidy cap was triggered */
  isMerchantCapTriggered: boolean;
  /** Invariant verification: platformDiscountPaise + merchantDiscountPaise === totalDiscountPaise */
  isZeroPaiseLeakageVerified: boolean;
}

/**
 * Allocates promotional discount between the Platform and Merchant.
 * 
 * Invariants:
 * 1. platformSharePercent + merchantSharePercent must strictly equal 100% (within floating point precision).
 * 2. platformDiscountPaise + merchantDiscountPaise strictly equals totalDiscountPaise (exact integer paise preservation).
 * 3. Caps: If either party's subsidy exceeds their agreed statutory cap, the counterparty absorbs the delta.
 */
export function allocateCoFundedDiscount(input: CoFundedDiscountInput): CoFundedDiscountResult {
  const {
    totalDiscountPaise,
    platformSharePercent,
    merchantSharePercent,
    maxPlatformSubsidyCapPaise,
    maxMerchantSubsidyCapPaise,
    campaignCode,
  } = input;

  if (totalDiscountPaise < 0) {
    throw new Error(`Total discount cannot be negative: ${totalDiscountPaise} paise`);
  }
  if (platformSharePercent < 0 || platformSharePercent > 100) {
    throw new Error(`Platform share percent must be between 0 and 100: ${platformSharePercent}%`);
  }
  if (merchantSharePercent < 0 || merchantSharePercent > 100) {
    throw new Error(`Merchant share percent must be between 0 and 100: ${merchantSharePercent}%`);
  }

  const shareSum = platformSharePercent + merchantSharePercent;
  if (Math.abs(shareSum - 100) > 0.001) {
    throw new Error(
      `Co-funded discount share must sum to 100%. Provided Platform: ${platformSharePercent}%, Merchant: ${merchantSharePercent}% (Sum: ${shareSum}%)`
    );
  }

  if (totalDiscountPaise === 0) {
    return {
      campaignCode,
      totalDiscountPaise: 0,
      platformSharePercent,
      merchantSharePercent,
      platformDiscountPaise: 0,
      merchantDiscountPaise: 0,
      effectivePlatformSharePercent: platformSharePercent,
      effectiveMerchantSharePercent: merchantSharePercent,
      isPlatformCapTriggered: false,
      isMerchantCapTriggered: false,
      isZeroPaiseLeakageVerified: true,
    };
  }

  // Step 1: Compute uncapped pro-rata distribution
  let uncappedPlatformPaise = Math.round(totalDiscountPaise * (platformSharePercent / 100));
  let uncappedMerchantPaise = totalDiscountPaise - uncappedPlatformPaise; // Guarantees exact sum

  let platformDiscountPaise = uncappedPlatformPaise;
  let merchantDiscountPaise = uncappedMerchantPaise;
  let isPlatformCapTriggered = false;
  let isMerchantCapTriggered = false;

  // Step 2: Check Platform Cap
  if (
    maxPlatformSubsidyCapPaise !== undefined &&
    maxPlatformSubsidyCapPaise >= 0 &&
    platformDiscountPaise > maxPlatformSubsidyCapPaise
  ) {
    platformDiscountPaise = maxPlatformSubsidyCapPaise;
    merchantDiscountPaise = totalDiscountPaise - platformDiscountPaise;
    isPlatformCapTriggered = true;
  }
  // Step 3: Check Merchant Cap (only if platform cap didn't override)
  else if (
    maxMerchantSubsidyCapPaise !== undefined &&
    maxMerchantSubsidyCapPaise >= 0 &&
    merchantDiscountPaise > maxMerchantSubsidyCapPaise
  ) {
    merchantDiscountPaise = maxMerchantSubsidyCapPaise;
    platformDiscountPaise = totalDiscountPaise - merchantDiscountPaise;
    isMerchantCapTriggered = true;
  }

  // Step 4: Strict zero-leakage invariant assertion
  const isZeroPaiseLeakageVerified = (platformDiscountPaise + merchantDiscountPaise) === totalDiscountPaise;
  if (!isZeroPaiseLeakageVerified) {
    throw new Error(
      `Zero-leakage invariant violated: ${platformDiscountPaise} + ${merchantDiscountPaise} !== ${totalDiscountPaise}`
    );
  }

  const effectivePlatformSharePercent = parseFloat(
    ((platformDiscountPaise / totalDiscountPaise) * 100).toFixed(2)
  );
  const effectiveMerchantSharePercent = parseFloat(
    ((merchantDiscountPaise / totalDiscountPaise) * 100).toFixed(2)
  );

  return {
    campaignCode,
    totalDiscountPaise,
    platformSharePercent,
    merchantSharePercent,
    platformDiscountPaise,
    merchantDiscountPaise,
    effectivePlatformSharePercent,
    effectiveMerchantSharePercent,
    isPlatformCapTriggered,
    isMerchantCapTriggered,
    isZeroPaiseLeakageVerified,
  };
}

// ============================================================================
// 4. HOLISTIC MARKETPLACE TRANSACTION PROFIT OPTIMIZER
// ============================================================================

export interface ComprehensiveOrderInput {
  orderId: string;
  restaurantId: string;
  zoneId: string;
  
  /** Food Item Total before discount (paise) */
  itemTotalPaise: number;
  /** Packaging charges retained by merchant (paise) */
  packagingChargePaise?: number;
  /** Base delivery fee in zone (paise) */
  baseDeliveryFeePaise?: number;
  /** Customer platform convenience fee (paise, e.g. 400 = ₹4) */
  customerPlatformFeePaise?: number;

  /** Dynamic Zone Metrics */
  activeOrdersInZone: number;
  availableRidersInZone: number;

  /** Merchant Contract Terms */
  commissionRateBps: number; // e.g. 1800 for 18%
  
  /** Promotional Co-funded Voucher (optional) */
  discountCoupon?: {
    code: string;
    totalDiscountPaise: number;
    platformSharePercent: number;
    merchantSharePercent: number;
    maxPlatformSubsidyCapPaise?: number;
    maxMerchantSubsidyCapPaise?: number;
  };

  /** Payment Gateway Fee Rate Bps (default: 180 for 1.8%) */
  pgFeeBps?: number;
}

export interface ComprehensiveOrderEconomicsResult {
  orderId: string;
  restaurantId: string;
  zoneId: string;

  /** Customer Facing Bill */
  customerBill: {
    itemTotalPaise: number;
    packagingChargePaise: number;
    deliveryFeePaise: number;
    surgeFeePaise: number;
    customerPlatformFeePaise: number;
    totalDiscountPaise: number;
    taxesCollectedPaise: number;
    grossOrderValuePaise: number; // Final amount collected from customer
  };

  /** Surge Engine Telemetry */
  surgeTelemetry: SurgePricingResult;

  /** Co-funded Discount Telemetry */
  discountTelemetry?: CoFundedDiscountResult;

  /** Merchant Payout (Food Cost to Restaurant) */
  merchantSettlement: {
    grossFoodSalesPaise: number;
    merchantDiscountAbsorptionPaise: number;
    netFoodSalesPaise: number;
    packagingChargePaise: number;
    platformCommissionPaise: number;
    commissionGstPaise: number;
    tcsDeductionPaise: number;
    tdsDeductionPaise: number;
    foodCostToRestaurantPaise: number; // Net payable to restaurant
  };

  /** Logistics & Gateway Costs */
  fulfillmentCosts: {
    riderBasePayoutPaise: number;
    riderSurgePayoutPaise: number;
    totalRiderPayoutPaise: number;
    paymentGatewayFeePaise: number;
    platformTaxPaise: number;
  };

  /** Contribution Margin & Profit Optimization */
  contributionMargin: OrderContributionMarginResult;

  /** Strategic optimization recommendations */
  optimizationAction?: string;
}

/**
 * Optimizes an end-to-end marketplace order transaction, synthesizing:
 * 1. Demand/Supply Elasticity Surge Pricing
 * 2. Co-funded Promotional Discount Allocation
 * 3. Statutory Indian Tax Schedules (Sec 9(5) CGST, Sec 52 TCS, Sec 194-O TDS)
 * 4. Order Contribution Margin
 */
export function optimizeMarketplaceOrderEconomics(
  input: ComprehensiveOrderInput
): ComprehensiveOrderEconomicsResult {
  const {
    orderId,
    restaurantId,
    zoneId,
    itemTotalPaise,
    packagingChargePaise = 1500, // ₹15 standard packaging
    baseDeliveryFeePaise = ECONOMIC_CONSTANTS.DEFAULT_BASE_DELIVERY_FEE_PAISE,
    customerPlatformFeePaise = 400, // ₹4 platform fee
    activeOrdersInZone,
    availableRidersInZone,
    commissionRateBps,
    discountCoupon,
    pgFeeBps = ECONOMIC_CONSTANTS.DEFAULT_PG_FEE_BPS,
  } = input;

  // 1. Calculate Dynamic Surge Pricing via Pure Elasticity Function
  const surgeTelemetry = calculateElasticitySurge({
    activeOrders: activeOrdersInZone,
    availableRiders: availableRidersInZone,
    baseDeliveryFeePaise,
  });

  // 2. Allocate Co-funded Discount if applicable
  let discountTelemetry: CoFundedDiscountResult | undefined;
  let totalDiscountPaise = 0;
  let platformDiscountPaise = 0;
  let merchantDiscountPaise = 0;

  if (discountCoupon && discountCoupon.totalDiscountPaise > 0) {
    discountTelemetry = allocateCoFundedDiscount({
      totalDiscountPaise: discountCoupon.totalDiscountPaise,
      platformSharePercent: discountCoupon.platformSharePercent,
      merchantSharePercent: discountCoupon.merchantSharePercent,
      maxPlatformSubsidyCapPaise: discountCoupon.maxPlatformSubsidyCapPaise,
      maxMerchantSubsidyCapPaise: discountCoupon.maxMerchantSubsidyCapPaise,
      campaignCode: discountCoupon.code,
    });
    totalDiscountPaise = discountTelemetry.totalDiscountPaise;
    platformDiscountPaise = discountTelemetry.platformDiscountPaise;
    merchantDiscountPaise = discountTelemetry.merchantDiscountPaise;
  }

  // 3. Customer Bill Computation
  // 5% GST on food orders under Section 9(5) CGST Act
  const discountedFoodPaise = Math.max(0, itemTotalPaise - totalDiscountPaise);
  const foodGstPaise = Math.round((discountedFoodPaise * ECONOMIC_CONSTANTS.DEFAULT_FOOD_GST_BPS) / 10000);
  // 18% GST on customer platform fee
  const platformFeeGstPaise = Math.round((customerPlatformFeePaise * ECONOMIC_CONSTANTS.DEFAULT_COMMISSION_GST_BPS) / 10000);
  const taxesCollectedPaise = foodGstPaise + platformFeeGstPaise;

  const grossOrderValuePaise = 
    itemTotalPaise +
    packagingChargePaise +
    surgeTelemetry.effectiveDeliveryFeePaise +
    customerPlatformFeePaise +
    taxesCollectedPaise -
    totalDiscountPaise;

  // 4. Merchant Settlement (Food Cost to Restaurant)
  // Food sales after merchant discount
  const netFoodSalesPaise = Math.max(0, itemTotalPaise - merchantDiscountPaise);
  // Platform commission on net food sales
  const platformCommissionPaise = Math.round((netFoodSalesPaise * commissionRateBps) / 10000);
  // 18% GST on platform commission
  const commissionGstPaise = Math.round((platformCommissionPaise * ECONOMIC_CONSTANTS.DEFAULT_COMMISSION_GST_BPS) / 10000);
  // 1% TCS under Sec 52
  const tcsDeductionPaise = Math.round((netFoodSalesPaise * 100) / 10000);
  // 1% TDS under Sec 194-O
  const tdsDeductionPaise = Math.round((netFoodSalesPaise * 100) / 10000);

  // Net payable to restaurant (Food Cost to Restaurant)
  const foodCostToRestaurantPaise = 
    netFoodSalesPaise +
    packagingChargePaise -
    platformCommissionPaise -
    commissionGstPaise -
    tcsDeductionPaise -
    tdsDeductionPaise;

  // 5. Rider Payout
  const riderBasePayoutPaise = baseDeliveryFeePaise;
  const riderSurgePayoutPaise = surgeTelemetry.riderSurgePayoutPaise;
  const totalRiderPayoutPaise = riderBasePayoutPaise + riderSurgePayoutPaise;

  // 6. Payment Gateway Fee
  // PG fee on full Gross Order Value collected
  const paymentGatewayFeePaise = Math.round((grossOrderValuePaise * pgFeeBps) / 10000);

  // 7. Platform Tax Liability
  // Platform must remit GST collected from customer (platformFeeGstPaise),
  // Section 9(5) food GST (foodGstPaise), and commission GST liability
  const platformTaxPaise = foodGstPaise + platformFeeGstPaise + commissionGstPaise;

  // 8. Order Contribution Margin
  const contributionMargin = calculateOrderContributionMargin({
    orderId,
    grossOrderValuePaise,
    foodCostToRestaurantPaise,
    riderPayoutPaise: totalRiderPayoutPaise,
    paymentGatewayFeePaise,
    platformTaxPaise,
  });

  // 9. Optimization Recommendations
  let optimizationAction: string | undefined;
  if (contributionMargin.netPlatformProfitPaise < 0) {
    optimizationAction = 'ALERT: Transaction is loss-making. Recommend reducing platform discount subsidy or adjusting surge multiplier.';
  } else if (discountTelemetry?.isPlatformCapTriggered) {
    optimizationAction = 'INFO: Platform subsidy capped successfully to preserve contribution margin.';
  } else if (surgeTelemetry.zoneStatus === 'CRITICAL_SCARCITY') {
    optimizationAction = 'DYNAMIC: Zone in critical scarcity. Max surge multiplier engaged to attract additional delivery supply.';
  }

  return {
    orderId,
    restaurantId,
    zoneId,
    customerBill: {
      itemTotalPaise,
      packagingChargePaise,
      deliveryFeePaise: surgeTelemetry.baseDeliveryFeePaise,
      surgeFeePaise: surgeTelemetry.surgeAmountPaise,
      customerPlatformFeePaise,
      totalDiscountPaise,
      taxesCollectedPaise,
      grossOrderValuePaise,
    },
    surgeTelemetry,
    discountTelemetry,
    merchantSettlement: {
      grossFoodSalesPaise: itemTotalPaise,
      merchantDiscountAbsorptionPaise: merchantDiscountPaise,
      netFoodSalesPaise,
      packagingChargePaise,
      platformCommissionPaise,
      commissionGstPaise,
      tcsDeductionPaise,
      tdsDeductionPaise,
      foodCostToRestaurantPaise,
    },
    fulfillmentCosts: {
      riderBasePayoutPaise,
      riderSurgePayoutPaise,
      totalRiderPayoutPaise,
      paymentGatewayFeePaise,
      platformTaxPaise,
    },
    contributionMargin,
    optimizationAction,
  };
}
