ALTER TABLE restaurants ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(cuisine_summary, '') || ' ' || coalesce(description_en, '') || ' ' || coalesce(description_bn, ''))
) STORED;

CREATE INDEX idx_restaurants_fts ON restaurants USING GIN (search_vector);

ALTER TABLE menu_items ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name_en, '') || ' ' || coalesce(name_bn, '') || ' ' || coalesce(description_en, '') || ' ' || coalesce(description_bn, ''))
) STORED;

CREATE INDEX idx_menu_items_fts ON menu_items USING GIN (search_vector);
