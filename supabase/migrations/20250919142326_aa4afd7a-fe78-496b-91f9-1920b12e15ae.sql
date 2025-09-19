-- Fix database constraints to support draft daily_published entries

-- 1. Update the status check constraint to include 'draft'
ALTER TABLE public.daily_published DROP CONSTRAINT daily_published_status_check;
ALTER TABLE public.daily_published ADD CONSTRAINT daily_published_status_check 
  CHECK (status = ANY (ARRAY['draft'::text, 'queued'::text, 'active'::text, 'expired'::text]));

-- 2. Allow queue_position to be NULL for draft entries
ALTER TABLE public.daily_published ALTER COLUMN queue_position DROP NOT NULL;

-- 3. Update the trigger function to handle draft entries properly
CREATE OR REPLACE FUNCTION public.handle_daily_published_queue_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set queue position for non-draft entries
  IF NEW.status != 'draft' AND NEW.queue_position IS NULL THEN
    NEW.queue_position = public.get_next_queue_position();
  END IF;
  
  -- Set default status if not provided and not draft
  IF NEW.status IS NULL THEN
    NEW.status = 'queued';
  END IF;
  
  RETURN NEW;
END;
$function$;