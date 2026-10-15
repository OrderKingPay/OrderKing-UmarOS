import { applyBps } from "./money.ts";

export type FundedBy = "RESTAURANT" | "PLATFORM" | "SHARED" | "CUSTOMER";

export type QuoteLine = {
  code: string;
  name: string;
  amountPaise: number;
  source: "item" | "restaurant" | "platform" | "tax" | "delivery" | "promotion" | "packaging" | "service";
  fundedBy: FundedBy;
  reason: string;
};

export type PricedCartLine = {
  key: string;
  itemId: string;
  variantId: string | null;
  name: string;
  quantity: number;
  unitPaise: number;
  addons: { id: string; name: string; pricePaise: number }[];
  instructions: string;
  available: boolean;
  itemPackagingPaise?: number;
};

export type PromoInput = {
  id: string;
  code: string | null;
  name: string;
  kind: "percent" | "fixed" | "bogo" | "free_delivery";
  percentBps: number | null;
  amountPaise: number | null;
  minOrderPaise: number;
  maxDiscountPaise: number | null;
  fundedBy: Exclude<FundedBy, "CUSTOMER">;
  firstOrderOnly: boolean;
};

export const STANDARD_DELIVERY_COMMISSION_BPS = 2800; // 28.00% Standard marketplace delivery take-rate
export const MIN_DELIVERY_COMMISSION_BPS = 1800; // 18.00% Negotiated high-volume enterprise take-rate
export const MAX_DELIVERY_COMMISSION_BPS = 2800; // 28.00% Maximum delivery take-rate cap
export const DINE_IN_TABLE_QR_COMMISSION_BPS = 0; // 0.00% Sovereign dine-in commission on Table QR orders

export const PAYMENT_GATEWAY_CONFIG = {
  FEE_BPS: 184, // 184 bps = 1.84% Payment Gateway base processing fee
  GST_BPS: 1800, // 1800 bps = 18.00% GST on Payment Gateway processing fee
} as const;

export type OrderFulfillmentType = "DELIVERY" | "DINE_IN" | "TABLE_QR" | "PICKUP";

export type PaymentGatewayBreakdown = {
  taxableBasePaise: number;
  feeBasePaise: number;
  feeGstPaise: number;
  totalFeePaise: number;
  isPassedThrough: boolean;
};

export function calculatePaymentGatewayFee(amountPaise: number): {
  feeBasePaise: number;
  feeGstPaise: number;
  totalFeePaise: number;
} {
  const feeBasePaise = applyBps(amountPaise, PAYMENT_GATEWAY_CONFIG.FEE_BPS);
  const feeGstPaise = applyBps(feeBasePaise, PAYMENT_GATEWAY_CONFIG.GST_BPS);
  return {
    feeBasePaise,
    feeGstPaise,
    totalFeePaise: feeBasePaise + feeGstPaise,
  };
}

export function validateDeliveryTakeRate(bps: number): number {
  if (!Number.isInteger(bps) || bps < MIN_DELIVERY_COMMISSION_BPS || bps > MAX_DELIVERY_COMMISSION_BPS) {
    throw new Error(
      `Delivery take-rate must be an integer between ${MIN_DELIVERY_COMMISSION_BPS} and ${MAX_DELIVERY_COMMISSION_BPS} bps (18% to 28%). Received: ${bps}`
    );
  }
  return bps;
}

