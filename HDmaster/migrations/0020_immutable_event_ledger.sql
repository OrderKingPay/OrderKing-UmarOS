-- 0020_immutable_event_ledger.sql
-- Compatibility migration for the canonical immutable_event_ledger contract.
-- 0019_immutable_event_ledger.sql owns the table, hash-chain trigger and
-- append-only protection. This migration only verifies that contract exists.
DO $$
BEGIN
  IF to_regclass('public.immutable_event_ledger') IS NULL THEN
    RAISE EXCEPTION 'immutable_event_ledger must exist before 0020';
  END IF;
END $$;
