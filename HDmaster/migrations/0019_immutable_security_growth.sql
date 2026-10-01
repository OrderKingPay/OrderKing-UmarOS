-- 0019: target-based growth incentives and immutable-ledger hardening.
-- The immutable event ledger itself is already provisioned by the production
-- schema. This migration does not create a duplicate ledger or duplicate
-- source triggers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF to_regclass('public.immutable_event_ledger') IS NULL THEN
    RAISE EXCEPTION 'immutable_event_ledger must exist before migration 0019';
  END IF;
END
$$;

REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM authenticated;

CREATE TABLE IF NOT EXISTS growth_campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('CUSTOMER','RESTAURANT','RIDER','MERCHANT')),
  target_metric TEXT NOT NULL CHECK (target_metric IN ('QUALIFIED_REFERRALS','FIRST_ORDERS','SHARES','DELIVERED_ORDERS')),
  target_value BIGINT NOT NULL CHECK (target_value > 0),
  reward_paise BIGINT NOT NULL DEFAULT 0 CHECK (reward_paise >= 0),
  reward_coins BIGINT NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  budget_paise BIGINT NOT NULL DEFAULT 0 CHECK (budget_paise >= 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','PAUSED','COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end > period_start)
);

CREATE INDEX IF NOT EXISTS growth_campaign_org_status_idx
  ON growth_campaigns(org_id, status, period_end);

CREATE TABLE IF NOT EXISTS growth_attributions (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  campaign_id TEXT REFERENCES growth_campaigns(id),
  referral_code TEXT NOT NULL,
  referrer_type TEXT NOT NULL CHECK (referrer_type IN ('CUSTOMER','RESTAURANT','RIDER','MERCHANT')),
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  first_qualified_order_id TEXT,
  qualified_at TIMESTAMPTZ,
  reward_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (reward_status IN ('PENDING','QUALIFIED','REWARDED','REJECTED')),
  fraud_score INTEGER NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referral_code, referred_user_id)
);

CREATE INDEX IF NOT EXISTS growth_attribution_referrer_idx
  ON growth_attributions(referrer_type, referrer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_reward_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL REFERENCES growth_campaigns(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('CUSTOMER','RESTAURANT','RIDER','MERCHANT')),
  actor_id TEXT NOT NULL,
  threshold_value BIGINT NOT NULL,
  reward_paise BIGINT NOT NULL DEFAULT 0 CHECK (reward_paise >= 0),
  reward_coins BIGINT NOT NULL DEFAULT 0 CHECK (reward_coins >= 0),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPLIED','BLOCKED')),
  evidence_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS growth_reward_actor_idx
  ON growth_reward_events(actor_type, actor_id, created_at DESC);

-- Promotions are never forced or spammed; a real user action is required
-- before a share/attribution event exists.
