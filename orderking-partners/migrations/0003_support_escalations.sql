create table if not exists support_escalations (
  id text primary key,
  restaurant_id text not null,
  created_by_user_id text not null,
  category text not null,
  severity text not null default 'MEDIUM',
  subject text not null,
  details text not null,
  geographic_context text,
  status text not null default 'OPEN',
  target_queue text not null default 'UMAR_OS_RESTAURANT_SUPPORT',
  data_mode text not null default 'ACTUAL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_escalations_restaurant_idx
  on support_escalations (restaurant_id, created_at desc);

create index if not exists support_escalations_queue_idx
  on support_escalations (target_queue, status, created_at desc);
