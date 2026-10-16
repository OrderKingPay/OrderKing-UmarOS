/**
 * UMAR OS - Supreme Rider Affiliate Ecosystem & Founder Revenue Maximization Engine
 * Authority: Supreme Rider Affiliate Ecosystem & Founder Revenue Maximization Specialist
 * Legal Framework: Code on Social Security 2020 (Act No. 36 of 2020) & NPCI UPI Ecosystem
 *
 * MISSION & ARCHITECTURE:
 * 1. Rider-Centric High-Value Benefits:
 *    - EV Rental & Battery Swapping: 15% discount with Yulu, Zypp Electric, Battery Smart.
 *    - Fuel Cashback & Petrocard: ₹2.50/L instant cashback via HPCL DriveTrack Plus / IOCL XtraPower.
 *    - Group Accidental & Health OPD: Statutory ₹10 Lakh accidental death & disability cover
 *      under Code on Social Security 2020 + ₹5/week OPD health card with unlimited doctor consults.
 *    - Instant Cashout Convenience: ₹10 flat fee for on-demand mid-shift withdrawals (100% founder profit).
 *    - Rider Rest Points & Charging Zones: Designated merchant hubs with free water, clean washrooms, 65W charging.
 *
 * 2. Founder Net Revenue Monetization:
 *    - EV Bounties: ₹350 one-time upfront referral bounty + ₹100/month recurring active subscription rev share.
 *    - Fuel Interchange: 0.5% (50 bps) merchant interchange share on corporate fleet fuel spend volume.
 *    - Insurance Broker Share: Compliant corporate affinity broker share (₹15/month or ₹3.50/week per rider).
 *    - Instant Cashout: Flat ₹10 fee with 98.5% net margin (100% founder profit retention).
 *    - Rest Hubs: Zero capex for founder; funded via merchant listing preference & co-branding.
 *
 * 3. Dynamic Trust Tier & Empathic Float Management:
 *    - Bronze Partner: 0-49 trips | ₹2,000 float limit | Warm onboarding guidance
 *    - Silver Partner: 50-199 trips | ₹2,500 float limit | Fuel cashback boost
 *    - Gold Partner: 200-499 trips | ₹3,500 float limit | 50% cashout fee discount + priority dispatch
 *    - Diamond Partner: 500+ trips | ₹5,000 float limit | 100% cashout fee waiver + top priority VIP queue
 *
 * 4. Human-Style Empathic Messaging:
 *    - Courteous, tea-break focused notifications instead of cold bureaucratic lockouts.
 *    - Prepaid orders remain 100% active even if floating cash limit is reached.
 */

import { z } from "zod";

// ============================================================================
// 1. ZOD SCHEMAS & CANONICAL TYPES
// ============================================================================

export const TrustTierEnum = z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"]);
export type TrustTier = z.infer<typeof TrustTierEnum>;

export const PartnerCategoryEnum = z.enum([
  "EV_RENTAL_AND_BATTERY_SWAP",
  "FUEL_PETROCARD_CASHBACK",
  "ACCIDENTAL_INSURANCE_AND_HEALTH_OPD",
  "INSTANT_CASHOUT_CONVENIENCE",
  "REST_POINTS_AND_CHARGING_ZONES",
]);
export type PartnerCategory = z.infer<typeof PartnerCategoryEnum>;

export interface TrustTierConfig {
  tier: TrustTier;
  title: string;
  minDeliveries: number;
  floatingCashLimitPaise: number;
  floatingCashLimitInr: number;
  instantCashoutFeeDiscountPct: number;
  fuelCashbackBonusPerLiterInr: number;
  evRentalDiscountPct: number;
  perks: string[];
}

export const TRUST_TIER_CONFIGS: Record<TrustTier, TrustTierConfig> = {
  BRONZE: {
    tier: "BRONZE",
    title: "Bronze Partner",
    minDeliveries: 0,
    floatingCashLimitPaise: 200000, // ₹2,000
    floatingCashLimitInr: 2000,
    instantCashoutFeeDiscountPct: 0,
    fuelCashbackBonusPerLiterInr: 0,
    evRentalDiscountPct: 15,
    perks: [
      "₹2,000 COD Cash Holding Limit",
      "15% EV Rental & Battery Swap Discount",
      "HPCL / IOCL ₹2.50/L Fuel Cashback",
      "₹10 Lakh Social Security Accident Cover",
      "Free Scheduled Wednesday Settlements",
    ],
  },
  SILVER: {
    tier: "SILVER",
    title: "Silver Partner",
    minDeliveries: 50,
    floatingCashLimitPaise: 250000, // ₹2,500
    floatingCashLimitInr: 2500,
    instantCashoutFeeDiscountPct: 0,
    fuelCashbackBonusPerLiterInr: 0.25, // ₹2.75/L total
    evRentalDiscountPct: 15,
    perks: [
      "₹2,500 COD Cash Holding Limit (+₹500 headroom)",
      "Instant Mid-Shift Float Clearing via UPI",
      "Enhanced ₹2.75/L Petrocard Cashback",
      "Designated Rest Point & Fast Charger Access",
      "Priority Payout Ledger Support",
    ],
  },
  GOLD: {
    tier: "GOLD",
    title: "Gold Partner",
    minDeliveries: 200,
    floatingCashLimitPaise: 350000, // ₹3,500
    floatingCashLimitInr: 3500,
    instantCashoutFeeDiscountPct: 50, // 50% discount on ₹10 fee = ₹5
    fuelCashbackBonusPerLiterInr: 0.5, // ₹3.00/L total
    evRentalDiscountPct: 16,
    perks: [
      "₹3,500 COD Cash Holding Limit",
      "50% Off Instant Cashout Fee (Only ₹5)",
      "Enhanced ₹3.00/L Petrocard Cashback",
      "Priority Dispatch Routing Multiplier (1.25x)",
      "Free Engine Oil Change Voucher every quarter",
    ],
  },
  DIAMOND: {
    tier: "DIAMOND",
    title: "Diamond Partner",
    minDeliveries: 500,
    floatingCashLimitPaise: 500000, // ₹5,000
    floatingCashLimitInr: 5000,
    instantCashoutFeeDiscountPct: 100, // 100% free instant cashouts
    fuelCashbackBonusPerLiterInr: 1.0, // ₹3.50/L total
    evRentalDiscountPct: 18,
    perks: [
      "₹5,000 Maximum Cash Holding Limit",
      "Unlimited Free Instant IMPS Cashouts (₹0 fee)",
      "Maximum ₹3.50/L Petrocard Cashback",
      "Top-Tier VIP Dispatch Priority (1.5x)",
      "Family Health OPD Card Included (₹0 cost)",
    ],
  },
};

