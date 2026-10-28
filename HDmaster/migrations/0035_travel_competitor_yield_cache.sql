-- Migration 0035: Travel Competitor Yield Cache
-- Supreme Engineer ALPHA (80c3a27b)
-- PostgreSQL 17.6 Sub-10ms Route Yield Lookup & Real-Time Price Comparison
-- OrderKing / KingPay Statutory Entity: 18AFXPH9838M1Z9

CREATE TABLE IF NOT EXISTS travel_competitor_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_key TEXT NOT NULL UNIQUE,
    skyscanner_paise BIGINT NOT NULL,
    mmt_paise BIGINT NOT NULL,
    tbo_net_paise BIGINT NOT NULL,
    last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    surge_tier TEXT NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast Indexing for Sub-10ms High-Concurrency Yield Queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_travel_competitor_cache_route_key 
    ON travel_competitor_cache (route_key);

CREATE INDEX IF NOT EXISTS idx_travel_competitor_cache_last_scraped 
    ON travel_competitor_cache (last_scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_travel_competitor_cache_lookup 
    ON travel_competitor_cache (route_key, last_scraped_at DESC);

-- Automatic Updated At Timestamp Trigger
CREATE OR REPLACE FUNCTION update_travel_competitor_cache_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_travel_competitor_cache_updated_at ON travel_competitor_cache;
CREATE TRIGGER trg_travel_competitor_cache_updated_at
BEFORE UPDATE ON travel_competitor_cache
FOR EACH ROW EXECUTE FUNCTION update_travel_competitor_cache_modtime();

-- Fail-Closed Row Level Security Protection
ALTER TABLE travel_competitor_cache ENABLE ROW LEVEL SECURITY;

-- 1. Service role bypass (full admin for automated pricing crawlers, background scrapers, and TBO sync)
DROP POLICY IF EXISTS "Service role full access on travel_competitor_cache" ON travel_competitor_cache;
CREATE POLICY "Service role full access on travel_competitor_cache" 
    ON travel_competitor_cache FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Public / Authenticated read-only access (for real-time passenger fare comparisons and dynamic shadow pricing)
DROP POLICY IF EXISTS "Public read access on travel_competitor_cache" ON travel_competitor_cache;
CREATE POLICY "Public read access on travel_competitor_cache" 
    ON travel_competitor_cache FOR SELECT 
    USING (true);

-- 3. Explicit Privilege Control (Fail-closed statutory security)
REVOKE ALL ON travel_competitor_cache FROM PUBLIC;
GRANT SELECT ON travel_competitor_cache TO anon, authenticated;
GRANT ALL ON travel_competitor_cache TO service_role;
