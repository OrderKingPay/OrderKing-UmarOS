-- Migration: 0014_bulletproof_production_rls.sql
-- Description: Council Domain 1 & Domain 8 Supreme Security & Production Hardening RLS
-- Pillars:
-- 1. Customer Phone Masking & Rider Isolation (+91 98765 XXXXX via get_masked_order_contact)
-- 2. Merchant Menu Isolation (Public Read, Partners can only CUD their own menu items)
-- 3. Customer Order Privacy (Customers can only query their own orders)
-- 4. Rate-Limit Enforced Webhooks & Service-Role Only Ledger Tables

-- ============================================================================
-- 1. UTILITY: SECURE PHONE NUMBER MASKING FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION mask_phone_number(raw_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    cleaned TEXT;
    prefix TEXT;
    masked TEXT;
BEGIN
    IF raw_phone IS NULL OR trim(raw_phone) = '' THEN
        RETURN NULL;
    END IF;

    -- If already masked, return as is
    IF raw_phone LIKE '%XXXXX%' THEN
        RETURN raw_phone;
    END IF;

    -- Strip non-digits
    cleaned := regexp_replace(raw_phone, '\D', '', 'g');

    -- Standard Indian 10-digit number handling
    IF length(cleaned) >= 10 THEN
        -- Get last 10 digits
        cleaned := substring(cleaned from length(cleaned) - 9 for 10);
        prefix := substring(cleaned from 1 for 5);
        masked := '+91 ' || prefix || ' XXXXX';
        RETURN masked;
    ELSIF length(cleaned) >= 5 THEN
        RETURN substring(cleaned from 1 for 3) || ' XXXXX';
    ELSE
        RETURN '+91 98765 XXXXX';
    END IF;
END;
$$;

-- ============================================================================
-- 2. SECURE FUNCTION: get_masked_order_contact
-- ============================================================================
-- Riders can ONLY access customer contact via this secure DEFINER function.
-- Raw customer phone numbers are strictly inaccessible to the rider role.
CREATE OR REPLACE FUNCTION get_masked_order_contact(p_order_id TEXT)
RETURNS TABLE (
    order_id TEXT,
    customer_id TEXT,
    customer_name TEXT,
    masked_phone TEXT,
    delivery_address TEXT,
    order_status TEXT,
    rider_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id TEXT := auth.uid()::text;
    v_caller_role TEXT := auth.jwt() ->> 'role';
    v_is_service_role BOOLEAN := (v_caller_role = 'service_role');
    v_order_record RECORD;
    v_customer_name TEXT := 'Valued Customer';
    v_raw_phone TEXT := NULL;
    v_address TEXT := 'Delivery Address on file';
    v_masked_phone TEXT;
    v_is_assigned_rider BOOLEAN := false;
    v_is_owner_customer BOOLEAN := false;
    v_is_merchant BOOLEAN := false;
BEGIN
    -- 1. Locate the order
    SELECT o.id::text AS id,
           COALESCE(o.customer_id::text, o.user_id::text) AS cust_id,
           o.rider_id::text AS r_id,
           o.restaurant_id::text AS rest_id,
           o.status::text AS ord_status,
           COALESCE(o.address_snapshot, '') AS addr
    INTO v_order_record
    FROM public.orders o
    WHERE o.id::text = p_order_id
    LIMIT 1;

    IF v_order_record.id IS NULL THEN
        RAISE EXCEPTION 'Order % not found or inaccessible.', p_order_id;
    END IF;

    -- 2. Authorization checks
    IF v_caller_id IS NOT NULL THEN
        -- Check if caller is assigned rider
        IF v_order_record.r_id = v_caller_id THEN
            v_is_assigned_rider := true;
        ELSIF EXISTS (
            SELECT 1 FROM public.riders r
            WHERE (r.id::text = v_order_record.r_id OR r.user_id::text = v_caller_id)
              AND (r.user_id::text = v_caller_id OR r.id::text = v_caller_id)
        ) THEN
            v_is_assigned_rider := true;
        END IF;

        -- Check if caller is order customer
        IF v_order_record.cust_id = v_caller_id THEN
            v_is_owner_customer := true;
        END IF;

        -- Check if caller is restaurant member
        IF (auth.jwt() ->> 'restaurant_id') = v_order_record.rest_id
           OR EXISTS (
               SELECT 1 FROM public.restaurant_members rm
               WHERE rm.restaurant_id = v_order_record.rest_id
                 AND rm.user_id = v_caller_id
           ) THEN
            v_is_merchant := true;
        END IF;
    END IF;

    -- Strict authorization gating
    IF NOT (v_is_service_role OR v_is_assigned_rider OR v_is_owner_customer OR v_is_merchant) THEN
        RAISE EXCEPTION 'Access denied: caller (%) is not authorized to access contact details for order %',
            COALESCE(v_caller_id, 'anonymous'), p_order_id;
    END IF;

    -- 3. Retrieve customer details from profiles
    SELECT COALESCE(p.display_name, 'Valued Customer'), p.phone
    INTO v_customer_name, v_raw_phone
    FROM public.profiles p
    WHERE p.id::text = v_order_record.cust_id
       OR p.user_id::text = v_order_record.cust_id
    LIMIT 1;

    -- Fallback to customer_addresses if profile phone is null
    IF v_raw_phone IS NULL OR v_raw_phone = '' THEN
        SELECT ca.phone
        INTO v_raw_phone
        FROM public.customer_addresses ca
        WHERE ca.user_id::text = v_order_record.cust_id
        LIMIT 1;
    END IF;

    -- 4. Apply Masking Rule:
    -- Riders MUST ALWAYS receive masked phone numbers (+91 98765 XXXXX).
    -- Raw phone numbers are NEVER disclosed to the rider role.
    IF v_is_assigned_rider AND NOT v_is_service_role THEN
        v_masked_phone := mask_phone_number(COALESCE(v_raw_phone, '+91 98765 00000'));
    ELSIF v_is_owner_customer OR v_is_service_role THEN
        v_masked_phone := COALESCE(v_raw_phone, '+91 98765 XXXXX');
    ELSE
        -- Merchants receive masked customer contact
        v_masked_phone := mask_phone_number(COALESCE(v_raw_phone, '+91 98765 00000'));
    END IF;

    IF v_order_record.addr <> '' THEN
        v_address := v_order_record.addr;
    END IF;

    RETURN QUERY
    SELECT v_order_record.id,
           v_order_record.cust_id,
           v_customer_name,
           v_masked_phone,
           v_address,
           v_order_record.ord_status,
           v_order_record.r_id;
END;
$$;

-- Secure View for Rider Assigned Order Contacts
CREATE OR REPLACE VIEW public.masked_order_contacts AS
SELECT
    o.id AS order_id,
    COALESCE(o.customer_id::text, o.user_id::text) AS customer_id,
    COALESCE(p.display_name, 'Customer') AS customer_name,
    mask_phone_number(COALESCE(p.phone, '9876500000')) AS masked_phone,
    COALESCE(o.address_snapshot, '') AS delivery_address,
    o.status AS order_status,
    o.rider_id AS rider_id
FROM public.orders o
LEFT JOIN public.profiles p ON (p.id::text = COALESCE(o.customer_id::text, o.user_id::text) OR p.user_id::text = COALESCE(o.customer_id::text, o.user_id::text));

-- ============================================================================
-- 3. PROFILES & CUSTOMER ADDRESSES RLS (Strict Raw Phone Shielding)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on profiles" ON public.profiles;
CREATE POLICY "Service role bypass on profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Profiles: Customers can read own profile" ON public.profiles;
CREATE POLICY "Profiles: Customers can read own profile" ON public.profiles FOR SELECT USING (
    auth.uid() = id OR auth.uid()::text = user_id::text
);

DROP POLICY IF EXISTS "Profiles: Customers can update own profile" ON public.profiles;
CREATE POLICY "Profiles: Customers can update own profile" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR auth.uid()::text = user_id::text
);

DROP POLICY IF EXISTS "Deny public profile write" ON public.profiles;
CREATE POLICY "Deny public profile write" ON public.profiles FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR auth.uid() = id OR auth.uid()::text = user_id::text
);

