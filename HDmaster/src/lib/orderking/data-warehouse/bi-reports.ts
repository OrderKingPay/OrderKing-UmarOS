import { getSql } from '../../db';

export async function generateExecutiveSummary() {
    const sql = await getSql();
    
    // High-level summary of total GMV, active users, and rider count
    const [summary] = await sql`
        SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders) AS total_gmv,
            (SELECT COUNT(DISTINCT user_id) FROM orders WHERE created_at >= NOW() - INTERVAL '30 days') AS active_users,
            (SELECT COUNT(*) FROM riders WHERE is_active = true) AS active_riders
    `;
    
    return summary;
}
