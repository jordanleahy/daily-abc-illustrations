-- Fix the data issue where all items have the same publish_date
-- Spread queued items across different future dates
WITH numbered_queued AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM daily_published 
  WHERE status = 'queued'
)
UPDATE daily_published 
SET publish_date = CURRENT_DATE + (numbered_queued.rn || ' days')::interval,
    updated_at = now()
FROM numbered_queued 
WHERE daily_published.id = numbered_queued.id;

-- Set active items to today if any exist
UPDATE daily_published 
SET publish_date = CURRENT_DATE,
    updated_at = now()
WHERE status = 'active';

-- Set expired items to past dates
WITH numbered_expired AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM daily_published 
  WHERE status = 'expired'
)
UPDATE daily_published 
SET publish_date = CURRENT_DATE - (numbered_expired.rn || ' days')::interval,
    updated_at = now()
FROM numbered_expired 
WHERE daily_published.id = numbered_expired.id;