ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;
