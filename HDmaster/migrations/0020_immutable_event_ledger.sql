CREATE TABLE IF NOT EXISTS immutable_event_ledger (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  actor_user_id TEXT NULL,
  actor_employee_id TEXT NULL,
  role_key TEXT NULL,
  action TEXT NOT NULL,
  target_type TEXT NULL,
  target_id TEXT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip TEXT NULL,
  user_agent TEXT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  h3_index TEXT NULL,
  gps_accuracy DOUBLE PRECISION NULL,
  previous_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL,
  payload_json JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS immutable_event_ledger_org_time_idx
  ON immutable_event_ledger (org_id, event_time DESC);

CREATE INDEX IF NOT EXISTS immutable_event_ledger_target_idx
  ON immutable_event_ledger (target_type, target_id, event_time DESC);

CREATE OR REPLACE FUNCTION prevent_immutable_event_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION 'immutable_event_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS immutable_event_ledger_no_update ON immutable_event_ledger;
CREATE TRIGGER immutable_event_ledger_no_update
  BEFORE UPDATE OR DELETE ON immutable_event_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_immutable_event_ledger_mutation();

REVOKE UPDATE, DELETE ON immutable_event_ledger FROM PUBLIC;
REVOKE UPDATE, DELETE ON immutable_event_ledger FROM anon;
REVOKE UPDATE, DELETE ON immutable_event_ledger FROM authenticated;
