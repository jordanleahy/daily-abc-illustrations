-- Add fixed daily schedule system (11:12 PM UTC daily activation)

-- Create function to get next fixed activation time
CREATE OR REPLACE FUNCTION public.get_next_fixed_activation_time()
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  today_activation TIMESTAMP WITH TIME ZONE;
  tomorrow_activation TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate today's 11:12 PM UTC
  today_activation := date_trunc('day', now() AT TIME ZONE 'UTC') + INTERVAL '23 hours 12 minutes';
  
  -- If it's already past today's activation time, use tomorrow's
  IF now() AT TIME ZONE 'UTC' > today_activation THEN
    tomorrow_activation := today_activation + INTERVAL '1 day';
    RETURN tomorrow_activation;
  ELSE
    RETURN today_activation;
  END IF;
END;
$function$;

-- Create function to calculate fixed schedule for queue position
CREATE OR REPLACE FUNCTION public.calculate_fixed_schedule_time(queue_pos INTEGER)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the next activation time
  SELECT public.get_next_fixed_activation_time() INTO base_time;
  
  -- Add days based on queue position (position 1 = next activation, position 2 = day after, etc.)
  RETURN base_time + INTERVAL '1 day' * (queue_pos - 1);
END;
$function$;

-- Update process_daily_published_queue function for fixed schedule
CREATE OR REPLACE FUNCTION public.process_daily_published_queue_fixed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_activation_time TIMESTAMP WITH TIME ZONE;
  next_item_id UUID;
  current_activation_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate today's 11:12 PM UTC activation time
  current_activation_time := date_trunc('day', now() AT TIME ZONE 'UTC') + INTERVAL '23 hours 12 minutes';
  
  -- Mark expired items (items that were active but it's now past 11:12 PM)
  UPDATE public.daily_published 
  SET status = 'expired', is_active = false, updated_at = now()
  WHERE status = 'active' 
  AND now() AT TIME ZONE 'UTC' > current_activation_time;
  
  -- Get next activation time
  SELECT public.get_next_fixed_activation_time() INTO next_activation_time;
  
  -- Check if it's time to activate the next item (at or after 11:12 PM UTC)
  IF now() AT TIME ZONE 'UTC' >= current_activation_time THEN
    -- Get the next queued item
    SELECT id INTO next_item_id
    FROM public.daily_published 
    WHERE status = 'queued'
    ORDER BY queue_position ASC
    LIMIT 1;
    
    -- Activate the next item if one exists
    IF next_item_id IS NOT NULL THEN
      UPDATE public.daily_published 
      SET 
        status = 'active',
        is_active = true,
        published_at = current_activation_time,
        expires_at = current_activation_time + INTERVAL '1 day'
      WHERE id = next_item_id;
    END IF;
  END IF;
END;
$function$;

-- Fix current queue to use fixed schedule
-- Set current active item to expire at today's 11:12 PM UTC
UPDATE public.daily_published 
SET expires_at = date_trunc('day', now() AT TIME ZONE 'UTC') + INTERVAL '23 hours 12 minutes'
WHERE status = 'active';

-- Set all queued items to have fixed schedule activation times
WITH fixed_schedule AS (
  SELECT 
    id,
    queue_position,
    public.calculate_fixed_schedule_time(queue_position) as new_activation_time
  FROM public.daily_published 
  WHERE status = 'queued'
  ORDER BY queue_position ASC
)
UPDATE public.daily_published 
SET 
  published_at = fixed_schedule.new_activation_time,
  expires_at = fixed_schedule.new_activation_time + INTERVAL '1 day',
  updated_at = now()
FROM fixed_schedule 
WHERE daily_published.id = fixed_schedule.id;