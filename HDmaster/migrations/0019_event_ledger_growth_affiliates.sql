-- OrderKing/Umar OS: governed growth rewards + affiliate attribution.
-- The immutable_event_ledger already exists in the production schema with a
-- cryptographic hash-chain and mutation-blocking triggers. This migration
-- intentionally preserves that implementation and adds only new growth tables.

CREATE TABLE IF NOT EXISTS growth_campaigns (
  campaign_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_key text NOT NULL UNIQUE,
  title text NOT NULL,
  goal_metric text NOT NULL,
  target_count bigint NOT NULL CHECK (target_count > 0),
  reward_paise bigint NOT NULL DEFAULT 0 CHECK (reward_paise >= 0),
  reward_coins bigint NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  max_budget_paise bigint NULL CHECK (max_budget_paise IS NULL OR max_budget_paise >= 0),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','CLOSED')),
  fraud_policy jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_campaigns_status
  ON growth_campaigns (status, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS growth_events (
  growth_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES growth_campaigns(campaign_id),
  user_id uuid NULL,
  actor_type text NOT NULL,
  actor_id text NULL,
  metric text NOT NULL,
  value bigint NOT NULL DEFAULT 1 CHECK (value > 0),
  dedupe_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz NULL,
  fraud_state text NOT NULL DEFAULT 'PENDING' CHECK (fraud_state IN ('PENDING','VERIFIED','REJECTED')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_growth_events_campaign_user
  ON growth_events (campaign_id, user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS growth_reward_ledger (
  reward_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES growth_campaigns(campaign_id),
  user_id uuid NOT NULL,
  source_growth_event_id uuid NOT NULL REFERENCES growth_events(growth_event_id),
  reward_paise bigint NOT NULL DEFAULT 0 CHECK (reward_paise >= 0),
  reward_coins bigint NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','REVERSED')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_growth_event_id)
);

CREATE INDEX IF NOT EXISTS idx_growth_reward_user
  ON growth_reward_ledger (user_id, created_at DESC);

ALTER TABLE growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_reward_ledger ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS affiliate_offers (
  offer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  category text NOT NULL,
  offer_key text NOT NULL UNIQUE,
  landing_url text NOT NULL,
  tracking_template text NULL,
  commission_model text NOT NULL,
  commission_bps integer NULL CHECK (commission_bps IS NULL OR commission_bps >= 0),
  fixed_commission_paise bigint NULL CHECK (fixed_commission_paise IS NULL OR fixed_commission_paise >= 0),
  terms_url text NULL,
  disclosure_text text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','CLOSED')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_offers_active
  ON affiliate_offers (status, category, starts_at, ends_at);

CREATE TABLE IF NOT EXISTS affiliate_attributions (
  attribution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES affiliate_offers(offer_id),
  user_id uuid NULL,
  click_id text NOT NULL UNIQUE,
  source text NOT NULL,
  medium text NULL,
  campaign text NULL,
  referrer_code text NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz NULL,
  conversion_reference text NULL,
  commission_paise bigint NULL CHECK (commission_paise IS NULL OR commission_paise >= 0),
  commission_status text NOT NULL DEFAULT 'PENDING' CHECK (commission_status IN ('PENDING','VERIFIED','PAID','REJECTED')),
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_affiliate_attr_user
  ON affiliate_attributions (user_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_attr_offer
  ON affiliate_attributions (offer_id, clicked_at DESC);

ALTER TABLE affiliate_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_attributions ENABLE ROW LEVEL SECURITY;

REVOKE UPDATE, DELETE ON growth_reward_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON affiliate_attributions FROM PUBLIC;
REVOKE UPDATE, DELETE ON growth_reward_ledger FROM anon;
REVOKE UPDATE, DELETE ON affiliate_attributions FROM anon;
REVOKE UPDATE, DELETE ON growth_reward_ledger FROM authenticated;
REVOKE UPDATE, DELETE ON affiliate_attributions FROM authenticated;