export interface EvPartnerBenefit {
  id: string;
  partnerName: string;
  brand: "YULU" | "ZYPP" | "BATTERY_SMART";
  vehicleModel: string;
  serviceType: "EV_RENTAL" | "BATTERY_SWAP" | "HYBRID_SUBSCRIPTION";
  retailMonthlyCostInr: number;
  riderDiscountPct: number;
  riderDiscountedMonthlyCostInr: number;
  monthlyRiderSavingsInr: number;
  founderReferralBountyInr: number; // ₹350
  founderMonthlyActiveRevenueInr: number; // ₹100/mo
  redemptionSteps: string[];
  partnerAppDeepLink: string;
  batterySwapTimeSeconds: number;
  claimedDiscountCode: string;
}

export interface FuelPartnerBenefit {
  id: string;
  partnerName: string;
  petrocardBrand: "HPCL_DRIVETRACK" | "IOCL_XTRAPOWER";
  cashbackPerLiterInr: number; // ₹2.50 base
  founderInterchangeBps: number; // 50 bps = 0.5%
  typicalMonthlyFuelLiters: number; // ~120 Liters
  typicalMonthlyFuelSpendInr: number; // ~₹12,000
  estimatedMonthlyRiderCashbackInr: number; // 120 * 2.50 = ₹300
  estimatedMonthlyFounderInterchangeInr: number; // ₹12,000 * 0.5% = ₹60
  cardType: "VIRTUAL_AND_PHYSICAL_PETROCARD";
  acceptedOutletsCount: number;
}

export interface SocialSecurityInsuranceBenefit {
  statute: string; // "Code on Social Security, 2020"
  statuteSection: string; // "Chapter IX - Social Security for Gig and Platform Workers"
  accidentalDeathCoverInr: number; // ₹10,00,000 (₹10 Lakh)
  permanentTotalDisabilityCoverInr: number; // ₹10,00,000 (₹10 Lakh)
  accidentalHospitalizationInr: number; // ₹1,00,000
  healthOpdWeeklyCostInr: number; // ₹5/week (₹20/month)
  opdBenefitsDescription: string;
  partnerClinicNetwork: string[];
  founderBrokerMonthlyAffinityInr: number; // ₹15/month per active enrolled rider
  underwriterName: string;
  nomineeRegistrationRequired: boolean;
}

export interface InstantCashoutBenefit {
  convenienceFeeInr: number; // ₹10 flat fee
  founderNetProfitInr: number; // ₹9.85 (after ~₹0.15 IMPS gateway rail charge)
  founderNetProfitMarginPct: number; // 98.5%
  scheduledWeeklySettlementFeeInr: number; // ₹0 (100% Free on Wednesday 14:00 IST)
  maxDailyCashouts: number;
  minCashoutAmountInr: number;
  transferRail: "NPCI_IMPS" | "UPI_INSTANT_PAYOUT";
}

export interface RestPointZone {
  id: string;
  hubName: string;
  hubType: "RESTAURANT_PARTNER" | "CLOUD_KITCHEN_CLUSTER" | "DARK_STORE_LOUNGE";
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  amenities: {
    freePurifiedWater: boolean;
    fastPhoneChargingDocks: boolean;
    cleanRestrooms: boolean;
    shadedParkingBay: boolean;
    discountedStaffMeals: boolean;
    indoorAirConditioning: boolean;
  };
  founderCapexInr: number; // 0
  merchantBenefit: string;
}

// ============================================================================
// 2. CANONICAL ECOSYSTEM CATALOG DATA
// ============================================================================

