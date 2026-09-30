// @ts-nocheck
/**
 * OrderKing weekly settlement period utilities.
 * Dates are calculated in India Standard Time (UTC+05:30) and returned as
 * YYYY-MM-DD calendar dates. Tax/fee figures are supplied by the real ledger
 * or configured rules; this module does not claim external aggregator formulas.
 */
export type WeeklyCyclePeriod = {
  cycleId: string;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: "OPEN" | "RECONCILING" | "DISBURSED";
};

export function getWeeklyCycle(referenceDate = new Date()): WeeklyCyclePeriod {
  const IST_OFFSET_MS = 330 * 60 * 1000;
  const shifted = new Date(referenceDate.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const d = shifted.getUTCDate();
  const day = shifted.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;

  const monday = new Date(Date.UTC(y, m, d - daysSinceMonday));
  const sunday = new Date(Date.UTC(y, m, d - daysSinceMonday + 6));
  const payoutWednesday = new Date(Date.UTC(y, m, d - daysSinceMonday + 9));

  const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
  const endDate = dateOnly(sunday);
  const payoutDate = dateOnly(payoutWednesday);

  const todayIst = dateOnly(shifted);
  const status =
    todayIst > payoutDate ? "DISBURSED" :
    todayIst === dateOnly(monday) ? "RECONCILING" :
    "OPEN";

  return {
    cycleId: `cycle_${dateOnly(monday)}_to_${endDate}`,
    startDate: dateOnly(monday),
    endDate,
    payoutDate,
    status,
  };
}
