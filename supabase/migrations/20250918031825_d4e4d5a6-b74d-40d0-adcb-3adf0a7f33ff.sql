-- Fix current queue data: only position 1 should be active, rest should be queued
UPDATE public.daily_published 
SET 
  status = CASE 
    WHEN queue_position = 1 THEN 'active'
    ELSE 'queued'
  END,
  is_active = CASE 
    WHEN queue_position = 1 THEN true
    ELSE false
  END
WHERE queue_position > 0;

-- Update the published_at and expires_at for queued items
-- Queued items should not have current timestamps
UPDATE public.daily_published 
SET 
  published_at = NULL,
  expires_at = NULL
WHERE status = 'queued';