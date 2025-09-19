-- Update the process_daily_published_queue function to exclude draft entries
CREATE OR REPLACE FUNCTION public.process_daily_published_queue()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_activation_time TIMESTAMP WITH TIME ZONE;
  next_item_id UUID;
BEGIN
  -- Mark expired items (exclude draft entries)
  UPDATE public.daily_published 
  SET status = 'expired', is_active = false
  WHERE status = 'active' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();
  
  -- Get next activation time (24 hours after last active item)
  SELECT public.get_next_activation_time() INTO next_activation_time;
  
  -- Check if it's time to activate the next item
  IF next_activation_time <= now() THEN
    -- Get the next queued item (exclude draft entries)
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
        published_at = now(),
        expires_at = now() + INTERVAL '24 hours'  -- Changed from 48 to 24 hours
      WHERE id = next_item_id;
    END IF;
  END IF;
END;
$function$;