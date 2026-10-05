-- Applied to Supabase project wziksbrumklcktrlgedb as migration:
-- section_3_public_api_least_privilege_boundary
--
-- Purpose: keep the browser Data API least-privilege while the marketplace
-- application performs sensitive business operations server-side.
--
-- Sensitive tables are intentionally not reachable by anon/authenticated via
-- the Data API until explicit tenant/role policies are designed and tested.
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.customers,
  public.customer_addresses,
  public.orders,
  public.order_items,
  public.riders,
  public.rider_location_pings,
  public.dispatch_assignments,
  public.restaurant_members,
  public.feature_flags
FROM anon, authenticated;

REVOKE ALL ON TABLE public.restaurants, public.menu_items FROM anon, authenticated;

GRANT SELECT ON TABLE public.restaurants, public.menu_items TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE USAGE, SELECT, UPDATE ON SEQUENCES
FROM anon, authenticated;
