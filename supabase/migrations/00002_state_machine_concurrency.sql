-- Migration: State Machine & Concurrency Check for Orders
-- Mission: Prevent race conditions & strict order-state machine enforcement

-- 1. DB check constraint to enforce allowed enum values
ALTER TABLE orders 
ADD CONSTRAINT check_valid_order_status 
CHECK (status IN ('accepted', 'preparing', 'ready', 'assigned', 'picked_up', 'delivered', 'cancelled'));

-- 2. State Machine Transition Enforcement Trigger
CREATE OR REPLACE FUNCTION enforce_order_state_machine()
RETURNS TRIGGER AS $$
BEGIN
  -- If status hasn't changed, allow the update
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Validate exact state machine transitions
  IF OLD.status = 'accepted' AND NEW.status IN ('preparing', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'preparing' AND NEW.status IN ('ready', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'ready' AND NEW.status IN ('assigned', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'assigned' AND NEW.status IN ('picked_up', 'cancelled') THEN RETURN NEW; END IF;
  IF OLD.status = 'picked_up' AND NEW.status IN ('delivered', 'cancelled') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Illegal order state transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_state_machine_trigger ON orders;
CREATE TRIGGER order_state_machine_trigger
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION enforce_order_state_machine();

-- 3. Stored Procedure for Atomic Rider Assignment (Race Condition Prevention)
CREATE OR REPLACE FUNCTION assign_rider_to_order(
  p_order_id TEXT,
  p_rider_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  -- Atomic update: ensures another rider hasn't already accepted it
  UPDATE orders
  SET 
    rider_id = p_rider_id, 
    status = 'assigned'
  WHERE 
    id = p_order_id 
    AND status = 'ready' 
    AND rider_id IS NULL;

  -- Check if the update affected any rows
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF NOT v_updated THEN
    RAISE EXCEPTION 'Race condition detected or invalid state: order % cannot be assigned to rider %', p_order_id, p_rider_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
