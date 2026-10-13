-- Migration: 20261012_production_hardening.sql
-- Production database hardening: tables, indexes, missing columns, and banking-grade RLS

-- =======================================================================
-- 1. LEDGER ENTRIES TABLE (Canonical split accounting)
-- =======================================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    org_id TEXT,
    order_id TEXT,
    restaurant_id TEXT,
    rider_id TEXT,
    party TEXT NOT NULL,
    kind TEXT NOT NULL,
    source TEXT NOT NULL,
    rule_key TEXT,
    amount_paise BIGINT NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Harmonize existing ledger_entries columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'rider_id') THEN
        ALTER TABLE ledger_entries ADD COLUMN rider_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'org_id') THEN
        ALTER TABLE ledger_entries ADD COLUMN org_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'note') THEN
        ALTER TABLE ledger_entries ADD COLUMN note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ledger_entries' AND column_name = 'rule_key') THEN
        ALTER TABLE ledger_entries ADD COLUMN rule_key TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ledger_entries_order_id ON ledger_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_restaurant_id ON ledger_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_party ON ledger_entries(party);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_org_id ON ledger_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on ledger_entries" ON ledger_entries;
CREATE POLICY "Service role bypass on ledger_entries" ON ledger_entries FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on ledger_entries" ON ledger_entries;
CREATE POLICY "Deny public on ledger_entries" ON ledger_entries FOR ALL USING (false);

-- =======================================================================
-- 2. PAYMENT WEBHOOK EVENTS TABLE (Cryptographic idempotency audit log)
-- =======================================================================
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    gateway TEXT NOT NULL,
    gateway_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload_json TEXT,
    signature TEXT,
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payment_webhook_events_gateway_event UNIQUE (gateway, gateway_event_id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'processed_at') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN processed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'processing_error') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN processing_error TEXT;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_gateway_id ON payment_webhook_events(gateway, gateway_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_created_at ON payment_webhook_events(created_at);

ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on payment_webhook_events" ON payment_webhook_events;
CREATE POLICY "Service role bypass on payment_webhook_events" ON payment_webhook_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on payment_webhook_events" ON payment_webhook_events;
CREATE POLICY "Deny public on payment_webhook_events" ON payment_webhook_events FOR ALL USING (false);

-- =======================================================================
-- 3. FINANCIAL LEDGER TABLE (Platform-wide financial reconciliation)
-- =======================================================================
CREATE TABLE IF NOT EXISTS financial_ledger (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    order_id TEXT,
    restaurant_id TEXT,
    rider_id TEXT,
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    amount_paise BIGINT DEFAULT 0,
    type TEXT DEFAULT 'GENERAL',
    entry_type TEXT,
    transaction_type TEXT,
    entity_type TEXT,
    account TEXT,
    source_account_id TEXT,
    destination_account_id TEXT,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'SETTLED',
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'amount_paise') THEN
        ALTER TABLE financial_ledger ADD COLUMN amount_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'entry_type') THEN
        ALTER TABLE financial_ledger ADD COLUMN entry_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'transaction_type') THEN
        ALTER TABLE financial_ledger ADD COLUMN transaction_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'entity_type') THEN
        ALTER TABLE financial_ledger ADD COLUMN entity_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'account') THEN
        ALTER TABLE financial_ledger ADD COLUMN account TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'source_account_id') THEN
        ALTER TABLE financial_ledger ADD COLUMN source_account_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'destination_account_id') THEN
        ALTER TABLE financial_ledger ADD COLUMN destination_account_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'currency') THEN
        ALTER TABLE financial_ledger ADD COLUMN currency TEXT DEFAULT 'INR';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'status') THEN
        ALTER TABLE financial_ledger ADD COLUMN status TEXT DEFAULT 'SETTLED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'metadata') THEN
        ALTER TABLE financial_ledger ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_ledger' AND column_name = 'rider_id') THEN
        ALTER TABLE financial_ledger ADD COLUMN rider_id TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_ledger_order_id ON financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_restaurant_id ON financial_ledger(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_type ON financial_ledger(type);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_entry_type ON financial_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_entity_type ON financial_ledger(entity_type);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_created_at ON financial_ledger(created_at);

ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on financial_ledger" ON financial_ledger;
CREATE POLICY "Service role bypass on financial_ledger" ON financial_ledger FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on financial_ledger" ON financial_ledger;
CREATE POLICY "Deny public on financial_ledger" ON financial_ledger FOR ALL USING (false);

-- =======================================================================
-- 4. RECONCILIATION REPORTS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS reconciliation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT,
    total_in NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_out NUMERIC(14, 2) NOT NULL DEFAULT 0,
    net_revenue NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_reports_order_id ON reconciliation_reports(order_id);
ALTER TABLE reconciliation_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on reconciliation_reports" ON reconciliation_reports;
CREATE POLICY "Service role bypass on reconciliation_reports" ON reconciliation_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on reconciliation_reports" ON reconciliation_reports;
CREATE POLICY "Deny public on reconciliation_reports" ON reconciliation_reports FOR ALL USING (false);

-- =======================================================================
-- 5. KINGPAY USER TRANSACTIONS TABLE
-- =======================================================================
CREATE TABLE IF NOT EXISTS kingpay_transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    amount_paise BIGINT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_user_id ON kingpay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_created_at ON kingpay_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_type ON kingpay_transactions(type);

ALTER TABLE kingpay_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_transactions" ON kingpay_transactions;
CREATE POLICY "Service role bypass on kingpay_transactions" ON kingpay_transactions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can read own kingpay transactions" ON kingpay_transactions;
CREATE POLICY "Users can read own kingpay transactions" ON kingpay_transactions FOR SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Deny public write on kingpay_transactions" ON kingpay_transactions;
CREATE POLICY "Deny public write on kingpay_transactions" ON kingpay_transactions FOR INSERT WITH CHECK (false);

-- =======================================================================
-- 6. HARDEN WAVE 9 KINGPAY TABLES WITH RLS & POLICIES
-- =======================================================================
ALTER TABLE merchant_kyc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on merchant_kyc" ON merchant_kyc;
CREATE POLICY "Service role bypass on merchant_kyc" ON merchant_kyc FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own kyc" ON merchant_kyc;
CREATE POLICY "Merchants can read own kyc" ON merchant_kyc FOR SELECT USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);
DROP POLICY IF EXISTS "Deny public write on merchant_kyc" ON merchant_kyc;
CREATE POLICY "Deny public write on merchant_kyc" ON merchant_kyc FOR INSERT WITH CHECK (false);

