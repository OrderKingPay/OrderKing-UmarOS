// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

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

export const SubscriptionController = {
  async subscribe() {
    return {
      success: false,
      status: "PROVIDER_REQUIRED",
      message: "King Pass activation is blocked until the live database entitlement writer and verified payment/webhook flow are connected.",
      availablePlans: Object.keys(PLANS),
    };
  },
  async getSubscription() {
    return {
      success: false,
      status: "DATABASE_REQUIRED",
      message: "Subscription status is not reported until the live database entitlement reader is connected.",
    };
  },
};

export const Route = createFileRoute("/api/v1/finance/subscription")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async () => Response.json(await SubscriptionController.subscribe(), { status: 503 }),
      GET: async () => Response.json(await SubscriptionController.getSubscription(), { status: 503 }),
    },
  },
});
