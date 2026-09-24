-- AI Workforce & Founder Approval Center
-- Empowers autonomous agents with specific operational contexts while requiring Founder approval
-- for sensitive financial or high-impact actions.

create table if not exists founder_approvals (
  id text primary key,
  org_id text not null references organizations(id),
  module text not null, -- e.g., 'FINANCE', 'GROWTH', 'SUPPORT'
  action text not null, -- e.g., 'ISSUE_PAYOUT', 'CHANGE_COMMISSION'
  details_json text not null,
  amount_paise int,
  status text not null default 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  requested_by text not null, -- e.g., 'ai_finance_manager'
  approved_by_user_id text,
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  notes text
);
create index if not exists founder_approvals_org_idx on founder_approvals (org_id, status);

create table if not exists ai_work_items (
  id text primary key,
  org_id text not null references organizations(id),
  agent_role text not null, -- e.g., 'RESTAURANT_GROWTH_MANAGER'
  task_type text not null,
  priority int not null default 5,
  target_id text,
  context_json text not null default '{}',
  status text not null default 'QUEUED', -- 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  result_json text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists ai_work_items_org_idx on ai_work_items (org_id, agent_role, status);

create table if not exists restaurant_growth_plans (
  id text primary key,
  org_id text not null references organizations(id),
  restaurant_id text not null references restaurants(id),
  generated_by text not null,
  plan_json text not null,
  status text not null default 'ACTIVE', -- 'ACTIVE', 'IMPLEMENTED', 'SUPERSEDED'
  created_at timestamptz not null default now(),
  implemented_at timestamptz
);
create index if not exists rgp_restaurant_idx on restaurant_growth_plans (restaurant_id, status);

create table if not exists finance_reconciliations (
  id text primary key,
  org_id text not null references organizations(id),
  batch_id text,
  verified_by text not null,
  discrepancy_paise int not null default 0,
  details_json text not null,
  status text not null default 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists frec_org_idx on finance_reconciliations (org_id, status);