export type FeeSchedule = {
  deliveryBasePaise: number;
  deliveryPerKmPaise: number;
  deliveryFreeOverPaise: number | null;
  serviceFeePaise: number;
  serviceFeeBps: number;
  menuPricesIncludeTax: boolean;
  menuTaxBps: number;
  serviceTaxBps: number;
  deliveryTaxBps: number;
  minOrderPaise: number;

  // Payment gateway fee pass-through configuration (184 bps + 18% GST)
  passThroughPaymentGatewayFee?: boolean;
  paymentGatewayFeeBps?: number;
  paymentGatewayTaxBps?: number;

  // Platform fee: Flat ₹6.00 to ₹10.00 (600 to 1000 paise) charged on every order
  platformFeePaise?: number;

  // Small cart fee: +₹25 (2500 paise) if net food bill is under ₹149 (14900 paise)
  smallCartFeePaise?: number;
  smallCartThresholdPaise?: number;

  // Distance delivery slabs (0-3km: base, 3-7km: +₹10/km, >7km: +₹14/km)
  useDistanceSlabs?: boolean;

  // Dynamic surge fees
  rainSurgeActive?: boolean;
  rainSurgePaise?: number; // +₹20 to +₹45 (2000-4500 paise)
  peakSurgeActive?: boolean;
  peakSurgePaise?: number; // +₹15 to +₹30 (1500-3000 paise)
  lateNightSurgeActive?: boolean;
  lateNightSurgePaise?: number; // +₹20 to +₹35 (2000-3500 paise)

  longDistanceMovPaise?: number;
  highwayExpressMovPaise?: number;
  dayModeRadiusKm?: number;
  eveningModeRadiusKm?: number;
  nightModeRadiusKm?: number;
  dayModeStartHour?: number;
  eveningModeStartHour?: number;
  nightModeStartHour?: number;
  nightModeEndHour?: number;
  nightModeActive?: boolean;
  eveningModeActive?: boolean;
  riderAvailable?: boolean;
};

export type ActiveSurge = {
  type: "RAIN" | "PEAK_DEMAND" | "LATE_NIGHT";
  label: string;
  amountPaise: number;
  description: string;
};

export type SurgeBreakdown = {
  rainSurgePaise: number;
  peakSurgePaise: number;
  lateNightSurgePaise: number;
  totalSurgePaise: number;
  activeSurges: ActiveSurge[];
};

export type TaxBreakdown = {
  foodGstPaise: number; // 5% CGST Sec 9(5)
  foodGstRateBps: number;
  foodGstIncludedInMenu: boolean;
  servicesGstPaise: number; // 18% GST on services (platform fee, delivery, small cart)
  servicesGstRateBps: number;
  totalTaxPaise: number;
};

export type QuoteInput = {
  lines: PricedCartLine[];
  packagingPaise: number;
  commissionBps?: number;
  distanceKm: number;
  fees: FeeSchedule;
  promo: PromoInput | null;
  isFirstOrder: boolean;
  orderType?: OrderFulfillmentType;
  passThroughPaymentGatewayFee?: boolean;
};

export type Quote = {
  foodSubtotalPaise: number;
  restaurantDiscountPaise: number;
  platformDiscountPaise: number;
  packagingPaise: number;
  baseDeliveryFeePaise: number;
  surgeFeePaise: number;
  surgeBreakdown: SurgeBreakdown;
  deliveryFeePaise: number;
  serviceFeePaise: number;
  platformFeePaise: number;
  smallCartFeePaise: number;
  taxPaise: number;
  taxBreakdown: TaxBreakdown;
  paymentGatewayFeePaise: number;
  paymentGatewayGstPaise: number;
  totalPaymentGatewayFeePaise: number;
  paymentGatewayBreakdown: PaymentGatewayBreakdown;
  totalPaise: number;
  savingsPaise: number;
  commissionBps: number;
  commissionPaise: number;
  restaurantPayablePaise: number;
  minOrderPaise: number;
  lines: QuoteLine[];
  blockers: string[];
  orderType: OrderFulfillmentType;
};

export type DeliveryTimeWindow = "DAY" | "EVENING" | "NIGHT";

export function getDeliveryTimeWindow(date: Date = new Date()): DeliveryTimeWindow {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  const hour = ist.getHours();
  // 11:00 PM (23) until 04:00 AM (4): NIGHT (3 to 4 km)
  if (hour >= 23 || hour < 4) {
    return "NIGHT";
  }
  // 06:00 PM (18) until 11:00 PM (23): EVENING (7 to 8 km)
  if (hour >= 18 && hour < 23) {
    return "EVENING";
  }
  // 04:00 AM until 06:00 PM (18): DAY (up to 25 km)
  return "DAY";
}

export function isNightModeActive(date: Date = new Date()): boolean {
  return getDeliveryTimeWindow(date) === "NIGHT";
}

export function isEveningModeActive(date: Date = new Date()): boolean {
  return getDeliveryTimeWindow(date) === "EVENING";
}

