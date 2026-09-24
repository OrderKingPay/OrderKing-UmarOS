import { getSql } from "@/lib/db";

export async function detectFinancialAnomalies() {
  const sql = await getSql();
  
  // 1. High refund rate check
  const refundAnomalies = await sql.query(`
    SELECT restaurant_id, COUNT(*) as total_orders, 
           SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded_orders
    FROM orders
    WHERE created_at > NOW() - INTERVAL '24 HOURS'
    GROUP BY restaurant_id
    HAVING (SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.15
       AND COUNT(*) > 10
  `);

  // 2. High COD cancellation rate
  const codAnomalies = await sql.query(`
    SELECT customer_id, COUNT(*) as cod_orders,
           SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_cod
    FROM orders
    WHERE payment_status = 'pending_cod' AND created_at > NOW() - INTERVAL '7 DAYS'
    GROUP BY customer_id
    HAVING (SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::float / COUNT(*)) > 0.5
       AND COUNT(*) > 3
  `);

  return {
    timestamp: new Date().toISOString(),
    status: (refundAnomalies.length > 0 || codAnomalies.length > 0) ? "ANOMALY_DETECTED" : "CLEAN",
    refundAnomalies,
    codAnomalies
  };
}