export const EV_PARTNER_BENEFITS: EvPartnerBenefit[] = [
  {
    id: "yulu-dex-fleet",
    partnerName: "Yulu Bikes",
    brand: "YULU",
    vehicleModel: "Yulu DeX / Wynn Cargo 2W",
    serviceType: "EV_RENTAL",
    retailMonthlyCostInr: 8500,
    riderDiscountPct: 15,
    riderDiscountedMonthlyCostInr: 7225,
    monthlyRiderSavingsInr: 1275,
    founderReferralBountyInr: 350,
    founderMonthlyActiveRevenueInr: 100,
    redemptionSteps: [
      "Open Yulu App and select 'Delivery Partner Rental'",
      "Apply corporate promo code 'OKYULU15'",
      "Scan QR at any nearest Yulu Max Hub to pick up your fully charged bike",
    ],
    partnerAppDeepLink: "https://www.yulu.bike/orderking-partner",
    batterySwapTimeSeconds: 60,
    claimedDiscountCode: "OKYULU15",
  },
  {
    id: "zypp-electric-heavy",
    partnerName: "Zypp Electric",
    brand: "ZYPP",
    vehicleModel: "Zypp Cargo Heavy Duty 120km Range",
    serviceType: "EV_RENTAL",
    retailMonthlyCostInr: 9000,
    riderDiscountPct: 15,
    riderDiscountedMonthlyCostInr: 7650,
    monthlyRiderSavingsInr: 1350,
    founderReferralBountyInr: 350,
    founderMonthlyActiveRevenueInr: 100,
    redemptionSteps: [
      "Install Zypp Delivery Partner App",
      "Verify with OrderKing Partner ID & Aadhaar",
      "Instant 15% discount auto-applied on weekly/monthly plan",
    ],
    partnerAppDeepLink: "https://zypp.app/orderking-fleet",
    batterySwapTimeSeconds: 90,
    claimedDiscountCode: "OKZYPP15",
  },
  {
    id: "battery-smart-unlimited",
    partnerName: "Battery Smart",
    brand: "BATTERY_SMART",
    vehicleModel: "Universal 48V/60V Swap Pack",
    serviceType: "BATTERY_SWAP",
    retailMonthlyCostInr: 3000,
    riderDiscountPct: 15,
    riderDiscountedMonthlyCostInr: 2550,
    monthlyRiderSavingsInr: 450,
    founderReferralBountyInr: 350,
    founderMonthlyActiveRevenueInr: 100,
    redemptionSteps: [
      "Drive to any of 1,200+ Battery Smart Swap Stations across India",
      "Authenticate via OrderKing QR in the Battery Smart App",
      "Swap drained battery for 100% full battery in under 2 minutes",
    ],
    partnerAppDeepLink: "https://batterysmart.in/orderking",
    batterySwapTimeSeconds: 120,
    claimedDiscountCode: "OKSMART15",
  },
];

export const FUEL_PARTNER_BENEFITS: FuelPartnerBenefit[] = [
  {
    id: "hpcl-drivetrack-plus",
    partnerName: "Hindustan Petroleum Corporation Ltd (HPCL)",
    petrocardBrand: "HPCL_DRIVETRACK",
    cashbackPerLiterInr: 2.5,
    founderInterchangeBps: 50, // 0.5%
    typicalMonthlyFuelLiters: 120,
    typicalMonthlyFuelSpendInr: 12000,
    estimatedMonthlyRiderCashbackInr: 300, // 120 * 2.50
    estimatedMonthlyFounderInterchangeInr: 60, // 12,000 * 0.005
    cardType: "VIRTUAL_AND_PHYSICAL_PETROCARD",
    acceptedOutletsCount: 21500,
  },
  {
    id: "iocl-xtrapower-fleet",
    partnerName: "Indian Oil Corporation Ltd (IOCL)",
    petrocardBrand: "IOCL_XTRAPOWER",
    cashbackPerLiterInr: 2.5,
    founderInterchangeBps: 50, // 0.5%
    typicalMonthlyFuelLiters: 120,
    typicalMonthlyFuelSpendInr: 12000,
    estimatedMonthlyRiderCashbackInr: 300,
    estimatedMonthlyFounderInterchangeInr: 60,
    cardType: "VIRTUAL_AND_PHYSICAL_PETROCARD",
    acceptedOutletsCount: 34000,
  },
];

export const SOCIAL_SECURITY_BENEFIT: SocialSecurityInsuranceBenefit = {
  statute: "Code on Social Security, 2020",
  statuteSection: "Chapter IX - Schemes for Gig Workers and Platform Workers (Section 114)",
  accidentalDeathCoverInr: 1000000, // ₹10 Lakh
  permanentTotalDisabilityCoverInr: 1000000, // ₹10 Lakh
  accidentalHospitalizationInr: 100000, // ₹1 Lakh
  healthOpdWeeklyCostInr: 5, // ₹5/week
  opdBenefitsDescription:
    "Unlimited 24/7 tele-consultations with general physicians & specialists, free digital prescriptions, plus 20% flat discount on Apollo / Netmeds pharmacy orders.",
  partnerClinicNetwork: ["MediBuddy", "Clinikk Health Hubs", "PlumHQ Affinity Network"],
  founderBrokerMonthlyAffinityInr: 15, // ₹15/month per enrolled rider
  underwriterName: "ICICI Lombard / Tata AIG General Insurance Co. Ltd.",
  nomineeRegistrationRequired: true,
};

