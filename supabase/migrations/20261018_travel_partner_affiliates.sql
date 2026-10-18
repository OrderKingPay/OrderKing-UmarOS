-- ============================================================================
-- OrderKing Migration: 20261018_travel_partner_affiliates.sql
-- Travel Partner Bookings, Click Out Attribution & Commission Tracking
-- Double-Entry KingPay Ledger Integration & Realtime Postback Architecture
-- ============================================================================

-- 1. TRAVEL PARTNER CLICKS (Click-out attribution & Tracking Token Registry)
CREATE TABLE IF NOT EXISTS public.travel_partner_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    vertical TEXT NOT NULL CHECK (vertical IN ('FLIGHT', 'TRAIN', 'BUS', 'HOTEL', 'CAB', 'VIP_CHARTER')),
    origin TEXT,
    destination TEXT,
    partner_name TEXT NOT NULL,
    tracking_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_travel_partner_clicks_token ON public.travel_partner_clicks(tracking_token);
CREATE INDEX IF NOT EXISTS idx_travel_partner_clicks_user_id ON public.travel_partner_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_partner_clicks_partner ON public.travel_partner_clicks(partner_name);
CREATE INDEX IF NOT EXISTS idx_travel_partner_clicks_created_at ON public.travel_partner_clicks(created_at);

-- 2. TRAVEL PARTNER COMMISSIONS (Affiliate postbacks & 24K Gold/Rupee Cashbacks)
CREATE TABLE IF NOT EXISTS public.travel_partner_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    tracking_token TEXT,
    booking_reference TEXT NOT NULL,
    gross_booking_amount_inr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    partner_commission_inr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    user_cashback_inr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SETTLED', 'REJECTED', 'CANCELLED')),
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    partner_name TEXT,
    cashback_credited BOOLEAN NOT NULL DEFAULT false,
    credited_at TIMESTAMPTZ,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_travel_partner_commissions_booking_ref UNIQUE (booking_reference)
);

CREATE INDEX IF NOT EXISTS idx_travel_partner_commissions_token ON public.travel_partner_commissions(tracking_token);
CREATE INDEX IF NOT EXISTS idx_travel_partner_commissions_user_id ON public.travel_partner_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_partner_commissions_status ON public.travel_partner_commissions(status);
CREATE INDEX IF NOT EXISTS idx_travel_partner_commissions_ref ON public.travel_partner_commissions(booking_reference);

-- 3. ENABLE SUPABASE REALTIME FOR TRAVEL PARTNER COMMISSIONS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'travel_partner_commissions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_partner_commissions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 4. IMMUTABLE KINGPAY DOUBLE-ENTRY LEDGER TABLE (Supports authentic wallet accounting)
CREATE TABLE IF NOT EXISTS public.kingpay_ledger_entries (
    entry_id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    account TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount_paise BIGINT NOT NULL,
    entity_id TEXT NOT NULL,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kingpay_ledger_tx ON public.kingpay_ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_ledger_entity ON public.kingpay_ledger_entries(entity_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_ledger_account ON public.kingpay_ledger_entries(account);

-- 5. EXTEND KINGPAY WALLETS WITH 24K GOLD BALANCE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'kingpay_wallets' AND column_name = 'gold_balance_mg'
    ) THEN
        ALTER TABLE public.kingpay_wallets ADD COLUMN gold_balance_mg BIGINT NOT NULL DEFAULT 0;
    END IF;
END $$;

-- 6. ROW LEVEL SECURITY & STRICT ISOLATION
ALTER TABLE public.travel_partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingpay_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Service role bypass policies
DROP POLICY IF EXISTS "Service role bypass on travel_partner_clicks" ON public.travel_partner_clicks;
CREATE POLICY "Service role bypass on travel_partner_clicks" ON public.travel_partner_clicks 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role bypass on travel_partner_commissions" ON public.travel_partner_commissions;
CREATE POLICY "Service role bypass on travel_partner_commissions" ON public.travel_partner_commissions 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role bypass on kingpay_ledger_entries" ON public.kingpay_ledger_entries;
CREATE POLICY "Service role bypass on kingpay_ledger_entries" ON public.kingpay_ledger_entries 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User SELECT / INSERT policies
DROP POLICY IF EXISTS "Users can view own clicks" ON public.travel_partner_clicks;
CREATE POLICY "Users can view own clicks" ON public.travel_partner_clicks 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clicks" ON public.travel_partner_clicks;
CREATE POLICY "Users can insert own clicks" ON public.travel_partner_clicks 
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own commissions" ON public.travel_partner_commissions;
CREATE POLICY "Users can view own commissions" ON public.travel_partner_commissions 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own ledger entries" ON public.kingpay_ledger_entries;
CREATE POLICY "Users can view own ledger entries" ON public.kingpay_ledger_entries 
    FOR SELECT USING (auth.uid()::text = entity_id);

-- Restrict unauthorized public direct writes
DROP POLICY IF EXISTS "Deny public direct write on travel_partner_commissions" ON public.travel_partner_commissions;
CREATE POLICY "Deny public direct write on travel_partner_commissions" ON public.travel_partner_commissions 
    FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Deny public direct write on kingpay_ledger_entries" ON public.kingpay_ledger_entries;
CREATE POLICY "Deny public direct write on kingpay_ledger_entries" ON public.kingpay_ledger_entries 
    FOR INSERT WITH CHECK (false);
