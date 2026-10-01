-- 0019_immutable_event_ledger.sql
-- Ensures the existing OrderKing immutable ledger contract exists in a fresh environment.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.immutable_event_ledger (
  event_seq BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  org_id TEXT,
  actor_user_id TEXT,
  actor_employee_id TEXT,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash CHAR(64),
  event_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_immutable_event_org_seq
  ON public.immutable_event_ledger (org_id, event_seq DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_source
  ON public.immutable_event_ledger (source_table, source_id, event_seq DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_actor
  ON public.immutable_event_ledger (actor_user_id, event_seq DESC);

CREATE OR REPLACE FUNCTION public.orderking_immutable_block_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_EVENT_LEDGER: UPDATE/DELETE is forbidden';
END;
$$;

DROP TRIGGER IF EXISTS immutable_event_block_mutation ON public.immutable_event_ledger;
CREATE TRIGGER immutable_event_block_mutation
BEFORE DELETE OR UPDATE ON public.immutable_event_ledger
FOR EACH ROW EXECUTE FUNCTION public.orderking_immutable_block_mutation();

CREATE OR REPLACE FUNCTION public.orderking_immutable_hash_chain()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  prior_hash CHAR(64);
  canonical TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(COALESCE(NEW.org_id, ''), 0));

  SELECT event_hash
    INTO prior_hash
  FROM public.immutable_event_ledger
  WHERE org_id IS NOT DISTINCT FROM NEW.org_id
  ORDER BY event_seq DESC
  LIMIT 1;

  NEW.prev_hash := prior_hash;
  canonical := concat_ws('|',
    COALESCE(NEW.event_id, ''),
    COALESCE(NEW.org_id, ''),
    COALESCE(NEW.actor_user_id, ''),
    COALESCE(NEW.actor_employee_id, ''),
    COALESCE(NEW.source_table, ''),
    COALESCE(NEW.source_id, ''),
    COALESCE(NEW.event_type, ''),
    COALESCE(to_char(NEW.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), ''),
    COALESCE(NEW.payload::text, '{}'),
    COALESCE(NEW.prev_hash, '')
  );

  NEW.event_hash := encode(digest(canonical, 'sha256'), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS immutable_event_hash_chain ON public.immutable_event_ledger;
CREATE TRIGGER immutable_event_hash_chain
BEFORE INSERT ON public.immutable_event_ledger
FOR EACH ROW EXECUTE FUNCTION public.orderking_immutable_hash_chain();

REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM authenticated;
