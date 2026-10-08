CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ai_agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    domain_id TEXT NOT NULL,
    memory_tier TEXT NOT NULL, -- 'working', 'episodic', 'semantic', 'procedural'
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_ai_agent_memory_tenant_domain 
ON ai_agent_memory (tenant_id, domain_id, memory_tier);

-- hnsw index for vector search. Using cosine distance.
CREATE INDEX IF NOT EXISTS ix_ai_agent_memory_embedding 
ON ai_agent_memory USING hnsw (embedding vector_cosine_ops);
