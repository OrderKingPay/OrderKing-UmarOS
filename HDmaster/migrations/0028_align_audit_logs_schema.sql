-- Align audit_logs schema with HDmaster command suite
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS org_id text DEFAULT 'org_orderking';
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS employee_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS role_key text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_type text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS target_id text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_json text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS new_json text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip text;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS audit_org_idx ON audit_logs (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_logs (org_id, action);