export const INSTANT_CASHOUT_BENEFIT: InstantCashoutBenefit = {
  convenienceFeeInr: 10,
  founderNetProfitInr: 9.85,
  founderNetProfitMarginPct: 98.5,
  scheduledWeeklySettlementFeeInr: 0,
  maxDailyCashouts: 3,
  minCashoutAmountInr: 100,
  transferRail: "NPCI_IMPS",
};

export const REST_POINT_HUBS: RestPointZone[] = [
  {
    id: "hub-koramangala-cloud",
    hubName: "Empire Restaurant & Cloud Kitchen Hub",
    hubType: "RESTAURANT_PARTNER",
    address: "80 Feet Rd, 4th Block, Koramangala",
    city: "Bengaluru",
    latitude: 12.9352,
    longitude: 77.6245,
    amenities: {
      freePurifiedWater: true,
      fastPhoneChargingDocks: true,
      cleanRestrooms: true,
      shadedParkingBay: true,
      discountedStaffMeals: true,
      indoorAirConditioning: true,
    },
    founderCapexInr: 0,
    merchantBenefit: "Priority OrderKing Courier Dispatch & 0% Takeaway Packaging Fee Boost",
  },
  {
    id: "hub-indiranagar-kitchen",
    hubName: "Behrouz & Faasos Megapod",
    hubType: "CLOUD_KITCHEN_CLUSTER",
    address: "100 Feet Rd, HAL 2nd Stage, Indiranagar",
    city: "Bengaluru",
    latitude: 12.9719,
    longitude: 77.6412,
    amenities: {
      freePurifiedWater: true,
      fastPhoneChargingDocks: true,
      cleanRestrooms: true,
      shadedParkingBay: true,
      discountedStaffMeals: false,
      indoorAirConditioning: true,
    },
    founderCapexInr: 0,
    merchantBenefit: "Rider Proximity Batching Optimization & Zero Delay Guarantee",
  },
  {
    id: "hub-cybercity-gurugram",
    hubName: "Haldiram's Express & Partner Lounge",
    hubType: "RESTAURANT_PARTNER",
    address: "DLF Cyber Hub, DLF Phase 2",
    city: "Gurugram",
    latitude: 28.4986,
    longitude: 77.0878,
    amenities: {
      freePurifiedWater: true,
      fastPhoneChargingDocks: true,
      cleanRestrooms: true,
      shadedParkingBay: true,
      discountedStaffMeals: true,
      indoorAirConditioning: true,
    },
    founderCapexInr: 0,
    merchantBenefit: "Exclusive Corporate Bulk Order Dispatch Corridor",
  },
];

// ============================================================================
// 3. DYNAMIC TRUST TIER RESOLUTION & LOGIC
// ============================================================================

/**
 * Resolves the rider's dynamic trust tier based on lifetime verified deliveries.
 * Trust progression:
 * - Bronze: 0 to 49 deliveries (₹2,000 float limit)
 * - Silver: 50 to 199 deliveries (₹2,500 float limit)
 * - Gold: 200 to 499 deliveries (₹3,500 float limit)
 * - Diamond: 500+ deliveries (₹5,000 float limit)
 */
export function getTrustTier(lifetimeDeliveries: number): TrustTierConfig {
  const count = Math.max(0, Math.floor(lifetimeDeliveries || 0));
  if (count >= TRUST_TIER_CONFIGS.DIAMOND.minDeliveries) return TRUST_TIER_CONFIGS.DIAMOND;
  if (count >= TRUST_TIER_CONFIGS.GOLD.minDeliveries) return TRUST_TIER_CONFIGS.GOLD;
  if (count >= TRUST_TIER_CONFIGS.SILVER.minDeliveries) return TRUST_TIER_CONFIGS.SILVER;
  return TRUST_TIER_CONFIGS.BRONZE;
}

/**
 * Returns dynamic progression metrics towards the next higher trust tier.
 */
export function getTrustTierProgression(lifetimeDeliveries: number): {
  currentTier: TrustTierConfig;
  nextTier: TrustTierConfig | null;
  deliveriesCompleted: number;
  deliveriesNeededForNextTier: number;
  progressPercentage: number;
  nextHeadroomBonusInr: number;
} {
  const current = getTrustTier(lifetimeDeliveries);
  const count = Math.max(0, Math.floor(lifetimeDeliveries || 0));

  let next: TrustTierConfig | null = null;
  if (current.tier === "BRONZE") next = TRUST_TIER_CONFIGS.SILVER;
  else if (current.tier === "SILVER") next = TRUST_TIER_CONFIGS.GOLD;
  else if (current.tier === "GOLD") next = TRUST_TIER_CONFIGS.DIAMOND;

  if (!next) {
    return {
      currentTier: current,
      nextTier: null,
      deliveriesCompleted: count,
      deliveriesNeededForNextTier: 0,
      progressPercentage: 100,
      nextHeadroomBonusInr: 0,
    };
  }

  const rangeSpan = next.minDeliveries - current.minDeliveries;
  const progressInRange = count - current.minDeliveries;
  const progressPct = Math.min(100, Math.max(0, Math.round((progressInRange / rangeSpan) * 100)));
  const needed = Math.max(0, next.minDeliveries - count);
  const bonusInr = next.floatingCashLimitInr - current.floatingCashLimitInr;

  return {
    currentTier: current,
    nextTier: next,
    deliveriesCompleted: count,
    deliveriesNeededForNextTier: needed,
    progressPercentage: progressPct,
    nextHeadroomBonusInr: bonusInr,
  };
}