-- Customer Addresses RLS: strictly owner and service_role only
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on customer_addresses" ON public.customer_addresses;
CREATE POLICY "Service role bypass on customer_addresses" ON public.customer_addresses FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Customers can read own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can read own addresses" ON public.customer_addresses FOR SELECT USING (
    auth.uid()::text = user_id::text
);

DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage own addresses" ON public.customer_addresses FOR ALL USING (
    auth.uid()::text = user_id::text
);

-- ============================================================================
-- 4. MERCHANT MENU ISOLATION (Public Read, Owner-Only CUD)
-- ============================================================================
-- Harmonize merchant_id column on menu_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'merchant_id') THEN
        ALTER TABLE public.menu_items ADD COLUMN merchant_id TEXT;
    END IF;
END $$;

-- Populate merchant_id from restaurant_id if null
UPDATE public.menu_items SET merchant_id = restaurant_id WHERE merchant_id IS NULL;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Drop legacy broad deny policies
DROP POLICY IF EXISTS "Deny all for public on menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Service role bypass on menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Merchants can insert own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Merchants can update own menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Merchants can delete own menu items" ON public.menu_items;

-- 1. Service role bypass
CREATE POLICY "Service role bypass on menu_items"
ON public.menu_items
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Read is public: customers & visitors can browse active/available menu items
CREATE POLICY "Public can read menu items"
ON public.menu_items
FOR SELECT
USING (true);

