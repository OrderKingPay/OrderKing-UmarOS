import { getSql } from '@/lib/db'; // Assuming getSql is available here or inject appropriately

/**
 * Forecasts the number of riders needed in the next 60 minutes
 * based on the past 7 days of order velocity.
 *
 * Uses Simple Exponential Smoothing (SES) combined with a
 * time-of-day seasonal baseline to predict upcoming demand.
 * 
 * @param zoneId The ID of the zone to forecast demand for
 * @returns The predicted number of riders needed in the next hour
 */
export async function forecastNextHourDemand(zoneId: string): Promise<number> {
  const sql = getSql();
  
  // Fetch orders from the last 7 days
  const query = `
    SELECT created_at 
    FROM orders 
    WHERE zone_id = $1 
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
  `;
  
  const orders = await sql(query, [zoneId]);
  
  if (!orders || orders.length === 0) {
    return 1; // Base case: assume at least 1 rider needed if no data
  }
  
  // Group orders into 1-hour buckets for the past 168 hours (7 days)
  const buckets = new Array(168).fill(0);
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  
  for (const order of orders) {
    const orderTime = new Date(order.created_at).getTime();
    const hoursAgo = Math.floor((now - orderTime) / oneHourMs);
    
    // Safety bounds check
    if (hoursAgo >= 0 && hoursAgo < 168) {
      // Index 0 is 7 days ago (oldest), Index 167 is the most recent hour
      buckets[167 - hoursAgo]++;
    }
  }
  
  // 1. Calculate a Seasonal Baseline
  // Average order volume for this specific hour of the day over the last 7 days
  let seasonalSum = 0;
  for (let i = 0; i < 7; i++) {
    // The current hour's equivalent on previous days
    seasonalSum += buckets[167 - (i * 24)];
  }
  const seasonalAverage = seasonalSum / 7;
  
  // 2. Apply Simple Exponential Smoothing (SES) over the timeline
  // alpha (smoothing factor) between 0 and 1. 
  // Higher alpha discounts older observations faster, making it more responsive to recent trends.
  const alpha = 0.3;
  let smoothedDemand = buckets[0]; // Initialize with the oldest data point
  
  for (let i = 1; i < 168; i++) {
    smoothedDemand = alpha * buckets[i] + (1 - alpha) * smoothedDemand;
  }
  
  // 3. Ensemble Model
  // Combine the SES recent trend with the historical time-of-day seasonal average
  // Weighting: 60% recent trend (SES), 40% historical time-of-day pattern
  const forecastedOrders = (smoothedDemand * 0.6) + (seasonalAverage * 0.4);
  
  // 4. Conversion to Rider Demand
  // Assume on average 1 rider can complete ~2.5 orders per hour in a busy state
  // We use Math.ceil to ensure we don't understaff
  const ridersNeeded = Math.ceil(forecastedOrders / 2.5);
  
  return Math.max(1, ridersNeeded); // Always ensure at least 1 rider is recommended
}
