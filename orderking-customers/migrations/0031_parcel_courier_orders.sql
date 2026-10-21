-- Migration: 0031_parcel_courier_orders.sql
-- Description: Enable Porter-style point-to-point courier and parcel deliveries in orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'FOOD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_details JSONB;

-- Make restaurant_id and outlet_id nullable for non-food peer-to-peer courier dispatches
ALTER TABLE orders ALTER COLUMN restaurant_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN outlet_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_category ON orders (category);
