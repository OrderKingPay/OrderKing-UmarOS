-- Partner work opportunities: remote jobs + contractual service projects.
-- No seed rows are inserted here. Only verified/approved sources should create
-- OPEN jobs or VERIFIED project providers.

create table if not exists work_profiles (
  user_id text primary key,
  display_name text not null default '',
  state text not null default '',
  district text not null default '',
  city text not null default '',
  pincode text not null default '',
  languages text not null default '',
  skills text not null default '',
  remote_available boolean not null default false,
  availability_status text not null default 'AVAILABLE',
  updated_at timestamptz not null default now()
);

create table if not exists remote_jobs (
  id text primary key,
  title text not null,
  category text not null,
  description text not null,
  client_budget_paise integer not null,
  worker_payout_paise integer not null,
  payment_cost_paise integer not null default 0,
  verification_cost_paise integer not null default 0,
  platform_fee_paise integer not null,
  applicable_tax_paise integer not null default 0,
  estimated_minutes integer not null,
  requirements text not null default '',
  source_type text not null,
  source_ref text not null default '',
  status text not null default 'OPEN',
  remote_only boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists remote_jobs_open_idx
  on remote_jobs (status, remote_only, expires_at, created_at desc);

alter table remote_jobs
  add constraint remote_jobs_money_nonnegative
  check (
    client_budget_paise >= 0
    and worker_payout_paise >= 0
    and payment_cost_paise >= 0
    and verification_cost_paise >= 0
    and platform_fee_paise >= 0
    and applicable_tax_paise >= 0
  );

create table if not exists job_acceptances (
  id text primary key,
  job_id text not null references remote_jobs(id) on delete cascade,
  worker_user_id text not null,
  status text not null default 'ACCEPTED',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  submission_note text not null default '',
  verification_status text not null default 'PENDING',
  verification_note text not null default '',
  payout_status text not null default 'NOT_RELEASED',
  payout_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, worker_user_id)
);

create index if not exists job_acceptances_worker_idx
  on job_acceptances (worker_user_id, status, updated_at desc);

create table if not exists project_requests (
  id text primary key,
  owner_user_id text not null,
  restaurant_id text references restaurants(id) on delete set null,
  title text not null,
  category text not null,
  description text not null,
  state text not null default '',
  district text not null default '',
  city text not null default '',
  pincode text not null default '',
  service_radius_km integer not null default 25,
  mode text not null default 'MARKETPLACE',
  status text not null default 'OPEN',
  budget_min_paise integer,
  budget_max_paise integer,
  selected_provider_id text,
  platform_commission_bps integer,
  control_sync_status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_requests_owner_idx
  on project_requests (owner_user_id, updated_at desc);
create index if not exists project_requests_match_idx
  on project_requests (state, district, city, category, status);

alter table project_requests
  add constraint project_budget_order
  check (
    (budget_min_paise is null and budget_max_paise is null)
    or
    (budget_min_paise is not null and budget_max_paise is not null and budget_min_paise >= 0 and budget_max_paise >= budget_min_paise)
  );

create table if not exists project_providers (
  id text primary key,
  user_id text not null unique,
  display_name text not null,
  categories text not null default '',
  state text not null default '',
  district text not null default '',
  city text not null default '',
  pincode text not null default '',
  service_radius_km integer not null default 25,
  verification_status text not null default 'PENDING',
  availability_status text not null default 'AVAILABLE',
  capacity_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_providers_match_idx
  on project_providers (state, district, city, verification_status, availability_status);

create table if not exists project_quotes (
  id text primary key,
  project_id text not null references project_requests(id) on delete cascade,
  provider_id text not null references project_providers(id) on delete cascade,
  quote_paise integer not null,
  estimated_days integer not null,
  notes text not null default '',
  status text not null default 'SUBMITTED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists project_quotes_active_provider_idx
  on project_quotes (project_id, provider_id);

create table if not exists project_milestones (
  id text primary key,
  project_id text not null references project_requests(id) on delete cascade,
  name text not null,
  percentage_bps integer not null,
  amount_paise integer,
  status text not null default 'PENDING',
  proof_note text not null default '',
  approved_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_milestones_project_idx
  on project_milestones (project_id, created_at);

alter table project_milestones
  add constraint project_milestone_percentage
  check (percentage_bps >= 0 and percentage_bps <= 10000);
