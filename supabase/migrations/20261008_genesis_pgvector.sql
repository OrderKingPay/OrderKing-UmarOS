CREATE EXTENSION IF NOT EXISTS vector;
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
