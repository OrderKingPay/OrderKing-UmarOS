CREATE TABLE IF NOT EXISTS crm_affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL,
    utm_source TEXT,
    utm_campaign TEXT,
    discount_override INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_referral_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, 
    referral_code TEXT UNIQUE NOT NULL,
    reward_amount BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    affiliate_id UUID REFERENCES crm_affiliates(id),
    referral_id UUID REFERENCES crm_referral_programs(id),
    user_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,
    template_id TEXT,
    sent_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
