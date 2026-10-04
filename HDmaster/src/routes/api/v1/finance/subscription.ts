// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";

function unavailable() {
  return new Response(JSON.stringify({
    success: false,
    error: "KING_PASS_PROVIDER_NOT_CONFIGURED",
    message: "King Pass billing is disabled until its production subscription provider is configured.",
  }), { status: 503, headers: { "content-type": "application/json" } });
}

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

export const Route = createAPIFileRoute("/api/v1/finance/subscription")({
  GET: async () => unavailable(),
  POST: async () => unavailable(),
});
