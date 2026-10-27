-- Onboarding schema harmonization for Restaurants
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS fbo_name text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS fssai_license_number text DEFAULT '';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS bank_holder text DEFAULT '';

ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS document_type text DEFAULT '';
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS document_number text DEFAULT '';
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS verified_at timestamptz DEFAULT now();
ALTER TABLE restaurant_documents ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
