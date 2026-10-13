-- Migration: WAVE 2 (Multi-Agent Workforce) - Database Architecture

-- Create ENUM type for agent task status
CREATE TYPE agent_task_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- 1. agent_registry
CREATE TABLE agent_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(255) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_capabilities_is_object CHECK (jsonb_typeof(capabilities) = 'object')
);

-- 2. agent_tasks
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agent_registry(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status agent_task_status NOT NULL DEFAULT 'PENDING',
    result JSONB,
    cost NUMERIC(10, 4) DEFAULT 0.0,
    error_details TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_payload_is_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT chk_result_is_object CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
    CONSTRAINT chk_dates CHECK (
        (started_at IS NULL AND completed_at IS NULL AND status = 'PENDING') OR
        (status IN ('RUNNING', 'COMPLETED', 'FAILED'))
    )
);

-- 3. agent_execution_logs
CREATE TABLE agent_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
    level VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_created_at ON agent_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_updated_at ON agent_tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_task_id ON agent_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_level ON agent_execution_logs(level);

-- Banking-Grade RLS for Multi-Agent Workforce
ALTER TABLE agent_registry ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_registry" ON agent_registry;
CREATE POLICY "Service role bypass on agent_registry" ON agent_registry FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_registry" ON agent_registry;
CREATE POLICY "Deny public on agent_registry" ON agent_registry FOR ALL USING (false);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_tasks" ON agent_tasks;
CREATE POLICY "Service role bypass on agent_tasks" ON agent_tasks FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_tasks" ON agent_tasks;
CREATE POLICY "Deny public on agent_tasks" ON agent_tasks FOR ALL USING (false);

ALTER TABLE agent_execution_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role bypass on agent_execution_logs" ON agent_execution_logs;
CREATE POLICY "Service role bypass on agent_execution_logs" ON agent_execution_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
DROP POLICY IF EXISTS "Deny public on agent_execution_logs" ON agent_execution_logs;
CREATE POLICY "Deny public on agent_execution_logs" ON agent_execution_logs FOR ALL USING (false);
