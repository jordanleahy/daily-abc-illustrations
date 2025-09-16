-- Fix search path for the duplicate check function
CREATE OR REPLACE FUNCTION check_daily_published_duplicate()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if there's already an active publication for this book
  IF EXISTS (
    SELECT 1 FROM daily_published 
    WHERE book_id = NEW.book_id 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'A daily publication already exists for this book and is still active';
  END IF;
  
  RETURN NEW;
END;
$$;