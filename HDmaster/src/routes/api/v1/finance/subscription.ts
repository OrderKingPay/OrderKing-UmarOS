import { getSql } from "@/lib/db";

type SubscriptionRequest = {
  customerId?: string;
  planName?: "KING_PASS_MONTHLY" | "KING_PASS_YEARLY";
};

const PLANS = {
  KING_PASS_MONTHLY: { pricePaise: 19900, durationMonths: 1 },
  KING_PASS_YEARLY: { pricePaise: 199900, durationMonths: 12 },
} as const;

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export class SubscriptionController {
  static async subscribe(request: Request) {
    try {
      const body = (await request.json()) as SubscriptionRequest;
      if (!body.customerId || !body.planName) {
        return json({ success: false, error: "customerId and planName are required" }, 400);
      }

      const plan = PLANS[body.planName];
      if (!plan) {
        return json({ success: false, error: "Invalid planName" }, 400);
      }

      const validUntil = new Date();
      validUntil.setUTCMonth(validUntil.getUTCMonth() + plan.durationMonths);

      const sql = await getSql();
      const rows = await sql.query<{ id: string }>(
        `insert into customer_subscriptions
          (customer_id, plan_name, price_paise, status, valid_until)
         values ($1,$2,$3,'ACTIVE',$4)
         returning id`,
        [body.customerId, body.planName, plan.pricePaise, validUntil.toISOString()],
      );

      const subscriptionId = rows[0]?.id;
      if (!subscriptionId) {
        return json({ success: false, error: "subscription_not_created" }, 503);
      }

      return json({
        success: true,
        data: {
          subscriptionId,
          planName: body.planName,
          validUntil: validUntil.toISOString(),
          pricePaise: plan.pricePaise,
        },
      }, 201);
    } catch (error) {
      console.error("Subscription error:", error);
      return json({ success: false, error: "subscription_unavailable" }, 503);
    }
  }

  static async getSubscription(request: Request) {
    try {
      const customerId = new URL(request.url).searchParams.get("customerId");
      if (!customerId) return json({ success: false, error: "customerId is required" }, 400);

      const sql = await getSql();
      const rows = await sql.query(
        `select id, customer_id, plan_name, price_paise, status, valid_until, created_at, updated_at
         from customer_subscriptions
         where customer_id=$1 and status='ACTIVE' and valid_until > now()
         order by valid_until desc
         limit 1`,
        [customerId],
      );

      return json({ success: true, data: rows[0] ?? null });
    } catch (error) {
      console.error("Subscription lookup error:", error);
      return json({ success: false, error: "subscription_unavailable" }, 503);
    }
  }
}
