-- 1000X Autonomous Task Engine
-- Full lifecycle: REQUESTED -> UNDERSTOOD -> PLANNED -> EXECUTING -> VALIDATING -> COMPLETED / BLOCKED / FAILED / ESCALATED

CREATE TABLE IF NOT EXISTS autonomous_tasks (
  id text primary key,
  org_id text not null references organizations(id),
  owner text not null, -- The AI agent or user owning this task
  state text not null default 'REQUESTED', 
  inputs_json text not null default '{}',
  dependencies_json text not null default '[]',
  progress real not null default 0.0,
  retries int not null default 0,
  timeout_ms bigint not null default 300000,
  result_json text,
  evidence_text text,
  error_state text,
  resume_state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS autonomous_tasks_state_idx ON autonomous_tasks (org_id, state);
