CREATE TABLE IF NOT EXISTS growth_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_qualifications BIGINT NOT NULL CHECK (target_qualifications > 0),
  reward_per_qualification_paise BIGINT NOT NULL CHECK (reward_per_qualification_paise >= 0),
  max_budget_paise BIGINT NOT NULL CHECK (max_budget_paise >= 0),
  min_order_paise BIGINT NOT NULL CHECK (min_order_paise >= 0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS growth_referral_codes (
  user_id TEXT PRIMARY KEY,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS growth_referral_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES growth_campaigns(id),
  referral_code TEXT NOT NULL,
  referrer_user_id TEXT,
  invitee_user_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('VISIT','SIGNUP','QUALIFIED_ORDER')),
  source TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  order_id TEXT,
  amount_paise BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qualified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_referral_qualified_unique
  ON growth_referral_events(campaign_id, invitee_user_id)
  WHERE event_type = 'QUALIFIED_ORDER';

CREATE INDEX IF NOT EXISTS growth_referral_invitee_idx
  ON growth_referral_events(invitee_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_bonus_ledger (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES growth_campaigns(id),
  event_id TEXT UNIQUE NOT NULL REFERENCES growth_referral_events(id),
  user_id TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  status TEXT NOT NULL CHECK (status IN ('POSTED','REJECTED')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS growth_bonus_user_idx
  ON growth_bonus_ledger(user_id, created_at DESC);

ALTER TABLE growth_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_bonus_ledger ENABLE ROW LEVEL SECURITY;
