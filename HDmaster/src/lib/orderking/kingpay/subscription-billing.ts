import { getSql } from '../../db';
import { processPayment } from './payment-processor';

export async function billSubscription(restaurantId: string) {
    const sql = await getSql();
    
    const rows = await sql`
        SELECT tier, next_billing_date 
        FROM restaurant_subscriptions 
        WHERE restaurant_id = ${restaurantId}
    `;
    
    if (rows.length === 0) {
        throw new Error('Subscription not found');
    }
    
    const tier = (rows[0] as any).tier;
    
    // Determine amount in paise
    let amount = 0;
    if (tier === 'PREMIUM') {
        amount = 99900; // 999 INR
    } else if (tier === 'PRO') {
        amount = 199900; // 1999 INR
    } else {
        throw new Error('Invalid tier');
    }
    
    const orderId = `sub_${restaurantId}_${Date.now()}`;
    
    // We would need a saved payment method. For now, mocking method here but calling the real processPayment
    const payment = await processPayment(orderId, amount, 'card', 'stripe');
    
    await sql`
        UPDATE restaurant_subscriptions
        SET next_billing_date = DATE_ADD(next_billing_date, INTERVAL 1 MONTH)
        WHERE restaurant_id = ${restaurantId}
    `;
    
    return payment;
}
