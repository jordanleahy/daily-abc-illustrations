-- Fix daily published queue - activate the next item that should be active
-- Mark expired items as expired
UPDATE public.daily_published 
SET status = 'expired', is_active = false, updated_at = now()
WHERE expires_at < now() 
  AND status != 'expired';

-- Activate the next queued item that should be active
UPDATE public.daily_published 
SET 
  status = 'active',
  is_active = true,
  published_at = now(),
  updated_at = now()
WHERE id = (
  SELECT id 
  FROM public.daily_published 
  WHERE status = 'queued' 
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY queue_position ASC, created_at ASC
  LIMIT 1
);