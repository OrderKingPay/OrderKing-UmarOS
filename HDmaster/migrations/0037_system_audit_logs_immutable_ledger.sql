-- Migration 0037: Dedicated Immutable Forensic System Audit Logs
-- Enforces Section 79 IT Act, DPDP Act 2023 & Cryptographic Audit Chaining

CREATE TABLE IF NOT EXISTS system_audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    before_state_snapshot JSONB,
    after_state_snapshot JSONB,
    previous_checksum TEXT,
    cryptographic_checksum TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sys_audit_actor ON system_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_sys_audit_action ON system_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_sys_audit_created ON system_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sys_audit_entity ON system_audit_logs(target_entity, target_id);

-- Enforce strict append-only immutability at database level (reject UPDATE and DELETE)
CREATE OR REPLACE FUNCTION trg_enforce_system_audit_logs_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'system_audit_logs is strictly immutable and append-only: UPDATE and DELETE operations are prohibited under Section 79 IT Act & DPDP Act 2023.'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_system_audit_logs_immutable ON system_audit_logs;
CREATE TRIGGER trg_system_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON system_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_system_audit_logs_append_only();
