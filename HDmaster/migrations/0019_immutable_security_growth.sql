-- 0019: target-based growth incentives and immutable-ledger hardening.
-- The immutable event ledger already exists in production and is protected by
-- append-only triggers. This migration adds growth campaigns/progress/rewards.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  IF to_regclass('public.immutable_event_ledger') IS NULL THEN
    RAISE EXCEPTION 'immutable_event_ledger must exist before growth migration';
  END IF;
END $$;

REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.immutable_event_ledger FROM authenticated;

ALTER TABLE public.growth_campaigns
  ADD COLUMN IF NOT EXISTS org_id TEXT,
  ADD COLUMN IF NOT EXISTS participant_type TEXT NOT NULL DEFAULT 'CUSTOMER',
  ADD COLUMN IF NOT EXISTS target_metric TEXT NOT NULL DEFAULT 'QUALIFIED_REFERRALS',
  ADD COLUMN IF NOT EXISTS reward_coins BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.growth_attributions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT REFERENCES public.growth_campaigns(id),
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
ON public.growth_attributions(referrer_type, referrer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.growth_target_progress (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.growth_campaigns(id),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('CUSTOMER','RESTAURANT','RIDER','MERCHANT')),
  actor_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  qualifying_count BIGINT NOT NULL DEFAULT 0,
  qualifying_value_paise BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, actor_type, actor_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS growth_target_actor_idx
ON public.growth_target_progress(actor_type, actor_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.growth_reward_events (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.growth_campaigns(id),
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
ON public.growth_reward_events(actor_type, actor_id, created_at DESC);
