-- Fix Daily Published Queue Scheduling
-- Reset queue positions and fix scheduled times to follow 11:12 PM UTC daily schedule

-- First, let's get the next activation time (11:12 PM UTC today or tomorrow)
CREATE OR REPLACE FUNCTION get_base_activation_time() 
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  today_activation TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate today's 11:12 PM UTC
  today_activation := date_trunc('day', now() AT TIME ZONE 'UTC') + INTERVAL '23 hours 12 minutes';
  
  -- If it's already past today's activation time, use tomorrow's
  IF now() AT TIME ZONE 'UTC' > today_activation THEN
    RETURN today_activation + INTERVAL '1 day';
  ELSE
    RETURN today_activation;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fix queue positions and scheduled times for queued items
WITH queued_items AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_position
  FROM daily_published 
  WHERE status = 'queued'
),
base_time AS (
  SELECT get_base_activation_time() as activation_time
)
UPDATE daily_published 
SET 
  queue_position = qi.new_position,
  published_at = bt.activation_time + INTERVAL '1 day' * (qi.new_position - 1),
  expires_at = bt.activation_time + INTERVAL '1 day' * qi.new_position,
  updated_at = now()
FROM queued_items qi, base_time bt
WHERE daily_published.id = qi.id;

-- Clean up the temporary function
DROP FUNCTION get_base_activation_time();