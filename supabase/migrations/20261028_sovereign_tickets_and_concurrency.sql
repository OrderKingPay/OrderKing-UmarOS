-- Migration 20261028: Sovereign Tickets & Ultra-High Concurrency Optimizations
-- Supreme Engineer ALPHA (80c3a27b) & Supreme Engineer OMEGA (183f728c)
-- PostgreSQL 17.6 Sub-Millisecond Concurrency Tuning for Live Booking Tables

-- 1. Sovereign Tickets Table (Air, Rail, Hotel, Dining & High-Value Sovereign Reservations)
CREATE TABLE IF NOT EXISTS sovereign_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT UNIQUE NOT NULL,
    order_id TEXT,
    user_id TEXT NOT NULL,
    booking_type TEXT NOT NULL DEFAULT 'TRAVEL', -- 'TRAVEL', 'FLIGHT', 'RAIL', 'HOTEL', 'DINING', 'VIP'
    carrier_or_provider TEXT,
    pnr_or_booking_ref TEXT,
    passenger_or_guest_name TEXT,
    origin TEXT,
    destination TEXT,
    departure_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    seat_or_table TEXT,
    fare_paise BIGINT NOT NULL DEFAULT 0,
    tax_paise BIGINT NOT NULL DEFAULT 0,
    total_paise BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'LOCKED', 'PROCESSING', 'CANCELLED', 'COMPLETED'
    idempotency_key TEXT UNIQUE,
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Concurrency-Optimized Indexes for Sub-Millisecond FOR UPDATE SKIP LOCKED Queues
CREATE INDEX IF NOT EXISTS idx_sovereign_tickets_queue_concurrency 
    ON sovereign_tickets (status, created_at) 
    WHERE status IN ('PENDING', 'CONFIRMED', 'PROCESSING');

CREATE INDEX IF NOT EXISTS idx_sovereign_tickets_user_id 
    ON sovereign_tickets (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sovereign_tickets_order_id 
    ON sovereign_tickets (order_id);

CREATE INDEX IF NOT EXISTS idx_sovereign_tickets_pnr 
    ON sovereign_tickets (pnr_or_booking_ref);

-- 3. Orders Concurrency Index for Sub-Millisecond Auto-Dispatch & Settlement Locks
CREATE INDEX IF NOT EXISTS idx_orders_concurrency_skip_locked 
    ON orders (status, placed_at ASC) 
    WHERE status IN ('CREATED', 'PAID', 'PREPARING', 'READY', 'RIDER_ASSIGNED');

-- 4. Financial Ledger Concurrency & Audit Index
CREATE INDEX IF NOT EXISTS idx_financial_ledger_unsettled_concurrency 
    ON financial_ledger (status, created_at ASC) 
    WHERE status IN ('PENDING', 'UNSETTLED', 'PROCESSING');

-- 5. Row Level Security Protection for Sovereign Tickets
ALTER TABLE sovereign_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role bypass on sovereign_tickets" ON sovereign_tickets;
CREATE POLICY "Service role bypass on sovereign_tickets" 
    ON sovereign_tickets FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view own sovereign tickets" ON sovereign_tickets;
CREATE POLICY "Users can view own sovereign tickets" 
    ON sovereign_tickets FOR SELECT 
    USING (auth.uid()::text = user_id);
