-- Gamified Loyalty Engine: King Coins & Streaks

ALTER TABLE customers ADD COLUMN king_coins INT NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN current_streak INT NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN highest_streak INT NOT NULL DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_streak_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS king_coins_ledger (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS king_coins_ledger_customer_idx ON king_coins_ledger (customer_id, created_at DESC);
