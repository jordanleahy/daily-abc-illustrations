-- Fix security issues for book thumbnail functions
DROP FUNCTION IF EXISTS public.get_next_book_thumbnail_version_number(uuid);
DROP FUNCTION IF EXISTS public.manage_book_thumbnail_latest();
DROP TRIGGER IF EXISTS manage_book_thumbnail_latest_trigger ON public.book_thumbnails;

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_next_book_thumbnail_version_number(p_book_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM book_thumbnails
  WHERE book_id = p_book_id;
  
  RETURN next_version;
END;
$function$;

-- Function to manage latest thumbnail versioning
CREATE OR REPLACE FUNCTION public.manage_book_thumbnail_latest()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If the new record is being set to is_latest = true
  IF NEW.is_latest = true THEN
    -- Set all other thumbnails for this book to is_latest = false
    UPDATE book_thumbnails 
    SET is_latest = false, updated_at = now()
    WHERE book_id = NEW.book_id 
    AND id != NEW.id 
    AND is_latest = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger for managing latest versions
CREATE TRIGGER manage_book_thumbnail_latest_trigger
  BEFORE INSERT OR UPDATE ON public.book_thumbnails
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_book_thumbnail_latest();