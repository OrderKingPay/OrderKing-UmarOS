-- HDmaster/migrations/0018_performance_indexes.sql

-- Autonomous Tasks
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_org_id ON autonomous_tasks (org_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_state ON autonomous_tasks (state);
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_owner ON autonomous_tasks (owner);

-- Ledger
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_order_id ON ledger_transactions (order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_event_type ON ledger_transactions (event_type);
CREATE INDEX IF NOT EXISTS idx_ledger_transactions_timestamp ON ledger_transactions (timestamp);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries (transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries (account);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_entity_id ON ledger_entries (entity_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_timestamp ON ledger_entries (timestamp);

-- Settlements
CREATE INDEX IF NOT EXISTS idx_settlement_batches_entity_id ON settlement_batches (entity_id);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_period ON settlement_batches (period_start, period_end);

-- DLQ
CREATE INDEX IF NOT EXISTS idx_dead_letter_queue_org_id ON dead_letter_queue (org_id);
CREATE INDEX IF NOT EXISTS idx_dead_letter_queue_status_retry ON dead_letter_queue (status, next_retry_at);

-- KingPay
CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_user_id ON kingpay_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_created_at ON kingpay_transactions (created_at);

-- Geospatial Telemetry
CREATE INDEX IF NOT EXISTS idx_geospatial_org_id ON geospatial_telemetry_100x (org_id);
CREATE INDEX IF NOT EXISTS idx_geospatial_entity ON geospatial_telemetry_100x (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_geospatial_h3_index ON geospatial_telemetry_100x (h3_index);

-- Payment Webhook Events (if exists)
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_type ON payment_webhook_events (event_type);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_received_at ON payment_webhook_events (received_at);
