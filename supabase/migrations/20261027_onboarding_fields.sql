-- Onboarding schema harmonization for Restaurants and Riders
-- Zero-human instant autonomous onboarding support

-- 1. Restaurants table onboarding columns
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS fbo_name text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS fssai_license_number text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '';

-- 2. Restaurant documents table harmonization
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS document_type text DEFAULT '';
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS document_number text DEFAULT '';
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS verified_at timestamptz DEFAULT now();
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Riders table onboarding columns
ALTER TABLE riders ALTER COLUMN org_id SET DEFAULT 'org_orderking';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS vehicle_number text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS dl_number text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS pan text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_account text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_ifsc text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '';
ALTER TABLE riders ADD COLUMN IF NOT EXISTS kyc_reject_reason text DEFAULT '';

-- 3b. Harmonize restaurant & hours column defaults for flawless persistence
ALTER TABLE restaurants ALTER COLUMN cuisine_summary SET DEFAULT '';
ALTER TABLE restaurants ALTER COLUMN description_bn SET DEFAULT '';
ALTER TABLE restaurants ALTER COLUMN description_en SET DEFAULT '';
ALTER TABLE restaurant_hours ALTER COLUMN open_minute SET DEFAULT 0;
ALTER TABLE restaurant_hours ALTER COLUMN close_minute SET DEFAULT 1440;

-- 4. Rider KYC table
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
