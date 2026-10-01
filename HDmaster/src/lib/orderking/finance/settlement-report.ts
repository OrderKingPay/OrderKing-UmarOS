// @ts-nocheck
import { getSql } from "../../db";
import { getWeeklyCycle } from "./weekly-settlement";

export async function getWeeklySettlementReport(restaurantId: string, referenceDate: Date = new Date()) {
  const cycle = getWeeklyCycle(referenceDate);
  const sql = await getSql();

  const rows = await sql.query(
    "SELECT r.id restaurant_id, r.name restaurant_name, " +
    "COUNT(o.id)::int orders, COALESCE(SUM(o.food_paise),0)::bigint gross_food_paise, " +
    "COALESCE(SUM(o.tax_paise),0)::bigint tax_paise, COALESCE(SUM(o.commission_paise),0)::bigint commission_paise, " +
    "COALESCE(SUM(o.delivery_fee_paise),0)::bigint delivery_fee_paise, COALESCE(SUM(o.service_fee_paise),0)::bigint service_fee_paise, " +
    "COALESCE(SUM(o.restaurant_discount_paise),0)::bigint restaurant_discount_paise, " +
    "COALESCE(SUM(o.platform_discount_paise),0)::bigint platform_discount_paise, " +
    "COALESCE((SELECT SUM(le.amount_paise) FROM ledger_entries le WHERE le.restaurant_id=o.restaurant_id " +
    "AND le.kind='restaurant_settlement' AND le.created_at >= $2 AND le.created_at < ($3::date + INTERVAL '1 day')),0)::bigint ledger_net_paise " +
    "FROM restaurants r LEFT JOIN orders o ON o.restaurant_id=r.id AND o.status='DELIVERED' " +
    "AND o.placed_at >= $2 AND o.placed_at < ($3::date + INTERVAL '1 day') " +
    "WHERE r.id=$1 GROUP BY r.id, r.name LIMIT 1",
    [restaurantId, cycle.startDate, cycle.endDate],
  );

  const row = rows[0];
  if (!row) throw new Error("RESTAURANT_NOT_FOUND");

  const expectedNet =
    Number(row.gross_food_paise)
    - Number(row.restaurant_discount_paise)
    - Number(row.commission_paise)
    + Number(row.platform_discount_paise);

  const reconciliationDelta = Number(row.ledger_net_paise) - expectedNet;

  return {
    cycle: { id: cycle.cycleId, startDate: cycle.startDate, endDate: cycle.endDate, cadence: "WEEKLY" },
    restaurant: { id: row.restaurant_id, name: row.restaurant_name },
    sales: { deliveredOrders: Number(row.orders), grossFoodPaise: Number(row.gross_food_paise) },
    deductions: {
      restaurantDiscountPaise: Number(row.restaurant_discount_paise),
      platformCommissionPaise: Number(row.commission_paise),
      taxPaise: Number(row.tax_paise),
      deliveryFeePaise: Number(row.delivery_fee_paise),
      serviceFeePaise: Number(row.service_fee_paise),
    },
    payout: {
      expectedNetPaise: expectedNet,
      ledgerNetPaise: Number(row.ledger_net_paise),
      reconciliationDeltaPaise: reconciliationDelta,
      status: reconciliationDelta === 0 ? "RECONCILED" : "ESCALATED_RECONCILIATION",
      externalTransferStatus: "NOT_CLAIMED",
    },
  };
}
