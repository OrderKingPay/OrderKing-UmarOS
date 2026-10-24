-- 👑 ORDERKING & KINGPAY T+1 DAILY AUTOMATED PAYOUTS & RAZORPAYX INTEGRATION SCHEMA
-- Ensures complete column parity across settlement_batches, restaurants, and riders.

-- 1. Alignment of settlement_batches
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS org_id TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS party_type TEXT DEFAULT 'RESTAURANT';
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'RESTAURANT';
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS party_id TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS entity_id TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS party_name TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS payable_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS net_payout_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS gross_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS gross_amount_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS fee_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS deductions_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS commission_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS gst_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS net_paise BIGINT DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'READY';
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'CALCULATED';
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS provider_reference TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS payout_upi_or_account_number TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS attempts_count INTEGER DEFAULT 0;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS period_end TIMESTAMPTZ;
ALTER TABLE settlement_batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Alignment of restaurants payout banking info
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS payout_vpa TEXT;

-- 3. Alignment of riders payout banking info
ALTER TABLE riders ADD COLUMN IF NOT EXISTS payout_upi TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- 4. High-performance lookup indexes for T+1 daily settlement queries
CREATE INDEX IF NOT EXISTS idx_settlement_batches_ext_ref ON settlement_batches (external_reference);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_prov_ref ON settlement_batches (provider_reference);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_idemp ON settlement_batches (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_status ON settlement_batches (status, state);
