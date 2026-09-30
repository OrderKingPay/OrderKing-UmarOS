import { getSql, type Sql } from "../../db";
import { getWeeklyCycle } from "./weekly-settlement";

/**
 * OrderKing weekly reconciliation.
 * Source of truth: real orders + real immutable ledger_entries.
 * This job ONLY reconciles and queues auditable payout batches. It never moves
 * external money by itself and never reports a payout as completed without a
 * verified provider callback.
 */
export const AutoSettlementEngine = {
  async runGlobalWeeklyReconciliation(referenceDate: Date = new Date()) {
    const cycle = getWeeklyCycle(referenceDate);
    const sql = await getSql();

    let queued = 0;
    let escalated = 0;

    const results = await sql.transaction(async (tx: Sql) => {
      const restaurantStats = await tx.query<any>(`
        WITH delivered AS (
          SELECT
            o.restaurant_id,
            MAX(o.org_id) AS org_id,
            COUNT(*)::int AS order_count,
            COALESCE(SUM(o.food_paise),0)::bigint AS gross_food_paise,
            COALESCE(SUM(o.tax_paise),0)::bigint AS recorded_tax_paise,
            COALESCE(SUM(o.commission_paise),0)::bigint AS recorded_commission_paise
          FROM orders o
          WHERE o.status = 'DELIVERED'
            AND o.placed_at >= $1::timestamptz
            AND o.placed_at < ($2::date + INTERVAL '1 day')
          GROUP BY o.restaurant_id
        ),
        ledger AS (
          SELECT
            le.restaurant_id,
            COALESCE(SUM(CASE WHEN le.kind = 'restaurant_settlement' THEN le.amount_paise ELSE 0 END),0)::bigint AS net_settlement_paise,
            COALESCE(SUM(CASE WHEN le.kind IN ('commission','payment_fee','service_fee','tax','restaurant_funded_discount') THEN ABS(le.amount_paise) ELSE 0 END),0)::bigint AS fee_paise
          FROM ledger_entries le
          WHERE le.party = 'RESTAURANT'
            AND le.created_at >= $1::timestamptz
            AND le.created_at < ($2::date + INTERVAL '1 day')
          GROUP BY le.restaurant_id
        )
        SELECT
          r.id AS restaurant_id,
          r.name AS restaurant_name,
          r.active,
          d.org_id,
          d.order_count,
          d.gross_food_paise,
          d.recorded_tax_paise,
          d.recorded_commission_paise,
          COALESCE(l.net_settlement_paise,0)::bigint AS net_settlement_paise,
          COALESCE(l.fee_paise,0)::bigint AS fee_paise
        FROM delivered d
        JOIN restaurants r ON r.id = d.restaurant_id
        LEFT JOIN ledger l ON l.restaurant_id = d.restaurant_id
        ORDER BY r.name ASC
      `, [cycle.startDate, cycle.endDate]);

      const out = [];

      for (const stat of restaurantStats) {
        const idempotencyKey = `stl_rest_${stat.restaurant_id}_${cycle.cycleId}`;
        const existing = await tx.query(
          `SELECT id, status, payable_paise FROM settlement_batches WHERE reason LIKE $1 LIMIT 1`,
          [`%idempotency:${idempotencyKey}%`],
        );
        if (existing.length > 0) {
          out.push(existing[0]);
          continue;
        }

        const payable = Number(stat.net_settlement_paise);
        const gross = Number(stat.gross_food_paise);
        const fees = Math.max(0, gross - payable);

        let status = "PENDING_PROVIDER";
        let reason = `RECONCILED_FROM_LEDGER; idempotency:${idempotencyKey}`;

        if (payable < 0) {
          status = "ESCALATED_NEGATIVE";
          reason += "; negative payable detected";
          escalated++;
        } else if (!stat.active) {
          status = "ESCALATED_INACTIVE";
          reason += "; restaurant is inactive";
          escalated++;
        } else if (!stat.org_id) {
          status = "ESCALATED_NO_ORG";
          reason += "; organization mapping missing";
          escalated++;
        } else {
          queued++;
        }

        const batchId = `stl_${stat.restaurant_id}_${cycle.cycleId}`;
        const inserted = await tx.query<any>(
          `INSERT INTO settlement_batches (
             id, org_id, party_type, party_id, party_name, payable_paise, status,
             reason, created_at, gross_paise, fee_paise, net_paise
           )
           VALUES ($1,$2,'RESTAURANT',$3,$4,$5,$6,$7,NOW(),$8,$9,$10)
           ON CONFLICT (id) DO NOTHING
           RETURNING id, status, payable_paise`,
          [
            batchId,
            stat.org_id ?? "UNMAPPED",
            stat.restaurant_id,
            stat.restaurant_name,
            Math.max(0, payable),
            status,
            reason,
            gross,
            fees,
            payable,
          ],
        );
        if (inserted.length) out.push(inserted[0]);
      }

      return out;
    });

    return {
      success: true,
      cycle: cycle.cycleId,
      queued: results.filter((x: any) => x.status === "PENDING_PROVIDER").length,
      escalated,
      status: "RECONCILED",
      message: "Weekly settlement reconciled from recorded ledger entries. No external payout is claimed until provider confirmation.",
    };
  },
};
