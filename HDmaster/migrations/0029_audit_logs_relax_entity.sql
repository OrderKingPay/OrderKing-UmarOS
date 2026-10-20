-- Relax entity constraint and provide default for compatibility across monorepo apps
ALTER TABLE audit_logs ALTER COLUMN entity DROP NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN entity SET DEFAULT 'system';
