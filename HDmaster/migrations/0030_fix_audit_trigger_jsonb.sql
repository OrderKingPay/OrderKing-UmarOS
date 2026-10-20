-- Fix COALESCE types text and jsonb mismatch in orderking_capture_audit_log trigger
CREATE OR REPLACE FUNCTION orderking_capture_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.orderking_emit_immutable_event(
    'audit:' || NEW.id,
    NULL,
    NEW.actor_user_id,
    NULL,
    'audit_logs',
    NEW.id,
    NEW.action,
    COALESCE(NEW.created_at, now()),
    (CASE 
      WHEN NEW.metadata IS NOT NULL AND NEW.metadata != '' THEN 
        CASE WHEN substring(NEW.metadata from 1 for 1) = '{' THEN NEW.metadata::jsonb ELSE jsonb_build_object('raw', NEW.metadata) END
      ELSE '{}'::jsonb 
    END) || jsonb_build_object(
      'entity', NEW.entity,
      'entity_id', NEW.entity_id,
      'actor_role', NEW.actor_role
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
