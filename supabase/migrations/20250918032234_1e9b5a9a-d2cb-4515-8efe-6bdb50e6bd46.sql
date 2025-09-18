-- Fix current queue data: only position 1 should be active, rest should be queued
-- For queued items, set future dates based on queue position
UPDATE public.daily_published 
SET 
  status = CASE 
    WHEN queue_position = 1 THEN 'active'
    ELSE 'queued'
  END,
  is_active = CASE 
    WHEN queue_position = 1 THEN true
    ELSE false
  END,
  -- Set future activation dates for queued items (48 hours * queue position from first item)
  published_at = CASE 
    WHEN queue_position = 1 THEN published_at -- Keep current for active item
    ELSE (SELECT published_at FROM daily_published WHERE queue_position = 1) + INTERVAL '48 hours' * (queue_position - 1)
  END,
  expires_at = CASE 
    WHEN queue_position = 1 THEN expires_at -- Keep current for active item  
    ELSE (SELECT published_at FROM daily_published WHERE queue_position = 1) + INTERVAL '48 hours' * queue_position
  END
WHERE queue_position > 0;