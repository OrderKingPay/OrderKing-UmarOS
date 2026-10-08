import { getSql } from '../../db';

export async function findDemandClusters(city: string) {
    const sql = await getSql();

    // Query last 1000 orders and group them into grid blocks
    // 0.01 degrees of lat/lng is roughly 1km
    const clusters = await sql`
        WITH recent_orders AS (
            SELECT lat, lng
            FROM orders
            WHERE city = ${city}
            ORDER BY created_at DESC
            LIMIT 1000
        )
        SELECT 
            ROUND(lat::numeric, 2) AS grid_lat,
            ROUND(lng::numeric, 2) AS grid_lng,
            COUNT(*) as demand_count
        FROM recent_orders
        GROUP BY 1, 2
        ORDER BY demand_count DESC
        LIMIT 10;
    `;

    return clusters;
}
