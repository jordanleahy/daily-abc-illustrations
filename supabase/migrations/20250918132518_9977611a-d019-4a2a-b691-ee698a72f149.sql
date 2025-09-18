-- Update daily published schedule to 9 AM publication times

-- First, mark any currently active items as expired
UPDATE daily_published 
SET 
  status = 'expired',
  is_active = false,
  expires_at = now()
WHERE status = 'active' AND is_active = true;

-- Activate the next queued item immediately (position 2 - Arctic Adventures)
UPDATE daily_published 
SET 
  status = 'active',
  is_active = true,
  published_at = now(),
  expires_at = date_trunc('day', now() + interval '1 day') + interval '9 hours'  -- Tomorrow at 9 AM
WHERE queue_position = 2 AND status = 'queued';

-- Update remaining queued items to start at 9 AM on consecutive days
-- Position 3: Tomorrow 9 AM to day after 9 AM
UPDATE daily_published 
SET 
  published_at = date_trunc('day', now() + interval '1 day') + interval '9 hours',
  expires_at = date_trunc('day', now() + interval '2 days') + interval '9 hours'
WHERE queue_position = 3 AND status = 'queued';

-- Position 4: Day after tomorrow 9 AM to next day 9 AM  
UPDATE daily_published 
SET 
  published_at = date_trunc('day', now() + interval '2 days') + interval '9 hours',
  expires_at = date_trunc('day', now() + interval '3 days') + interval '9 hours'
WHERE queue_position = 4 AND status = 'queued';

-- Position 5: 3 days from now 9 AM to next day 9 AM
UPDATE daily_published 
SET 
  published_at = date_trunc('day', now() + interval '3 days') + interval '9 hours',
  expires_at = date_trunc('day', now() + interval '4 days') + interval '9 hours'
WHERE queue_position = 5 AND status = 'queued';