// ============================================================================
// 4. POLITE HUMAN-STYLE MESSAGING ENGINE
// ============================================================================

export type FloatingCashTone = "COMFORTABLE" | "SOFT_WARNING" | "APPROACHING_LIMIT" | "LIMIT_REACHED";

export interface PoliteFloatingCashMessage {
  tone: FloatingCashTone;
  badgeLabel: string;
  badgeTone: "online" | "warning" | "busy";
  headline: string;
  greetingAndStatus: string;
  suggestedAction: string;
  chaiBreakEncouragement: string;
  recommendedDepositInr: number;
  upiIntentUrl: string;
  qrCodeUrl: string;
  prepaidOrdersUninterruptedNotice: string;
  trustTierTitle: string;
  holdingLimitInr: number;
  balanceInr: number;
  headroomInr: number;
  utilizationPct: number;
}

/**
 * Generates an empathetic, human-style message for the rider regarding their floating cash.
 * Strictly eliminates cold, threatening software warnings. Emphasizes partner respect,
 * tea/chai breaks, safety of funds, and instant one-tap UPI clearing.
 */
export function getPoliteFloatingCashMessage(params: {
  currentBalancePaise: number;
  lifetimeDeliveries?: number;
  disciplineConfigLimitInr?: number;
  riderName?: string;
  vpa?: string;
}): PoliteFloatingCashMessage {
  const deliveries = params.lifetimeDeliveries ?? 0;
  const tierConfig = getTrustTier(deliveries);

  const effectiveLimitInr = params.disciplineConfigLimitInr && params.disciplineConfigLimitInr > 0
    ? params.disciplineConfigLimitInr
    : tierConfig.floatingCashLimitInr;
  const effectiveLimitPaise = effectiveLimitInr * 100;

  const balancePaise = Math.max(0, params.currentBalancePaise || 0);
  const balanceInr = Math.round(balancePaise / 100);
  const headroomPaise = Math.max(0, effectiveLimitPaise - balancePaise);
  const headroomInr = Math.round(headroomPaise / 100);
  const utilizationPct = Math.min(100, Math.round((balancePaise / Math.max(1, effectiveLimitPaise)) * 100));

  const name = params.riderName ? params.riderName.split(" ")[0] : "Partner";
  const vpa = params.vpa || "orderking.treasury@okaxis";

  let tone: FloatingCashTone = "COMFORTABLE";
  if (balancePaise >= effectiveLimitPaise) {
    tone = "LIMIT_REACHED";
  } else if (utilizationPct >= 90) {
    tone = "APPROACHING_LIMIT";
  } else if (utilizationPct >= 75) {
    tone = "SOFT_WARNING";
  }

  // Recommended deposit amount (round to neat hundred)
  const recommendedDepositInr = Math.max(100, Math.ceil(balanceInr / 100) * 100);
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=OrderKing%20Treasury&am=${recommendedDepositInr}&cu=INR&tn=FloatDeposit_${tierConfig.tier}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiIntentUrl)}`;

  if (tone === "LIMIT_REACHED") {
    return {
      tone,
      badgeLabel: "Cash Limit Reached (Tea Break)",
      badgeTone: "busy",
      headline: `Incredible hustle today, ${name}! You've reached your ₹${effectiveLimitInr.toLocaleString("en-IN")} safety limit.`,
      greetingAndStatus: `You have ₹${balanceInr.toLocaleString("en-IN")} customer cash securely in hand. To keep you and your earnings 100% safe, new COD orders are momentarily paused.`,
      suggestedAction: `Take a relaxing 2-minute tea break, tap below to deposit ₹${recommendedDepositInr} via PhonePe/GPay/Paytm, and your COD orders will re-activate instantly.`,
      chaiBreakEncouragement: "Chai break time! Relax your shoulders, sip some warm tea, and let UPI handle the rest in 30 seconds.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice: "Prepaid online deliveries remain 100% active and unpaused without interruption.",
      trustTierTitle: tierConfig.title,
      holdingLimitInr: effectiveLimitInr,
      balanceInr,
      headroomInr: 0,
      utilizationPct: 100,
    };
  }

  if (tone === "APPROACHING_LIMIT") {
    return {
      tone,
      badgeLabel: "Nearing Safe Cap",
      badgeTone: "warning",
      headline: `Outstanding deliveries today, ${name}! ₹${balanceInr.toLocaleString("en-IN")} collected.`,
      greetingAndStatus: `You're within ₹${headroomInr} of your ₹${effectiveLimitInr.toLocaleString("en-IN")} ${tierConfig.title} limit (${utilizationPct}% utilized).`,
      suggestedAction: `Whenever you stop for your next meal or fuel fill, clear a quick deposit via UPI so high-tip cash orders never pause.`,
      chaiBreakEncouragement: "You're earning at top speed. A quick 1-tap deposit at the next signal keeps your flow uninterrupted.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice: "All prepaid online orders continue dispatching normally.",
      trustTierTitle: tierConfig.title,
      holdingLimitInr: effectiveLimitInr,
      balanceInr,
      headroomInr,
      utilizationPct,
    };
  }

  if (tone === "SOFT_WARNING") {
    return {
      tone,
      badgeLabel: "Healthy Cash Flow",
      badgeTone: "warning",
      headline: `Great pace, ${name}! You have ₹${balanceInr.toLocaleString("en-IN")} cash on hand.`,
      greetingAndStatus: `You have ₹${headroomInr} remaining headroom out of your ₹${effectiveLimitInr.toLocaleString("en-IN")} limit.`,
      suggestedAction: `You can let this offset in your Wednesday payout automatically, or clear it mid-shift anytime via 1-tap UPI.`,
      chaiBreakEncouragement: "Keep hydrated! Don't forget free RO water and charging docks at our partner rest points.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice: "All delivery modes active and dispatching.",
      trustTierTitle: tierConfig.title,
      holdingLimitInr: effectiveLimitInr,
      balanceInr,
      headroomInr,
      utilizationPct,
    };
  }

  return {
    tone: "COMFORTABLE",
    badgeLabel: "Safe & Active",
    badgeTone: "online",
    headline: `Shubh Aarambh, ${name}! Pocket balance is well within safe limits.`,
    greetingAndStatus: `You are holding ₹${balanceInr.toLocaleString("en-IN")} with ₹${headroomInr.toLocaleString("en-IN")} full headroom available under your ${tierConfig.title} tier.`,
    suggestedAction: `No immediate deposit required. Focus on delivering with care and delighting customers.`,
    chaiBreakEncouragement: "Drive safely and observe helmet safety on the road.",
    recommendedDepositInr: Math.max(100, balanceInr),
    upiIntentUrl,
    qrCodeUrl,
    prepaidOrdersUninterruptedNotice: "Full priority dispatch active.",
    trustTierTitle: tierConfig.title,
    holdingLimitInr: effectiveLimitInr,
    balanceInr,
    headroomInr,
    utilizationPct,
  };
}

