CREATE TABLE IF NOT EXISTS tool_execution_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    execution_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    input_snapshot JSONB,
    output_snapshot JSONB,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tool_id, request_id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_value TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    response_body JSONB NOT NULL,
    status INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
