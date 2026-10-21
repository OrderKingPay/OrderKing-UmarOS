-- Migration 0031: Central Governance & Platform Customization Configurations
CREATE TABLE IF NOT EXISTS app_configurations (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE INDEX IF NOT EXISTS app_configurations_cat_idx ON app_configurations (category);

-- Ensure platform_settings table exists
CREATE TABLE IF NOT EXISTS platform_settings (
  org_id text PRIMARY KEY,
  settings_json text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by_employee_id text
);

-- Seed initial app_configurations if not existing
INSERT INTO app_configurations (key, value_json, category, description)
VALUES 
  ('platform_modules', '{"travel": true, "utilities": true, "aiTutor": true, "jobs": true, "courier": true, "foodDelivery": true}'::jsonb, 'governance', 'Dynamic module toggles: Travel, Utilities, AI Tutor, Jobs, Courier, Food Delivery'),
  ('pricing_delivery_rules', '{"courierBaseFareInr": 30, "courierPerKmRateInr": 10, "courierBasePaise": 3000, "courierPerKmPaise": 1000, "nightFeeInr": 15, "nightFeePaise": 1500, "nightFeeActive": false, "platformCommissionBps": 1800, "townCommissionBps": 2200, "longDistanceCommissionBps": 2800}'::jsonb, 'pricing', 'Platform courier base fare (default ₹30), per-km rate (default ₹10), night fee, platform commission settings'),
  ('dynamic_branding', '{"customAccentColor": "#D97706", "announcementBanner": {"enabled": true, "text": "⚡ FESTIVE FEAST: Flat 20% OFF on all orders above ₹299! Code: UMAR20", "linkUrl": "/offers", "bgGradient": "from-amber-600 via-orange-600 to-amber-700", "badgeText": "LIMITED TIME"}, "featuredCityHubs": [{"id": "city_cp", "name": "Connaught Place, New Delhi", "state": "Delhi", "active": true, "tier": "TIER_1"}, {"id": "city_karimganj", "name": "Karimganj Core Hub", "state": "Assam", "active": true, "tier": "TIER_3"}, {"id": "city_silchar", "name": "Silchar Valley Hub", "state": "Assam", "active": true, "tier": "TIER_2"}, {"id": "city_guwahati", "name": "Guwahati Gateway", "state": "Assam", "active": true, "tier": "TIER_2"}, {"id": "city_bengaluru", "name": "Bengaluru Tech Corridor", "state": "Karnataka", "active": true, "tier": "TIER_1"}, {"id": "city_mumbai", "name": "Mumbai Metropolitan", "state": "Maharashtra", "active": true, "tier": "TIER_1"}, {"id": "city_kolkata", "name": "Kolkata Cultural Hub", "state": "West Bengal", "active": true, "tier": "TIER_1"}]}'::jsonb, 'branding', 'Custom accents, founder announcement banners, and featured city hubs')
ON CONFLICT (key) DO NOTHING;
