/**
 * OrderKing Rider Benefits & Affiliate Ecosystem Client Library
 * Legal Framework: Code on Social Security 2020 & NPCI Unified Payments Interface
 */

export type TrustTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface TrustTierConfig {
  tier: TrustTier;
  title: string;
  minDeliveries: number;
  floatingCashLimitPaise: number;
  floatingCashLimitInr: number;
  instantCashoutFeeDiscountPct: number;
  fuelCashbackBonusPerLiterInr: number;
  evRentalDiscountPct: number;
  badgeTone: "online" | "warning" | "busy" | "neutral";
  perks: string[];
}

export const TRUST_TIER_CONFIGS: Record<TrustTier, TrustTierConfig> = {
  BRONZE: {
    tier: "BRONZE",
    title: "Bronze Partner",
    minDeliveries: 0,
    floatingCashLimitPaise: 200000,
    floatingCashLimitInr: 2000,
    instantCashoutFeeDiscountPct: 0,
    fuelCashbackBonusPerLiterInr: 0,
    evRentalDiscountPct: 15,
    badgeTone: "neutral",
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
    floatingCashLimitPaise: 250000,
    floatingCashLimitInr: 2500,
    instantCashoutFeeDiscountPct: 0,
    fuelCashbackBonusPerLiterInr: 0.25,
    evRentalDiscountPct: 15,
    badgeTone: "online",
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
    floatingCashLimitPaise: 350000,
    floatingCashLimitInr: 3500,
    instantCashoutFeeDiscountPct: 50,
    fuelCashbackBonusPerLiterInr: 0.5,
    evRentalDiscountPct: 16,
    badgeTone: "warning",
    perks: [
      "₹3,500 COD Cash Holding Limit",
      "50% Off Instant Cashout Fee (Only ₹5)",
      "Enhanced ₹3.00/L Petrocard Cashback",
      "Priority Dispatch Routing Multiplier (1.25x)",
      "Free Engine Oil Change Voucher quarterly",
    ],
  },
  DIAMOND: {
    tier: "DIAMOND",
    title: "Diamond Partner",
    minDeliveries: 500,
    floatingCashLimitPaise: 500000,
    floatingCashLimitInr: 5000,
    instantCashoutFeeDiscountPct: 100,
    fuelCashbackBonusPerLiterInr: 1.0,
    evRentalDiscountPct: 18,
    badgeTone: "online",
    perks: [
      "₹5,000 Maximum Cash Holding Limit",
      "Unlimited Free Instant IMPS Cashouts (₹0 fee)",
      "Maximum ₹3.50/L Petrocard Cashback",
      "Top-Tier VIP Dispatch Priority (1.5x)",
      "Family Health OPD Card Included (₹0 cost)",
    ],
  },
};

export function getTrustTier(lifetimeDeliveries: number): TrustTierConfig {
  const count = Math.max(0, Math.floor(lifetimeDeliveries || 0));
  if (count >= TRUST_TIER_CONFIGS.DIAMOND.minDeliveries) return TRUST_TIER_CONFIGS.DIAMOND;
  if (count >= TRUST_TIER_CONFIGS.GOLD.minDeliveries) return TRUST_TIER_CONFIGS.GOLD;
  if (count >= TRUST_TIER_CONFIGS.SILVER.minDeliveries) return TRUST_TIER_CONFIGS.SILVER;
  return TRUST_TIER_CONFIGS.BRONZE;
}

