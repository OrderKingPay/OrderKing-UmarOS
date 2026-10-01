// @ts-nocheck
import { getSql } from "@/lib/db";
import { newId } from "@/lib/ids";
export async function detectFinancialAnomalies() {
  const sql = await getSql();
  const refundAnomalies = await sql.query(`
    SELECT restaurant_id, COUNT(*) as total_orders, SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_orders
    FROM orders WHERE created_at > NOW() - INTERVAL '24 HOURS' GROUP BY restaurant_id
    HAVING (SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.15 AND COUNT(*) > 10
  `);
  const codAnomalies = await sql.query(`
    SELECT customer_id, COUNT(*) as cod_orders, SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_cod
    FROM orders WHERE payment_status IN ('PENDING_COD','pending_cod') AND created_at > NOW() - INTERVAL '7 DAYS'
    GROUP BY customer_id HAVING (SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.5 AND COUNT(*) > 3
  `);
  const founders = (process.env.ORDERKING_FOUNDER_EMAILS || "").split(",").map((v) => v.trim()).filter(Boolean);
  const anomalies = [
    ...refundAnomalies.map((row: any) => ({
      kind: "FINANCIAL_REFUND_VELOCITY",
      title: "Critical refund-rate anomaly",
      body: `Restaurant ${row.restaurant_id} has ${row.refunded_orders}/${row.total_orders} refunded orders in the last 24h.`,
      evidence: row,
    })),
    ...codAnomalies.map((row: any) => ({
      kind: "FINANCIAL_COD_CANCELLATION_VELOCITY",
      title: "Critical COD-cancellation anomaly",
      body: `Customer ${row.customer_id} has ${row.cancelled_cod}/${row.cod_orders} cancelled COD orders in the last 7d.`,
      evidence: row,
    })),
  ];
  for (const anomaly of anomalies) {
    const recent = await sql<{ id: string }[]>`SELECT id FROM alerts WHERE kind=${anomaly.kind} AND status='OPEN' AND created_at>NOW()-INTERVAL '24 HOURS' LIMIT 1`;
    if (recent.length) continue;
    const alertId = newId("alert");
    await sql`INSERT INTO alerts (id,org_id,severity,kind,title,body,status) VALUES (${alertId},'org_orderking','CRITICAL',${anomaly.kind},${anomaly.title},${anomaly.body},'OPEN')`;
    const outboxId = newId("nbox");
    await sql`INSERT INTO notification_outbox (id,channel,status,payload) VALUES (${outboxId},'email','deferred',${JSON.stringify({priority:"CRITICAL",subject:anomaly.title,body:anomaly.body,evidence:anomaly.evidence,founders,reason:"Founder escalation queued; delivery is only claimed after a real provider processes the outbox."})})`;
  }
  return { timestamp:new Date().toISOString(), status: anomalies.length ? "ANOMALY_DETECTED" : "CLEAN", escalatedCount: anomalies.length, refundAnomalies, codAnomalies, founderEscalation: anomalies.length ? "QUEUED_CRITICAL" : "NONE" };
}