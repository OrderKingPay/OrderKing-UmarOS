import { getSql } from '../../db';

export async function extractDailyOrders(date: Date | string) {
    const sql = await getSql();
    
    // Query all orders, users, and restaurants for a specific day
    const orders = await sql`
        SELECT 
            o.id AS order_id,
            o.created_at,
            o.total_amount,
            u.id AS user_id,
            u.name AS user_name,
            r.id AS restaurant_id,
            r.name AS restaurant_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        JOIN restaurants r ON o.restaurant_id = r.id
        WHERE DATE(o.created_at) = DATE(${date})
    `;
    
    return orders;
}