/**
 * Peak demand hours: Lunch (12:00-15:00) & Dinner (19:00-23:00) IST
 */
export function isPeakDemandHour(date: Date = new Date()): boolean {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  const hour = ist.getHours();
  return (hour >= 12 && hour < 15) || (hour >= 19 && hour < 23);
}

/**
 * Late night surcharge hours: 23:00 to 05:00 IST
 */
export function isLateNightSurchargeHour(date: Date = new Date()): boolean {
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const ist = new Date(utc + (3600000 * 5.5));
  const hour = ist.getHours();
  return hour >= 23 || hour < 5;
}

/**
 * Distance delivery slabs calculation:
 * - Base delivery 0-3km: ₹25 to ₹35 (2500 to 3500 paise)
 * - 3-7km: +₹10/km (1000 paise/km)
 * - >7km: +₹14/km (1400 paise/km)
 */
export function calculateDistanceDeliveryPaise(
  distanceKm: number,
  basePaise: number = 2500
): number {
  const d = Math.max(0, distanceKm);
  const base = Math.max(2500, Math.min(3500, Math.round(basePaise)));
  if (d <= 3.0) {
    return base;
  }
  if (d <= 7.0) {
    return base + Math.round((d - 3.0) * 1000);
  }
  // > 7km
  const tier2 = 4 * 1000; // 4 km between 3km and 7km at ₹10/km = 4000 paise
  const tier3 = Math.round((d - 7.0) * 1400); // Distance beyond 7km at ₹14/km
  return base + tier2 + tier3;
}

function deliveryFeePaise(
  distanceKm: number,
  fees: FeeSchedule,
  foodAfterDiscounts: number
): { baseDeliveryPaise: number } {
  let delivery = 0;
  if (fees.useDistanceSlabs === true) {
    delivery = calculateDistanceDeliveryPaise(distanceKm, fees.deliveryBasePaise);
  } else {
    if (distanceKm <= 5) {
      delivery = fees.deliveryBasePaise + Math.round(distanceKm * fees.deliveryPerKmPaise);
    } else if (distanceKm <= 12) {
      // 5 to 12 km (Suburbs / Nilambazar) - Base ₹50 + ₹6/km
      delivery = Math.max(fees.deliveryBasePaise, 5000) + Math.round(distanceKm * Math.max(fees.deliveryPerKmPaise, 600));
    } else {
      // 12 to 25 km (Highway Express / Outer Perimeter up to 25 km) - Base ₹90 + ₹8/km
      delivery = Math.max(fees.deliveryBasePaise, 9000) + Math.round(distanceKm * Math.max(fees.deliveryPerKmPaise, 800));
    }
  }

  if (fees.deliveryFreeOverPaise != null && foodAfterDiscounts >= fees.deliveryFreeOverPaise) {
    delivery = 0;
  }
  return { baseDeliveryPaise: Math.round(delivery / 100) * 100 };
}

function splitDiscount(amount: number, fundedBy: PromoInput["fundedBy"]): { restaurant: number; platform: number } {
  if (fundedBy === "RESTAURANT") return { restaurant: amount, platform: 0 };
  if (fundedBy === "PLATFORM") return { restaurant: 0, platform: amount };
  const restaurant = Math.floor(amount / 2);
  return { restaurant, platform: amount - restaurant };
}

export function computePromoDiscount(
  foodPaise: number,
  promo: PromoInput | null,
  isFirstOrder: boolean,
  lines?: PricedCartLine[]
): number {
  if (!promo) return 0;
  if (promo.firstOrderOnly && !isFirstOrder) return 0;
  if (foodPaise < promo.minOrderPaise) return 0;
  let disc = 0;
  if (promo.kind === "percent" && promo.percentBps != null) {
    disc = applyBps(foodPaise, promo.percentBps);
  } else if (promo.kind === "fixed" && promo.amountPaise != null) {
    disc = promo.amountPaise;
  } else if (promo.kind === "bogo" && lines && lines.length > 0) {
    for (const line of lines) {
      if (line.quantity >= 2) {
        disc += line.unitPaise * Math.floor(line.quantity / 2);
      }
    }
    if (disc === 0 && lines.reduce((s, l) => s + l.quantity, 0) >= 2) {
      disc = Math.min(...lines.map((l) => l.unitPaise));
    }
  }
  if (promo.maxDiscountPaise != null) disc = Math.min(disc, promo.maxDiscountPaise);
  return Math.max(0, Math.min(disc, foodPaise));
}

