-- Window 5 Commercial Master Dials: Penalty Disputes, Featured Ad Auction Studio, and Operational Controls
-- All monetary calculations are strict SafeInteger paise (100 paise = 1 INR).

CREATE TABLE IF NOT EXISTS merchant_penalty_disputes (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  restaurant_name TEXT NOT NULL,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  penalty_type TEXT NOT NULL, -- 'LATE_PREPARATION', 'MERCHANT_CANCELLATION', 'ORDER_REJECTION'
  penalty_paise INT NOT NULL CHECK (penalty_paise >= 0),
  delay_minutes INT NOT NULL DEFAULT 0,
  merchant_notes TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'WAIVED', 'ENFORCED'
  reviewed_by_employee_id TEXT,
  waiver_reason TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalty_disputes_org ON merchant_penalty_disputes (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_penalty_disputes_rst ON merchant_penalty_disputes (restaurant_id);

CREATE TABLE IF NOT EXISTS featured_ad_campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  placement_slot TEXT NOT NULL DEFAULT 'TOP_OF_FEED', -- 'TOP_OF_FEED', 'CATEGORY_BANNER', 'SEARCH_SPONSORED'
  max_bid_cpc_paise INT NOT NULL DEFAULT 400 CHECK (max_bid_cpc_paise >= 100), -- Minimum ₹1.00 bid
  daily_budget_paise INT NOT NULL DEFAULT 50000 CHECK (daily_budget_paise >= 10000), -- Minimum ₹100.00 daily budget
  spent_today_paise INT NOT NULL DEFAULT 0,
  impressions_count INT NOT NULL DEFAULT 0,
  clicks_count INT NOT NULL DEFAULT 0,
  quality_score_x100 INT NOT NULL DEFAULT 150, -- 1.50 baseline multiplier
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'EXHAUSTED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_org ON featured_ad_campaigns (org_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_rst ON featured_ad_campaigns (restaurant_id);