ALTER TABLE kingpay_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_wallets" ON kingpay_wallets;
CREATE POLICY "Service role bypass on kingpay_wallets" ON kingpay_wallets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can read own kingpay wallet" ON kingpay_wallets;
CREATE POLICY "Users can read own kingpay wallet" ON kingpay_wallets FOR SELECT USING (auth.uid()::text = user_id::text);
DROP POLICY IF EXISTS "Deny public write on kingpay_wallets" ON kingpay_wallets;
CREATE POLICY "Deny public write on kingpay_wallets" ON kingpay_wallets FOR INSERT WITH CHECK (false);

ALTER TABLE kingpay_merchant_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_merchant_wallets" ON kingpay_merchant_wallets;
CREATE POLICY "Service role bypass on kingpay_merchant_wallets" ON kingpay_merchant_wallets FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own merchant wallet" ON kingpay_merchant_wallets;
CREATE POLICY "Merchants can read own merchant wallet" ON kingpay_merchant_wallets FOR SELECT USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);
DROP POLICY IF EXISTS "Deny public write on kingpay_merchant_wallets" ON kingpay_merchant_wallets;
CREATE POLICY "Deny public write on kingpay_merchant_wallets" ON kingpay_merchant_wallets FOR INSERT WITH CHECK (false);