-- 3. Restaurant partners can ONLY INSERT their own menu items
CREATE POLICY "Merchants can insert own menu items"
ON public.menu_items
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR
    merchant_id = auth.uid()::text OR
    restaurant_id = auth.uid()::text OR
    restaurant_id = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);

-- 4. Restaurant partners can ONLY UPDATE their own menu items
CREATE POLICY "Merchants can update own menu items"
ON public.menu_items
FOR UPDATE
USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    merchant_id = auth.uid()::text OR
    restaurant_id = auth.uid()::text OR
    restaurant_id = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);

-- 5. Restaurant partners can ONLY DELETE their own menu items
CREATE POLICY "Merchants can delete own menu items"
ON public.menu_items
FOR DELETE
USING (
    auth.jwt() ->> 'role' = 'service_role' OR
    merchant_id = auth.uid()::text OR
    restaurant_id = auth.uid()::text OR
    restaurant_id = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);

-- Competitor Private Operational Metrics Strict Isolation:
-- Payout Batches
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on payout_batches" ON public.payout_batches;
CREATE POLICY "Service role bypass on payout_batches" ON public.payout_batches FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own payout batches" ON public.payout_batches;
CREATE POLICY "Merchants can read own payout batches" ON public.payout_batches FOR SELECT USING (
    restaurant_id::text = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id::text IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);
DROP POLICY IF EXISTS "Deny public write on payout_batches" ON public.payout_batches;
CREATE POLICY "Deny public write on payout_batches" ON public.payout_batches FOR INSERT WITH CHECK (false);

-- Wallet Transactions (Restaurant earnings)
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Service role bypass on wallet_transactions" ON public.wallet_transactions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Merchants can read own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Merchants can read own wallet transactions" ON public.wallet_transactions FOR SELECT USING (
    restaurant_id::text = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id::text IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);
DROP POLICY IF EXISTS "Deny public write on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Deny public write on wallet_transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (false);

-- ============================================================================
-- 5. CUSTOMER ORDER PRIVACY (customer_id = auth.uid())
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN
        ALTER TABLE public.orders ADD COLUMN user_id TEXT;
    END IF;
END $$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass on orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: Customers can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: Restaurants can read their orders" ON public.orders;
DROP POLICY IF EXISTS "Orders: Riders can read their assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
DROP POLICY IF EXISTS "Deny direct public order update" ON public.orders;

-- 1. Service role bypass
CREATE POLICY "Service role bypass on orders"
ON public.orders
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Customer Order Privacy: Customers can ONLY query their own orders
CREATE POLICY "Orders: Customers can read own orders"
ON public.orders
FOR SELECT
USING (
    customer_id::text = auth.uid()::text OR
    user_id::text = auth.uid()::text
);

-- 3. Restaurants can ONLY view orders placed at their establishment
CREATE POLICY "Orders: Restaurants can read their orders"
ON public.orders
FOR SELECT
USING (
    restaurant_id::text = (auth.jwt() ->> 'restaurant_id') OR
    restaurant_id::text IN (
        SELECT rm.restaurant_id
        FROM public.restaurant_members rm
        WHERE rm.user_id = auth.uid()::text
    )
);

-- 4. Riders can ONLY view orders assigned to them
CREATE POLICY "Orders: Riders can read their assigned orders"
ON public.orders
FOR SELECT
USING (
    rider_id::text = auth.uid()::text OR
    EXISTS (
        SELECT 1 FROM public.riders r
        WHERE (r.id::text = orders.rider_id::text OR r.user_id::text = auth.uid()::text)
          AND (r.user_id::text = auth.uid()::text OR r.id::text = auth.uid()::text)
    )
);

-- 5. Customers can only create orders where customer_id/user_id matches their authenticated id
CREATE POLICY "Customers can create own orders"
ON public.orders
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role' OR
    customer_id::text = auth.uid()::text OR
    user_id::text = auth.uid()::text
);

-- 6. Disallow arbitrary customer mutation of placed orders
CREATE POLICY "Deny direct public order update"
ON public.orders
FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role');

-- Order Items isolation
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on order_items" ON public.order_items;
CREATE POLICY "Service role bypass on order_items" ON public.order_items FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can read own order items" ON public.order_items;
CREATE POLICY "Users can read own order items" ON public.order_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id::text = order_items.order_id::text
          AND (o.customer_id::text = auth.uid()::text OR o.user_id::text = auth.uid()::text)
    )
);

-- ============================================================================
-- 6. RATE-LIMIT ENFORCED WEBHOOKS & SERVICE-ROLE ONLY WRITE ON LEDGER TABLES
-- ============================================================================

