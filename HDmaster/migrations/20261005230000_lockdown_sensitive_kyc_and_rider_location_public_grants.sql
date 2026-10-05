-- Production security migration.
-- Sensitive KYC and precise rider location data are server-controlled.
REVOKE ALL PRIVILEGES ON TABLE public.kyc_cases FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.rider_location_pings FROM anon, authenticated;