-- =======================================================================
-- 7. TOOL EXECUTION AUDITS & IDEMPOTENCY KEYS
-- =======================================================================
CREATE TABLE IF NOT EXISTS tool_execution_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tool_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    execution_ms INTEGER NOT NULL,
    success BOOLEAN NOT NULL,
    input_snapshot JSONB,
    output_snapshot JSONB,
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tool_id, request_id)
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
    key_value TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    response_body JSONB NOT NULL,
    status INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_execution_audits_tool_id ON tool_execution_audits(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_audits_user_id ON tool_execution_audits(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_execution_audits_created_at ON tool_execution_audits(created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);

ALTER TABLE tool_execution_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on tool_execution_audits" ON tool_execution_audits;
CREATE POLICY "Service role bypass on tool_execution_audits" ON tool_execution_audits FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on tool_execution_audits" ON tool_execution_audits;
CREATE POLICY "Deny public on tool_execution_audits" ON tool_execution_audits FOR ALL USING (false);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on idempotency_keys" ON idempotency_keys;
CREATE POLICY "Service role bypass on idempotency_keys" ON idempotency_keys FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on idempotency_keys" ON idempotency_keys;
CREATE POLICY "Deny public on idempotency_keys" ON idempotency_keys FOR ALL USING (false);

-- =======================================================================
-- 8. PLUGIN OAUTH TOKENS SECURITY ISOLATION
-- =======================================================================
ALTER TABLE plugin_oauth_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on plugin_oauth_tokens" ON plugin_oauth_tokens;
CREATE POLICY "Service role bypass on plugin_oauth_tokens" ON plugin_oauth_tokens FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on plugin_oauth_tokens" ON plugin_oauth_tokens;
CREATE POLICY "Deny public on plugin_oauth_tokens" ON plugin_oauth_tokens FOR ALL USING (false);

-- =======================================================================
-- 9. ADD MISSING COLUMNS & CONSTRAINTS TO AGENT_TASKS
-- =======================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_tasks' AND column_name = 'created_at') THEN
        ALTER TABLE agent_tasks ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_tasks' AND column_name = 'updated_at') THEN
        ALTER TABLE agent_tasks ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
END $$;

ALTER TABLE agent_tasks DROP CONSTRAINT IF EXISTS chk_dates;
ALTER TABLE agent_tasks ADD CONSTRAINT chk_dates CHECK (
    (started_at IS NULL AND completed_at IS NULL AND status = 'PENDING') OR
    (status IN ('RUNNING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_updated_at ON agent_tasks(updated_at);

ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_registry" ON agent_registry;
CREATE POLICY "Service role bypass on agent_registry" ON agent_registry FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_registry" ON agent_registry;
CREATE POLICY "Deny public on agent_registry" ON agent_registry FOR ALL USING (false);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_tasks" ON agent_tasks;
CREATE POLICY "Service role bypass on agent_tasks" ON agent_tasks FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_tasks" ON agent_tasks;
CREATE POLICY "Deny public on agent_tasks" ON agent_tasks FOR ALL USING (false);

ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_execution_logs" ON agent_execution_logs;
CREATE POLICY "Service role bypass on agent_execution_logs" ON agent_execution_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_execution_logs" ON agent_execution_logs;
CREATE POLICY "Deny public on agent_execution_logs" ON agent_execution_logs FOR ALL USING (false);

-- =======================================================================
-- 10. NOTIFICATIONS & NOTIFICATION OUTBOX HARMONIZATION
-- =======================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    org_id TEXT,
    user_id TEXT,
    channel TEXT,
    template_key TEXT,
    template TEXT,
    audience TEXT,
    title TEXT,
    body TEXT,
    kind TEXT,
    entity_id TEXT,
    target TEXT,
    status TEXT DEFAULT 'QUEUED',
    provider TEXT,
    provider_confirmed INTEGER DEFAULT 0,
    delivered_at TIMESTAMPTZ,
    provider_message_id TEXT,
    failure TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'provider_confirmed') THEN
        ALTER TABLE notifications ADD COLUMN provider_confirmed INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'delivered_at') THEN
        ALTER TABLE notifications ADD COLUMN delivered_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'provider_message_id') THEN
        ALTER TABLE notifications ADD COLUMN provider_message_id TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_org_id ON notifications(org_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on notifications" ON notifications;
CREATE POLICY "Service role bypass on notifications" ON notifications FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id);
DROP POLICY IF EXISTS "Deny public write on notifications" ON notifications;
CREATE POLICY "Deny public write on notifications" ON notifications FOR INSERT WITH CHECK (false);

CREATE TABLE IF NOT EXISTS notification_outbox (
    id TEXT PRIMARY KEY,
    channel TEXT,
    status TEXT DEFAULT 'pending',
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status ON notification_outbox(status);
ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on notification_outbox" ON notification_outbox;
CREATE POLICY "Service role bypass on notification_outbox" ON notification_outbox FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on notification_outbox" ON notification_outbox;
CREATE POLICY "Deny public on notification_outbox" ON notification_outbox FOR ALL USING (false);

-- =======================================================================
-- 11. ORDERS COLUMN HARMONIZATION
-- =======================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_paise') THEN
        ALTER TABLE orders ADD COLUMN total_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_value_paise') THEN
        ALTER TABLE orders ADD COLUMN order_value_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_paise') THEN
        ALTER TABLE orders ADD COLUMN commission_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_fee_paise') THEN
        ALTER TABLE orders ADD COLUMN delivery_fee_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'refund_paise') THEN
        ALTER TABLE orders ADD COLUMN refund_paise BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'commission_rate') THEN
        ALTER TABLE orders ADD COLUMN commission_rate NUMERIC(5, 4) DEFAULT 0.15;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
        ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'UNPAID';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'restaurant_id') THEN
        ALTER TABLE orders ADD COLUMN restaurant_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'org_id') THEN
        ALTER TABLE orders ADD COLUMN org_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'city_id') THEN
        ALTER TABLE orders ADD COLUMN city_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'zone_id') THEN
        ALTER TABLE orders ADD COLUMN zone_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'placed_at') THEN
        ALTER TABLE orders ADD COLUMN placed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_org_id ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
