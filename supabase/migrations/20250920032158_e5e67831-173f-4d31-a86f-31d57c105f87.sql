-- Fix security issues by setting proper search_path for functions

-- Fix auto_expire_on_access function
CREATE OR REPLACE FUNCTION auto_expire_on_access()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If we're selecting and content is expired, mark it as expired
  IF TG_OP = 'SELECT' AND OLD.status = 'active' AND OLD.expires_at < now() THEN
    UPDATE daily_published 
    SET status = 'expired', is_active = false 
    WHERE id = OLD.id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Fix validate_single_active_item function  
CREATE OR REPLACE FUNCTION validate_single_active_item()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Only check if this record is being set to active
  IF NEW.status = 'active' AND NEW.is_active = true THEN
    -- Count currently active, non-expired items (excluding this one)
    SELECT COUNT(*) INTO active_count
    FROM daily_published 
    WHERE status = 'active' 
      AND is_active = true 
      AND (expires_at IS NULL OR expires_at > now())
      AND id != NEW.id;
    
    -- If there are already active items, this could be a race condition
    -- Log it but allow for automated queue processing
    IF active_count > 0 THEN
      RAISE WARNING 'Multiple active daily published items detected - this may indicate a race condition';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;