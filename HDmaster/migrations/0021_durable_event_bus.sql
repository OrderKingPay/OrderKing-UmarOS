CREATE TABLE IF NOT EXISTS durable_event_bus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS durable_event_bus_status_created_idx ON durable_event_bus(status, created_at);
CREATE INDEX IF NOT EXISTS durable_event_bus_topic_idx ON durable_event_bus(topic);
