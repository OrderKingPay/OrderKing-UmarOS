import { getSql } from '../../db';

export async function getRecommendations(customerId: string, limit: number) {
    const sql = await getSql();
    
    const result = await sql`
        WITH UserOrders AS (
            SELECT item_id
            FROM orders
            JOIN order_items ON orders.id = order_items.order_id
            WHERE customer_id = ${customerId}
        ),
        SimilarUsers AS (
            SELECT o.customer_id
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE oi.item_id IN (SELECT item_id FROM UserOrders)
              AND o.customer_id != ${customerId}
        )
        SELECT 
            oi.item_id, 
            COUNT(oi.item_id) as popularity
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id IN (SELECT customer_id FROM SimilarUsers)
          AND oi.item_id NOT IN (SELECT item_id FROM UserOrders)
        GROUP BY oi.item_id
        ORDER BY popularity DESC
        LIMIT ${limit}
    ` as any;
    
    return result;
}
