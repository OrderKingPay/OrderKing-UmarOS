// File: orderking-customers/src/lib/navigation/customer-zomato-kingpay-core.ts
// Exact Zomato Food + PhonePe Luxury Parity:
// - Dual-Vertical Floating Dock Strict Invariant
// - Algorithmic Unserviceability Handover (Zero Dead Ends -> Flights, Trains, APDCL Bills, Courier)
// - Clean Restaurant Cards (Zero Fake Static Badges; Real Merchant-Funded Campaigns Only)

export type ActiveVertical = 'orderking' | 'kingpay';

export interface DockTabItem {
  tabIndex: 1 | 2 | 3;
  id: string;
  label: string;
  href: string;
  isActive: boolean;
  role: 'active_vertical' | 'vertical_switcher' | 'contextual_history';
}

/**
 * Enforces the Strict Dual-Vertical Floating Dock Invariant:
 * - When in OrderKing (Food Delivery):
 *   Tab 1 = OrderKing (Active), Tab 2 = KingPay (Switcher), Tab 3 = Orders (/orders)
 * - When in KingPay (Fintech/Travel Super-App):
 *   Tab 1 = OrderKing (Switcher), Tab 2 = KingPay (Active), Tab 3 = Bookings (/travel?tab=bookings)
 */
export function resolveDualVerticalFloatingDock(vertical: ActiveVertical): [DockTabItem, DockTabItem, DockTabItem] {
  if (vertical === 'orderking') {
    return [
      {
        tabIndex: 1,
        id: 'orderking',
        label: 'OrderKing',
        href: '/',
        isActive: true,
        role: 'active_vertical',
      },
      {
        tabIndex: 2,
        id: 'kingpay',
        label: 'KingPay',
        href: '/kingpay',
        isActive: false,
        role: 'vertical_switcher',
      },
      {
        tabIndex: 3,
        id: 'orders',
        label: 'Orders',
        href: '/orders',
        isActive: false,
        role: 'contextual_history',
      },
    ];
  }

  return [
    {
      tabIndex: 1,
      id: 'orderking',
      label: 'OrderKing',
      href: '/',
      isActive: false,
      role: 'vertical_switcher',
    },
    {
      tabIndex: 2,
      id: 'kingpay',
      label: 'KingPay',
      href: '/kingpay',
      isActive: true,
      role: 'active_vertical',
    },
    {
      tabIndex: 3,
      id: 'bookings',
      label: 'Bookings',
      href: '/travel?tab=bookings',
      isActive: false,
      role: 'contextual_history',
    },
  ];
}

export interface UnserviceabilityHandoverService {
  id: 'flights' | 'trains' | 'apdcl_bills' | 'local_courier';
  title: string;
  description: string;
  href: string;
}

export interface UnserviceabilityHandoverPayload {
  mode: 'FOOD_SERVICEABLE' | 'KINGPAY_SEAMLESS_HANDOVER';
  operationalKitchenCount: number;
  headline: string;
  subheadline: string;
  services: UnserviceabilityHandoverService[];
}

/**
 * Algorithmic Unserviceability Handover (Zero Dead Ends):
 * If customer GPS coordinates have 0 operational kitchens within the shift delivery perimeter,
 * never displays a dead-end "Cannot Deliver" error screen. Seamlessly presents native KingPay
 * lifestyle & travel services with natural human-style copywriting.
 */
