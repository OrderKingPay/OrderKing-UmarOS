-- Windows/Postgres migration for OrderKing real-time rider discovery
ALTER TABLE riders ADD COLUMN IF NOT EXISTS online integer DEFAULT 0;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS zone_id text;
CREATE INDEX IF NOT EXISTS idx_riders_online_kyc ON riders(online, kyc_status, data_mode);
