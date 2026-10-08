-- Align ledger_entries with canonical ledger
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_id TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS account TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS direction TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS memo TEXT;

-- For existing data, we can make transaction_id nullable temporarily or fill it
-- Wait, the typescript code expects these. We just add them.
