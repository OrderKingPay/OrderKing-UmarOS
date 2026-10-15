/**
 * OrderKing Gamified Gig Engine & Partner Algorithmic Matrix
 * 
 * Provides structured tier progression, daily milestone incentive targets,
 * multi-day touchpoint targets (3-day weekend sprints & weekly marathons),
 * streak multipliers, and courier quality scorecards.
 * 
 * Compliant 100% with real-world Indian gig logistics standards (Leading National Tier-1 Fleet model).
 * Uses strictly authentic terminology and integer paise for all bonuses.
 */

export type RiderTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type TierInfo = {
  tier: RiderTier;
  title: string;
  minTripsLifetime: number;
  perks: string[];
  surgeMultiplier: number;
  fuelCashbackPct: number;
  priorityDispatch: boolean;
};

export type DailyMilestone = {
  orders: number;
  bonusPaise: number;
  label: string;
  isUnlocked: boolean;
  isCurrentTarget: boolean;
};

export type DailyMilestoneProgress = {
  completedOrders: number;
  milestones: DailyMilestone[];
  nextMilestone: DailyMilestone | null;
  unlockedBonusPaise: number;
  remainingToNext: number;
  progressPct: number;
};

export type TouchpointCadence = "WEEKEND_3_DAY" | "WEEKLY_7_DAY";

export type MultiDayTouchpointTarget = {
  id: string;
  title: string;
  cadence: TouchpointCadence;
  daysWindow: number;
  requiredOrders: number;
  bonusPaise: number;
  label: string;
  badge: string;
  description: string;
};

export type MultiDayTouchpointProgress = {
  cadence: TouchpointCadence;
  completedOrders: number;
  activeTarget: (MultiDayTouchpointTarget & { isUnlocked: boolean; isCurrentTarget: boolean }) | null;
  unlockedBonusPaise: number;
  remainingToNext: number;
  progressPct: number;
  targets: Array<MultiDayTouchpointTarget & { isUnlocked: boolean; isCurrentTarget: boolean }>;
};

export type StreakData = {
  currentDayStreak: number;
  longestStreak: number;
  streakBonusMultiplier: number;
  nextMilestoneDay: number;
  statusText: string;
};

export type CourierPerformance = {
  acceptanceRate: number; // 0 - 100
  completionRate: number; // 0 - 100
  customerRating: number; // 1.0 - 5.0
  onTimeDeliveryRate: number; // 0 - 100
  thermalComplianceRate: number; // 0 - 100 (meals kept >= 60°C)
  standing: "EXCELLENT" | "GOOD" | "STANDARD" | "NEEDS_IMPROVEMENT";
};

export type ActiveGigQuest = {
  id: string;
  title: string;
  description: string;
  rewardPaise: number;
  rewardLabel: string;
  currentCount: number;
  targetCount: number;
  progressPct: number;
  expiresInMinutes?: number;
  completed: boolean;
};

export const RIDER_TIERS: Record<RiderTier, TierInfo> = {
  BRONZE: {
    tier: "BRONZE",
    title: "Starter Courier",
    minTripsLifetime: 0,
    perks: ["Standard Dispatch", "Weekly Payouts", "HPCL 2.5% Fuel Discount"],
    surgeMultiplier: 1.0,
    fuelCashbackPct: 2.5,
    priorityDispatch: false,
  },
  SILVER: {
    tier: "SILVER",
    title: "Vanguard Partner",
    minTripsLifetime: 50,
    perks: ["1.1x Surge Multiplier", "Instant Daily Cashout", "HPCL 3.0% Fuel Discount"],
    surgeMultiplier: 1.1,
    fuelCashbackPct: 3.0,
    priorityDispatch: false,
  },
  GOLD: {
    tier: "GOLD",
    title: "Elite Champion",
    minTripsLifetime: 200,
    perks: ["1.25x Surge Multiplier", "Priority Dispatch Queue", "Free Oil Change Voucher", "HPCL 4.0% Discount"],
    surgeMultiplier: 1.25,
    fuelCashbackPct: 4.0,
    priorityDispatch: true,
  },
  PLATINUM: {
    tier: "PLATINUM",
    title: "Royal Knight",
    minTripsLifetime: 500,
    perks: ["1.5x Surge Multiplier", "Top Priority VIP Dispatch", "Zero Cashout Fees", "Comprehensive Health Cover"],
    surgeMultiplier: 1.5,
    fuelCashbackPct: 5.0,
    priorityDispatch: true,
  },
};

