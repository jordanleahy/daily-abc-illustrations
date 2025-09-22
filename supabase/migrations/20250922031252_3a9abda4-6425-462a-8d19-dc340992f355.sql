-- Push all daily published content forward by one day
UPDATE daily_published 
SET 
  publish_date = publish_date + INTERVAL '1 day',
  expires_at = CASE 
    WHEN expires_at IS NOT NULL THEN expires_at + INTERVAL '1 day'
    ELSE expires_at
  END,
  updated_at = now()
WHERE status IN ('active', 'queued');