import { Request, Response } from "express";

/**
 * King Pass subscription contract.
 * The SQL migration is retained for the eventual live database migration.
 * Activation is intentionally blocked until the real database + payment
 * entitlement flow is connected and verified.
 */
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

const PLANS = {
  KING_PASS_MONTHLY: { pricePaise: 19900, durationMonths: 1 },
  KING_PASS_YEARLY: { pricePaise: 199900, durationMonths: 12 },
} as const;

export class SubscriptionController {
  public static async subscribe(_req: Request, res: Response) {
    return res.status(503).json({
      success: false,
      status: "PROVIDER_REQUIRED",
      message: "King Pass activation is blocked until the live database entitlement writer and verified payment/webhook flow are connected.",
      availablePlans: Object.keys(PLANS),
    });
  }

  public static async getSubscription(_req: Request, res: Response) {
    return res.status(503).json({
      success: false,
      status: "DATABASE_REQUIRED",
      message: "Subscription status is not reported until the live database entitlement reader is connected.",
    });
  }
}
