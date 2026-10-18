CREATE TABLE IF NOT EXISTS public.pnr_live_cache (
  pnr_number text PRIMARY KEY,
  mode text NOT NULL CHECK (mode IN ('TRAIN', 'FLIGHT')),
  carrier_name text NOT NULL,
  carrier_number text NOT NULL,
  origin_code text NOT NULL,
  origin_name text NOT NULL,
  destination_code text NOT NULL,
  destination_name text NOT NULL,
  departure_time_iso timestamptz NOT NULL,
  arrival_time_iso timestamptz NOT NULL,
  chart_prepared boolean DEFAULT false,
  platform_or_gate text,
  coach_position text,
  passengers jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.travel_pnr_checkouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  pnr_number text NOT NULL,
  travel_mode text NOT NULL,
  carrier_number text NOT NULL,
  route_summary text NOT NULL,
  convenience_fee_inr numeric(10,2) NOT NULL,
  cashback_credited_inr numeric(10,2) NOT NULL DEFAULT 5.00,
  payment_rail text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE_MONITORING',
  passenger_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_pnr_checkouts;
