
-- Phase 2 Technical Hardening
-- 1. Idempotency Keys (Transaction Safety)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text unique;
ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS idempotency_key text unique;
ALTER TABLE kingpay_transactions ADD COLUMN IF NOT EXISTS idempotency_key text unique;

-- 2. Constraints (Data Integrity - Strict Zomato-Killer Mandates)
ALTER TABLE ledger_entries ADD CONSTRAINT check_positive_amount CHECK (amount_paise >= 0);
ALTER TABLE promotions ADD CONSTRAINT check_positive_min_order CHECK (min_order_paise >= 0);
ALTER TABLE order_items ADD CONSTRAINT check_positive_qty CHECK (qty > 0);
ALTER TABLE order_items ADD CONSTRAINT check_positive_unit_price CHECK (unit_paise >= 0);