// ============================================================================
// 5. FINANCIAL RETURN & FOUNDER REVENUE MAXIMIZATION CALCULATOR
// ============================================================================

export interface RiderBenefitUsageInput {
  hasEvRental: boolean;
  evPartnerId?: string; // "yulu-dex-fleet" | "zypp-electric-heavy" | "battery-smart-unlimited"
  hasFuelPetrocard: boolean;
  monthlyFuelLiters?: number;
  hasHealthOpdCard: boolean;
  instantCashoutsPerMonth: number;
  usesRestPoints: boolean;
}

export interface RiderMonthlySavingsBreakdown {
  evRentalSavingsInr: number;
  fuelCashbackSavingsInr: number;
  healthOpdDoctorSavingsInr: number; // Avg ₹600 doctor consult fees saved
  instantCashoutFeePaidInr: number;
  restPointPerksValueInr: number; // Free water, charging, restroom estimated value ₹250
  totalNetMonthlyRiderSavingsInr: number;
  annualizedRiderSavingsInr: number;
}

export interface FounderRevenuePerRiderBreakdown {
  evReferralBountyAmortizedMonthlyInr: number; // ₹350 / 6mo retention = ~₹58.33/mo OR upfront ₹350
  evReferralBountyUpfrontInr: number; // ₹350 one-off
  evMonthlySubscriptionRevShareInr: number; // ₹100/mo
  fuelInterchangeRevenueInr: number; // 0.5% on fuel spend
  insuranceBrokerShareMonthlyInr: number; // ₹15/mo
  instantCashoutConvenienceFeeRevenueInr: number; // ₹9.85 net per cashout * count
  totalMonthlyFounderNetRevenueInr: number;
  annualizedFounderNetRevenueInr: number;
}

/**
 * Calculates itemized monthly and annual financial savings for a delivery partner.
 */
export function calculateRiderMonthlySavings(usage: RiderBenefitUsageInput): RiderMonthlySavingsBreakdown {
  let evSavings = 0;
  if (usage.hasEvRental) {
    const ev = EV_PARTNER_BENEFITS.find((p) => p.id === usage.evPartnerId) || EV_PARTNER_BENEFITS[0];
    evSavings = ev.monthlyRiderSavingsInr;
  }

  let fuelSavings = 0;
  if (usage.hasFuelPetrocard && !usage.hasEvRental) {
    const liters = usage.monthlyFuelLiters ?? 120;
    fuelSavings = Math.round(liters * 2.5);
  }

  let healthSavings = 0;
  if (usage.hasHealthOpdCard) {
    // 2 doctor consultations/yr + medicine discounts = ~₹450/month economic value minus ₹20 cost = ₹430 net
    const doctorConsultEconomicValueInr = 450;
    const weeklyCostMonthly = 5 * 4.33; // ~₹21.65
    healthSavings = Math.round(doctorConsultEconomicValueInr - weeklyCostMonthly);
  }

  const cashoutFeePaid = Math.max(0, usage.instantCashoutsPerMonth * 10);
  const restPointValue = usage.usesRestPoints ? 300 : 0; // RO water + 65W charging + clean washrooms

  const totalMonthlySavings = evSavings + fuelSavings + healthSavings + restPointValue - cashoutFeePaid;
  const annualized = totalMonthlySavings * 12;

  return {
    evRentalSavingsInr: evSavings,
    fuelCashbackSavingsInr: fuelSavings,
    healthOpdDoctorSavingsInr: healthSavings,
    instantCashoutFeePaidInr: cashoutFeePaid,
    restPointPerksValueInr: restPointValue,
    totalNetMonthlyRiderSavingsInr: totalMonthlySavings,
    annualizedRiderSavingsInr: annualized,
  };
}

