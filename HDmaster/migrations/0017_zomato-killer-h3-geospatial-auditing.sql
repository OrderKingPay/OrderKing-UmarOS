-- OrderKing Zomato-Killer Geospatial H3 Auditing & Real-Time Telemetry
-- Restored capability migration. Idempotent by design so an already-provisioned
-- production database can be checked/applied without destructive changes.

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS h3_index VARCHAR(15);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS gps_accuracy NUMERIC(8,2);

ALTER TABLE order_events ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS h3_index VARCHAR(15);

CREATE TABLE IF NOT EXISTS geospatial_telemetry_100x (
    id VARCHAR(50) PRIMARY KEY,
    org_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    h3_index VARCHAR(15) NOT NULL,
    speed NUMERIC(6,2),
    heading NUMERIC(6,2),
    accuracy NUMERIC(8,2),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_entity ON geospatial_telemetry_100x(entity_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_h3 ON geospatial_telemetry_100x(h3_index);
CREATE INDEX IF NOT EXISTS idx_telemetry_time ON geospatial_telemetry_100x(captured_at DESC);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_lng DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_heading NUMERIC(6,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_ping_at TIMESTAMPTZ;
