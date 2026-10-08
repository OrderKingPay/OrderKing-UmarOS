import { getSql } from '../../db';

export async function generatePayoutBatch(date: string) {
    const sql = await getSql();
    
    // Get delivered orders for the date
    const rows = await sql`
        SELECT restaurant_id, amount 
        FROM orders 
        WHERE status = 'DELIVERED' AND DATE(created_at) = ${date}
    `;

    const restaurantEarnings: Record<string, number> = {};

    for (const row of rows) {
        const restId = (row as any).restaurant_id;
        const amount = (row as any).amount;
        
        // Subtract 22% commission (integer arithmetic)
        // amount * 78 / 100
        const payout = Math.floor((amount * 78) / 100);
        
        if (!restaurantEarnings[restId]) {
            restaurantEarnings[restId] = 0;
        }
        restaurantEarnings[restId] += payout;
    }

    const batch = [];
    for (const [restaurantId, amount] of Object.entries(restaurantEarnings)) {
        batch.push({
            beneficiaryId: restaurantId,
            amount: amount,
            mode: 'NEFT'
        });
        
        await sql`
            INSERT INTO payouts (restaurant_id, amount, date, status)
            VALUES (${restaurantId}, ${amount}, ${date}, 'PENDING')
        `;
    }

    return batch;
}
