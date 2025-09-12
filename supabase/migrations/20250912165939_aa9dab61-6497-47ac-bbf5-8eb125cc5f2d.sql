-- Fix linter warning: set stable search_path for function
CREATE OR REPLACE FUNCTION public.create_new_agent_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark all previous versions as not latest for this user
  UPDATE public.agents 
  SET is_latest = false 
  WHERE user_id = NEW.user_id 
    AND (parent_agent_id = NEW.parent_agent_id OR id = NEW.parent_agent_id OR (parent_agent_id IS NULL AND NEW.parent_agent_id IS NULL))
    AND id != NEW.id;
    
  -- Set this as the latest version
  NEW.is_latest = true;
  
  RETURN NEW;
END;
$$;