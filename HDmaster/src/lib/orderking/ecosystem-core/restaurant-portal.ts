import { getSql } from '../../db';

export async function calculateDailyEarningsAndUpdateWallet(restaurantId: string, date: string) {
  const sql = await getSql();
  
  // Using a transaction to ensure wallet consistency
  await sql`BEGIN`;
  try {
    const tx = sql;
    const stats = await tx`
      SELECT 
        COALESCE(SUM(total_amount), 0) as daily_total,
        MAX(commission_rate) as commission_rate
      FROM orders
      JOIN restaurants ON orders.restaurant_id = restaurants.id
      WHERE orders.restaurant_id = ${restaurantId}
        AND DATE(orders.completed_at) = ${date}
        AND orders.status = 'COMPLETED'
    `;

    const { daily_total, commission_rate } = stats[0] as any;
    
    // Calculate earnings after subtracting commission (default 20%)
    const rate = commission_rate ?? 0.20;
    const earnings = daily_total * (1 - rate);

    if (earnings > 0) {
      await tx`
        UPDATE restaurants
        SET wallet_balance = wallet_balance + ${earnings}
        WHERE id = ${restaurantId}
      `;
      
      await tx`
        INSERT INTO wallet_transactions (restaurant_id, amount, description, created_at)
        VALUES (${restaurantId}, ${earnings}, 'Daily earnings for ' || ${date}, NOW())
      `;
    }

    await tx`COMMIT`;
    return earnings;
  } catch (err) {
    await sql`ROLLBACK`;
    throw err;
  }
}
