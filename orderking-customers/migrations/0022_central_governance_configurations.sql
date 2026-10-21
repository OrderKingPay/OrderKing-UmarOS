-- Migration 0022: Central Governance & Platform Customization Configurations
CREATE TABLE IF NOT EXISTS app_configurations (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE INDEX IF NOT EXISTS app_configurations_cat_idx ON app_configurations (category);

-- Ensure platform_settings table exists
CREATE TABLE IF NOT EXISTS platform_settings (
  org_id text PRIMARY KEY,
  settings_json text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_employee_id text
);
