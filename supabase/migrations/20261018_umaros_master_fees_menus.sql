-- ============================================================================
-- OrderKing Migration: UmarOS Master Configuration, Founder Fees & Corridors,
-- Supabase Realtime Publication, PA-CB / AD Category-I Remittance Orders,
-- and Anchor Store Menu Categories (Party Box & Food Palace).
-- File: supabase/migrations/20261018_umaros_master_fees_menus.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table: public.umar_os_config
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.umar_os_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT DEFAULT 'founder',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure backwards-compatible non-destructive column additions
ALTER TABLE public.umar_os_config ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.umar_os_config ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'founder';
ALTER TABLE public.umar_os_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.umar_os_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Enable Row Level Security (RLS)
ALTER TABLE public.umar_os_config ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS policies for umar_os_config
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'umar_os_config' AND policyname = 'Allow all to read umar_os_config'
    ) THEN
        CREATE POLICY "Allow all to read umar_os_config" 
            ON public.umar_os_config 
            FOR SELECT 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'umar_os_config' AND policyname = 'Service role manages umar_os_config'
    ) THEN
        CREATE POLICY "Service role manages umar_os_config" 
            ON public.umar_os_config 
            FOR ALL 
            USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- Replica Identity for Realtime CDC
ALTER TABLE public.umar_os_config REPLICA IDENTITY FULL;

-- ----------------------------------------------------------------------------
-- Seed Data: founder_fees
-- ----------------------------------------------------------------------------
INSERT INTO public.umar_os_config (key, value, description, updated_by)
VALUES (
    'founder_fees',
    '{
        "remit_fee": 1.5,
        "food_platform_fee": 12,
        "travel_pnr_convenience_fee_inr": 29,
        "wallet_cashback_reward_inr": 5,
        "platform_convenience_fee_paise": 500,
        "instant_settlement_bps": 15,
        "pa_cb_cross_border_markup_bps": 75,
        "sovereign_take_rate_bps": 250,
        "dynamic_delivery_base_paise": 2500,
        "surge_multiplier_max": 2.50,
        "compliance_gst_rate_pct": 18,
        "food_packaging_fixed_paise": 1500,
        "intercity_corridor_surcharge_paise": 4900
    }'::jsonb,
    'Sovereign founder revenue economics, convenience fee rails, cashback reward margins, and platform take-rates.',
    'founder'
)
ON CONFLICT (key) DO UPDATE SET
    value = public.umar_os_config.value || EXCLUDED.value,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = timezone('utc'::text, now());

