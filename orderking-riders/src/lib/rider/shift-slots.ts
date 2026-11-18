import {
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
} from "./money";

export type ShiftSlot = {
  id: string;
  label: string;
  window: string;
  durationHours: number;
  tag: string;
  baseFarePaise: number;
  distanceRatePaise: number;
  peakIncentiveNote: string;
};

export const OPERATIONAL_SHIFT_SLOTS: ReadonlyArray<ShiftSlot> = [
  {
    id: "morning_07_11",
    label: "Morning",
    window: "07:00–11:00",
    durationHours: 4,
    tag: "Breakfast Dispatch",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 (first 2 km) + ₹12/km distance pay · ₹1/min wait pay after 6m",
  },
  {
    id: "lunch_peak_1130_1530",
    label: "Lunch Peak",
    window: "11:30–15:30",
    durationHours: 4,
    tag: "High-Demand Lunch Peak",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · High order density toward Daily Milestone slabs",
  },
  {
    id: "evening_16_19",
    label: "Evening",
    window: "16:00–19:00",
    durationHours: 3,
    tag: "Snack & Tiffin",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 (first 2 km) + ₹12/km distance pay · Short-radius trips",
  },
  {
    id: "dinner_peak_19_2330",
    label: "Dinner Peak",
    window: "19:00–23:30",
    durationHours: 4.5,
    tag: "Prime Dinner Peak Slot",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · Peak dispatch priority & kitchen wait-time pay",
  },
  {
    id: "late_night_23_02",
    label: "Late Night",
    window: "23:00–02:00",
    durationHours: 3,
    tag: "Night Operations",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · 24x7 SOS rider safety support active",
  },
];

export const BOOKED_GIGS_STORAGE_KEY = "ok_rider_booked_gigs_v1";

export function getIsoDateOffset(daysOffset: number): string {
  const d = new Date(Date.now() + daysOffset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export interface MinimumGuaranteeCriteria {
  minLoggedHours: number; // e.g. 4.0 hours
  minAcceptanceRatePct: number; // >= 80%
  maxUnexcusedCancellations: number; // 0
  minCompletedOrders: number; // e.g. 5 trips
  guaranteeAmountPaise: number; // e.g. ₹500 (50,000 paise)
}

export interface MinimumGuaranteeEvaluation {
  eligible: boolean;
  loggedHours: number;
  acceptanceRatePct: number;
  cancellations: number;
  completedOrders: number;
  guaranteeAmountPaise: number;
  actualEarningsPaise: number;
  topUpDuePaise: number;
  reasons: string[];
}

/**
 * Calculates Minimum Guarantee (MG) eligibility for booked shift slots.
 * Criteria: Logged-in hours, minimum acceptance rate (≥80%), zero unexcused cancellations.
 */
export function evaluateMinimumGuaranteeEligibility(
  actual: {
    loggedHours: number;
    acceptanceRatePct: number;
    unexcusedCancellations: number;
    completedOrders: number;
    earnedPaise: number;
  },
  criteria: MinimumGuaranteeCriteria = {
    minLoggedHours: 4,
    minAcceptanceRatePct: 80,
    maxUnexcusedCancellations: 0,
    minCompletedOrders: 5,
    guaranteeAmountPaise: 50000,
  },
): MinimumGuaranteeEvaluation {
  const reasons: string[] = [];

  if (actual.loggedHours < criteria.minLoggedHours) {
    reasons.push(
      `Logged hours (${actual.loggedHours.toFixed(1)}h) below minimum required ${criteria.minLoggedHours}h`,
    );
  }
  if (actual.acceptanceRatePct < criteria.minAcceptanceRatePct) {
    reasons.push(
      `Acceptance Rate (${actual.acceptanceRatePct}%) below minimum required ${criteria.minAcceptanceRatePct}%`,
    );
  }
  if (actual.unexcusedCancellations > criteria.maxUnexcusedCancellations) {
    reasons.push(
      `Unexcused cancellations (${actual.unexcusedCancellations}) exceeded zero-tolerance threshold`,
    );
  }
  if (actual.completedOrders < criteria.minCompletedOrders) {
    reasons.push(
      `Completed trips (${actual.completedOrders}) below minimum shift quota of ${criteria.minCompletedOrders}`,
    );
  }

  const eligible = reasons.length === 0;
  const topUpDuePaise = eligible
    ? Math.max(0, criteria.guaranteeAmountPaise - actual.earnedPaise)
    : 0;

  return {
    eligible,
    loggedHours: actual.loggedHours,
    acceptanceRatePct: actual.acceptanceRatePct,
    cancellations: actual.unexcusedCancellations,
    completedOrders: actual.completedOrders,
    guaranteeAmountPaise: criteria.guaranteeAmountPaise,
    actualEarningsPaise: actual.earnedPaise,
    topUpDuePaise,
    reasons,
  };
}
