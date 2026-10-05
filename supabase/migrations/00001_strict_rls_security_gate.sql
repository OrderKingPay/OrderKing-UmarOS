-- Supabase Banking-Grade RLS Migration
-- Enforces strict multi-tenant data isolation for Customers, Restaurants, and Riders.

-- 1. Enable RLS on all relevant tables
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 2. Clean up existing policies to prevent conflicts
DO $$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename) || ';';
    END LOOP;
END $$;

-- ============================================================================
-- CUSTOMER POLICIES (Matches auth.uid() to user_id)
-- ============================================================================

-- Profiles
CREATE POLICY "Customers can view their own profile" ON profiles FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Customers can update their own profile" ON profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- Addresses
CREATE POLICY "Customers can view their own addresses" ON customer_addresses FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Customers can insert their own addresses" ON customer_addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Customers can update their own addresses" ON customer_addresses FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Customers can delete their own addresses" ON customer_addresses FOR DELETE USING (auth.uid()::text = user_id);

-- Customer Orders
CREATE POLICY "Customers can view their own orders" ON orders FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Customers can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Payments
CREATE POLICY "Customers can view their own payments via orders" ON payments FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Customers can insert their own payments via orders" ON payments FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()::text)
);

-- ============================================================================
-- RESTAURANT PARTNER POLICIES (Matches via restaurant_members)
-- ============================================================================

-- Restaurant Members (Self access)
CREATE POLICY "Partners can view their memberships" ON restaurant_members FOR SELECT USING (auth.uid()::text = user_id);

-- Restaurant Orders
CREATE POLICY "Partners can view orders for their restaurants" ON orders FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Partners can update orders for their restaurants" ON orders FOR UPDATE USING (
    restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()::text)
);

-- Restaurant Order Items
CREATE POLICY "Partners can view order items for their restaurants" ON order_items FOR SELECT USING (
    order_id IN (
        SELECT id FROM orders WHERE restaurant_id IN (
            SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()::text
        )
    )
);

-- Settlements
CREATE POLICY "Partners can view settlements for their restaurants" ON settlement_batches FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()::text)
);
CREATE POLICY "Partners can view settlement lines for their restaurants" ON settlement_lines FOR SELECT USING (
    restaurant_id IN (SELECT restaurant_id FROM restaurant_members WHERE user_id = auth.uid()::text)
);

-- ============================================================================
-- RIDER POLICIES (Matches auth.uid() to rider user_id)
-- ============================================================================

-- Riders
CREATE POLICY "Riders can view their own profile" ON riders FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Riders can update their own profile" ON riders FOR UPDATE USING (auth.uid()::text = user_id);

-- Rider Documents
CREATE POLICY "Riders can view their own documents" ON rider_documents FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Riders can upload their own documents" ON rider_documents FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Deliveries
CREATE POLICY "Riders can view their assigned deliveries" ON deliveries FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Riders can update their assigned deliveries" ON deliveries FOR UPDATE USING (auth.uid()::text = user_id);

-- Rider Earnings
CREATE POLICY "Riders can view their own earnings" ON rider_earnings FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================================================
-- STRICT DENY-ALL DEFAULTS
-- By default, RLS blocks all operations not explicitly allowed.
-- ============================================================================