export function computeQuote(input: QuoteInput): Quote {
  const blockers: string[] = [];
  const foodSubtotalPaise = input.lines.reduce((sum, line) => {
    if (!line.available) blockers.push("UNAVAILABLE_ITEM");
    return sum + line.unitPaise * line.quantity;
  }, 0);

  let effectiveMinOrder = input.fees.minOrderPaise;
  if (input.distanceKm > 5 && input.distanceKm <= 12) {
    effectiveMinOrder = Math.max(input.fees.minOrderPaise, input.fees.longDistanceMovPaise ?? 49900);
  } else if (input.distanceKm > 12) {
    effectiveMinOrder = Math.max(input.fees.minOrderPaise, input.fees.highwayExpressMovPaise ?? 99900);
  }

  if (input.lines.length === 0) blockers.push("EMPTY_CART");
  if (foodSubtotalPaise < effectiveMinOrder) blockers.push("MIN_ORDER");

  // Max Daytime Radius (up to 25 km until 6:00 PM)
  const maxDayRadius = input.fees.dayModeRadiusKm ?? 25.0;
  if (input.distanceKm > maxDayRadius) {
    blockers.push("EXCEEDS_MAX_RADIUS");
  }

  // Evening Window Limit (7 to 8 km from 6:00 PM till 11:00 PM)
  const eveningLimit = input.fees.eveningModeRadiusKm ?? 8.0;
  if (input.fees.eveningModeActive && input.distanceKm > eveningLimit) {
    blockers.push("EVENING_DISTANCE_LIMIT");
  }

  // Night Curfew Limit (3 to 4 km from 11:00 PM until 4:00 AM)
  const nightLimit = input.fees.nightModeRadiusKm ?? 4.0;
  if (input.fees.nightModeActive && input.distanceKm > nightLimit) {
    blockers.push("NIGHT_SAFETY_CURFEW");
  }

  if (input.fees.riderAvailable === false) {
    blockers.push("NO_RIDER_AVAILABLE");
  }

  const promoDiscount = computePromoDiscount(foodSubtotalPaise, input.promo, input.isFirstOrder, input.lines);
  const split = input.promo ? splitDiscount(promoDiscount, input.promo.fundedBy) : { restaurant: 0, platform: 0 };
  const restaurantDiscountPaise = split.restaurant;
  const platformDiscountPaise = split.platform;
  const foodAfterDiscounts = foodSubtotalPaise - restaurantDiscountPaise - platformDiscountPaise;

  const packagingPaise = Math.max(0, input.packagingPaise);

  // Delivery & Surges
  const isCartEmpty = input.lines.length === 0;
  let baseDeliveryFeePaise = isCartEmpty
    ? 0
    : deliveryFeePaise(input.distanceKm, input.fees, foodAfterDiscounts).baseDeliveryPaise;

  // Dynamic Surge Fees
  const activeSurges: ActiveSurge[] = [];
  let rainSurgePaise = 0;
  let peakSurgePaise = 0;
  let lateNightSurgePaise = 0;

  if (!isCartEmpty) {
    // 1. Rain Surge: +₹20 to +₹45 (2000-4500 paise) when rain/weather condition is active
    if (input.fees.rainSurgeActive) {
      rainSurgePaise = Math.max(2000, Math.min(4500, input.fees.rainSurgePaise ?? 2500));
      activeSurges.push({
        type: "RAIN",
        label: "Rain / Weather Surge",
        amountPaise: rainSurgePaise,
        description: "Adverse weather compensation paid directly to delivery partners.",
      });
    }

    // 2. Peak Demand Surge: +₹15 to +₹30 (1500-3000 paise) during lunch/dinner peak hours
    const isPeak = input.fees.peakSurgeActive !== undefined ? input.fees.peakSurgeActive : isPeakDemandHour();
    if (isPeak) {
      peakSurgePaise = Math.max(1500, Math.min(3000, input.fees.peakSurgePaise ?? 2000));
      activeSurges.push({
        type: "PEAK_DEMAND",
        label: "Peak Demand Surge",
        amountPaise: peakSurgePaise,
        description: "High order demand surge during lunch and dinner rush hours.",
      });
    }

    // 3. Late Night Surcharge: +₹20 to +₹35 (2000-3500 paise) between 23:00 and 05:00
    const isLateNight =
      input.fees.lateNightSurgeActive !== undefined
        ? input.fees.lateNightSurgeActive
        : isLateNightSurchargeHour();
    if (isLateNight) {
      lateNightSurgePaise = Math.max(2000, Math.min(3500, input.fees.lateNightSurgePaise ?? 2500));
      activeSurges.push({
        type: "LATE_NIGHT",
        label: "Late Night Surcharge",
        amountPaise: lateNightSurgePaise,
        description: "Operational surcharge for late-night delivery operations (23:00 - 05:00).",
      });
    }
  }

  const surgeFeePaise = rainSurgePaise + peakSurgePaise + lateNightSurgePaise;
  const surgeBreakdown: SurgeBreakdown = {
    rainSurgePaise,
    peakSurgePaise,
    lateNightSurgePaise,
    totalSurgePaise: surgeFeePaise,
    activeSurges,
  };

  let totalDeliveryBeforeDiscount = baseDeliveryFeePaise + surgeFeePaise;
  let deliveryDiscountPaise = 0;
  if (
    input.promo?.kind === "free_delivery" &&
    (!input.promo.firstOrderOnly || input.isFirstOrder) &&
    foodSubtotalPaise >= input.promo.minOrderPaise
  ) {
    deliveryDiscountPaise = totalDeliveryBeforeDiscount;
    if (input.promo.maxDiscountPaise != null) {
      deliveryDiscountPaise = Math.min(deliveryDiscountPaise, input.promo.maxDiscountPaise);
    }
    totalDeliveryBeforeDiscount = Math.max(0, totalDeliveryBeforeDiscount - deliveryDiscountPaise);
  }
  const deliveryFeePaiseValue = totalDeliveryBeforeDiscount;

  // Consumer Platform Fee: Flat ₹6.00 to ₹10.00 (600 to 1000 paise) charged on every order if configured
  const platformFeePaise = isCartEmpty
    ? 0
    : input.fees.platformFeePaise !== undefined
      ? input.fees.platformFeePaise
      : 0;

  // Small Cart Fee: +₹25 (2500 paise) if net food bill is under threshold
  const smallCartThreshold = input.fees.smallCartThresholdPaise ?? 0;
  const smallCartFeePaise =
    !isCartEmpty && smallCartThreshold > 0 && foodAfterDiscounts > 0 && foodAfterDiscounts < smallCartThreshold
      ? (input.fees.smallCartFeePaise !== undefined ? input.fees.smallCartFeePaise : 2500)
      : 0;

  const marketplaceServiceFee =
    Math.max(0, input.fees.serviceFeePaise) + applyBps(foodSubtotalPaise, input.fees.serviceFeeBps);
  const serviceFeePaise = platformFeePaise + smallCartFeePaise + marketplaceServiceFee;

  // Statutory Tax Calculation: 5% food GST (Sec 9(5) CGST) + 18% services GST on platform fee and services
  const foodGstRateBps = input.fees.menuTaxBps ?? 500;
  const foodGstPaise = applyBps(foodAfterDiscounts, foodGstRateBps);

  const serviceTaxRateBps = input.fees.serviceTaxBps ?? 1800;
  const servicesTaxablePaise = platformFeePaise + smallCartFeePaise + marketplaceServiceFee;
  let servicesGstPaise = applyBps(servicesTaxablePaise, serviceTaxRateBps);
  if (input.fees.deliveryTaxBps > 0) {
    servicesGstPaise += applyBps(deliveryFeePaiseValue, input.fees.deliveryTaxBps);
  }

  const taxPaise = (input.fees.menuPricesIncludeTax ? 0 : foodGstPaise) + servicesGstPaise;

  const taxBreakdown: TaxBreakdown = {
    foodGstPaise,
    foodGstRateBps,
    foodGstIncludedInMenu: Boolean(input.fees.menuPricesIncludeTax),
    servicesGstPaise,
    servicesGstRateBps: serviceTaxRateBps,
    totalTaxPaise: taxPaise,
  };

  const orderType: OrderFulfillmentType = input.orderType ?? "DELIVERY";
  const isTableQrOrDineIn = orderType === "TABLE_QR" || orderType === "DINE_IN";

  // Enforce commercial take-rate:
  // - 0% dine-in commission on Table QR orders
  // - 28% standard delivery take-rate (configurable by tier from 18% to 28% in integer basis points: 1800 to 2800 bps)
  let commissionBps = input.commissionBps ?? STANDARD_DELIVERY_COMMISSION_BPS;
  if (isTableQrOrDineIn) {
    commissionBps = DINE_IN_TABLE_QR_COMMISSION_BPS; // Strictly 0 bps on Table QR
  }

  const effectiveDeliveryFeePaise = isTableQrOrDineIn ? 0 : deliveryFeePaiseValue;
  const foodForCommission = foodSubtotalPaise - restaurantDiscountPaise;
  const commissionPaise = applyBps(foodForCommission, commissionBps);
  const restaurantPayablePaise = foodForCommission - commissionPaise + packagingPaise;

  // Base customer total before payment gateway pass-through
  const subtotalBeforePg =
    foodAfterDiscounts + packagingPaise + effectiveDeliveryFeePaise + serviceFeePaise + taxPaise;

  // Payment Gateway Fee pass-through (184 bps = 1.84% + 18% GST)
  const isPgPassThrough = Boolean(
    input.passThroughPaymentGatewayFee ?? input.fees.passThroughPaymentGatewayFee
  );
  const pgFee = calculatePaymentGatewayFee(subtotalBeforePg);
  const paymentGatewayBreakdown: PaymentGatewayBreakdown = {
    taxableBasePaise: subtotalBeforePg,
    feeBasePaise: pgFee.feeBasePaise,
    feeGstPaise: pgFee.feeGstPaise,
    totalFeePaise: pgFee.totalFeePaise,
    isPassedThrough: isPgPassThrough,
  };

  const totalPaise = subtotalBeforePg + (isPgPassThrough ? pgFee.totalFeePaise : 0);

  const lines: QuoteLine[] = [
    {
      code: "FOOD",
      name: "Food Total",
      amountPaise: foodSubtotalPaise,
      source: "item",
      fundedBy: "CUSTOMER",
      reason: "Sum of item prices including chosen variants and add-ons.",
    },
  ];
  if (restaurantDiscountPaise) {
    lines.push({
      code: "RESTAURANT_DISCOUNT",
      name: input.promo?.name ?? "Kitchen discount",
      amountPaise: -restaurantDiscountPaise,
      source: "promotion",
      fundedBy: "RESTAURANT",
      reason: "Discount funded by the kitchen, not by the platform.",
    });
  }
  if (platformDiscountPaise) {
    lines.push({
      code: "PLATFORM_DISCOUNT",
      name: input.promo?.name ?? "Platform discount",
      amountPaise: -platformDiscountPaise,
      source: "promotion",
      fundedBy: "PLATFORM",
      reason: "Discount funded by the platform. The kitchen is not charged for this amount.",
    });
  }
  if (packagingPaise) {
    lines.push({
      code: "PACKAGING",
      name: "Packaging",
      amountPaise: packagingPaise,
      source: "packaging",
      fundedBy: "CUSTOMER",
      reason: "Packaging charged by the kitchen for hygienic thermal packaging.",
    });
  }
  if (!isTableQrOrDineIn) {
    lines.push({
      code: "DELIVERY",
      name: "Delivery Fee",
      amountPaise: baseDeliveryFeePaise,
      source: "delivery",
      fundedBy: "CUSTOMER",
      reason:
        baseDeliveryFeePaise === 0
          ? deliveryDiscountPaise > 0
            ? (input.promo?.name ?? "Free delivery offer applied.")
            : "Delivery waived because the order crossed the free-delivery threshold."
          : "Base distance slab fee for this zone.",
    });
    if (rainSurgePaise > 0) {
      lines.push({
        code: "RAIN_SURGE",
        name: "Rain / Weather Surge",
        amountPaise: rainSurgePaise,
        source: "delivery",
        fundedBy: "CUSTOMER",
        reason: "Weather compensation paid directly to riders braving rains.",
      });
    }
    if (peakSurgePaise > 0) {
      lines.push({
        code: "PEAK_SURGE",
        name: "Peak Demand Surge",
        amountPaise: peakSurgePaise,
        source: "delivery",
        fundedBy: "CUSTOMER",
        reason: "Surge applied during high-demand rush hours.",
      });
    }
    if (lateNightSurgePaise > 0) {
      lines.push({
        code: "LATE_NIGHT_SURGE",
        name: "Late Night Surcharge",
        amountPaise: lateNightSurgePaise,
        source: "delivery",
        fundedBy: "CUSTOMER",
        reason: "Operational surcharge for orders placed between 23:00 and 05:00.",
      });
    }
  }
  if (platformFeePaise > 0) {
    lines.push({
      code: "PLATFORM_FEE",
      name: "Platform Fee",
      amountPaise: platformFeePaise,
      source: "platform",
      fundedBy: "CUSTOMER",
      reason: "Flat fee for continuous platform uptime and founder-grade tech operations.",
    });
  }
  if (smallCartFeePaise > 0) {
    lines.push({
      code: "SMALL_CART_FEE",
      name: "Small Cart Fee",
      amountPaise: smallCartFeePaise,
      source: "service",
      fundedBy: "CUSTOMER",
      reason: "Applied on food bills under ₹149 to support logistics efficiency.",
    });
  }
  if (marketplaceServiceFee > 0) {
    lines.push({
      code: "SERVICE",
      name: "Service Fee",
      amountPaise: marketplaceServiceFee,
      source: "service",
      fundedBy: "CUSTOMER",
      reason: "Platform service fee from marketplace configuration.",
    });
  }
  if (taxPaise > 0) {
    lines.push({
      code: "TAX",
      name: "Govt Taxes (GST)",
      amountPaise: taxPaise,
      source: "tax",
      fundedBy: "CUSTOMER",
      reason: "Statutory 18% services GST on platform charges & Section 9(5) CGST compliance.",
    });
  }
  if (isPgPassThrough && pgFee.totalFeePaise > 0) {
    lines.push({
      code: "PAYMENT_GATEWAY",
      name: "Payment Gateway Fee (1.84% + 18% GST)",
      amountPaise: pgFee.totalFeePaise,
      source: "service",
      fundedBy: "CUSTOMER",
      reason: "Payment gateway processing fee pass-through (184 bps + 18% GST).",
    });
  }
  lines.push({
    code: "TOTAL",
    name: "To pay",
    amountPaise: totalPaise,
    source: "item",
    fundedBy: "CUSTOMER",
    reason: "Customer payable. Every other line is included in this total.",
  });

  return {
    foodSubtotalPaise,
    restaurantDiscountPaise,
    platformDiscountPaise,
    packagingPaise,
    baseDeliveryFeePaise: isTableQrOrDineIn ? 0 : baseDeliveryFeePaise,
    surgeFeePaise: isTableQrOrDineIn ? 0 : surgeFeePaise,
    surgeBreakdown,
    deliveryFeePaise: effectiveDeliveryFeePaise,
    serviceFeePaise,
    platformFeePaise,
    smallCartFeePaise,
    taxPaise,
    taxBreakdown,
    paymentGatewayFeePaise: pgFee.feeBasePaise,
    paymentGatewayGstPaise: pgFee.feeGstPaise,
    totalPaymentGatewayFeePaise: pgFee.totalFeePaise,
    paymentGatewayBreakdown,
    totalPaise,
    savingsPaise: restaurantDiscountPaise + platformDiscountPaise + deliveryDiscountPaise,
    commissionBps,
    commissionPaise,
    restaurantPayablePaise,
    minOrderPaise: input.fees.minOrderPaise,
    lines,
    blockers: [...new Set(blockers)],
    orderType,
  };
}
