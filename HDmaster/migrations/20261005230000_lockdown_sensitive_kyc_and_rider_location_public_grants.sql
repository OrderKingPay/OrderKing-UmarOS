-- Production security migration:
-- The application uses server-authenticated database access for these datasets.
-- Public browser roles must not read KYC or rider location records.

REVOKE ALL PRIVILEGES ON TABLE public.kyc_cases FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.rider_location_pings FROM anon, authenticated;