export function getTrustTierProgression(lifetimeDeliveries: number) {
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

export interface PoliteFloatingCashMessage {
  tone: "COMFORTABLE" | "SOFT_WARNING" | "APPROACHING_LIMIT" | "LIMIT_REACHED";
  badgeLabel: string;
  badgeTone: "online" | "busy";
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

export function getPoliteFloatingCashMessage(params: {
  currentBalancePaise: number;
  lifetimeDeliveries?: number;
  disciplineConfigLimitInr?: number;
  riderName?: string;
  vpa?: string;
}): PoliteFloatingCashMessage {
  const deliveries = params.lifetimeDeliveries ?? 0;
  const tierConfig = getTrustTier(deliveries);

  const effectiveLimitInr =
    params.disciplineConfigLimitInr && params.disciplineConfigLimitInr > 0
      ? params.disciplineConfigLimitInr
      : tierConfig.floatingCashLimitInr;
  const effectiveLimitPaise = effectiveLimitInr * 100;

  const balancePaise = Math.max(0, params.currentBalancePaise || 0);
  const balanceInr = Math.round(balancePaise / 100);
  const headroomPaise = Math.max(0, effectiveLimitPaise - balancePaise);
  const headroomInr = Math.round(headroomPaise / 100);
  const utilizationPct = Math.min(
    100,
    Math.round((balancePaise / Math.max(1, effectiveLimitPaise)) * 100),
  );

  const name = params.riderName ? params.riderName.split(" ")[0] : "Partner";
  const vpa = params.vpa || "orderking.treasury@okaxis";

  let tone: "COMFORTABLE" | "SOFT_WARNING" | "APPROACHING_LIMIT" | "LIMIT_REACHED" = "COMFORTABLE";
  if (balancePaise >= effectiveLimitPaise) {
    tone = "LIMIT_REACHED";
  } else if (utilizationPct >= 90) {
    tone = "APPROACHING_LIMIT";
  } else if (utilizationPct >= 75) {
    tone = "SOFT_WARNING";
  }

  const recommendedDepositInr = Math.max(100, Math.ceil(balanceInr / 100) * 100);
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=OrderKing%20Treasury&am=${recommendedDepositInr}&cu=INR&tn=FloatDeposit_${tierConfig.tier}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentUrl)}`;

  if (tone === "LIMIT_REACHED") {
    return {
      tone,
      badgeLabel: "Cash Limit Reached (Tea Break)",
      badgeTone: "busy",
      headline: `Incredible hustle today, ${name}! You've reached your ₹${effectiveLimitInr.toLocaleString("en-IN")} safety limit.`,
      greetingAndStatus: `You have ₹${balanceInr.toLocaleString("en-IN")} customer cash securely in hand. To keep you and your earnings 100% safe, new COD orders are momentarily paused.`,
      suggestedAction: `Take a relaxing 2-minute tea break, tap below to deposit ₹${recommendedDepositInr} via PhonePe/GPay/Paytm, and your COD orders will re-activate instantly.`,
      chaiBreakEncouragement:
        "Chai break time! Relax your shoulders, sip some warm tea, and let UPI handle the rest in 30 seconds.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice:
        "Prepaid online deliveries remain 100% active and unpaused without interruption.",
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
      badgeTone: "busy",
      headline: `Outstanding deliveries today, ${name}! ₹${balanceInr.toLocaleString("en-IN")} collected.`,
      greetingAndStatus: `You're within ₹${headroomInr} of your ₹${effectiveLimitInr.toLocaleString("en-IN")} ${tierConfig.title} limit (${utilizationPct}% utilized).`,
      suggestedAction: `Whenever you stop for your next meal or fuel fill, clear a quick deposit via UPI so high-tip cash orders never pause.`,
      chaiBreakEncouragement:
        "You're earning at top speed. A quick 1-tap deposit at the next signal keeps your flow uninterrupted.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice:
        "All prepaid online orders continue dispatching normally.",
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
      badgeTone: "busy",
      headline: `Great pace, ${name}! You have ₹${balanceInr.toLocaleString("en-IN")} cash on hand.`,
      greetingAndStatus: `You have ₹${headroomInr} remaining headroom out of your ₹${effectiveLimitInr.toLocaleString("en-IN")} limit.`,
      suggestedAction: `You can let this offset in your Wednesday payout automatically, or clear it mid-shift anytime via 1-tap UPI.`,
      chaiBreakEncouragement:
        "Keep hydrated! Don't forget free RO water and charging docks at our partner rest points.",
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

export const RIDER_AFFILIATE_PARTNERS = {
  evPartners: [
    {
      id: "yulu",
      name: "Yulu Bikes",
      service: "Yulu DeX / Wynn Cargo EV",
      discount: "15% Monthly Rental Discount",
      promoCode: "OKYULU15",
      savingsMonthly: "₹1,275/mo savings",
      description: "Zero petrol expense, 60-second battery swaps at 500+ Yulu Max Hubs.",
      deepLink: "https://www.yulu.bike/orderking-partner",
    },
    {
      id: "zypp",
      name: "Zypp Electric",
      service: "Zypp Cargo Heavy Duty (120km Range)",
      discount: "15% Rental & Maintenance Waiver",
      promoCode: "OKZYPP15",
      savingsMonthly: "₹1,350/mo savings",
      description: "Heavy duty carrier bag, dual batteries, free periodic maintenance.",
      deepLink: "https://zypp.app/orderking-fleet",
    },
    {
      id: "battery_smart",
      name: "Battery Smart",
      service: "Universal 2-Minute Battery Swap Network",
      discount: "15% Swap Subscription Discount",
      promoCode: "OKSMART15",
      savingsMonthly: "₹450/mo savings",
      description: "1,200+ swap stations across 25+ Indian cities. Never wait to charge.",
      deepLink: "https://batterysmart.in/orderking",
    },
  ],
  fuelPartners: [
    {
      id: "hpcl",
      name: "HPCL DriveTrack Plus",
      service: "Fleet Petrocard & UPI Cashback",
      discount: "₹2.50 / Liter Direct Cashback",
      savingsMonthly: "₹300 - ₹450/mo fuel savings",
      description: "Accepted across 21,500+ HPCL petrol pumps nationwide. Instant credit.",
      claimText: "Instant Virtual Card in Rider App",
    },
    {
      id: "iocl",
      name: "IOCL XtraPower Fleet",
      service: "Smart Fleet Card & Reward Points",
      discount: "₹2.50 / Liter Direct Cashback",
      savingsMonthly: "₹300 - ₹450/mo fuel savings",
      description: "Accepted at 34,000+ IndianOil retail outlets with 1-tap UPI scan.",
      claimText: "Instant Virtual Card in Rider App",
    },
  ],
  insurance: {
    statute: "Code on Social Security, 2020 Compliant",
    accidentalDeathCover: "₹10,00,000 (₹10 Lakh Cover)",
    disabilityCover: "₹10,00,000 Total Disability Protection",
    hospitalizationCover: "₹1,00,000 Emergency Medical Cover",
    opdHealthCard: "₹5/week Unlimited 24/7 Tele-Consultations",
    opdPartners: "MediBuddy, Clinikk, PlumHQ Affinity Network",
    pharmacyDiscount: "20% flat discount on Apollo & Netmeds medicines",
  },
  instantCashout: {
    convenienceFee: "₹10 Flat Fee per Early Withdrawal",
    founderNetProfit: "100% Founder Retained Profit",
    scheduledSettlement: "₹0 Free Scheduled Payout Every Wednesday 14:00 IST",
    speed: "Instant 60-Second IMPS Transfer to verified UPI / Bank",
  },
  restPoints: [
    {
      name: "Koramangala Partner Hub (Empire Restaurant)",
      city: "Bengaluru",
      amenities: ["Free RO Chilled Water", "65W Phone Charging Docks", "Sanitized Washroom", "Shaded Parking"],
    },
    {
      name: "Indiranagar Cloud Kitchen Hub (Faasos / Behrouz)",
      city: "Bengaluru",
      amenities: ["Free RO Drinking Water", "Fast Phone Charging", "Restroom Access", "Air Conditioned Bay"],
    },
    {
      name: "DLF Cyber Hub Partner Lounge (Haldiram's Express)",
      city: "Gurugram",
      amenities: ["Free Purified Water", "Mobile Charging Stations", "Clean Restrooms", "Discounted Partner Meals"],
    },
  ],
};
