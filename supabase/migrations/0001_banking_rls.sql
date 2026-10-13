-- Banking-Grade RLS Policies for Multi-Tenant Data Isolation

-- 1. PROFILES (Customers)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on profiles" ON public.profiles;
CREATE POLICY "Service role bypass on profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Profiles: Customers can read own profile" ON public.profiles;
CREATE POLICY "Profiles: Customers can read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles: Customers can update own profile" ON public.profiles;
CREATE POLICY "Profiles: Customers can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. ORDERS (Transactions)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on orders" ON public.orders;
CREATE POLICY "Service role bypass on orders" ON public.orders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Orders: Customers can read own orders" ON public.orders;
CREATE POLICY "Orders: Customers can read own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_id);

-- Partners (Restaurants) can only view orders assigned to their restaurant_id
DROP POLICY IF EXISTS "Orders: Restaurants can read their orders" ON public.orders;
CREATE POLICY "Orders: Restaurants can read their orders" 
ON public.orders FOR SELECT 
USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);

-- Riders can only view orders assigned to them
DROP POLICY IF EXISTS "Orders: Riders can read their assigned orders" ON public.orders;
CREATE POLICY "Orders: Riders can read their assigned orders" 
ON public.orders FOR SELECT 
USING (
  auth.uid() = rider_id 
  OR auth.uid() IN (SELECT user_id FROM public.riders WHERE riders.id = orders.rider_id)
);

-- 3. PAYMENTS & REFUNDS (Critical Financial)
-- Strict isolation: No public insert/update allowed for payments. Only service_role can write.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on payments" ON public.payments;
CREATE POLICY "Service role bypass on payments" ON public.payments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Payments: Customers can read own payments" ON public.payments;
CREATE POLICY "Payments: Customers can read own payments" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);
DROP POLICY IF EXISTS "Deny public write on payments" ON public.payments;
CREATE POLICY "Deny public write on payments" ON public.payments FOR INSERT WITH CHECK (false);

-- 4. RIDERS
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on riders" ON public.riders;
CREATE POLICY "Service role bypass on riders" ON public.riders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Riders: Read own data" ON public.riders;
CREATE POLICY "Riders: Read own data" 
ON public.riders FOR SELECT 
USING (auth.uid() = id OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Riders: Update own data" ON public.riders;
CREATE POLICY "Riders: Update own data" 
ON public.riders FOR UPDATE 
USING (auth.uid() = id OR auth.uid() = user_id);

-- 5. RESTAURANTS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on restaurants" ON public.restaurants;
CREATE POLICY "Service role bypass on restaurants" ON public.restaurants FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Restaurants: Public read" ON public.restaurants;
CREATE POLICY "Restaurants: Public read" 
ON public.restaurants FOR SELECT 
USING (status = 'active');

