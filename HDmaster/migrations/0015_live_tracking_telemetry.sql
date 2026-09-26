-- Migration to add Real-Time GPS Tracking directly into the Order core for Sub-second Supabase Sync.
-- This ensures the tracking component has 60fps telemetry.

alter table orders add column if not exists rider_lat double precision;
alter table orders add column if not exists rider_lng double precision;
alter table orders add column if not exists rider_heading numeric(6,2);
alter table orders add column if not exists last_ping_at timestamptz;
