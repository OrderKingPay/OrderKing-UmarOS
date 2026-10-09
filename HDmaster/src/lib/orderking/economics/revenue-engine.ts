import { getSql } from '@/lib/db';

export class MonetizationEngine {
  /**
   * Dynamically calculates a "Priority Delivery" upsell fee based on current network load
   * to generate instant high-margin revenue.
   * @param orderId The ID of the order.
   * @param baseFee The base fee for the order.
   */
  async calculatePriorityUpsell(orderId: string, baseFee: number): Promise<number> {
    const sql = await getSql();
    
    // Fetch current network load to dynamic price the priority delivery
    const metrics = await sql<any>`
      SELECT current_load_factor 
      FROM delivery_network_metrics 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const loadFactor = metrics.length > 0 ? metrics[0].current_load_factor : 1.0;
    
    // High network load = higher urgency = higher upsell capability
    const surgeMultiplier = loadFactor > 0.8 ? 0.75 : 0.25; 
    const priorityUpsellFee = baseFee * surgeMultiplier;
    
    // Log the generated monetization opportunity
    await sql`
      INSERT INTO monetization_logs (order_id, upsell_type, calculated_fee, created_at)
      VALUES (${orderId}, 'PRIORITY_DELIVERY', ${priorityUpsellFee}, NOW())
    `;
    
    return priorityUpsellFee;
  }

  /**
   * Logic to lock a user into a recurring monthly subscription (Kings Pass)
   * which guarantees real recurring revenue.
   * @param userId The ID of the user.
   */
  async processKingsPassSubscription(userId: string): Promise<boolean> {
    const sql = await getSql();
    
    // Verify user is not already subscribed
    const existing = await sql`
      SELECT id FROM user_subscriptions 
      WHERE user_id = ${userId} AND status = 'ACTIVE' AND plan_name = 'KINGS_PASS'
    `;
    
    if (existing.length > 0) {
      return false; // Already locked in
    }
    
    const recurringMonthlyFee = 14.99; // Kings Pass premium tier
    
    // Lock in the subscription
    await sql`
      INSERT INTO user_subscriptions (user_id, plan_name, status, monthly_fee, next_billing_date)
      VALUES (${userId}, 'KINGS_PASS', 'ACTIVE', ${recurringMonthlyFee}, NOW() + INTERVAL '1 month')
    `;
    
    // Record guaranteed recurring revenue event
    await sql`
      INSERT INTO revenue_events (user_id, event_type, amount_usd, description, created_at)
      VALUES (${userId}, 'SUBSCRIPTION_LOCKED', ${recurringMonthlyFee}, 'Kings Pass - First Month', NOW())
    `;
    
    return true;
  }
}
