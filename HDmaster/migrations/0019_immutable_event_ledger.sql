-- 0019_immutable_event_ledger.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.immutable_event_ledger (
  sequence_id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  org_id TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash TEXT,
  event_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_immutable_event_stream
  ON public.immutable_event_ledger (org_id, stream_key, sequence_id DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_entity
  ON public.immutable_event_ledger (entity_type, entity_id, sequence_id DESC);
CREATE INDEX IF NOT EXISTS idx_immutable_event_actor
  ON public.immutable_event_ledger (actor_type, actor_id, sequence_id DESC);

CREATE OR REPLACE FUNCTION public.immutable_event_ledger_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_EVENT_LEDGER: UPDATE and DELETE are forbidden';
END;
$$;

DROP TRIGGER IF EXISTS immutable_event_no_mutation ON public.immutable_event_ledger;
CREATE TRIGGER immutable_event_no_mutation
BEFORE UPDATE OR DELETE ON public.immutable_event_ledger
FOR EACH ROW EXECUTE FUNCTION public.immutable_event_ledger_guard();

CREATE OR REPLACE FUNCTION public.append_immutable_event(
  p_org_id TEXT,
  p_stream_key TEXT,
  p_actor_type TEXT,
  p_actor_id TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_occurred_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(event_id TEXT, event_hash TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_event_id TEXT := gen_random_uuid()::text;
  v_prev_hash TEXT;
  v_canonical TEXT;
  v_event_hash TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_org_id), hashtext(p_stream_key));

  SELECT i.event_hash
  INTO v_prev_hash
  FROM public.immutable_event_ledger i
  WHERE i.org_id = p_org_id
    AND i.stream_key = p_stream_key
  ORDER BY i.sequence_id DESC
  LIMIT 1;

  v_canonical :=
      COALESCE(v_prev_hash, 'GENESIS')
      || '|' || v_event_id
      || '|' || p_org_id
      || '|' || p_stream_key
      || '|' || p_actor_type
      || '|' || p_actor_id
      || '|' || p_entity_type
      || '|' || p_entity_id
      || '|' || p_event_type
      || '|' || COALESCE(p_occurred_at::text, '')
      || '|' || COALESCE(p_payload::text, '{}');

  v_event_hash := encode(digest(v_canonical, 'sha256'), 'hex');

  INSERT INTO public.immutable_event_ledger (
    event_id, org_id, stream_key, actor_type, actor_id,
    entity_type, entity_id, event_type, occurred_at, payload,
    prev_hash, event_hash
  ) VALUES (
    v_event_id, p_org_id, p_stream_key, p_actor_type, p_actor_id,
    p_entity_type, p_entity_id, p_event_type, p_occurred_at, COALESCE(p_payload, '{}'::jsonb),
    v_prev_hash, v_event_hash
  );

  RETURN QUERY SELECT v_event_id, v_event_hash;
END;
$$;

REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE ON public.immutable_event_ledger FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.append_immutable_event(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.append_immutable_event(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TIMESTAMPTZ) FROM anon;
REVOKE EXECUTE ON FUNCTION public.append_immutable_event(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TIMESTAMPTZ) FROM authenticated;
