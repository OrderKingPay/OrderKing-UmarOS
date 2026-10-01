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
  const negativeWalletAnomalies = await sql.query(`
    SELECT user_id, balance_paise
    FROM kingpay_wallets
    WHERE balance_paise < 0
    LIMIT 100
  `);

  const duplicatePaymentAnomalies = await sql.query(`
    SELECT source_type, source_id, COUNT(*) AS entries
    FROM journal_entries
    GROUP BY source_type, source_id
    HAVING COUNT(*) > 1
    LIMIT 100
  `);

  const unbalancedJournalAnomalies = await sql.query(`
    SELECT j.id,
           COALESCE(SUM(CASE WHEN l.direction='DEBIT' THEN l.amount_paise ELSE 0 END),0) AS debit,
           COALESCE(SUM(CASE WHEN l.direction='CREDIT' THEN l.amount_paise ELSE 0 END),0) AS credit
    FROM journal_entries j
    LEFT JOIN journal_lines l ON l.journal_id = j.id
    GROUP BY j.id
    HAVING COALESCE(SUM(CASE WHEN l.direction='DEBIT' THEN l.amount_paise ELSE 0 END),0)
        <> COALESCE(SUM(CASE WHEN l.direction='CREDIT' THEN l.amount_paise ELSE 0 END),0)
    LIMIT 100
  `);

  const webhookFailureAnomalies = await sql.query(`
    SELECT gateway, gateway_event_id, processing_error, created_at
    FROM payment_webhook_events
    WHERE processing_error IS NOT NULL
      AND created_at > NOW() - INTERVAL '24 HOURS'
    ORDER BY created_at DESC
    LIMIT 100
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
    ...negativeWalletAnomalies.map((row: any) => ({
      kind: "FINANCIAL_NEGATIVE_WALLET",
      title: "Critical negative-wallet invariant breach",
      body: `KingPay wallet ${row.user_id} has a negative balance of ${row.balance_paise} paise.`,
      evidence: row,
    })),
    ...duplicatePaymentAnomalies.map((row: any) => ({
      kind: "FINANCIAL_DUPLICATE_JOURNAL_SOURCE",
      title: "Duplicate journal source detected",
      body: `Journal source ${row.source_type}:${row.source_id} appears ${row.entries} times.`,
      evidence: row,
    })),
    ...unbalancedJournalAnomalies.map((row: any) => ({
      kind: "FINANCIAL_UNBALANCED_JOURNAL",
      title: "Double-entry journal imbalance",
      body: `Journal ${row.id} has debit ${row.debit} and credit ${row.credit} paise.`,
      evidence: row,
    })),
    ...webhookFailureAnomalies.map((row: any) => ({
      kind: "FINANCIAL_WEBHOOK_FAILURE",
      title: "Payment webhook processing failure",
      body: `Provider webhook ${row.gateway}:${row.gateway_event_id} failed processing: ${row.processing_error}`,
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