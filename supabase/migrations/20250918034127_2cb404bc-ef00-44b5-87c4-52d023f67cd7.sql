-- Update expiration time from 48 hours to 24 hours and set start time to 3pm on 9/17

-- 1. Update existing active items to expire in 24 hours from their original publish time
UPDATE public.daily_published 
SET expires_at = published_at + INTERVAL '24 hours'
WHERE status = 'active';

-- 2. Set the first queued item to start at 3pm on September 17, 2024
-- and update all queued items to have 24-hour intervals
UPDATE public.daily_published 
SET 
  published_at = '2024-09-17 15:00:00'::timestamp with time zone + INTERVAL '24 hours' * (queue_position - 1),
  expires_at = '2024-09-17 15:00:00'::timestamp with time zone + INTERVAL '24 hours' * queue_position
WHERE status = 'queued';

-- 3. Update the queue processing function to use 24 hours
CREATE OR REPLACE FUNCTION public.process_daily_published_queue()
RETURNS VOID AS $$
DECLARE
  next_activation_time TIMESTAMP WITH TIME ZONE;
  next_item_id UUID;
BEGIN
  -- Mark expired items
  UPDATE public.daily_published 
  SET status = 'expired', is_active = false
  WHERE status = 'active' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();
  
  -- Get next activation time (24 hours after last active item)
  SELECT public.get_next_activation_time() INTO next_activation_time;
  
  -- Check if it's time to activate the next item
  IF next_activation_time <= now() THEN
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
        published_at = now(),
        expires_at = now() + INTERVAL '24 hours'  -- Changed from 48 to 24 hours
      WHERE id = next_item_id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update the activation time calculation function for 24-hour intervals
CREATE OR REPLACE FUNCTION public.get_next_activation_time()
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  last_published TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the most recent publication time
  SELECT published_at INTO last_published
  FROM public.daily_published 
  WHERE status = 'active'
  ORDER BY published_at DESC 
  LIMIT 1;
  
  -- If no active publication, return now
  IF last_published IS NULL THEN
    RETURN now();
  END IF;
  
  -- Return 24 hours after last publication (changed from 48 hours)
  RETURN last_published + INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;