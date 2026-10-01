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


export async function buildWeeklySettlementReport(referenceDate = new Date(), orgId?: string) {
  const cycle = getWeeklyCycle(referenceDate);
  const { getSql } = await import("../../db");
  const sql = await getSql();

  const rows = await sql<{
    id: string;
    party_type: string;
    party_id: string;
    party_name: string;
    gross_paise: number;
    fee_paise: number;
    net_paise: number;
    payable_paise: number;
    status: string;
    external_reference: string | null;
    created_at: string;
    paid_at: string | null;
  }>`
    SELECT id, party_type, party_id, party_name,
           gross_paise, fee_paise, net_paise, payable_paise,
           status, external_reference,
           created_at::text AS created_at,
           paid_at::text AS paid_at
    FROM settlement_batches
    WHERE created_at >= ${cycle.startDate}::timestamptz
      AND created_at < (${cycle.endDate}::date + INTERVAL '1 day')
      AND (${orgId ?? null} IS NULL OR org_id = ${orgId ?? null})
    ORDER BY party_name ASC, created_at ASC
  `;

  const totals = rows.reduce(
    (acc, row) => ({
      grossPaise: acc.grossPaise + Number(row.gross_paise || 0),
      feePaise: acc.feePaise + Number(row.fee_paise || 0),
      netPaise: acc.netPaise + Number(row.net_paise || 0),
      payablePaise: acc.payablePaise + Number(row.payable_paise || 0),
    }),
    { grossPaise: 0, feePaise: 0, netPaise: 0, payablePaise: 0 },
  );

  const statusBreakdown = rows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status || "UNKNOWN");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    cycle,
    generatedAt: new Date().toISOString(),
    rows,
    totals,
    statusBreakdown,
    source: "settlement_batches",
    definition: "PAID requires verified provider confirmation; PENDING_PROVIDER means reconciled but not externally disbursed.",
  };
}
