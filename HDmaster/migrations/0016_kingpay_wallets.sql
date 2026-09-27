CREATE TABLE IF NOT EXISTS kingpay_wallets (
  user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  balance_paise BIGINT NOT NULL DEFAULT 0,
  king_coins BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kingpay_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL,
  type TEXT NOT NULL, -- 'CREDIT' or 'DEBIT'
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE kingpay_wallets ADD CONSTRAINT check_positive_balance CHECK (balance_paise >= 0);