-- OrderKing/Umar OS: governed growth events/rewards + affiliate attribution ledgers.
-- Existing immutable_event_ledger, growth_campaigns and affiliate_offers schemas are preserved.

CREATE TABLE IF NOT EXISTS growth_event_ledger (
  growth_event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_growth_event_campaign_user
  ON growth_event_ledger (campaign_id, user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS growth_reward_ledger_v2 (
  reward_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id text NOT NULL,
  user_id uuid NOT NULL,
  source_growth_event_id uuid NOT NULL REFERENCES growth_event_ledger(growth_event_id),
  reward_paise bigint NOT NULL DEFAULT 0 CHECK (reward_paise >= 0),
  reward_coins bigint NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','PAID','REVERSED')),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_growth_event_id)
);

CREATE INDEX IF NOT EXISTS idx_growth_reward_v2_user
  ON growth_reward_ledger_v2 (user_id, created_at DESC);

ALTER TABLE growth_event_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_reward_ledger_v2 ENABLE ROW LEVEL SECURITY;

REVOKE UPDATE, DELETE ON growth_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON growth_reward_ledger_v2 FROM PUBLIC;
REVOKE UPDATE, DELETE ON growth_event_ledger FROM anon;
REVOKE UPDATE, DELETE ON growth_reward_ledger_v2 FROM anon;
REVOKE UPDATE, DELETE ON growth_event_ledger FROM authenticated;
REVOKE UPDATE, DELETE ON growth_reward_ledger_v2 FROM authenticated;

CREATE TABLE IF NOT EXISTS affiliate_attribution_ledger (
  attribution_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_affiliate_attr_v2_user
  ON affiliate_attribution_ledger (user_id, clicked_at DESC);

CREATE INDEX IF NOT EXISTS idx_affiliate_attr_v2_offer
  ON affiliate_attribution_ledger (offer_id, clicked_at DESC);

ALTER TABLE affiliate_attribution_ledger ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE, DELETE ON affiliate_attribution_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON affiliate_attribution_ledger FROM anon;
REVOKE UPDATE, DELETE ON affiliate_attribution_ledger FROM authenticated;

CREATE TABLE IF NOT EXISTS referral_codes (
  user_id text PRIMARY KEY,
  referral_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(referral_code);
