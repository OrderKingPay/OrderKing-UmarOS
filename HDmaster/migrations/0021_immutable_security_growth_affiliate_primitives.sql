-- Final Customer ledger syntax correction 2026-10-01
-- Final syntax correction batch 2026-10-01
-- Corrective route-source build fix 2026-10-01
-- Production primitives: immutable event chain, target bonuses, provider-backed affiliate ledger.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.security_event_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_key text NOT NULL,
  sequence_no bigint NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id text,
  actor_type text NOT NULL,
  event_type text NOT NULL,
  subject_type text,
  subject_id text,
  request_id text,
  device_id text,
  ip_hash text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_hash text,
  event_hash text NOT NULL,
  UNIQUE (stream_key, sequence_no),
  UNIQUE (event_hash)
);
CREATE INDEX IF NOT EXISTS security_event_ledger_stream_idx ON public.security_event_ledger(stream_key, sequence_no DESC);
ALTER TABLE public.security_event_ledger ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.prepare_security_event_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  prev_hash text;
  next_seq bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.stream_key));
  SELECT event_hash INTO prev_hash FROM public.security_event_ledger WHERE stream_key = NEW.stream_key ORDER BY sequence_no DESC LIMIT 1;
  SELECT COALESCE(MAX(sequence_no),0) + 1 INTO next_seq FROM public.security_event_ledger WHERE stream_key = NEW.stream_key;
  NEW.sequence_no := next_seq;
  NEW.previous_hash := prev_hash;
  NEW.event_hash := encode(
    digest(
      concat_ws('|',
        NEW.stream_key, NEW.sequence_no::text, NEW.occurred_at::text,
        COALESCE(NEW.actor_id,''), NEW.actor_type, NEW.event_type,
        COALESCE(NEW.subject_type,''), COALESCE(NEW.subject_id,''),
        COALESCE(NEW.request_id,''), COALESCE(NEW.device_id,''),
        COALESCE(NEW.ip_hash,''), COALESCE(NEW.payload::text,'{}'),
        COALESCE(prev_hash,'')
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS security_event_ledger_prepare ON public.security_event_ledger;
CREATE TRIGGER security_event_ledger_prepare
BEFORE INSERT ON public.security_event_ledger
FOR EACH ROW EXECUTE FUNCTION public.prepare_security_event_ledger();

CREATE OR REPLACE FUNCTION public.prevent_security_event_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_SECURITY_EVENT_LEDGER';
END;
$$;

DROP TRIGGER IF EXISTS security_event_ledger_no_update ON public.security_event_ledger;
CREATE TRIGGER security_event_ledger_no_update BEFORE UPDATE ON public.security_event_ledger FOR EACH ROW EXECUTE FUNCTION public.prevent_security_event_mutation();
DROP TRIGGER IF EXISTS security_event_ledger_no_delete ON public.security_event_ledger;
CREATE TRIGGER security_event_ledger_no_delete BEFORE DELETE ON public.security_event_ledger FOR EACH ROW EXECUTE FUNCTION public.prevent_security_event_mutation();

CREATE TABLE IF NOT EXISTS public.growth_bonus_targets (
  id text PRIMARY KEY,
  campaign_id text,
  audience_type text NOT NULL CHECK (audience_type IN ('CUSTOMER','PARTNER','RIDER')),
  metric text NOT NULL,
  threshold bigint NOT NULL CHECK (threshold > 0),
  bonus_paise bigint NOT NULL CHECK (bonus_paise >= 0),
  max_bonus_paise bigint NOT NULL CHECK (max_bonus_paise >= bonus_paise),
  min_verified_order_paise bigint NOT NULL DEFAULT 0 CHECK (min_verified_order_paise >= 0),
  active boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.growth_bonus_targets ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.affiliate_partner_offers (
  id text PRIMARY KEY,
  provider_name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING_PROVIDER','ACTIVE','PAUSED','REVOKED')) DEFAULT 'PENDING_PROVIDER',
  payout_bps bigint NOT NULL DEFAULT 0 CHECK (payout_bps >= 0),
  fixed_payout_paise bigint NOT NULL DEFAULT 0 CHECK (fixed_payout_paise >= 0),
  click_url text,
  callback_secret_config_key text,
  disclosure_label text NOT NULL DEFAULT 'Partner offer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.affiliate_click_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL REFERENCES public.affiliate_partner_offers(id),
  user_id text,
  click_id text NOT NULL,
  dedupe_key text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  provider_reference text,
  commission_paise bigint NOT NULL DEFAULT 0 CHECK (commission_paise >= 0),
  status text NOT NULL CHECK (status IN ('CLICKED','CONVERTED','REJECTED','PENDING_PROVIDER')) DEFAULT 'CLICKED',
  UNIQUE (offer_id, dedupe_key),
  UNIQUE (click_id)
);
ALTER TABLE public.affiliate_partner_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_click_ledger ENABLE ROW LEVEL SECURITY;
