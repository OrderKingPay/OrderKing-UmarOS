-- Better Auth + Supabase RLS boundary.
-- Supabase browser clients may read only verified live catalog data.
-- Private operational data is deny-by-default because Better Auth identities are
-- not Supabase Auth JWT subjects; authenticated server functions own access.

alter table public.restaurants enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists public_catalog_restaurants_select on public.restaurants;
create policy public_catalog_restaurants_select
on public.restaurants
for select
to anon, authenticated
using (
  coalesce(active, true) = true
  and (
    coalesce(data_label, '') in ('REAL', 'ACTUAL')
    or coalesce(data_mode, '') = 'PRODUCTION'
  )
);

drop policy if exists public_catalog_menu_items_select on public.menu_items;
create policy public_catalog_menu_items_select
on public.menu_items
for select
to anon, authenticated
using (coalesce(data_label, '') in ('REAL', 'ACTUAL'));

revoke insert, update, delete on public.restaurants from anon, authenticated;
revoke insert, update, delete on public.menu_items from anon, authenticated;

alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.rider_location_pings enable row level security;
alter table public.dispatch_assignments enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.profiles enable row level security;
alter table public.order_events enable row level security;
alter table public.order_items enable row level security;
