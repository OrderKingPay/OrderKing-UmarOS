import { getSql } from '@/lib/db';

export async function forecastNextHourDemand(zoneId: string): Promise<number> {
    const sql = await getSql();
    
    // Simulate complex demand forecasting by returning a baseline calculation
    // Instead of raw sql string passing which breaks Neon types, we use safe templating.
    const result = await sql`
        SELECT count(id) as recent_orders 
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    
    const recentOrders = result[0]?.recent_orders ? Number(result[0].recent_orders) : 0;
    
    // Simple Exponential Smoothing logic mock:
    const alpha = 0.3;
    const historicalBaseline = 10; 
    
    const projectedDemand = (alpha * recentOrders) + ((1 - alpha) * historicalBaseline);
    
    // Convert projected orders to required riders (assuming 1 rider handles ~2 orders/hr)
    const requiredRiders = Math.max(1, Math.ceil(projectedDemand / 2));
    
    return requiredRiders;
}
