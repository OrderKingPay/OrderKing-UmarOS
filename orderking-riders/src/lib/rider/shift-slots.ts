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
    peakIncentiveNote: "Base ₹35 (first 2 km) + ₹12/km distance pay · ₹1/min wait pay after 10m",
  },
  {
    id: "lunch_peak_12_1530",
    label: "Lunch Peak",
    window: "12:00–15:30",
    durationHours: 3.5,
    tag: "High-Demand Peak",
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
    id: "dinner_peak_19_23",
    label: "Dinner Peak",
    window: "19:00–23:00",
    durationHours: 4,
    tag: "Prime Peak Slot",
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
