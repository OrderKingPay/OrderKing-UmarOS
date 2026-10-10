-- Migration: Zomato-Killer High-Performance Geospatial H3 Auditing and Real-time Tracking Engine
-- Extends the tracking and auditing systems for ultimate spreadable scale in India.
-- Ensures 100% realistic auditing and geographic perfection.

-- 1. Add geospatial auditing to core audit table
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS h3_index VARCHAR(15);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC(8,2);

-- 2. Add geospatial auditing to order_events (to perfectly track where a rider hit "picked up" or "delivered")
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS h3_index VARCHAR(15);

-- 3. Create the High-Performance Powerful Tracking Audit Table for Telemetry
-- Every movement is permanently audited for total security and geographic accuracy.
CREATE TABLE IF NOT EXISTS geospatial_telemetry_High-Performance (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'RIDER', 'CUSTOMER', 'RESTAURANT'
    entity_id VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    h3_index VARCHAR(15) NOT NULL,
    speed NUMERIC(6,2),
    heading NUMERIC(6,2),
    accuracy NUMERIC(8,2),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_entity ON geospatial_telemetry_High-Performance(entity_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_h3 ON geospatial_telemetry_High-Performance(h3_index);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON geospatial_telemetry_High-Performance(captured_at DESC);
