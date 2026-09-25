CREATE TABLE IF NOT EXISTS ledger_transactions (
    transaction_id TEXT PRIMARY KEY,
    idempotency_key TEXT UNIQUE NOT NULL,
    order_id TEXT,
    event_type TEXT NOT NULL,
    total_amount_paise BIGINT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    audit_hash TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    is_fraud_suspicious BOOLEAN,
    fraud_reasons JSONB,
    fraud_score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    entry_id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES ledger_transactions(transaction_id),
    account TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount_paise BIGINT NOT NULL,
    entity_id TEXT NOT NULL,
    memo TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlement_batches (
    batch_id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('RESTAURANT', 'RIDER')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    gross_amount_paise BIGINT NOT NULL,
    deductions_paise BIGINT NOT NULL,
    commission_paise BIGINT NOT NULL,
    gst_paise BIGINT NOT NULL,
    net_payout_paise BIGINT NOT NULL,
    state TEXT NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    payout_upi_or_account_number TEXT NOT NULL,
    provider_reference TEXT,
    failure_reason TEXT,
    attempts_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
