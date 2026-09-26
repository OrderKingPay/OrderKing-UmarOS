-- Enterprise Dead Letter Queue (DLQ) for transaction retries
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  target_system TEXT NOT NULL, -- e.g., 'RIDER_DISPATCH', 'PAYMENT_WEBHOOK'
  payload_json TEXT NOT NULL,
  error_message TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RETRIED', 'DEAD'
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dlq_org_target ON dead_letter_queue(org_id, target_system);
CREATE INDEX IF NOT EXISTS idx_dlq_status_next_retry ON dead_letter_queue(status, next_retry_at);