export function evaluateLocationServiceabilityHandover(params: {
  operationalKitchenCount: number;
  customerCityOrArea?: string;
  activeShiftRadiusKm: number;
}): UnserviceabilityHandoverPayload {
  if (params.operationalKitchenCount > 0) {
    return {
      mode: 'FOOD_SERVICEABLE',
      operationalKitchenCount: params.operationalKitchenCount,
      headline: `${params.operationalKitchenCount} kitchens delivering to you right now`,
      subheadline: `Live menus within your ${params.activeShiftRadiusKm} km delivery perimeter`,
      services: [],
    };
  }

  const areaLabel = params.customerCityOrArea?.trim() || 'your area';
  return {
    mode: 'KINGPAY_SEAMLESS_HANDOVER',
    operationalKitchenCount: 0,
    headline: `Kitchens near ${areaLabel} are opening shortly — explore KingPay services active at your location right now`,
    subheadline:
      'Book domestic and international flights, reserve IRCTC train seats, pay APDCL electricity bills, or dispatch a local parcel courier in seconds.',
    services: [
      {
        id: 'flights',
        title: 'Flights & Air Travel',
        description: 'Compare domestic and international fares across IndiGo, Air India, Akasa Air, and Aviasales.',
        href: '/travel/trips?category=flights',
      },
      {
        id: 'trains',
        title: 'IRCTC Train Tickets',
        description: 'Check seat availability and book reserved rail tickets on official Indian Railways routes.',
        href: '/travel/trips?category=trains',
      },
      {
        id: 'apdcl_bills',
        title: 'APDCL Electricity & Utility Bills',
        description: 'Pay Assam Power Distribution (APDCL), mobile recharge, FASTag, and piped gas bills instantly.',
        href: '/kingpay?service=apdcl-electricity',
      },
      {
        id: 'local_courier',
        title: 'Local Parcel & Document Courier',
        description: 'Send packages, keys, or documents point-to-point with live rider GPS tracking and 4-digit OTP handover.',
        href: '/courier',
      },
    ],
  };
}

export interface MerchantFundedCampaign {
  campaignId: string;
  restaurantId: string;
  promoCode: string;
  discountPaise: number;
  minOrderPaise: number;
  totalBudgetPaise: number;
  budgetRemainingPaise: number;
  isActive: boolean;
  expiresAtIso: string;
}

export interface CleanRestaurantCardModel {
  restaurantId: string;
  name: string;
  isPureVeg: boolean;
  fssaiLicenseNumber: string;
  distanceKm: number;
  etaMinutes: number;
  featuredDishes: ReadonlyArray<{ id: string; name: string; pricePaise: number; isVeg: boolean }>;
  verifiedMerchantCampaignChip: string | null;
}

/**
 * Enforces Commandment 1 (ZERO MOCK, ZERO FAKE, ZERO BRAINLESS CHARITY):
 * Strips all hardcoded static discount badges ("").
 * Attaches a promotion chip ONLY if the restaurant created an active, funded campaign in PostgreSQL
 * with sufficient remaining marketing budget.
 */
export function buildCleanRestaurantCard(params: {
  restaurantId: string;
  name: string;
  isPureVeg: boolean;
  fssaiLicenseNumber: string;
  distanceKm: number;
  etaMinutes: number;
  featuredDishes: ReadonlyArray<{ id: string; name: string; pricePaise: number; isVeg: boolean }>;
  activeCampaign?: MerchantFundedCampaign | null;
  nowMs?: number;
}): CleanRestaurantCardModel {
  const now = params.nowMs ?? Date.now();
  let verifiedMerchantCampaignChip: string | null = null;

  const c = params.activeCampaign;
  if (
    c &&
    c.isActive &&
    c.restaurantId === params.restaurantId &&
    c.discountPaise > 0 &&
    c.budgetRemainingPaise >= c.discountPaise &&
    new Date(c.expiresAtIso).getTime() > now
  ) {
    const discountInr = Math.floor(c.discountPaise / 100);
    const minOrderInr = Math.floor(c.minOrderPaise / 100);
    verifiedMerchantCampaignChip = `₹${discountInr} OFF above ₹${minOrderInr} · Code ${c.promoCode}`;
  }

  return {
    restaurantId: params.restaurantId,
    name: params.name,
    isPureVeg: params.isPureVeg,
    fssaiLicenseNumber: params.fssaiLicenseNumber,
    distanceKm: Number(params.distanceKm.toFixed(1)),
    etaMinutes: Math.max(10, Math.round(params.etaMinutes)),
    featuredDishes: params.featuredDishes,
    verifiedMerchantCampaignChip,
  };
}