CREATE TABLE IF NOT EXISTS merchant_kyc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    ifsc TEXT NOT NULL,
    fund_account_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kingpay_merchant_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL UNIQUE,
    balance_paise BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kingpay_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    balance_paise BIGINT NOT NULL DEFAULT 0,
    king_coins BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_restaurant_id ON merchant_kyc(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_kyc_status ON merchant_kyc(status);
CREATE INDEX IF NOT EXISTS idx_kingpay_merchant_wallets_restaurant_id ON kingpay_merchant_wallets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_wallets_user_id ON kingpay_wallets(user_id);

-- Banking-Grade RLS Isolation
ALTER TABLE merchant_kyc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on merchant_kyc" ON merchant_kyc;
CREATE POLICY "Service role bypass on merchant_kyc" ON merchant_kyc FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own kyc" ON merchant_kyc;
CREATE POLICY "Merchants can read own kyc" ON merchant_kyc FOR SELECT USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);
DROP POLICY IF EXISTS "Deny public write on merchant_kyc" ON merchant_kyc;
CREATE POLICY "Deny public write on merchant_kyc" ON merchant_kyc FOR INSERT WITH CHECK (false);

ALTER TABLE kingpay_merchant_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_merchant_wallets" ON kingpay_merchant_wallets;
CREATE POLICY "Service role bypass on kingpay_merchant_wallets" ON kingpay_merchant_wallets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own merchant wallet" ON kingpay_merchant_wallets;
CREATE POLICY "Merchants can read own merchant wallet" ON kingpay_merchant_wallets FOR SELECT USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);
DROP POLICY IF EXISTS "Deny public write on kingpay_merchant_wallets" ON kingpay_merchant_wallets;
CREATE POLICY "Deny public write on kingpay_merchant_wallets" ON kingpay_merchant_wallets FOR INSERT WITH CHECK (false);

ALTER TABLE kingpay_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_wallets" ON kingpay_wallets;
CREATE POLICY "Service role bypass on kingpay_wallets" ON kingpay_wallets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can read own kingpay wallet" ON kingpay_wallets;
CREATE POLICY "Users can read own kingpay wallet" ON kingpay_wallets FOR SELECT USING (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Deny public write on kingpay_wallets" ON kingpay_wallets;
CREATE POLICY "Deny public write on kingpay_wallets" ON kingpay_wallets FOR INSERT WITH CHECK (false);
