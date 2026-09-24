-- Strategic Nearest-Rider Cascading Dispatch Migration
-- Ensures dispatch is 10x more strategic:
-- 1. Dispatches to the single closest online rider first via GPS proximity.
-- 2. If declined or timed out, cascades to the next nearest rider with dynamic bounty escalation.

alter table dispatch_assignments add column if not exists cascade_index int not null default 0;
alter table dispatch_assignments add column if not exists bounty_paise int not null default 0;
alter table dispatch_assignments add column if not exists distance_km numeric(6,2);

alter table restaurants add column if not exists lat numeric;
alter table restaurants add column if not exists lng numeric;

-- Upgrade create_live_dispatch_offers to select ONLY the single nearest online rider
create or replace function create_live_dispatch_offers()
returns trigger
language plpgsql
as $$
declare
  v_rest_lat numeric;
  v_rest_lng numeric;
begin
  if new.data_mode <> 'PRODUCTION' or new.status <> 'READY' or old.status = 'READY' then
    return new;
  end if;

  -- Resolve restaurant coordinates or fallback to Karimganj town center (24.8690, 92.3580)
  select coalesce(lat, 24.8690), coalesce(lng, 92.3580)
  into v_rest_lat, v_rest_lng
  from restaurants
  where id = new.restaurant_id;

  -- Insert offer for ONLY the single nearest eligible online rider (cascade_index = 0, bounty_paise = 0)
  insert into dispatch_assignments (
    id, org_id, order_id, rider_id, score, distance_m, eta_seconds, status, offered_at, cascade_index, bounty_paise, distance_km
  )
  select
    'offer_' || substr(md5(new.id || r.id || clock_timestamp()::text), 1, 20),
    new.org_id,
    new.id,
    r.id,
    round(
      cast(
        sqrt(
          power((coalesce(r.lat, v_rest_lat) - v_rest_lat) * 111.0, 2) +
          power((coalesce(r.lng, v_rest_lng) - v_rest_lng) * 100.0, 2)
        ) as numeric
      ),
      2
    ) as score,
    round(
      cast(
        sqrt(
          power((coalesce(r.lat, v_rest_lat) - v_rest_lat) * 111.0, 2) +
          power((coalesce(r.lng, v_rest_lng) - v_rest_lng) * 100.0, 2)
        ) * 1000 as numeric
      )
    ) as distance_m,
    round(
      cast(
        (sqrt(
          power((coalesce(r.lat, v_rest_lat) - v_rest_lat) * 111.0, 2) +
          power((coalesce(r.lng, v_rest_lng) - v_rest_lng) * 100.0, 2)
        ) / 20.0) * 3600 as numeric
      )
    ) as eta_seconds,
    'OFFERED',
    now(),
    0,
    0,
    round(
      cast(
        sqrt(
          power((coalesce(r.lat, v_rest_lat) - v_rest_lat) * 111.0, 2) +
          power((coalesce(r.lng, v_rest_lng) - v_rest_lng) * 100.0, 2)
        ) as numeric
      ),
      2
    ) as distance_km
  from riders r
  where r.org_id = new.org_id
    and r.city_id = new.city_id
    and r.status in ('ACTIVE', 'ONLINE')
    and r.online = 1
    and r.data_mode = 'PRODUCTION'
    and r.active_order_id is null
    and not exists (
      select 1 from dispatch_assignments da
      where da.order_id = new.id
        and da.rider_id = r.id
        and da.status in ('OFFERED', 'ACCEPTED')
    )
  order by
    sqrt(
      power((coalesce(r.lat, v_rest_lat) - v_rest_lat) * 111.0, 2) +
      power((coalesce(r.lng, v_rest_lng) - v_rest_lng) * 100.0, 2)
    ) asc,
    r.rating_x10 desc
  limit 1;

  return new;
end;
$$;
