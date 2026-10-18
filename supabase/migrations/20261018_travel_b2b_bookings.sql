CREATE TABLE IF NOT EXISTS public.travel_partner_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  booking_type text NOT NULL CHECK (booking_type IN ('FLIGHT', 'TRAIN', 'BUS', 'HOTEL')),
  partner_provider text NOT NULL CHECK (partner_provider IN ('KIWI', 'TRAVELPAYOUTS', 'CONFIRMTKT', 'REDBUS', 'BOOKING_COM')),
  carrier_name text,
  carrier_code text,
  route_summary text NOT NULL,
  fare_amount_inr numeric(10,2) NOT NULL,
  platform_convenience_fee_inr numeric(10,2) NOT NULL DEFAULT 29.00,
  commission_expected_inr numeric(10,2) NOT NULL DEFAULT 0.00,
  cashback_accrued_paise bigint NOT NULL DEFAULT 500,
  booking_status text NOT NULL DEFAULT 'INITIATED' CHECK (booking_status IN ('INITIATED', 'HANDOFF_COMPLETED', 'CONFIRMED', 'FAILED')),
  affiliate_deep_link text,
  created_at timestamptz DEFAULT now()
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_partner_bookings;
