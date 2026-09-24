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

export type QuoteInput = {
  lines: PricedCartLine[];
  packagingPaise: number;
  commissionBps: number;
  distanceKm: number;
  fees: FeeSchedule;
  promo: PromoInput | null;
  isFirstOrder: boolean;
};

export type Quote = {
  foodSubtotalPaise: number;
  restaurantDiscountPaise: number;
  platformDiscountPaise: number;
  packagingPaise: number;
  deliveryFeePaise: number;
  serviceFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  savingsPaise: number;
  commissionBps: number;
  commissionPaise: number;
  restaurantPayablePaise: number;
  minOrderPaise: number;
  lines: QuoteLine[];
  blockers: string[];
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

function deliveryFeePaise(distanceKm: number, fees: FeeSchedule, foodAfterDiscounts: number): number {
  let delivery = 0;
  if (distanceKm <= 5) {
    delivery = fees.deliveryBasePaise + Math.round(distanceKm * fees.deliveryPerKmPaise);
  } else if (distanceKm <= 12) {
    // 5 to 12 km (Suburbs / Nilambazar) - Base ₹50 + ₹6/km
    delivery = Math.max(fees.deliveryBasePaise, 5000) + Math.round(distanceKm * Math.max(fees.deliveryPerKmPaise, 600));
  } else {
    // 12 to 25 km (Highway Express / Outer Perimeter up to 25 km) - Base ₹90 + ₹8/km
    delivery = Math.max(fees.deliveryBasePaise, 9000) + Math.round(distanceKm * Math.max(fees.deliveryPerKmPaise, 800));
  }
  if (fees.deliveryFreeOverPaise != null && foodAfterDiscounts >= fees.deliveryFreeOverPaise) {
    delivery = 0;
  }
  return Math.round(delivery / 100) * 100;
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
  let deliveryFeePaiseValue = deliveryFeePaise(input.distanceKm, input.fees, foodAfterDiscounts);
  let deliveryDiscountPaise = 0;
  if (
    input.promo?.kind === "free_delivery" &&
    (!input.promo.firstOrderOnly || input.isFirstOrder) &&
    foodSubtotalPaise >= input.promo.minOrderPaise
  ) {
    deliveryDiscountPaise = deliveryFeePaiseValue;
    if (input.promo.maxDiscountPaise != null) {
      deliveryDiscountPaise = Math.min(deliveryDiscountPaise, input.promo.maxDiscountPaise);
    }
    deliveryFeePaiseValue = Math.max(0, deliveryFeePaiseValue - deliveryDiscountPaise);
  }
  const serviceFeePaise =
    Math.max(0, input.fees.serviceFeePaise) + applyBps(foodSubtotalPaise, input.fees.serviceFeeBps);

  let taxPaise = 0;
  if (!input.fees.menuPricesIncludeTax) {
    taxPaise += applyBps(foodAfterDiscounts, input.fees.menuTaxBps);
  }
  taxPaise += applyBps(serviceFeePaise, input.fees.serviceTaxBps);
  taxPaise += applyBps(deliveryFeePaiseValue, input.fees.deliveryTaxBps);

  const totalPaise =
    foodAfterDiscounts + packagingPaise + deliveryFeePaiseValue + serviceFeePaise + taxPaise;

  const commissionBps = input.commissionBps;
  const foodForCommission = foodSubtotalPaise - restaurantDiscountPaise;
  const commissionPaise = applyBps(foodForCommission, commissionBps);
  const restaurantPayablePaise = foodForCommission - commissionPaise + packagingPaise;

  const lines: QuoteLine[] = [
    {
      code: "FOOD",
      name: "Food",
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
      reason: "Packaging charged by the kitchen and paid through to the kitchen.",
    });
  }
  lines.push({
    code: "DELIVERY",
    name: "Delivery",
    amountPaise: deliveryFeePaiseValue,
    source: "delivery",
    fundedBy: "CUSTOMER",
    reason:
      deliveryFeePaiseValue === 0
        ? deliveryDiscountPaise > 0
          ? (input.promo?.name ?? "Free delivery offer applied.")
          : "Delivery waived because the order crossed the free-delivery threshold."
        : "Base delivery fee plus distance component for this zone.",
  });
  if (serviceFeePaise) {
    lines.push({
      code: "SERVICE",
      name: "Service fee",
      amountPaise: serviceFeePaise,
      source: "service",
      fundedBy: "CUSTOMER",
      reason: "Optional platform service fee from marketplace configuration.",
    });
  }
  if (taxPaise) {
    lines.push({
      code: "TAX",
      name: "Tax",
      amountPaise: taxPaise,
      source: "tax",
      fundedBy: "CUSTOMER",
      reason: "Tax on fees. Menu prices are configured separately as tax-inclusive or exclusive.",
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
    deliveryFeePaise: deliveryFeePaiseValue,
    serviceFeePaise,
    taxPaise,
    totalPaise,
    savingsPaise: restaurantDiscountPaise + platformDiscountPaise + deliveryDiscountPaise,
    commissionBps,
    commissionPaise,
    restaurantPayablePaise,
    minOrderPaise: input.fees.minOrderPaise,
    lines,
    blockers: [...new Set(blockers)],
  };
}
