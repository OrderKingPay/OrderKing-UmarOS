-- Migration 0024: B2B Franchise Onboarding & Setup Fee Engine
-- Stores legally binding merchant onboarding contracts, GST-compliant setup fee invoices,
-- and digital signature attestation records for founder upfront capital acquisition.

CREATE TABLE IF NOT EXISTS b2b_franchise_contracts (
  id TEXT PRIMARY KEY,
  contract_number TEXT UNIQUE NOT NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  restaurant_id TEXT REFERENCES restaurants(id) ON DELETE SET NULL,
  restaurant_name TEXT NOT NULL,
  legal_entity_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  gstin TEXT,
  pan_number TEXT,
  fssai_license TEXT,
  registered_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'PRIORITY_PARTNER',
  setup_fee_inr INT NOT NULL,
  gst_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  gst_amount_inr NUMERIC(10,2) NOT NULL,
  total_payable_inr NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_method TEXT,
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  contract_status TEXT NOT NULL DEFAULT 'ISSUED',
  signed_at TIMESTAMPTZ,
  digital_signature_hash TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  deliverables JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS b2b_franchise_contracts_status_idx ON b2b_franchise_contracts(payment_status, contract_status);
CREATE INDEX IF NOT EXISTS b2b_franchise_contracts_created_idx ON b2b_franchise_contracts(created_at DESC);
