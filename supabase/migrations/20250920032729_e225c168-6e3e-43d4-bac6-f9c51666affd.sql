-- Fix expired active content and activate next item
-- Step 1: Mark expired active items as expired
UPDATE public.daily_published 
SET 
  status = 'expired',
  is_active = false,
  updated_at = now()
WHERE status = 'active' 
  AND expires_at IS NOT NULL 
  AND expires_at < now();

-- Step 2: Activate "Cozy Cabin Alphabet: A Snowy Day" 
UPDATE public.daily_published 
SET 
  status = 'active',
  is_active = true,
  queue_position = 1,
  published_at = now(),
  expires_at = now() + INTERVAL '24 hours',
  updated_at = now()
WHERE id = '7640ba9b-466b-4228-8faa-cf5f32aa0e7a'
  AND status = 'queued';

-- Step 3: Resequence remaining queued items
WITH resequenced AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY queue_position ASC, created_at ASC) + 1 as new_position
  FROM public.daily_published 
  WHERE status = 'queued'
    AND id != '7640ba9b-466b-4228-8faa-cf5f32aa0e7a'
)
UPDATE public.daily_published 
SET 
  queue_position = resequenced.new_position,
  updated_at = now()
FROM resequenced 
WHERE daily_published.id = resequenced.id;