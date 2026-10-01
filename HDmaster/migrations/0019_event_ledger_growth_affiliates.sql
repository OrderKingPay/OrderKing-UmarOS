-- OrderKing/Umar OS: immutable events + governed growth rewards + affiliate attribution.
-- Additive only. App/admin roles are prevented from UPDATE/DELETE on event and reward ledgers.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS immutable_event_ledger (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_scope text NOT NULL,
  sequence_no bigint NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL,
  actor_id text NULL,
  entity_type text NOT NULL,
  entity_id text NULL,
  event_type text NOT NULL,
  latitude double precision NULL,
  longitude double precision NULL,
  request_id text NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash bytea NULL,
  event_hash bytea NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (chain_scope, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_immutable_event_scope_time
  ON immutable_event_ledger (chain_scope, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_entity
  ON immutable_event_ledger (entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_actor
  ON immutable_event_ledger (actor_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION append_immutable_event(
  p_chain_scope text,
  p_occurred_at timestamptz,
  p_actor_type text,
  p_actor_id text,
  p_entity_type text,
  p_entity_id text,
  p_event_type text,
  p_latitude double precision DEFAULT NULL,
  p_longitude double precision DEFAULT NULL,
  p_request_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_event_id uuid := gen_random_uuid();
  v_sequence bigint;
  v_prev_hash bytea;
  v_event_hash bytea;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_chain_scope, 0));

  SELECT COALESCE(MAX(sequence_no), 0) + 1,
         (ARRAY_AGG(event_hash ORDER BY sequence_no DESC))[1]
    INTO v_sequence, v_prev_hash
    FROM immutable_event_ledger
   WHERE chain_scope = p_chain_scope;

  v_event_hash := digest(
      convert_to(
        concat_ws(
          '|',
          v_event_id::text,
          p_chain_scope,
          v_sequence::text,
          to_char(p_occurred_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          p_actor_type,
          COALESCE(p_actor_id, ''),
          p_entity_type,
          COALESCE(p_entity_id, ''),
          p_event_type,
          COALESCE(p_latitude::text, ''),
          COALESCE(p_longitude::text, ''),
          COALESCE(p_request_id, ''),
          COALESCE(p_payload::text, '{}'),
          encode(COALESCE(v_prev_hash, decode('', 'hex')), 'hex'),
          COALESCE(p_metadata::text, '{}')
        ),
        'UTF8'
      ),
      'sha256'
    );

  INSERT INTO immutable_event_ledger (
    event_id, chain_scope, sequence_no, occurred_at,
    actor_type, actor_id, entity_type, entity_id, event_type,
    latitude, longitude, request_id, payload, prev_hash, event_hash, metadata
  )
  VALUES (
    v_event_id, p_chain_scope, v_sequence, p_occurred_at,
    p_actor_type, p_actor_id, p_entity_type, p_entity_id, p_event_type,
    p_latitude, p_longitude, p_request_id, COALESCE(p_payload, '{}'::jsonb),
    v_prev_hash, v_event_hash, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION immutable_event_ledger_no_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'immutable_event_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS trg_immutable_event_ledger_no_mutation ON immutable_event_ledger;
CREATE TRIGGER trg_immutable_event_ledger_no_mutation
BEFORE UPDATE OR DELETE ON immutable_event_ledger
FOR EACH ROW EXECUTE FUNCTION immutable_event_ledger_no_mutation();

ALTER TABLE immutable_event_ledger ENABLE ROW LEVEL SECURITY;
REVOKE UPDATE, DELETE ON immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE ON immutable_event_ledger FROM authenticated;

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
