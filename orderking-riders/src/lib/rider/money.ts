/** Integer paise internally. Never invent earnings — callers supply ledger values. */

export const PAISE_PER_RUPEE = 100;

export function paise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function formatPaise(amountPaise: number, locale = "en-IN"): string {
  const sign = amountPaise < 0 ? "-" : "";
  const abs = Math.abs(amountPaise);
  const rupees = Math.floor(abs / 100);
  const frac = abs % 100;
  const grouped = rupees.toLocaleString(locale);
  return `${sign}₹${grouped}.${String(frac).padStart(2, "0")}`;
}

export function assertNonNegativePaise(amountPaise: number): void {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new Error("Amount must be a non-negative integer (paise)");
  }
}

export function sumPaise(lines: ReadonlyArray<{ amountPaise: number }>): number {
  return lines.reduce((acc, l) => acc + l.amountPaise, 0);
}

/** Statutory minimum base fare floor: ₹35 (3,500 paise) */
export const STATUTORY_BASE_FARE_PAISE = 3500;

/** Distance included in the base fare: 2 km */
export const STATUTORY_BASE_DISTANCE_KM = 2;

/** Distance rate beyond base distance: ₹12/km (1,200 paise/km) */
export const STATUTORY_DISTANCE_RATE_PER_KM_PAISE = 1200;

/**
 * Calculates rider payout enforcing statutory ₹35 base fare floor (3,500 paise)
 * plus distance rate (₹12/km beyond 2km).
 *
 * @param distanceKm Total route distance in kilometers
 * @param customRatePerKmPaise Distance rate in paise/km (defaults to ₹12 = 1200 paise)
 * @param baseDistanceKm Base distance included in base fare (defaults to 2 km)
 * @returns Total calculated payout in paise (guaranteed >= 3500 paise)
 */
export function calculateRiderPayout(
  distanceKm: number,
  customRatePerKmPaise = STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  baseDistanceKm = STATUTORY_BASE_DISTANCE_KM,
): number {
  const dist = Math.max(0, Number.isFinite(distanceKm) ? distanceKm : 0);
  const extraKm = Math.max(0, dist - baseDistanceKm);
  const distanceFarePaise = Math.round(extraKm * customRatePerKmPaise);
  const totalPaise = STATUTORY_BASE_FARE_PAISE + distanceFarePaise;
  return Math.max(STATUTORY_BASE_FARE_PAISE, totalPaise);
}

/**
 * Strictly enforces the statutory minimum floor of ₹35 (3,500 paise) on any payout.
 */
export function enforcePayoutFloor(amountPaise: number): number {
  const amount = Number.isFinite(amountPaise) ? Math.round(amountPaise) : STATUTORY_BASE_FARE_PAISE;
  return Math.max(STATUTORY_BASE_FARE_PAISE, amount);
}