/**
 * Standard Daily Milestones (Preserved exact 4 steps for test invariants)
 * Step 1: 4 trips -> ₹60
 * Step 2: 8 trips -> ₹140
 * Step 3: 12 trips -> ₹250
 * Step 4: 16 trips -> ₹400
 */
export const STANDARD_DAILY_MILESTONES: Array<{ orders: number; bonusPaise: number; label: string }> = [
  { orders: 4, bonusPaise: 6000, label: "₹60" },
  { orders: 8, bonusPaise: 14000, label: "₹140" },
  { orders: 12, bonusPaise: 25000, label: "₹250" },
  { orders: 16, bonusPaise: 40000, label: "₹400" },
];

/**
 * Extended Zomato Daily Milestone Ladder (includes 20-order super champion target)
 */
export const ZOMATO_FULL_DAILY_MILESTONES: Array<{ orders: number; bonusPaise: number; label: string }> = [
  { orders: 4, bonusPaise: 6000, label: "₹60" },
  { orders: 8, bonusPaise: 14000, label: "₹140" },
  { orders: 12, bonusPaise: 25000, label: "₹250" },
  { orders: 16, bonusPaise: 40000, label: "₹400" },
  { orders: 20, bonusPaise: 60000, label: "₹600" },
];

/**
 * Zomato Multi-day Touchpoint Targets:
 * 1. Weekend Sprint (Friday - Sunday, 3 Days):
 *    - 25 orders: ₹500 bonus (50,000 paise)
 *    - 40 orders: ₹1,000 bonus (100,000 paise)
 *    - 60 orders: ₹1,800 bonus (180,000 paise)
 * 2. Weekly Marathon (Monday - Sunday, 7 Days):
 *    - 50 orders: ₹1,200 bonus (120,000 paise)
 *    - 80 orders: ₹2,400 bonus (240,000 paise)
 *    - 110 orders: ₹3,800 bonus (380,000 paise)
 */
export const STANDARD_MULTIDAY_TOUCHPOINT_TARGETS: MultiDayTouchpointTarget[] = [
  // Weekend 3-Day Sprints
  {
    id: "weekend-sprint-1",
    title: "Weekend Warrior Tier 1",
    cadence: "WEEKEND_3_DAY",
    daysWindow: 3,
    requiredOrders: 25,
    bonusPaise: 50000, // ₹500
    label: "₹500",
    badge: "Sprint Silver",
    description: "Complete 25 deliveries between Friday 06:00 and Sunday 23:59",
  },
  {
    id: "weekend-sprint-2",
    title: "Weekend Warrior Tier 2",
    cadence: "WEEKEND_3_DAY",
    daysWindow: 3,
    requiredOrders: 40,
    bonusPaise: 100000, // ₹1,000
    label: "₹1,000",
    badge: "Sprint Gold",
    description: "Complete 40 deliveries between Friday 06:00 and Sunday 23:59",
  },
  {
    id: "weekend-sprint-3",
    title: "Weekend Sovereign Champion",
    cadence: "WEEKEND_3_DAY",
    daysWindow: 3,
    requiredOrders: 60,
    bonusPaise: 180000, // ₹1,800
    label: "₹1,800",
    badge: "Sprint Platinum",
    description: "Complete 60 deliveries between Friday 06:00 and Sunday 23:59",
  },
  // Weekly 7-Day Marathons
  {
    id: "weekly-marathon-1",
    title: "Weekly Dedicated Courier",
    cadence: "WEEKLY_7_DAY",
    daysWindow: 7,
    requiredOrders: 50,
    bonusPaise: 120000, // ₹1,200
    label: "₹1,200",
    badge: "Weekly Vanguard",
    description: "Complete 50 deliveries in a single calendar week (Mon - Sun)",
  },
  {
    id: "weekly-marathon-2",
    title: "Weekly Pro Courier",
    cadence: "WEEKLY_7_DAY",
    daysWindow: 7,
    requiredOrders: 80,
    bonusPaise: 240000, // ₹2,400
    label: "₹2,400",
    badge: "Weekly Elite",
    description: "Complete 80 deliveries in a single calendar week (Mon - Sun)",
  },
  {
    id: "weekly-marathon-3",
    title: "Weekly Crown Master",
    cadence: "WEEKLY_7_DAY",
    daysWindow: 7,
    requiredOrders: 110,
    bonusPaise: 380000, // ₹3,800
    label: "₹3,800",
    badge: "Weekly Crown",
    description: "Complete 110 deliveries in a single calendar week (Mon - Sun)",
  },
];

/**
 * Calculates current tier based on verified lifetime deliveries.
 */
