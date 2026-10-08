-- Enable the pg_trgm extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for restaurants table
CREATE INDEX IF NOT EXISTS restaurants_name_trgm_idx ON restaurants USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS restaurants_description_trgm_idx ON restaurants USING GIN (description gin_trgm_ops);

-- Create GIN indexes for menu_items table
CREATE INDEX IF NOT EXISTS menu_items_name_trgm_idx ON menu_items USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS menu_items_description_trgm_idx ON menu_items USING GIN (description gin_trgm_ops);
