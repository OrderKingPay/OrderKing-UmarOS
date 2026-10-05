-- Migration: Growth Engine & Geographic Referral Mechanics
-- 100x Growth Intelligence Tracking

CREATE TABLE IF NOT EXISTS growth_referrals (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    referrer_id VARCHAR(50) NOT NULL, -- User who referred
    referrer_type VARCHAR(20) NOT NULL, -- 'CUSTOMER', 'RIDER', 'RESTAURANT'
    referred_id VARCHAR(50) NOT NULL, -- The new user created
    referred_type VARCHAR(20) NOT NULL,
    
    -- Geographic Growth Intelligence (Where was this referral generated?)
    signup_lat DOUBLE PRECISION,
    signup_lng DOUBLE PRECISION,
    signup_h3_index VARCHAR(15),
    
    -- Conversion Metrics
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACTIVATED', 'FIRST_ORDER_DONE'
    reward_amount_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
    reward_paid_out BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_referrals_referrer ON growth_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_growth_referrals_referred ON growth_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_growth_referrals_h3 ON growth_referrals(signup_h3_index);
