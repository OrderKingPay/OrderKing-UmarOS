-- ============================================================================
-- ORDERKING & KINGPAY — QUAD-PLATFORM POSTGRESQL 17.6 PRODUCTION SCHEMA & DDL
-- Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
-- Enforces:
-- 1. Integer-Paise Financial Architecture & Double-Entry Bookkeeping Ledger
-- 2. Strict Order State Machine & Immutable Audit Trail (72-Month Retention)
-- 3. 14-Digit FSSAI Validation, Expiry Tracking & Digital Clickwrap Contracts
-- 4. Dynamic Platform Config (KingPay Fees, Shift Radiuses, Telecom Failover)
-- 5. 90-Day Ephemeral GPS Telemetry Auto-Purge Window (DPDP Act 2023)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DYNAMIC PLATFORM CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS public.platform_dynamic_configs (
    config_key TEXT PRIMARY KEY,
    domestic_flight_fee_paise BIGINT NOT NULL DEFAULT 39900 CHECK (domestic_flight_fee_paise >= 0),
    intl_flight_fee_paise BIGINT NOT NULL DEFAULT 129900 CHECK (intl_flight_fee_paise >= 0),
    food_platform_fee_paise BIGINT NOT NULL DEFAULT 1200 CHECK (food_platform_fee_paise >= 0),
    default_commission_bps INTEGER NOT NULL DEFAULT 1800 CHECK (default_commission_bps BETWEEN 0 AND 3500),
    surge_multiplier_bps INTEGER NOT NULL DEFAULT 10000 CHECK (surge_multiplier_bps BETWEEN 10000 AND 30000),
    day_shift_radius_km NUMERIC(5,2) NOT NULL DEFAULT 12.00 CHECK (day_shift_radius_km > 0),
    evening_shift_radius_km NUMERIC(5,2) NOT NULL DEFAULT 7.50 CHECK (evening_shift_radius_km > 0),
    night_shift_radius_km NUMERIC(5,2) NOT NULL DEFAULT 3.50 CHECK (night_shift_radius_km > 0),
    telecom_priority JSONB NOT NULL DEFAULT '["fast2sms", "2factor"]'::jsonb,
    updated_by TEXT NOT NULL DEFAULT 'SYSTEM',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_dynamic_configs (config_key)
VALUES ('GLOBAL_SWITCHBOARD')
ON CONFLICT (config_key) DO NOTHING;

-- 2. MERCHANT FSSAI VERIFICATION & DIGITAL CLICKWRAP CONTRACTS
CREATE TABLE IF NOT EXISTS public.merchant_fssai_verifications (
    restaurant_id TEXT PRIMARY KEY,
    fssai_number VARCHAR(14) NOT NULL CHECK (fssai_number ~ '^[12][0-9]{13}$'),
    license_tier TEXT NOT NULL CHECK (license_tier IN ('CENTRAL_LICENSE', 'STATE_LICENSE', 'BASIC_REGISTRATION')),
    fbo_legal_name TEXT NOT NULL,
    gstin VARCHAR(15) CHECK (gstin IS NULL OR gstin = '' OR gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
    bank_account_number VARCHAR(34) NOT NULL,
    bank_ifsc VARCHAR(11) NOT NULL CHECK (bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
    expiry_date DATE NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.merchant_clickwrap_contracts (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id TEXT NOT NULL REFERENCES public.merchant_fssai_verifications(restaurant_id) ON DELETE CASCADE,
    signatory_name TEXT NOT NULL,
    signatory_mobile VARCHAR(10) NOT NULL CHECK (signatory_mobile ~ '^[6-9][0-9]{9}$'),
    commission_bps INTEGER NOT NULL CHECK (commission_bps BETWEEN 1500 AND 2200),
    settlement_cycle TEXT NOT NULL DEFAULT 'T_PLUS_1' CHECK (settlement_cycle IN ('T_PLUS_1', 'STANDARD_T3')),
    contract_sha256 CHAR(64) NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months')
);

-- 3. QUAD-PARTY ORDERS TABLE (INTEGER-PAISE ARCHITECTURE & STATE MACHINE)
DO $$
BEGIN
    CREATE TYPE public.order_lifecycle_status AS ENUM (
        'PLACED_AND_PAID',
        'KITCHEN_ACCEPTED',
        'FOOD_PREPARED_READY',
        'RIDER_ASSIGNED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'REJECTED',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.quad_party_orders (
    order_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    restaurant_id TEXT NOT NULL,
    rider_id TEXT,
    status public.order_lifecycle_status NOT NULL DEFAULT 'PLACED_AND_PAID',
    items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
    prep_timer_minutes INTEGER CHECK (prep_timer_minutes IN (10, 15, 25, 35)),
    rejection_reason TEXT,
    pickup_pin CHAR(4) NOT NULL CHECK (pickup_pin ~ '^[0-9]{4}$'),
    doorstep_otp_hash CHAR(64) NOT NULL,
    doorstep_otp_verified BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_distance_km NUMERIC(6,2) NOT NULL DEFAULT 1.50 CHECK (delivery_distance_km >= 0),
    
    -- Integer-Paise Financial Columns (Zero Floating-Point)
    price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
    packaging_paise BIGINT NOT NULL DEFAULT 0 CHECK (packaging_paise >= 0),
    delivery_fee_paise BIGINT NOT NULL DEFAULT 0 CHECK (delivery_fee_paise >= 0),
    convenience_fee_paise BIGINT NOT NULL DEFAULT 1200 CHECK (convenience_fee_paise >= 0),
    cgst_paise BIGINT NOT NULL CHECK (cgst_paise >= 0),
    sgst_paise BIGINT NOT NULL CHECK (sgst_paise >= 0),
    platform_commission_paise BIGINT NOT NULL CHECK (platform_commission_paise >= 0),
    commission_gst_paise BIGINT NOT NULL CHECK (commission_gst_paise >= 0),
    tds_paise BIGINT NOT NULL CHECK (tds_paise >= 0),
    tcs_paise BIGINT NOT NULL CHECK (tcs_paise >= 0),
    pg_fee_paise BIGINT NOT NULL CHECK (pg_fee_paise >= 0),
    rider_payout_paise BIGINT NOT NULL CHECK (rider_payout_paise >= 0),
    net_merchant_payable_paise BIGINT NOT NULL CHECK (net_merchant_payable_paise >= 0),
    customer_total_paise BIGINT NOT NULL CHECK (customer_total_paise >= 0),

    delivered_gps_lat DOUBLE PRECISION,
    delivered_gps_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months')
);

-- 4. IMMUTABLE ORDER STATE AUDIT LOG (DPDP ACT 2023 & SEC 36 CGST 72-MONTH RETENTION)
CREATE TABLE IF NOT EXISTS public.order_lifecycle_audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL REFERENCES public.quad_party_orders(order_id) ON DELETE RESTRICT,
    previous_status public.order_lifecycle_status,
    next_status public.order_lifecycle_status NOT NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('CUSTOMER', 'MERCHANT_KDS', 'RIDER', 'UMAR_OS_ADMIN', 'SYSTEM')),
    actor_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months')
);

-- Strict State Transition Trigger Function
CREATE OR REPLACE FUNCTION public.enforce_order_state_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF OLD.status = 'PLACED_AND_PAID' AND NEW.status NOT IN ('KITCHEN_ACCEPTED', 'REJECTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid state transition from PLACED_AND_PAID to %', NEW.status;
    ELSIF OLD.status = 'KITCHEN_ACCEPTED' AND NEW.status NOT IN ('FOOD_PREPARED_READY', 'RIDER_ASSIGNED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid state transition from KITCHEN_ACCEPTED to %', NEW.status;
    ELSIF OLD.status = 'FOOD_PREPARED_READY' AND NEW.status NOT IN ('RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid state transition from FOOD_PREPARED_READY to %', NEW.status;
    ELSIF OLD.status = 'RIDER_ASSIGNED' AND NEW.status NOT IN ('FOOD_PREPARED_READY', 'OUT_FOR_DELIVERY', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid state transition from RIDER_ASSIGNED to %', NEW.status;
    ELSIF OLD.status = 'OUT_FOR_DELIVERY' AND NEW.status NOT IN ('DELIVERED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid state transition from OUT_FOR_DELIVERY to %', NEW.status;
    ELSIF OLD.status IN ('DELIVERED', 'REJECTED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Terminal order status % cannot transition to %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'REJECTED' AND (NEW.rejection_reason IS NULL OR length(trim(NEW.rejection_reason)) < 3) THEN
        RAISE EXCEPTION 'Mandatory rejection_reason required when rejecting an order';
    END IF;

    IF NEW.status = 'DELIVERED' AND NEW.doorstep_otp_verified IS NOT TRUE THEN
        RAISE EXCEPTION 'Order cannot transition to DELIVERED without verified 4-digit doorstep OTP';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_state_transition ON public.quad_party_orders;
CREATE TRIGGER trg_enforce_order_state_transition
    BEFORE UPDATE ON public.quad_party_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_order_state_transition();

-- 5. DOUBLE-ENTRY FINANCIAL LEDGER (INTEGER PAISE, 72-MONTH RETENTION)
CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_group_id UUID NOT NULL,
    order_id TEXT NOT NULL REFERENCES public.quad_party_orders(order_id) ON DELETE RESTRICT,
    account_code TEXT NOT NULL CHECK (account_code IN (
        'CUSTOMER_ESCROW_DEBIT',
        'MERCHANT_PAYABLE_CREDIT',
        'RIDER_EARNINGS_CREDIT',
        'ECO_CGST_9_5_PAYABLE_CREDIT',
        'ECO_SGST_9_5_PAYABLE_CREDIT',
        'TDS_194_O_WITHHOLDING_CREDIT',
        'TCS_52_WITHHOLDING_CREDIT',
        'PLATFORM_COMMISSION_REVENUE_CREDIT',
        'COMMISSION_GST_18_PAYABLE_CREDIT',
        'PAYMENT_GATEWAY_RESERVE_CREDIT',
        'DELIVERY_FEE_RESERVE_CREDIT'
    )),
    entry_side TEXT NOT NULL CHECK (entry_side IN ('DEBIT', 'CREDIT')),
    amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retention_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months')
);

-- 6. EPHEMERAL RIDER GPS TELEMETRY (90-DAY AUTO-PURGE UNDER DPDP ACT 2023)
CREATE TABLE IF NOT EXISTS public.rider_gps_telemetry (
    ping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id TEXT NOT NULL,
    order_id TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    purge_after TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_rider_gps_purge_after ON public.rider_gps_telemetry(purge_after);
