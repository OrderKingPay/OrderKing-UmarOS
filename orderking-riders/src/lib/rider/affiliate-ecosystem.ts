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
      "Scheduled Wednesday Settlements (₹0 Fee)",
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
      "Mid-Shift Float Clearing via UPI",
      "₹2.75/L Petrocard Cashback",
      "Assam Partner Hub & Charging Access",
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
      "50% Off On-Demand Cashout Fee (₹5)",
      "₹3.00/L Petrocard Cashback",
      "Priority Dispatch Routing",
      "Quarterly Service Support Eligibility",
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
      "₹0 Fee On-Demand IMPS Cashouts via RazorpayX",
      "₹3.50/L Petrocard Cashback",
      "Priority Dispatch Routing",
      "Family OPD Tele-Consultation Eligibility",
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
  const vpa = params.vpa || "orderking@ybl";

  let tone: "COMFORTABLE" | "SOFT_WARNING" | "APPROACHING_LIMIT" | "LIMIT_REACHED" = "COMFORTABLE";
  if (balancePaise >= effectiveLimitPaise) {
    tone = "LIMIT_REACHED";
  } else if (utilizationPct >= 90) {
    tone = "APPROACHING_LIMIT";
  } else if (utilizationPct >= 75) {
    tone = "SOFT_WARNING";
  }

  const recommendedDepositInr = Math.max(100, Math.ceil(balanceInr / 100) * 100);
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(String(vpa ?? ""))}&pn=OrderKing%20Treasury&am=${recommendedDepositInr}&cu=INR&tn=FloatDeposit_${tierConfig.tier}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(String(upiIntentUrl ?? ""))}`;

  if (tone === "LIMIT_REACHED") {
    return {
      tone,
      badgeLabel: "COD Limit Reached",
      badgeTone: "busy",
      headline: `${name}, you have reached your ₹${effectiveLimitInr.toLocaleString("en-IN")} COD holding limit.`,
      greetingAndStatus: `You hold ₹${balanceInr.toLocaleString("en-IN")} in customer cash. Cash-on-Delivery orders are paused until deposit.`,
      suggestedAction: `Deposit ₹${recommendedDepositInr} via UPI (PhonePe / GPay / Paytm / BHIM) to re-enable COD dispatch.`,
      chaiBreakEncouragement:
        "Prepaid online deliveries remain active. Clear your COD balance via UPI to resume cash orders.",
      recommendedDepositInr,
      upiIntentUrl,
      qrCodeUrl,
      prepaidOrdersUninterruptedNotice:
        "Prepaid online deliveries remain active and unpaused without interruption.",
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
      badgeLabel: "Approaching COD Cap",
      badgeTone: "busy",
      headline: `${name}, ₹${balanceInr.toLocaleString("en-IN")} collected (${utilizationPct}% of COD cap).`,
      greetingAndStatus: `₹${headroomInr} headroom remaining before your ₹${effectiveLimitInr.toLocaleString("en-IN")} ${tierConfig.title} limit.`,
      suggestedAction: `Deposit ₹${recommendedDepositInr} via UPI before your next COD order to avoid a cash-dispatch pause.`,
      chaiBreakEncouragement:
        "Use UPI deposit anytime to reset your COD headroom.",
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
      badgeLabel: "COD Balance Active",
      badgeTone: "busy",
      headline: `${name}, ₹${balanceInr.toLocaleString("en-IN")} customer cash currently in hand.`,
      greetingAndStatus: `₹${headroomInr} remaining headroom out of your ₹${effectiveLimitInr.toLocaleString("en-IN")} limit.`,
      suggestedAction: `Settle automatically in your Wednesday payout or deposit mid-shift via UPI.`,
      chaiBreakEncouragement:
        "RO water and charging points are available at OrderKing partner hubs.",
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
    badgeLabel: "Active",
    badgeTone: "online",
    headline: `${name}, COD balance is within limit.`,
    greetingAndStatus: `Holding ₹${balanceInr.toLocaleString("en-IN")} with ₹${headroomInr.toLocaleString("en-IN")} headroom under ${tierConfig.title}.`,
    suggestedAction: `No deposit required right now. COD and prepaid deliveries are active.`,
    chaiBreakEncouragement: "Wear a BIS-certified helmet and follow local traffic regulations.",
    recommendedDepositInr: Math.max(100, balanceInr),
    upiIntentUrl,
    qrCodeUrl,
    prepaidOrdersUninterruptedNotice: "All delivery modes active.",
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
      discount: "15% Fleet Rental Program",
      promoCode: "OKYULU15",
      savingsMonthly: "15% off monthly rental",
      description: "Electric two-wheeler rental with swappable battery hubs in supported cities.",
      deepLink: "https://www.yulu.bike",
    },
    {
      id: "zypp",
      name: "Zypp Electric",
      service: "Zypp Cargo EV",
      discount: "15% Fleet Rental Program",
      promoCode: "OKZYPP15",
      savingsMonthly: "15% off monthly rental",
      description: "Cargo EV rental with dual battery pack and scheduled maintenance.",
      deepLink: "https://zypp.electric",
    },
    {
      id: "battery_smart",
      name: "Battery Smart",
      service: "Battery Swap Network",
      discount: "15% Swap Plan Program",
      promoCode: "OKSMART15",
      savingsMonthly: "15% off swap plans",
      description: "Two-minute lithium battery swap stations in supported delivery zones.",
      deepLink: "https://www.batterysmart.in",
    },
  ],
  fuelPartners: [
    {
      id: "hpcl",
      name: "HPCL DriveTrack Plus",
      service: "Fleet Petrocard Program",
      discount: "₹2.50 / Liter Direct Cashback",
      savingsMonthly: "Up to ₹2.50/L at HPCL pumps",
      description: "Fleet fuel cashback program for verified OrderKing delivery partners.",
      claimText: "Request via Fleet Support (+91-9395065587)",
    },
    {
      id: "iocl",
      name: "IOCL XtraPower Fleet",
      service: "Fleet Fuel Card Program",
      discount: "₹2.50 / Liter Direct Cashback",
      savingsMonthly: "Up to ₹2.50/L at IOCL pumps",
      description: "Fleet fuel cashback program at IndianOil outlets for verified partners.",
      claimText: "Request via Fleet Support (+91-9395065587)",
    },
  ],
  insurance: {
    statute: "Code on Social Security, 2020 Compliant",
    accidentalDeathCover: "₹10,00,000 (₹10 Lakh Cover)",
    disabilityCover: "₹10,00,000 Total Disability Protection",
    hospitalizationCover: "₹1,00,000 Emergency Medical Cover",
    opdHealthCard: "₹5/week Primary Tele-Consultations",
    opdPartners: "MediBuddy, Clinikk, PlumHQ Affinity Network",
    pharmacyDiscount: "Partner pharmacy discount via OPD enrollment",
  },
  instantCashout: {
    convenienceFee: "₹10 Flat Fee per Early Withdrawal",
    founderNetProfit: "Platform Operating Margin",
    scheduledSettlement: "₹0 Fee Scheduled Payout Every Wednesday 14:00 IST",
    speed: "IMPS Transfer to verified UPI / Bank account",
  },
  restPoints: [
    {
      name: "Karimganj Central Hub",
      city: "Karimganj, Assam",
      amenities: ["RO Drinking Water", "Fast Phone Charging", "Sanitized Washroom", "Shaded Parking"],
    },
    {
      name: "Hailakandi South Hub",
      city: "Hailakandi, Assam",
      amenities: ["RO Drinking Water", "Fast Phone Charging", "Restroom Access", "Shaded Waiting Area"],
    },
    {
      name: "Silchar Central Hub",
      city: "Silchar, Assam",
      amenities: ["RO Drinking Water", "Fast Phone Charging", "Clean Restrooms", "Partner Break Area"],
    },
  ],
};
