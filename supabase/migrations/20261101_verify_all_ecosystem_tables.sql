-- Connected Ecosystem Specialist (f5a2c465) & Supreme Engineer ALPHA (80c3a27b)
-- Idempotent verification of all 8 critical OrderKing & UmarOS table families
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.restaurants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  landmark TEXT,
  cuisine TEXT,
  diet TEXT DEFAULT 'NONVEG',
  gstin TEXT,
  fssai_number TEXT,
  pan TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  bank_holder TEXT,
  status TEXT DEFAULT 'APPROVED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.riders (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT,
  phone TEXT,
  city_zone TEXT,
  address TEXT,
  vehicle_type TEXT DEFAULT 'BIKE',
  dl_number TEXT,
  rc_number TEXT,
  pan TEXT,
  payout_upi TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  kyc_status TEXT DEFAULT 'VERIFIED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  restaurant_id TEXT,
  rider_id TEXT,
  status TEXT DEFAULT 'PLACED',
  total_paise INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  user_id TEXT,
  amount_paise INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'SUCCESS',
  provider TEXT DEFAULT 'UPI',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  amount_paise INTEGER NOT NULL DEFAULT 0,
  tx_type TEXT DEFAULT 'CREDIT',
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.otp_sessions (
  phone TEXT PRIMARY KEY,
  otp_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.travel_bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  booking_type TEXT NOT NULL,
  pnr TEXT,
  origin TEXT,
  destination TEXT,
  travel_date TEXT,
  amount_paise INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
