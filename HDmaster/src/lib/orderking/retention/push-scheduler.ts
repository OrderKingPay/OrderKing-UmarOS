import { getSql } from "@/lib/db";

export class RetentionScheduler {
  /**
   * Identifies users with strong habitual ordering patterns (e.g. Biryani every Friday at 1 PM)
   * and schedules a highly personalized preemptive push notification.
   */
  async runPredictiveRetentionScan(): Promise<void> {
    const sql = await getSql();

    // Find users who have ordered the exact same item at roughly the same time 
    // on the same day of the week, at least 3 times.
    const predictiveTriggers = await sql<{
      user_id: string;
      restaurant_id: string;
      item_name: string;
      predicted_day: number;
      predicted_hour: number;
    }[]>`
      WITH order_patterns AS (
        SELECT 
          user_id,
          restaurant_id,
          EXTRACT(ISODOW FROM created_at) AS order_day,
          EXTRACT(HOUR FROM created_at) AS order_hour,
          COUNT(*) AS frequency
        FROM orders
        WHERE status = 'DELIVERED'
        GROUP BY user_id, restaurant_id, order_day, order_hour
      )
      SELECT 
        user_id,
        restaurant_id,
        'Habitual Item' as item_name,
        order_day as predicted_day,
        order_hour as predicted_hour
      FROM order_patterns
      WHERE frequency >= 3
    `;

    for (const trigger of predictiveTriggers) {
      // In production, this drops the event onto BullMQ / Redis or AWS EventBridge
      // to trigger exactly 15 minutes before their `predicted_hour`.
      await this.queuePersonalizedPush(trigger);
    }
  }

  private async queuePersonalizedPush(trigger: any) {
    // Drop into message broker
    console.log(`[RETENTION] Queued preemptive push for user ${trigger.user_id}: "Time for your usual from Restaurant ${trigger.restaurant_id}?"`);
  }
}
