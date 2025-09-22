-- Drop triggers and functions in correct order to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_daily_published_queue_insert ON public.daily_published;
DROP FUNCTION IF EXISTS public.handle_daily_published_queue_insert();

-- Remove old queue management functions that are no longer needed
DROP FUNCTION IF EXISTS public.process_daily_published_queue_fixed();
DROP FUNCTION IF EXISTS public.cleanup_daily_published_queue();
DROP FUNCTION IF EXISTS public.get_next_queue_position();
DROP FUNCTION IF EXISTS public.get_next_fixed_activation_time();
DROP FUNCTION IF EXISTS public.calculate_fixed_schedule_time(integer);

-- Update the daily published table to make queue_position optional/nullable
-- since we're now using publish_date for ordering
ALTER TABLE public.daily_published 
ALTER COLUMN queue_position DROP NOT NULL;

-- Create a trigger to set publish_date for new entries if not provided
CREATE OR REPLACE FUNCTION public.set_default_publish_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If publish_date is not set, use next available date for queued items
  IF NEW.publish_date IS NULL THEN
    IF NEW.status = 'queued' THEN
      NEW.publish_date := public.get_next_available_publish_date();
    ELSIF NEW.status = 'active' THEN
      NEW.publish_date := CURRENT_DATE;
    ELSIF NEW.status = 'draft' THEN
      -- Set draft items far in the future by default
      NEW.publish_date := CURRENT_DATE + INTERVAL '100 days';
    ELSE
      NEW.publish_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_default_publish_date_trigger
  BEFORE INSERT ON public.daily_published
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_publish_date();