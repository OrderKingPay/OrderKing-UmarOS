-- OrderKing Dining & Table Reservation Persistence Migration
-- Multi-device persistent dining tables and reservation bookings with 0% merchant commission

create table if not exists dining_tables (
  id text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  table_number text not null,
  zone text not null,
  capacity_tag text not null default '4-Seater',
  max_guests integer not null default 4,
  status text not null default 'AVAILABLE',
  current_booking_ref text,
  guest_name text,
  seated_since text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, table_number)
);

create index if not exists dining_tables_restaurant_idx on dining_tables (restaurant_id);

create table if not exists dining_reservations (
  id text primary key,
  restaurant_id text not null references restaurants(id) on delete cascade,
  booking_ref text not null,
  guest_name text not null,
  phone text not null,
  guests_count integer not null default 2,
  time_slot text not null,
  date text not null default 'Today',
  area_preference text not null,
  occasion text,
  status text not null default 'PENDING',
  assigned_table text,
  deposit_amount integer not null default 0,
  platform_fee_percent numeric(5,2) not null default 5.00,
  platform_fee_amount integer not null default 0,
  net_restaurant_payable integer not null default 0,
  merchant_commission_percent numeric(5,2) not null default 0.00,
  seated_at text,
  completed_at text,
  bill_amount integer,
  notes text,
  is_walk_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dining_reservations_restaurant_idx on dining_reservations (restaurant_id, status);
