
import { getSql } from "@/lib/db";

// 2. Create the raw SQL queries to build customer_subscriptions table
export const subscriptionMigrationQuery = `
  CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    price_paise BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_cust_subs_customer_id ON customer_subscriptions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_cust_subs_status_valid ON customer_subscriptions(status, valid_until);
`;

export class SubscriptionController {
  
  /**
   * Create a King Pass subscription for a user
   */
  public static async subscribe(req: any, res: any) {
    try {
      const { customerId, planName } = req.body;
      
      if (!customerId || !planName) {
        return res.status(400).json({ error: 'customerId and planName are required' });
      }

      let pricePaise = 0;
      let durationMonths = 1;

      // Plan configuration
      if (planName === 'KING_PASS_MONTHLY') {
        pricePaise = 19900; // 199 INR
        durationMonths = 1;
      } else if (planName === 'KING_PASS_YEARLY') {
        pricePaise = 199900; // 1999 INR
        durationMonths = 12;
      } else {
        return res.status(400).json({ error: 'Invalid planName' });
      }

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + durationMonths);

      const sql = await getSql();

      // 3. Subscription logic inserting to DB
      const result = await sql.query<{ id: string }>(
        `INSERT INTO customer_subscriptions (customer_id, plan_name, price_paise, status, valid_until)
         VALUES ($1, $2, $3, 'ACTIVE', $4)
         RETURNING id`,
        [customerId, planName, pricePaise, validUntil.toISOString()]
      );
      
      const subscriptionId = result[0]?.id;

      return res.status(201).json({
        success: true,
        message: 'Successfully subscribed to King Pass',
        data: {
          subscriptionId,
          planName,
          validUntil,
          pricePaise
        }
      });
    } catch (error) {
      console.error('Subscription error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get active subscription details
   */
  public static async getSubscription(req: any, res: any) {
    try {
      const { customerId } = req.params;

      const sql = await getSql();
      const result = await sql.query(
        `SELECT * FROM customer_subscriptions 
         WHERE customer_id = $1 AND status = 'ACTIVE' AND valid_until > NOW()
         ORDER BY valid_until DESC
         LIMIT 1`,
         [customerId]
      );

      return res.status(200).json({
        success: true,
        data: result.length > 0 ? result[0] : null
      });
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}