/**
 * Calculates net revenue generated directly for the Founder from a single active rider.
 */
export function calculateFounderRevenuePerRider(usage: RiderBenefitUsageInput): FounderRevenuePerRiderBreakdown {
  let upfrontBounty = 0;
  let monthlyEvRevShare = 0;

  if (usage.hasEvRental) {
    upfrontBounty = 350;
    monthlyEvRevShare = 100;
  }

  let fuelInterchange = 0;
  if (usage.hasFuelPetrocard && !usage.hasEvRental) {
    const liters = usage.monthlyFuelLiters ?? 120;
    const spend = liters * 100; // ₹100/L average fuel price
    fuelInterchange = Math.round(spend * 0.005); // 0.5% = ₹60
  }

  let insuranceBrokerShare = 0;
  if (usage.hasHealthOpdCard) {
    insuranceBrokerShare = SOCIAL_SECURITY_BENEFIT.founderBrokerMonthlyAffinityInr; // ₹15/mo
  }

  const cashoutProfitPerTx = INSTANT_CASHOUT_BENEFIT.founderNetProfitInr; // ₹9.85
  const cashoutRevenue = Math.round(usage.instantCashoutsPerMonth * cashoutProfitPerTx);

  // Amortize one-time ₹350 bounty over average 6 months lifecycle for run-rate modeling
  const amortizedBounty = Math.round(upfrontBounty / 6);
  const totalMonthly = monthlyEvRevShare + fuelInterchange + insuranceBrokerShare + cashoutRevenue + amortizedBounty;
  const annualized = totalMonthly * 12;

  return {
    evReferralBountyAmortizedMonthlyInr: amortizedBounty,
    evReferralBountyUpfrontInr: upfrontBounty,
    evMonthlySubscriptionRevShareInr: monthlyEvRevShare,
    fuelInterchangeRevenueInr: fuelInterchange,
    insuranceBrokerShareMonthlyInr: insuranceBrokerShare,
    instantCashoutConvenienceFeeRevenueInr: cashoutRevenue,
    totalMonthlyFounderNetRevenueInr: totalMonthly,
    annualizedFounderNetRevenueInr: annualized,
  };
}

export interface FleetEcosystemSimulationInput {
  fleetSize: number; // e.g. 500 or 5,000 riders
  evAdoptionPct?: number; // default 35%
  petrocardAdoptionPct?: number; // default 55%
  insuranceAdoptionPct?: number; // default 80%
  avgInstantCashoutsPerRiderPerMonth?: number; // default 3.5
}

export interface FleetEcosystemFinancialsResult {
  fleetSize: number;
  ridersOnEv: number;
  ridersOnPetrocard: number;
  ridersWithInsurance: number;
  monthlyFleetTotalInstantCashouts: number;
  // Rider Side
  totalFleetMonthlyRiderSavingsInr: number;
  totalFleetAnnualRiderSavingsInr: number;
  avgMonthlySavingsPerRiderInr: number;
  // Founder Side
  monthlyFounderEvRevenueInr: number;
  monthlyFounderFuelInterchangeInr: number;
  monthlyFounderInsuranceBrokerageInr: number;
  monthlyFounderInstantCashoutNetProfitInr: number;
  totalMonthlyFounderNetProfitInr: number;
  totalAnnualFounderNetProfitInr: number;
  founderUpfrontEvBountiesPipelineInr: number;
  // Win-Win Telemetry
  founderRevenueToRiderSavingsRatioPct: number;
}

/**
 * Simulates ecosystem economics and net profit across an entire fleet topology.
 */
