-- Migration 0036: Append-Only Audit Log Triggers & Administrative Override Capture
-- Enforces Section 79 IT Act & DPDP Act 2023 statutory audit immutability

-- 1. Ensure commission_bps exists on restaurant_outlets
ALTER TABLE restaurant_outlets ADD COLUMN IF NOT EXISTS commission_bps int;

-- 2. Function enforcing audit_logs is append-only (rejects UPDATE and DELETE)
CREATE OR REPLACE FUNCTION trg_enforce_audit_logs_append_only()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: UPDATE and DELETE operations are strictly prohibited under Section 79 IT Act & DPDP Act 2023 statutory compliance.'
    USING ERRCODE = '55000';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_audit_logs_append_only();

-- 3. Trigger capturing administrative overrides on restaurants (commission changes and merchant suspensions)
CREATE OR REPLACE FUNCTION trg_capture_restaurant_override()
RETURNS TRIGGER AS $$
DECLARE
  v_id text;
BEGIN
  -- Commission slider changes
  IF OLD.commission_bps IS DISTINCT FROM NEW.commission_bps THEN
    v_id := 'aud_comm_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    INSERT INTO audit_logs (
      id, org_id, user_id, role_key, action, target_type, target_id,
      previous_json, new_json, reason, entity, entity_id, actor_role, created_at
    ) VALUES (
      v_id,
      COALESCE(NEW.org_id, 'org_orderking'),
      'system-trigger',
      'SUPER_ADMIN',
      'restaurant.commission_override',
      'restaurant',
      NEW.id,
      json_build_object('commission_bps', OLD.commission_bps)::text,
      json_build_object('commission_bps', NEW.commission_bps)::text,
      'Automated statutory audit: Restaurant commission adjustment override',
      'restaurant',
      NEW.id,
      'SUPER_ADMIN',
      now()
    );
  END IF;

  -- Merchant suspensions
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'SUSPENDED' THEN
    v_id := 'aud_susp_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    INSERT INTO audit_logs (
      id, org_id, user_id, role_key, action, target_type, target_id,
      previous_json, new_json, reason, entity, entity_id, actor_role, created_at
    ) VALUES (
      v_id,
      COALESCE(NEW.org_id, 'org_orderking'),
      'system-trigger',
      'SUPER_ADMIN',
      'restaurant.suspended',
      'restaurant',
      NEW.id,
      json_build_object('status', OLD.status)::text,
      json_build_object('status', NEW.status)::text,
      'Automated statutory audit: Merchant suspension override',
      'restaurant',
      NEW.id,
      'SUPER_ADMIN',
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restaurants_audit_override ON restaurants;
CREATE TRIGGER trg_restaurants_audit_override
  AFTER UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trg_capture_restaurant_override();

-- 4. Trigger capturing outlet-level commission adjustments on restaurant_outlets
CREATE OR REPLACE FUNCTION trg_capture_outlet_commission_override()
RETURNS TRIGGER AS $$
DECLARE
  v_id text;
BEGIN
  IF OLD.commission_bps IS DISTINCT FROM NEW.commission_bps THEN
    v_id := 'aud_outl_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    INSERT INTO audit_logs (
      id, org_id, user_id, role_key, action, target_type, target_id,
      previous_json, new_json, reason, entity, entity_id, actor_role, created_at
    ) VALUES (
      v_id,
      'org_orderking',
      'system-trigger',
      'SUPER_ADMIN',
      'restaurant_outlet.commission_override',
      'restaurant_outlet',
      NEW.id,
      json_build_object('commission_bps', OLD.commission_bps)::text,
      json_build_object('commission_bps', NEW.commission_bps)::text,
      'Automated statutory audit: Outlet commission adjustment override',
      'restaurant_outlet',
      NEW.id,
      'SUPER_ADMIN',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_outlet_commission_override ON restaurant_outlets;
CREATE TRIGGER trg_outlet_commission_override
  AFTER UPDATE ON restaurant_outlets
  FOR EACH ROW
  EXECUTE FUNCTION trg_capture_outlet_commission_override();

-- 5. Trigger capturing platform fee & settings changes on platform_settings
CREATE OR REPLACE FUNCTION trg_capture_platform_settings_override()
RETURNS TRIGGER AS $$
DECLARE
  v_id text;
BEGIN
  IF OLD.settings_json IS DISTINCT FROM NEW.settings_json THEN
    v_id := 'aud_fee_' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
    INSERT INTO audit_logs (
      id, org_id, employee_id, user_id, role_key, action, target_type, target_id,
      previous_json, new_json, reason, entity, entity_id, actor_role, created_at
    ) VALUES (
      v_id,
      NEW.org_id,
      NEW.updated_by_employee_id,
      'system-trigger',
      'SUPER_ADMIN',
      'platform_settings.fee_updated',
      'platform_settings',
      NEW.org_id,
      OLD.settings_json,
      NEW.settings_json,
      'Automated statutory audit: Platform settings and fee dials override',
      'platform_settings',
      NEW.org_id,
      'SUPER_ADMIN',
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_settings_audit_override ON platform_settings;
CREATE TRIGGER trg_platform_settings_audit_override
  AFTER UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION trg_capture_platform_settings_override();
