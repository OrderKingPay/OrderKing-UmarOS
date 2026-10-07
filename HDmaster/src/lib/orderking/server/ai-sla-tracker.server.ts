import { getSql } from "@/lib/db";

export async function detectSlaBreaches() {
  const sql = await getSql();
  
  // Find orders that are accepted but not ready after 45 minutes
  const delayedPrep = await sql.query(`
    SELECT id, restaurant_id, status, created_at, 
           EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_elapsed
    FROM orders
    WHERE status IN ('confirmed', 'cooking')
      AND created_at < NOW() - INTERVAL '45 MINUTES'
  `);

  // Find orders that are picked up but not delivered after 60 minutes
  const delayedDelivery = await sql.query(`
    SELECT id, rider_id, status, created_at,
           EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_elapsed
    FROM orders
    WHERE status = 'picked_up'
      AND created_at < NOW() - INTERVAL '60 MINUTES'
  `);

  return {
    timestamp: new Date().toISOString(),
    status: (delayedPrep.length > 0 || delayedDelivery.length > 0) ? "SLA_BREACH" : "HEALTHY",
    delayedPrep,
    delayedDelivery
  };
}
