CREATE TABLE IF NOT EXISTS founder_income_products (
  id VARCHAR(64) PRIMARY KEY,
  org_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  price_paise BIGINT NOT NULL,
  category VARCHAR(64) NOT NULL,
  checkout_link VARCHAR(255) NOT NULL,
  status VARCHAR(24) DEFAULT 'ACTIVE',
  sales_count INT DEFAULT 0,
  total_earned_paise BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS founder_income_products_org_idx ON founder_income_products(org_id);
