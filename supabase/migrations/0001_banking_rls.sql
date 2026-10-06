-- Banking-Grade RLS Policies for Multi-Tenant Data Isolation

-- 1. PROFILES (Customers)
-- Customers can only read/update their own profile
CREATE POLICY "Profiles: Customers can read own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Profiles: Customers can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 2. ORDERS (Transactions)
-- Customers can only view their own orders
CREATE POLICY "Orders: Customers can read own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = customer_id);

-- Partners (Restaurants) can only view orders assigned to their restaurant_id
-- We assume auth.jwt() -> 'user_metadata' ->> 'restaurant_id' exists, OR they query via a server function.
CREATE POLICY "Orders: Restaurants can read their orders" 
ON public.orders FOR SELECT 
USING (auth.jwt() ->> 'restaurant_id' = restaurant_id::text);

-- Riders can only view orders assigned to them
CREATE POLICY "Orders: Riders can read their assigned orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = rider_id);

-- 3. PAYMENTS & REFUNDS (Critical Financial)
-- Strict isolation: No public insert/update allowed for payments. Only service_role can write.
-- Customers can read their own payment receipts.
CREATE POLICY "Payments: Customers can read own payments" 
ON public.payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = payments.order_id 
    AND orders.customer_id = auth.uid()
  )
);

-- 4. RIDERS
-- Riders can only read/update their own data
CREATE POLICY "Riders: Read own data" 
ON public.riders FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Riders: Update own data" 
ON public.riders FOR UPDATE 
USING (auth.uid() = id);

-- 5. RESTAURANTS
-- Public can read active restaurants
CREATE POLICY "Restaurants: Public read" 
ON public.restaurants FOR SELECT 
USING (status = 'active');