-- ----------------------------------------------------------------------------
-- Seed Data: corridor_settings
-- ----------------------------------------------------------------------------
INSERT INTO public.umar_os_config (key, value, description, updated_by)
VALUES (
    'corridor_settings',
    '{
        "active_corridors": [
            {
                "id": "IND-UAE",
                "name": "India - United Arab Emirates",
                "source_currency": "INR",
                "destination_currency": "AED",
                "fx_markup_bps": 65,
                "per_tx_min_paise": 100000,
                "per_tx_max_paise": 250000000,
                "ad_bank_escrow": "HDFC_BANK_TREASURY_MUMBAI",
                "settlement_rail": "PA_CB_DIRECT",
                "rbi_purpose_codes": ["P0103", "P0802", "P1006"],
                "active": true
            },
            {
                "id": "IND-SGP",
                "name": "India - Singapore (UPI-PayNow)",
                "source_currency": "INR",
                "destination_currency": "SGD",
                "fx_markup_bps": 50,
                "per_tx_min_paise": 50000,
                "per_tx_max_paise": 250000000,
                "ad_bank_escrow": "ICICI_BANK_GIFT_CITY",
                "settlement_rail": "UPI_PAYNOW_CROSS_BORDER",
                "rbi_purpose_codes": ["P0103", "P0802", "P1006"],
                "active": true
            },
            {
                "id": "IND-USA",
                "name": "India - United States (FedNow/ACH)",
                "source_currency": "INR",
                "destination_currency": "USD",
                "fx_markup_bps": 75,
                "per_tx_min_paise": 100000,
                "per_tx_max_paise": 250000000,
                "ad_bank_escrow": "STATE_BANK_OF_INDIA_GLOBAL",
                "settlement_rail": "PA_CB_SWIFT_GPI",
                "rbi_purpose_codes": ["P0802", "P1006"],
                "active": true
            },
            {
                "id": "IND-GBR",
                "name": "India - United Kingdom (Faster Payments)",
                "source_currency": "INR",
                "destination_currency": "GBP",
                "fx_markup_bps": 70,
                "per_tx_min_paise": 100000,
                "per_tx_max_paise": 250000000,
                "ad_bank_escrow": "BARCLAYS_AD_CAT1_NOSTRO",
                "settlement_rail": "PA_CB_DIRECT",
                "rbi_purpose_codes": ["P0103", "P0802", "P1006"],
                "active": true
            },
            {
                "id": "DOM-DEL-BOM",
                "name": "Delhi - Mumbai Aviation Corridor",
                "type": "DOMESTIC_HIGH_SPEED",
                "source_city": "DEL",
                "destination_city": "BOM",
                "active": true,
                "surge_allowed": true
            }
        ],
        "compliance_rules": {
            "pa_cb_framework": "RBI_CIRCULAR_PA_CB_2023_24",
            "ad_bank_category": "AD_CATEGORY_1",
            "annual_lrs_limit_usd": 250000,
            "kyc_mandatory": true,
            "pan_verification_mandatory": true,
            "sanctions_screening_realtime": true,
            "tcs_threshold_inr": 700000,
            "tcs_rate_pct": 5
        }
    }'::jsonb,
    'RBI PA-CB (Payment Aggregator - Cross Border) and AD Category-I corridor parameters and domestic high-speed corridor telemetry.',
    'founder'
)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_by = EXCLUDED.updated_by,
    updated_at = timezone('utc'::text, now());

-- ----------------------------------------------------------------------------
-- 2. Realtime Publication: Add umar_os_config to supabase_realtime
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'umar_os_config') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'umar_os_config'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.umar_os_config;
        END IF;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Table: public.remittance_orders (PA-CB / AD Category-I compliant)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.remittance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_pan_masked TEXT NOT NULL,
    sender_country_code VARCHAR(3) NOT NULL DEFAULT 'IND',
    sender_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    recipient_name TEXT NOT NULL,
    recipient_country_code VARCHAR(3) NOT NULL,
    recipient_currency VARCHAR(3) NOT NULL,
    recipient_iban_or_account_masked TEXT NOT NULL,
    recipient_swift_bic TEXT,
    recipient_routing_number TEXT,
    corridor_id TEXT NOT NULL,
    send_amount_paise BIGINT NOT NULL,
    fx_rate NUMERIC(18, 6) NOT NULL,
    fx_spread_bps INTEGER NOT NULL DEFAULT 50,
    receive_amount_units BIGINT NOT NULL,
    service_fee_paise BIGINT NOT NULL DEFAULT 0,
    gst_paise BIGINT NOT NULL DEFAULT 0,
    total_charged_paise BIGINT NOT NULL,
    ad_bank_partner TEXT NOT NULL DEFAULT 'AD_CAT1_PARTNER_ESCROW',
    ad_reference_number TEXT,
    purpose_code TEXT NOT NULL,
    compliance_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (compliance_status IN ('PENDING', 'OFAC_PASSED', 'AML_CLEARED', 'EDD_REQUIRED', 'REJECTED')),
    lrs_financial_year_utilization_usd NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'INITIATED' CHECK (status IN ('INITIATED', 'PROCESSING', 'SETTLING_AD_BANK', 'COMPLETED', 'FAILED', 'REFUNDED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Performance & Compliance Indexes
CREATE INDEX IF NOT EXISTS idx_remittance_orders_user_id ON public.remittance_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_remittance_orders_order_number ON public.remittance_orders (order_number);
CREATE INDEX IF NOT EXISTS idx_remittance_orders_status ON public.remittance_orders (status);
CREATE INDEX IF NOT EXISTS idx_remittance_orders_corridor ON public.remittance_orders (corridor_id);
CREATE INDEX IF NOT EXISTS idx_remittance_orders_created_at ON public.remittance_orders (created_at DESC);

-- Enable RLS for remittance_orders
ALTER TABLE public.remittance_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'remittance_orders' AND policyname = 'Service role full access on remittance_orders'
    ) THEN
        CREATE POLICY "Service role full access on remittance_orders" 
            ON public.remittance_orders 
            FOR ALL 
            USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'remittance_orders' AND policyname = 'Users can view own remittance_orders'
    ) THEN
        CREATE POLICY "Users can view own remittance_orders" 
            ON public.remittance_orders 
            FOR SELECT 
            USING (auth.uid()::text = user_id::text);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'remittance_orders' AND policyname = 'Users can insert own remittance_orders'
    ) THEN
        CREATE POLICY "Users can insert own remittance_orders" 
            ON public.remittance_orders 
            FOR INSERT 
            WITH CHECK (auth.uid()::text = user_id::text);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Table: public.menu_categories & Anchor Stores Seed (Party Box & Food Palace)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.menu_categories (
    id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_bn TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'menu_categories' AND policyname = 'Allow public select on menu_categories'
    ) THEN
        CREATE POLICY "Allow public select on menu_categories" 
            ON public.menu_categories 
            FOR SELECT 
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'menu_categories' AND policyname = 'Service role manages menu_categories'
    ) THEN
        CREATE POLICY "Service role manages menu_categories" 
            ON public.menu_categories 
            FOR ALL 
            USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;

