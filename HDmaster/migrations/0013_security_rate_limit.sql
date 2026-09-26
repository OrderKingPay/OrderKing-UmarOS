CREATE TABLE IF NOT EXISTS rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  bucket_key TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_bucket_time
  ON rate_limit_events (bucket_key, occurred_at);

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_occurred_at
  ON rate_limit_events (occurred_at);

-- Keep the table bounded. This is intentionally conservative; request-time
-- pruning remains authoritative for the sliding-window decision.
CREATE OR REPLACE FUNCTION cleanup_rate_limit_events() RETURNS void
LANGUAGE SQL
AS $$
  DELETE FROM rate_limit_events
  WHERE occurred_at < now() - interval '15 minutes';
$$;
