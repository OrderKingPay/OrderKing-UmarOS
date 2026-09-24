CREATE TABLE IF NOT EXISTS system_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  is_secret boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);