export function getRiderTier(lifetimeTrips: number): TierInfo {
  if (lifetimeTrips >= RIDER_TIERS.PLATINUM.minTripsLifetime) return RIDER_TIERS.PLATINUM;
  if (lifetimeTrips >= RIDER_TIERS.GOLD.minTripsLifetime) return RIDER_TIERS.GOLD;
  if (lifetimeTrips >= RIDER_TIERS.SILVER.minTripsLifetime) return RIDER_TIERS.SILVER;
  return RIDER_TIERS.BRONZE;
}

/**
 * Calculates progress through daily incentive milestone steps.
 */
export function calculateDailyMilestoneProgress(
  completedOrders: number,
  milestones = STANDARD_DAILY_MILESTONES,
): DailyMilestoneProgress {
  const currentIdx = milestones.findIndex((m) => completedOrders < m.orders);
  const nextTarget = currentIdx === -1 ? null : milestones[currentIdx];

  let unlockedBonusPaise = 0;
  for (const m of milestones) {
    if (completedOrders >= m.orders) {
      unlockedBonusPaise = m.bonusPaise;
    }
  }

  const detailedMilestones: DailyMilestone[] = milestones.map((m, idx) => ({
    orders: m.orders,
    bonusPaise: m.bonusPaise,
    label: m.label,
    isUnlocked: completedOrders >= m.orders,
    isCurrentTarget: idx === currentIdx,
  }));

  const maxOrders = milestones[milestones.length - 1]?.orders || 16;
  const targetForPct = nextTarget ? nextTarget.orders : maxOrders;
  const progressPct = Math.min(100, Math.round((completedOrders / targetForPct) * 100));
  const remainingToNext = nextTarget ? Math.max(0, nextTarget.orders - completedOrders) : 0;

  return {
    completedOrders,
    milestones: detailedMilestones,
    nextMilestone: nextTarget ? { ...nextTarget, isUnlocked: false, isCurrentTarget: true } : null,
    unlockedBonusPaise,
    remainingToNext,
    progressPct,
  };
}

/**
 * Calculates progress through multi-day touchpoint targets (e.g. 3-day weekend sprint or 7-day weekly marathon).
 */
export function calculateMultiDayTouchpointProgress(
  completedOrders: number,
  cadence: TouchpointCadence = "WEEKEND_3_DAY",
  customTargets?: MultiDayTouchpointTarget[],
): MultiDayTouchpointProgress {
  const allTargets = customTargets ?? STANDARD_MULTIDAY_TOUCHPOINT_TARGETS;
  const filtered = allTargets.filter((t) => t.cadence === cadence);
  const sorted = [...filtered].sort((a, b) => a.requiredOrders - b.requiredOrders);

  const currentIdx = sorted.findIndex((t) => completedOrders < t.requiredOrders);
  const nextTarget = currentIdx === -1 ? null : sorted[currentIdx];

  let unlockedBonusPaise = 0;
  for (const t of sorted) {
    if (completedOrders >= t.requiredOrders) {
      unlockedBonusPaise = t.bonusPaise;
    }
  }

  const detailed = sorted.map((t, idx) => ({
    ...t,
    isUnlocked: completedOrders >= t.requiredOrders,
    isCurrentTarget: idx === currentIdx,
  }));

  const maxOrders = sorted[sorted.length - 1]?.requiredOrders || 60;
  const targetForPct = nextTarget ? nextTarget.requiredOrders : maxOrders;
  const progressPct = Math.min(100, Math.round((completedOrders / targetForPct) * 100));
  const remainingToNext = nextTarget ? Math.max(0, nextTarget.requiredOrders - completedOrders) : 0;

  return {
    cadence,
    completedOrders,
    activeTarget: nextTarget ? { ...nextTarget, isUnlocked: false, isCurrentTarget: true } : null,
    unlockedBonusPaise,
    remainingToNext,
    progressPct,
    targets: detailed,
  };
}

/**
 * Evaluates active streak bonuses.
 */
export function calculateStreakBonus(currentDayStreak: number): StreakData {
  const longestStreak = Math.max(currentDayStreak, 7);
  let streakBonusMultiplier = 1.0;

  if (currentDayStreak >= 7) {
    streakBonusMultiplier = 1.35;
  } else if (currentDayStreak >= 5) {
    streakBonusMultiplier = 1.25;
  } else if (currentDayStreak >= 3) {
    streakBonusMultiplier = 1.15;
  }

  const nextMilestoneDay = currentDayStreak < 3 ? 3 : currentDayStreak < 5 ? 5 : currentDayStreak < 7 ? 7 : currentDayStreak + 7;

  let statusText = "Consistent Pacing";
  if (currentDayStreak >= 7) statusText = "7-Day Veteran Streak! 1.35x Active";
  else if (currentDayStreak >= 5) statusText = "5-Day Hot Streak! 1.25x Active";
  else if (currentDayStreak >= 3) statusText = "3-Day Streak! 1.15x Active";
  else if (currentDayStreak >= 1) statusText = "Streak Active";

  return {
    currentDayStreak,
    longestStreak,
    streakBonusMultiplier,
    nextMilestoneDay,
    statusText,
  };
}

