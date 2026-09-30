-- OrderKing Global Crypto Treasury & Revenue Extensions

CREATE TABLE IF NOT EXISTS crypto_payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    amount NUMERIC(10, 4) NOT NULL,
    wallet_address TEXT NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS crypto_order_idx ON crypto_payment_intents (order_id);

-- Subscriptions table (Zomato Gold / King Pass)
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id text primary key,
    customer_id text not null references customers(id) on delete cascade,
    plan_name text not null,
    price_paise integer not null,
    status text not null default 'ACTIVE',
    valid_until timestamptz not null,
    created_at timestamptz not null default now()
);
