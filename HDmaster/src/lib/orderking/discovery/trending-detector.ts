import { getSql } from '../../db';

export async function getTrending(city: string, hours: number) {
    const sql = await getSql();
    
    const result = await sql`
        WITH RecentOrders AS (
            SELECT 
                r.id as restaurant_id, 
                r.name as restaurant_name,
                COUNT(o.id) as recent_count
            FROM restaurants r
            JOIN orders o ON r.id = o.restaurant_id
            WHERE r.city = ${city}
              AND o.created_at >= NOW() - INTERVAL '1 hour' * ${hours}
            GROUP BY r.id, r.name
        ),
        HistoricalOrders AS (
            SELECT 
                r.id as restaurant_id,
                COUNT(o.id) / (7 * 24.0 / ${hours}) as average_count
            FROM restaurants r
            JOIN orders o ON r.id = o.restaurant_id
            WHERE r.city = ${city}
              AND o.created_at >= NOW() - INTERVAL '7 days'
            GROUP BY r.id
        )
        SELECT 
            r.restaurant_id,
            r.restaurant_name,
            r.recent_count,
            h.average_count
        FROM RecentOrders r
        JOIN HistoricalOrders h ON r.restaurant_id = h.restaurant_id
        WHERE r.recent_count > 2 * h.average_count
        ORDER BY r.recent_count DESC
    ` as any;
    
    return result;
}
