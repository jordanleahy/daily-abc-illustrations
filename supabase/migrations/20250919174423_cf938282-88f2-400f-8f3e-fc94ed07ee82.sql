-- Update the duplicate check function to enforce only one active publication globally
CREATE OR REPLACE FUNCTION public.check_daily_published_duplicate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if there's already ANY active publication (not just for this book)
  IF NEW.status = 'active' OR NEW.is_active = true THEN
    IF EXISTS (
      SELECT 1 FROM daily_published 
      WHERE (status = 'active' OR is_active = true)
      AND (expires_at IS NULL OR expires_at > now())
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Only one publication can be active at a time. Please wait for the current publication to expire.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$