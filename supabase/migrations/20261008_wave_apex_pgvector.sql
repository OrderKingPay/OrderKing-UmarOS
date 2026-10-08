CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE menu_items ADD COLUMN embedding vector(768);

CREATE INDEX ON menu_items USING hnsw (embedding vector_cosine_ops);
