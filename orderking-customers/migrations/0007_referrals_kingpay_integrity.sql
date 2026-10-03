-- Part 1.4: verified referral attribution + canonical customer wallet ledger.
-- Better Auth owns identities in "user". Keep referral data on that same identity table.

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS referral_code text;

CREATE UNIQUE INDEX IF NOT EXISTS user_referral_code_unique
  ON "user" (referral_code)
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id text PRIMARY KEY,
  referrer_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  new_user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'COMPLETED',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (new_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx
  ON referrals (referrer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS kingpay_wallets (
  user_id text PRIMARY KEY REFERENCES "user"("id") ON DELETE CASCADE,
  balance_paise bigint NOT NULL DEFAULT 0,
  king_coins bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (balance_paise >= 0)
);

CREATE TABLE IF NOT EXISTS kingpay_transactions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  amount_paise bigint NOT NULL CHECK (amount_paise >= 0),
  type text NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kingpay_transactions_user_created_idx
  ON kingpay_transactions (user_id, created_at DESC);
