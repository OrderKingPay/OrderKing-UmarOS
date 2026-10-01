CREATE TABLE IF NOT EXISTS finance_escalations (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  order_id TEXT,
  settlement_batch_id TEXT,
  user_id TEXT,
  source_app TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','REJECTED')),
  amount_paise BIGINT,
  currency TEXT NOT NULL DEFAULT 'INR',
  evidence JSONB NOT NULL DEFAULT '{}'::JSONB,
  requested_action TEXT NOT NULL,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX IF NOT EXISTS finance_escalations_status_created_idx
  ON finance_escalations(status, created_at DESC);

CREATE INDEX IF NOT EXISTS finance_escalations_order_idx
  ON finance_escalations(order_id, created_at DESC);

ALTER TABLE finance_escalations ENABLE ROW LEVEL SECURITY;
