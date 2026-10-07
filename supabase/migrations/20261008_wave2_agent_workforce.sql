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
    
    CONSTRAINT chk_payload_is_object CHECK (jsonb_typeof(payload) = 'object'),
    CONSTRAINT chk_result_is_object CHECK (result IS NULL OR jsonb_typeof(result) = 'object'),
    CONSTRAINT chk_dates CHECK (
        (started_at IS NULL AND completed_at IS NULL AND status = 'PENDING') OR
        (started_at IS NOT NULL AND status IN ('RUNNING', 'COMPLETED', 'FAILED'))
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
CREATE INDEX idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_execution_logs_task_id ON agent_execution_logs(task_id);
CREATE INDEX idx_agent_execution_logs_level ON agent_execution_logs(level);
