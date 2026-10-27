-- Onboarding schema harmonization for Riders
ALTER TABLE riders ALTER COLUMN org_id SET DEFAULT 'org_orderking';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS vehicle_number text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS dl_number text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS pan text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_account text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_ifsc text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '';

CREATE TABLE IF NOT EXISTS rider_kyc (
  id text PRIMARY KEY,
  rider_id text NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  vehicle_type text NOT NULL DEFAULT 'MOTORCYCLE',
  vehicle_number text DEFAULT '',
  dl_number text DEFAULT '',
  pan text DEFAULT '',
  aadhaar_last4 text DEFAULT '',
  bank_account text DEFAULT '',
  bank_ifsc text DEFAULT '',
  bank_holder text DEFAULT '',
  document_urls jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  rejection_reason text,
  verified_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rider_kyc_rider_id_idx ON rider_kyc(rider_id);
CREATE INDEX IF NOT EXISTS rider_kyc_user_id_idx ON rider_kyc(user_id);
CREATE INDEX IF NOT EXISTS rider_kyc_status_idx ON rider_kyc(status);