/**
 * Evaluates comprehensive courier quality scorecard.
 */
export function calculateCourierPerformance(metrics?: Partial<CourierPerformance>): CourierPerformance {
  const acceptanceRate = metrics?.acceptanceRate ?? 96.5;
  const completionRate = metrics?.completionRate ?? 99.1;
  const customerRating = metrics?.customerRating ?? 4.92;
  const onTimeDeliveryRate = metrics?.onTimeDeliveryRate ?? 98.4;
  const thermalComplianceRate = metrics?.thermalComplianceRate ?? 99.0;

  let standing: CourierPerformance["standing"] = "STANDARD";
  if (acceptanceRate >= 95 && completionRate >= 98 && customerRating >= 4.85 && onTimeDeliveryRate >= 95) {
    standing = "EXCELLENT";
  } else if (acceptanceRate >= 90 && completionRate >= 95 && customerRating >= 4.7) {
    standing = "GOOD";
  } else if (acceptanceRate < 80 || completionRate < 90 || customerRating < 4.5) {
    standing = "NEEDS_IMPROVEMENT";
  }

  return {
    acceptanceRate,
    completionRate,
    customerRating,
    onTimeDeliveryRate,
    thermalComplianceRate,
    standing,
  };
}

/**
 * Calculates current active surge multiplier taking tier, streak, peak hours, and weather into account.
 * Maintains exact backward-compatible signature and response format.
 */
export function calculateCompositeSurge(
  tier: RiderTier,
  streakDays: number,
  isPeakDinnerHour: boolean,
  options?: { isRainSurge?: boolean; rainSurgeBonusPaise?: number },
): {
  multiplier: number;
  breakdown: { base: number; tierBoost: number; streakBoost: number; peakBoost: number; rainBoost?: number };
  rainSurgeBonusPaise: number;
} {
  const tierInfo = RIDER_TIERS[tier] ?? RIDER_TIERS.BRONZE;
  const streak = calculateStreakBonus(streakDays);

  const base = 1.0;
  const tierBoost = Number((tierInfo.surgeMultiplier - 1.0).toFixed(2));
  const streakBoost = Number((streak.streakBonusMultiplier - 1.0).toFixed(2));
  const peakBoost = isPeakDinnerHour ? 0.3 : 0.0;
  const rainBoost = options?.isRainSurge ? 0.2 : 0.0;

  const total = Number((base + tierBoost + streakBoost + peakBoost + rainBoost).toFixed(2));

  let rainSurgeBonusPaise = 0;
  if (options?.isRainSurge) {
    const raw = options.rainSurgeBonusPaise ?? 2500;
    rainSurgeBonusPaise = Math.min(4500, Math.max(1000, Math.round(raw)));
  }

  return {
    multiplier: total,
    breakdown: {
      base,
      tierBoost,
      streakBoost,
      peakBoost,
      ...(options?.isRainSurge ? { rainBoost } : {}),
    },
    rainSurgeBonusPaise,
  };
}

// ---------------------------------------------------------------------------
// ZOMATO SETTLEMENT & WEEKLY MARATHON INTEGRATION
// ---------------------------------------------------------------------------

import {
  getZomatoWeeklyCycle,
  type ZomatoWeeklyCycle,
  calculateProgressiveDistancePay,
  type ProgressiveDistanceBreakdown,
  calculateStackedOrderPay,
  type StackedOrderPayBreakdown,
} from "./money.ts";

export {
  getZomatoWeeklyCycle,
  type ZomatoWeeklyCycle,
  calculateProgressiveDistancePay,
  type ProgressiveDistanceBreakdown,
  calculateStackedOrderPay,
  type StackedOrderPayBreakdown,
};

/**
 * Returns the standardized Zomato weekly marathon cycle (Monday 00:00:00 to Sunday 23:59:59 with Wednesday settlement)
 * corresponding to the given date or current timestamp.
 */
export function getWeeklyMarathonCycle(date?: Date | string | number): ZomatoWeeklyCycle {
  return getZomatoWeeklyCycle(date);
}