-- Ensure Anchor Restaurant entries exist in public.restaurants
INSERT INTO public.restaurants (
    id, slug, name, description_en, description_bn, cuisine_summary, veg_only,
    rating_avg, rating_count, prep_minutes, commission_bps, packaging_paise, min_order_paise,
    promoted, active, status, data_mode, org_id, city_id, zone_id
) VALUES 
(
    'rst_party_box',
    'party-box-anchor',
    'Party Box',
    'Sovereign mega-portions, artisanal Biryanis, celebratory bowls, and family feast platters.',
    'পার্টি ও পরিবারের জন্য তৈরি প্রিমিয়াম বিরিয়ানি, বোলস ও স্পেশাল প্ল্যাটার।',
    'Biryanis, Bowls, Party Platters, Mughlai, Kebabs',
    false,
    4.85,
    3500,
    20,
    1000,
    2500,
    19900,
    true,
    true,
    'ACTIVE',
    'LIVE',
    'org_orderking',
    'del',
    'del-cp'
),
(
    'party_box',
    'party-box',
    'Party Box',
    'Sovereign mega-portions, artisanal Biryanis, celebratory bowls, and family feast platters.',
    'পার্টি ও পরিবারের জন্য তৈরি প্রিমিয়াম বিরিয়ানি, বোলস ও স্পেশাল প্ল্যাটার।',
    'Biryanis, Bowls, Party Platters, Mughlai, Kebabs',
    false,
    4.85,
    3500,
    20,
    1000,
    2500,
    19900,
    true,
    true,
    'ACTIVE',
    'LIVE',
    'org_orderking',
    'del',
    'del-cp'
),
(
    'rst_food_palace',
    'food-palace-anchor',
    'Food Palace',
    'Grand heritage multi-cuisine dining anchor serving rich North Indian, Royal Mughlai, and Tandoori feasts.',
    'ঐতিহ্যবাহী নর্থ ইন্ডিয়ান, রয়েল মুঘলাই এবং সুস্বাদু তন্দুরি খাবারের রাজকীয় ঠিকানা।',
    'North Indian, Royal Mughlai, Tandoor, Indo-Chinese',
    false,
    4.75,
    4800,
    25,
    1200,
    2000,
    14900,
    true,
    true,
    'ACTIVE',
    'LIVE',
    'org_orderking',
    'del',
    'del-cp'
),
(
    'food_palace',
    'food-palace',
    'Food Palace',
    'Grand heritage multi-cuisine dining anchor serving rich North Indian, Royal Mughlai, and Tandoori feasts.',
    'ঐতিহ্যবাহী নর্থ ইন্ডিয়ান, রয়েল মুঘলাই এবং সুস্বাদু তন্দুরি খাবারের রাজকীয় ঠিকানা।',
    'North Indian, Royal Mughlai, Tandoor, Indo-Chinese',
    false,
    4.75,
    4800,
    25,
    1200,
    2000,
    14900,
    true,
    true,
    'ACTIVE',
    'LIVE',
    'org_orderking',
    'del',
    'del-cp'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    active = EXCLUDED.active,
    status = EXCLUDED.status,
    description_en = EXCLUDED.description_en,
    cuisine_summary = EXCLUDED.cuisine_summary;

-- Seed Menu Categories for Party Box & Food Palace Anchor Stores
-- MANDATORY: Party Box BIRYANIS & BOWLS is at rank #3 (sort_order = 3)
INSERT INTO public.menu_categories (id, restaurant_id, name_en, name_bn, sort_order)
VALUES
    -- Party Box Anchor (rst_party_box)
    ('mc_pb_starters', 'rst_party_box', 'Starters & Quick Bites', 'স্টার্টার ও স্ন্যাক্স', 1),
    ('mc_pb_platters', 'rst_party_box', 'Party Platters & Feast Boxes', 'পার্টি প্ল্যাটার ও ফিস্ট বক্স', 2),
    ('mc_pb_biryanis_bowls', 'rst_party_box', 'BIRYANIS & BOWLS', 'বিরিয়ানি ও বোলস', 3),
    ('mc_pb_curries', 'rst_party_box', 'Chef Special Handi Curries', 'হান্ডি কারি ও গ্রেভি', 4),
    ('mc_pb_breads', 'rst_party_box', 'Tandoori Breads & Naans', 'তন্দুরি রুটি ও নান', 5),
    ('mc_pb_desserts', 'rst_party_box', 'Desserts & Beverages', 'ডেজার্ট ও পানীয়', 6),

    -- Party Box Anchor Alias (party_box)
    ('mc_pb_alias_starters', 'party_box', 'Starters & Quick Bites', 'স্টার্টার ও স্ন্যাক্স', 1),
    ('mc_pb_alias_platters', 'party_box', 'Party Platters & Feast Boxes', 'পার্টি প্ল্যাটার ও ফিস্ট বক্স', 2),
    ('mc_pb_alias_biryanis_bowls', 'party_box', 'BIRYANIS & BOWLS', 'বিরিয়ানি ও বোলস', 3),
    ('mc_pb_alias_curries', 'party_box', 'Chef Special Handi Curries', 'হান্ডি কারি ও গ্রেভি', 4),
    ('mc_pb_alias_breads', 'party_box', 'Tandoori Breads & Naans', 'তন্দুরি রুটি ও নান', 5),
    ('mc_pb_alias_desserts', 'party_box', 'Desserts & Beverages', 'ডেজার্ট ও পানীয়', 6),

    -- Food Palace Anchor (rst_food_palace)
    ('mc_fp_mughlai', 'rst_food_palace', 'Royal Mughlai Specials', 'রয়্যাল মুঘলাই স্পেশাল', 1),
    ('mc_fp_tandoori', 'rst_food_palace', 'Tandoor & Kebabs', 'তন্দুর ও কাবাব', 2),
    ('mc_fp_main_course', 'rst_food_palace', 'Main Course Delicacies', 'মেইন কোর্স ডেলিকেসি', 3),
    ('mc_fp_biryani', 'rst_food_palace', 'Dum Pukht Biryanis', 'দম পুখত বিরিয়ানি', 4),
    ('mc_fp_oriental', 'rst_food_palace', 'Indo-Chinese Delights', 'ইন্দো-চাইনিজ', 5),
    ('mc_fp_beverages', 'rst_food_palace', 'Royal Beverages & Desserts', 'রয়েল পানীয় ও ডেজার্ট', 6),

    -- Food Palace Anchor Alias (food_palace)
    ('mc_fp_alias_mughlai', 'food_palace', 'Royal Mughlai Specials', 'রয়্যাল মুঘলাই স্পেশাল', 1),
    ('mc_fp_alias_tandoori', 'food_palace', 'Tandoor & Kebabs', 'তন্দুর ও কাবাব', 2),
    ('mc_fp_alias_main_course', 'food_palace', 'Main Course Delicacies', 'মেইন কোর্স ডেলিকেসি', 3),
    ('mc_fp_alias_biryani', 'food_palace', 'Dum Pukht Biryanis', 'দম পুখত বিরিয়ানি', 4),
    ('mc_fp_alias_oriental', 'food_palace', 'Indo-Chinese Delights', 'ইন্দো-চাইনিজ', 5),
    ('mc_fp_alias_beverages', 'food_palace', 'Royal Beverages & Desserts', 'রয়েল পানীয় ও ডেজার্ট', 6)
ON CONFLICT (id) DO UPDATE SET
    restaurant_id = EXCLUDED.restaurant_id,
    name_en = EXCLUDED.name_en,
    name_bn = EXCLUDED.name_bn,
    sort_order = EXCLUDED.sort_order;

-- Seed flagship menu items for Party Box BIRYANIS & BOWLS anchor category
INSERT INTO public.menu_items (
    id, restaurant_id, category_id, name_en, name_bn, description_en, description_bn,
    veg, spicy_level, bestseller, available, base_price_paise, sort_order, data_label,
    category, name, price_paise
) VALUES
(
    'itm_pb_royal_mutton_biryani_bowl',
    'rst_party_box',
    'mc_pb_biryanis_bowls',
    'Royal Mutton Dum Biryani Party Bowl',
    'রয়্যাল মাটন দম বিরিয়ানি পার্টি বোল',
    'Slow-cooked succulent tender goat meat layered with fragrant aged long-grain basmati rice and saffron essence.',
    'সুগন্ধি জাফরান ও দীর্ঘ দানার বাসমতী চালে রান্না নরম খাঁটি খাসির দম বিরিয়ানি।',
    false,
    2,
    true,
    true,
    59900,
    1,
    'LIVE',
    'mc_pb_biryanis_bowls',
    'Royal Mutton Dum Biryani Party Bowl',
    59900
),
(
    'itm_pb_murgh_tikka_biryani_bowl',
    'rst_party_box',
    'mc_pb_biryanis_bowls',
    'Charcoal Murgh Tikka Biryani Bowl',
    'চারকোল চিকেন টিক্কা বিরিয়ানি বোল',
    'Charcoal-smoked spiced chicken tikka pieces served over dum-spiced aromatic saffron basmati rice.',
    'চারকোল ধোঁয়ায় রোস্ট করা টিক্কা ও জাফরানি সুগন্ধি চালের বিরিয়ানি বোল।',
    false,
    2,
    true,
    true,
    44900,
    2,
    'LIVE',
    'mc_pb_biryanis_bowls',
    'Charcoal Murgh Tikka Biryani Bowl',
    44900
),
(
    'itm_pb_shahi_paneer_rice_bowl',
    'rst_party_box',
    'mc_pb_biryanis_bowls',
    'Shahi Malai Paneer Biryani Bowl',
    'শাহী মালাই পনির বিরিয়ানি বোল',
    'Rich cottage cheese cubes simmered in royal cashew saffron sauce atop aromatic steamed basmati.',
    'কাজুবাদাম ও কেশরের রাজকীয় স্বাদে নরম মালাই পনির বিরিয়ানি বোল।',
    true,
    1,
    true,
    true,
    37900,
    3,
    'LIVE',
    'mc_pb_biryanis_bowls',
    'Shahi Malai Paneer Biryani Bowl',
    37900
)
ON CONFLICT (id) DO UPDATE SET
    name_en = EXCLUDED.name_en,
    name_bn = EXCLUDED.name_bn,
    base_price_paise = EXCLUDED.base_price_paise,
    price_paise = EXCLUDED.price_paise,
    available = EXCLUDED.available;
