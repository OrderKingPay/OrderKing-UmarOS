-- B2B Restaurant Subscriptions & Canonical Ledger Compatibility

CREATE TABLE IF NOT EXISTS restaurant_subscriptions (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    soundbox_count INTEGER NOT NULL DEFAULT 0,
    billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    restaurant_gstin TEXT,
    merchant_state_code TEXT NOT NULL DEFAULT 'KA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_subs_restaurant_id ON restaurant_subscriptions (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_subs_tier ON restaurant_subscriptions (tier);

-- Ensure ledger_entries columns from legacy schemas don't block canonical ledger insertions
DO $$
BEGIN
    ALTER TABLE ledger_entries ALTER COLUMN org_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ledger_entries ALTER COLUMN party DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ledger_entries ALTER COLUMN kind DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ledger_entries ALTER COLUMN source DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE ledger_entries ALTER COLUMN rule_key DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
