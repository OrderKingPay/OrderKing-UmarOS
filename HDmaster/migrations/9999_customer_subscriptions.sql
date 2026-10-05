CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  plan_name VARCHAR(64) NOT NULL CHECK (plan_name IN ('KING_PASS_MONTHLY', 'KING_PASS_YEARLY')),
  price_paise BIGINT NOT NULL CHECK (price_paise > 0),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_customer
  ON customer_subscriptions(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_active
  ON customer_subscriptions(status, valid_until);
