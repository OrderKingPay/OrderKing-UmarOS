CREATE TABLE IF NOT EXISTS security_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT,
    severity TEXT,
    source_ip TEXT,
    request_path TEXT,
    request_method TEXT,
    detected_payload TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    amount BIGINT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apm_slow_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_name TEXT,
    duration_ns BIGINT,
    threshold_ns BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_name TEXT,
    provider TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plugin_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_name TEXT,
    event_type TEXT,
    payload JSONB,
    signature_valid BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    token_hash TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    channel TEXT,
    template TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    amount_paise BIGINT,
    bank_ref TEXT,
    status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID,
    tier TEXT,
    amount_paise BIGINT,
    next_billing_date DATE,
    status TEXT
);

CREATE INDEX IF NOT EXISTS restaurants_search_idx ON restaurants USING GIN(to_tsvector('english', name || ' ' || cuisine_type));

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    discount_percentage INT,
    max_discount BIGINT,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN
);

CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    rated_by TEXT,
    rating INT CHECK(rating>=1 AND rating<=5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    from_status TEXT,
    to_status TEXT,
    transitioned_at TIMESTAMPTZ DEFAULT NOW()
);
