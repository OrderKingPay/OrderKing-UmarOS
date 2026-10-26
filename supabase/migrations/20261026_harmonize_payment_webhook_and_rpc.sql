-- Migration: 20261026_harmonize_payment_webhook_and_rpc.sql
-- 👑 ORDERKINGPAY AUTOMATED SETTLEMENT & RECONCILIATION ENGINE
-- Harmonizes payment_webhook_events schema and deploys settle_captured_razorpay_order RPC

-- 1. Harmonize payment_webhook_events table
CREATE TABLE IF NOT EXISTS payment_webhook_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    gateway TEXT NOT NULL DEFAULT 'RAZORPAY',
    gateway_event_id TEXT,
    event_id TEXT,
    payment_id TEXT,
    order_id TEXT,
    event_type TEXT NOT NULL,
    raw_payload JSONB,
    payload_json TEXT,
    signature TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns safely if table already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'event_id') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN event_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'payment_id') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'order_id') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN order_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'raw_payload') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN raw_payload JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'received_at') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN received_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'processed_at') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN processed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_webhook_events' AND column_name = 'processing_error') THEN
        ALTER TABLE payment_webhook_events ADD COLUMN processing_error TEXT;
    END IF;
END $$;

-- Backfill event_id from gateway_event_id if null
UPDATE payment_webhook_events 
SET event_id = gateway_event_id 
WHERE event_id IS NULL AND gateway_event_id IS NOT NULL;

-- High-performance lookup & idempotency uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_webhook_events_event_id ON payment_webhook_events (event_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_order_id ON payment_webhook_events (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_payment_id ON payment_webhook_events (payment_id);

-- RLS Enforcement
ALTER TABLE payment_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on payment_webhook_events" ON payment_webhook_events;
CREATE POLICY "Service role bypass on payment_webhook_events" ON payment_webhook_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on payment_webhook_events" ON payment_webhook_events;
CREATE POLICY "Deny public on payment_webhook_events" ON payment_webhook_events FOR ALL USING (false);

-- 2. Ensure financial_ledger & payments updated_at schema
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'updated_at') THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_ledger_order_id ON financial_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_created_at ON financial_ledger(created_at);

ALTER TABLE financial_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on financial_ledger" ON financial_ledger;
CREATE POLICY "Service role bypass on financial_ledger" ON financial_ledger FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on financial_ledger" ON financial_ledger;
CREATE POLICY "Deny public on financial_ledger" ON financial_ledger FOR ALL USING (false);

-- 3. Atomic settlement RPC for Razorpay webhook captured order
CREATE OR REPLACE FUNCTION settle_captured_razorpay_order(
    p_event_id TEXT,
    p_razorpay_order_id TEXT,
    p_razorpay_payment_id TEXT,
    p_amount_paise BIGINT,
    p_gateway_fee_paise BIGINT DEFAULT 0,
    p_gateway_tax_paise BIGINT DEFAULT 0,
    p_method TEXT DEFAULT 'upi',
    p_upi_rrn TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id TEXT;
    v_order_status TEXT;
    v_current_payment_status TEXT;
BEGIN
    -- 1. Identify target order by razorpay_order_id stored in payments or orders
    SELECT o.id, o.status, o.payment_status
    INTO v_order_id, v_order_status, v_current_payment_status
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
    WHERE (
       p.provider_ref = p_razorpay_order_id
       OR p.idempotency_key = 'rzp:' || p_razorpay_payment_id
       OR o.idempotency_key = p_razorpay_order_id
       OR (p.raw_payload IS NOT NULL AND p.raw_payload LIKE '%' || p_razorpay_order_id || '%')
    )
    LIMIT 1;

    -- 2. If order exists, update status idempotently
    IF v_order_id IS NOT NULL THEN
        UPDATE orders
        SET payment_status = 'paid',
            status = CASE WHEN status = 'PAYMENT_PENDING' THEN 'PLACED' ELSE status END,
            updated_at = NOW()
        WHERE id = v_order_id;

        UPDATE payments
        SET status = 'captured',
            amount_paise = p_amount_paise,
            provider_ref = COALESCE(provider_ref, p_razorpay_payment_id),
            raw_payload = jsonb_build_object(
                'event_id', p_event_id,
                'payment_id', p_razorpay_payment_id,
                'fee_paise', p_gateway_fee_paise,
                'tax_paise', p_gateway_tax_paise,
                'method', p_method,
                'rrn', p_upi_rrn,
                'settled_at', NOW()
            )::text,
            updated_at = NOW()
        WHERE order_id = v_order_id;
    END IF;

    -- 3. Record in financial_ledger
    INSERT INTO financial_ledger (
        id, order_id, amount, amount_paise, type, entry_type, transaction_type,
        account, source_account_id, destination_account_id, currency,
        status, description, metadata, created_at
    ) VALUES (
        gen_random_uuid()::text,
        v_order_id,
        (p_amount_paise::numeric / 100.0),
        p_amount_paise,
        'GATEWAY_PAYMENT',
        'CREDIT',
        'PAYMENT_CAPTURED',
        'BANK_CLEARING',
        'RAZORPAY',
        'PLATFORM_NODAL',
        'INR',
        'SETTLED',
        'Razorpay webhook capture for ' || p_razorpay_payment_id,
        jsonb_build_object(
            'event_id', p_event_id,
            'gateway_fee_paise', p_gateway_fee_paise,
            'gateway_tax_paise', p_gateway_tax_paise,
            'method', p_method,
            'rrn', p_upi_rrn
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'ok', true,
        'order_id', v_order_id,
        'payment_id', p_razorpay_payment_id,
        'amount_paise', p_amount_paise,
        'settled', true
    );
END;
$$;
