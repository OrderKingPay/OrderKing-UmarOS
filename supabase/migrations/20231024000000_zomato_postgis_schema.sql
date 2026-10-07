-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Orders State Machine ENUM
CREATE TYPE order_status AS ENUM (
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'RIDER_ASSIGNED',
    'DELIVERED'
);

-- 2. Real-time riders tracking table
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    current_location geometry(Point, 4326),
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    rider_id UUID REFERENCES riders(id),
    status order_status DEFAULT 'PENDING'::order_status,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_location geometry(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Surge pricing audit table
CREATE TABLE IF NOT EXISTS surge_pricing_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id TEXT NOT NULL,
    multiplier DECIMAL(3, 2) NOT NULL,
    active_from TIMESTAMP WITH TIME ZONE NOT NULL,
    active_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE surge_pricing_audit ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS for riders (can only see their active orders)
CREATE POLICY "Riders can view their assigned orders"
    ON orders
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM riders WHERE riders.id = orders.rider_id
    ));