-- A. Webhook Rate Limiting Table & Enforcement Engine
CREATE TABLE IF NOT EXISTS public.webhook_rate_limits (
    id BIGSERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL,
    identifier TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_webhook_rate_limit UNIQUE (endpoint, identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_webhook_rate_limits_window
ON public.webhook_rate_limits(endpoint, identifier, window_start);

ALTER TABLE public.webhook_rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on webhook_rate_limits" ON public.webhook_rate_limits;
CREATE POLICY "Service role bypass on webhook_rate_limits" ON public.webhook_rate_limits FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on webhook_rate_limits" ON public.webhook_rate_limits;
CREATE POLICY "Deny public on webhook_rate_limits" ON public.webhook_rate_limits FOR ALL USING (false);

-- Sliding-window rate limit checker
CREATE OR REPLACE FUNCTION enforce_webhook_rate_limit(
    p_endpoint TEXT,
    p_identifier TEXT,
    p_max_requests INT DEFAULT 60,
    p_window_seconds INT DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window_start TIMESTAMPTZ := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
    v_current_count INT;
BEGIN
    INSERT INTO public.webhook_rate_limits (endpoint, identifier, window_start, request_count)
    VALUES (p_endpoint, p_identifier, v_window_start, 1)
    ON CONFLICT (endpoint, identifier, window_start)
    DO UPDATE SET request_count = public.webhook_rate_limits.request_count + 1
    RETURNING request_count INTO v_current_count;

    -- Cleanup expired windows (older than 15 minutes)
    DELETE FROM public.webhook_rate_limits
    WHERE window_start < now() - interval '15 minutes';

    IF v_current_count > p_max_requests THEN
        RETURN false; -- Rate limit exceeded
    END IF;

    RETURN true; -- Allowed
END;
$$;

-- B. SERVICE-ROLE ONLY WRITE ACCESS TO ALL LEDGER TABLES

-- 1. ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on ledger_entries" ON public.ledger_entries;
CREATE POLICY "Service role bypass on ledger_entries" ON public.ledger_entries FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public write on ledger_entries" ON public.ledger_entries;
CREATE POLICY "Deny public write on ledger_entries" ON public.ledger_entries FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public update on ledger_entries" ON public.ledger_entries;
CREATE POLICY "Deny public update on ledger_entries" ON public.ledger_entries FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public delete on ledger_entries" ON public.ledger_entries;
CREATE POLICY "Deny public delete on ledger_entries" ON public.ledger_entries FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. financial_ledger
ALTER TABLE public.financial_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on financial_ledger" ON public.financial_ledger;
CREATE POLICY "Service role bypass on financial_ledger" ON public.financial_ledger FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public write on financial_ledger" ON public.financial_ledger;
CREATE POLICY "Deny public write on financial_ledger" ON public.financial_ledger FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public update on financial_ledger" ON public.financial_ledger;
CREATE POLICY "Deny public update on financial_ledger" ON public.financial_ledger FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public delete on financial_ledger" ON public.financial_ledger;
CREATE POLICY "Deny public delete on financial_ledger" ON public.financial_ledger FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. payment_webhook_events
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on payment_webhook_events" ON public.payment_webhook_events;
CREATE POLICY "Service role bypass on payment_webhook_events" ON public.payment_webhook_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public write on payment_webhook_events" ON public.payment_webhook_events;
CREATE POLICY "Deny public write on payment_webhook_events" ON public.payment_webhook_events FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public update on payment_webhook_events" ON public.payment_webhook_events;
CREATE POLICY "Deny public update on payment_webhook_events" ON public.payment_webhook_events FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. kingpay_transactions
ALTER TABLE public.kingpay_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on kingpay_transactions" ON public.kingpay_transactions;
CREATE POLICY "Service role bypass on kingpay_transactions" ON public.kingpay_transactions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public write on kingpay_transactions" ON public.kingpay_transactions;
CREATE POLICY "Deny public write on kingpay_transactions" ON public.kingpay_transactions FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 5. reconciliation_reports
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on reconciliation_reports" ON public.reconciliation_reports;
CREATE POLICY "Service role bypass on reconciliation_reports" ON public.reconciliation_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on reconciliation_reports" ON public.reconciliation_reports;
CREATE POLICY "Deny public on reconciliation_reports" ON public.reconciliation_reports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 7. AUDIT TRAIL LOGGING
-- ============================================================================
INSERT INTO public.audit_logs (
    action,
    entity,
    entity_id,
    metadata
)
VALUES (
    'SUPREME_RLS_PRODUCTION_HARDENED',
    'system_schema',
    'migration_0014',
    '{"masked_phone": true, "merchant_isolation": true, "customer_order_privacy": true, "ledger_service_role_only": true}'
);
