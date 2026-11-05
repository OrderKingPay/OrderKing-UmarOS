-- ORDERKING & KINGPAY — POSTGRESQL 17.6 STATUTORY & QUAD-PLATFORM CORE SCHEMA
-- Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 | Assam - 788710
BEGIN;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE orderking_order_status AS ENUM (
    'PLACED_AND_PAID','KITCHEN_ACCEPTED','FOOD_PREPARED_AND_READY',
    'RIDER_ASSIGNED','OUT_FOR_DELIVERY','DELIVERED','REJECTED_BY_KITCHEN','CANCELLED','REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.merchant_outlets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id TEXT NOT NULL,
  legal_business_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  fssai_license_number CHAR(14) NOT NULL UNIQUE
    CONSTRAINT chk_fssai_14_digits CHECK (fssai_license_number ~ '^[12](0[1-9]|[12][0-9]|3[0-8])[0-9]{11}$'),
  fssai_license_category TEXT NOT NULL CHECK (fssai_license_category IN ('CENTRAL_LICENSE','STATE_LICENSE','BASIC_REGISTRATION')),
  fssai_valid_until DATE NOT NULL,
  is_gst_registered BOOLEAN NOT NULL DEFAULT FALSE,
  gstin VARCHAR(18) NOT NULL DEFAULT 'GST_EXEMPT_SEC_9_5',
  pan_number CHAR(10) NOT NULL CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  bank_account_number VARCHAR(34) NOT NULL,
  bank_ifsc CHAR(11) NOT NULL CHECK (bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  commission_rate_bps INTEGER NOT NULL DEFAULT 1800 CHECK (commission_rate_bps BETWEEN 1000 AND 2500),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_pure_veg BOOLEAN NOT NULL DEFAULT FALSE,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  clickwrap_contract_version TEXT NOT NULL DEFAULT 'OKP-MERCHANT-MSA-2026-V1',
  clickwrap_signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clickwrap_sha256_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orderking_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code VARCHAR(16) NOT NULL UNIQUE,
  customer_id TEXT NOT NULL,
  outlet_id UUID NOT NULL REFERENCES public.merchant_outlets(id),
  rider_id TEXT,
  status orderking_order_status NOT NULL DEFAULT 'PLACED_AND_PAID',
  version INTEGER NOT NULL DEFAULT 1,
  items_snapshot JSONB NOT NULL,
  price_paise BIGINT NOT NULL CHECK (price_paise >= 0),
  packaging_paise BIGINT NOT NULL DEFAULT 0 CHECK (packaging_paise >= 0),
  merchant_discount_paise BIGINT NOT NULL DEFAULT 0 CHECK (merchant_discount_paise >= 0),
  net_taxable_food_paise BIGINT NOT NULL CHECK (net_taxable_food_paise >= 0),
  cgst_paise BIGINT NOT NULL CHECK (cgst_paise >= 0),
  sgst_paise BIGINT NOT NULL CHECK (sgst_paise >= 0),
  platform_fee_paise BIGINT NOT NULL DEFAULT 1000,
  delivery_fee_paise BIGINT NOT NULL DEFAULT 0,
  customer_tip_paise BIGINT NOT NULL DEFAULT 0,
  platform_commission_paise BIGINT NOT NULL DEFAULT 0,
  gst_on_commission_paise BIGINT NOT NULL DEFAULT 0,
  tds_paise BIGINT NOT NULL DEFAULT 0,
  tcs_paise BIGINT NOT NULL DEFAULT 0,
  payment_gateway_fee_paise BIGINT NOT NULL DEFAULT 0,
  merchant_net_payable_paise BIGINT NOT NULL DEFAULT 0,
  rider_payout_paise BIGINT NOT NULL DEFAULT 0,
  customer_total_paid_paise BIGINT NOT NULL CHECK (customer_total_paid_paise >= 0),
  kds_prep_minutes INTEGER NOT NULL DEFAULT 15 CHECK (kds_prep_minutes IN (10,15,20,25,30,35,40,45,50)),
  kds_reject_reason TEXT,
  pickup_otp_4digit CHAR(4) NOT NULL,
  delivery_otp_hmac_sha256 CHAR(64) NOT NULL,
  delivery_otp_verified_at TIMESTAMPTZ,
  delivered_gps_lat DOUBLE PRECISION,
  delivered_gps_lng DOUBLE PRECISION,
  retain_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.double_entry_ledger (
  entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orderking_orders(id),
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  entry_type TEXT NOT NULL,
  prev_hash CHAR(64) NOT NULL,
  curr_hash CHAR(64) NOT NULL,
  retain_until TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 months'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rider_ephemeral_telemetry (
  ping_id BIGSERIAL PRIMARY KEY,
  rider_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (speed_kmh >= 0 AND speed_kmh <= 120),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purge_after TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE TABLE IF NOT EXISTS public.umar_os_config (
  config_key TEXT PRIMARY KEY,
  config_value JSONB NOT NULL,
  updated_by TEXT NOT NULL DEFAULT 'FOUNDER_UMAR_OS',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
COMMIT;