export function calculateFleetEcosystemFinancials(
  input: FleetEcosystemSimulationInput,
): FleetEcosystemFinancialsResult {
  const size = Math.max(1, Math.round(input.fleetSize));
  const evPct = Math.min(100, Math.max(0, input.evAdoptionPct ?? 35));
  const fuelPct = Math.min(100, Math.max(0, input.petrocardAdoptionPct ?? 55));
  const insPct = Math.min(100, Math.max(0, input.insuranceAdoptionPct ?? 80));
  const cashoutsPerRider = Math.max(0, input.avgInstantCashoutsPerRiderPerMonth ?? 3.5);

  const ridersOnEv = Math.round((size * evPct) / 100);
  const ridersOnPetrocard = Math.round((size * fuelPct) / 100);
  const ridersWithInsurance = Math.round((size * insPct) / 100);
  const totalMonthlyCashouts = Math.round(size * cashoutsPerRider);

  // 1. Rider Savings
  const evSavingsMonthly = ridersOnEv * 1300; // avg ₹1,300/mo savings
  const fuelSavingsMonthly = ridersOnPetrocard * 300; // ₹300/mo fuel cashback
  const insSavingsMonthly = ridersWithInsurance * 430; // ₹430/mo net healthcare savings
  const restPointSavingsMonthly = size * 200; // RO water & charging
  const cashoutFeesPaid = totalMonthlyCashouts * 10;

  const totalMonthlyRiderSavings = evSavingsMonthly + fuelSavingsMonthly + insSavingsMonthly + restPointSavingsMonthly - cashoutFeesPaid;
  const totalAnnualRiderSavings = totalMonthlyRiderSavings * 12;
  const avgMonthlySavingsPerRider = Math.round(totalMonthlyRiderSavings / size);

  // 2. Founder Net Profits
  const upfrontEvBounties = ridersOnEv * 350; // ₹350 one-time per EV rider
  const monthlyEvRecurring = ridersOnEv * 100; // ₹100/mo per EV rider
  const monthlyFuelInterchange = ridersOnPetrocard * 60; // ₹60/mo (0.5% on ₹12k)
  const monthlyInsuranceBrokerage = ridersWithInsurance * 15; // ₹15/mo per insured rider
  const monthlyInstantCashoutNet = Math.round(totalMonthlyCashouts * 9.85); // ₹9.85 per cashout

  const totalMonthlyFounderNet = monthlyEvRecurring + monthlyFuelInterchange + monthlyInsuranceBrokerage + monthlyInstantCashoutNet;
  const totalAnnualFounderNet = totalMonthlyFounderNet * 12;

  const ratioPct = totalMonthlyRiderSavings > 0
    ? Math.round((totalMonthlyFounderNet / totalMonthlyRiderSavings) * 100)
    : 0;

  return {
    fleetSize: size,
    ridersOnEv,
    ridersOnPetrocard,
    ridersWithInsurance,
    monthlyFleetTotalInstantCashouts: totalMonthlyCashouts,
    totalFleetMonthlyRiderSavingsInr: totalMonthlyRiderSavings,
    totalFleetAnnualRiderSavingsInr: totalAnnualRiderSavings,
    avgMonthlySavingsPerRiderInr: avgMonthlySavingsPerRider,
    monthlyFounderEvRevenueInr: monthlyEvRecurring,
    monthlyFounderFuelInterchangeInr: monthlyFuelInterchange,
    monthlyFounderInsuranceBrokerageInr: monthlyInsuranceBrokerage,
    monthlyFounderInstantCashoutNetProfitInr: monthlyInstantCashoutNet,
    totalMonthlyFounderNetProfitInr: totalMonthlyFounderNet,
    totalAnnualFounderNetProfitInr: totalAnnualFounderNet,
    founderUpfrontEvBountiesPipelineInr: upfrontEvBounties,
    founderRevenueToRiderSavingsRatioPct: ratioPct,
  };
}

// ============================================================================
// 6. SINGLETON CLASS INTERFACE
// ============================================================================

export class RiderAffiliateEcosystemEngine {
  private static instance: RiderAffiliateEcosystemEngine;

  public static getInstance(): RiderAffiliateEcosystemEngine {
    if (!RiderAffiliateEcosystemEngine.instance) {
      RiderAffiliateEcosystemEngine.instance = new RiderAffiliateEcosystemEngine();
    }
    return RiderAffiliateEcosystemEngine.instance;
  }

  public getEvPartners(): EvPartnerBenefit[] {
    return [...EV_PARTNER_BENEFITS];
  }

  public getFuelPartners(): FuelPartnerBenefit[] {
    return [...FUEL_PARTNER_BENEFITS];
  }

  public getSocialSecurityInsurance(): SocialSecurityInsuranceBenefit {
    return { ...SOCIAL_SECURITY_BENEFIT };
  }

  public getInstantCashoutConfig(): InstantCashoutBenefit {
    return { ...INSTANT_CASHOUT_BENEFIT };
  }

  public getRestPoints(city?: string): RestPointZone[] {
    if (!city) return [...REST_POINT_HUBS];
    return REST_POINT_HUBS.filter((h) => h.city.toLowerCase() === city.toLowerCase());
  }

  public evaluateFloatingCash(params: {
    currentBalancePaise: number;
    lifetimeDeliveries?: number;
    disciplineConfigLimitInr?: number;
    riderName?: string;
    vpa?: string;
  }): PoliteFloatingCashMessage {
    return getPoliteFloatingCashMessage(params);
  }

  public calculateSavings(usage: RiderBenefitUsageInput): RiderMonthlySavingsBreakdown {
    return calculateRiderMonthlySavings(usage);
  }

  public calculateFounderRevenue(usage: RiderBenefitUsageInput): FounderRevenuePerRiderBreakdown {
    return calculateFounderRevenuePerRider(usage);
  }

  public simulateFleet(input: FleetEcosystemSimulationInput): FleetEcosystemFinancialsResult {
    return calculateFleetEcosystemFinancials(input);
  }
}

export const riderAffiliateEcosystemEngine = RiderAffiliateEcosystemEngine.getInstance();
