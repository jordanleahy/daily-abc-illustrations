-- Fix existing daily_published records with incorrect timezone data
-- Convert any published_at and expires_at times that don't align with 7:01 AM Eastern Time

-- First, let's identify and fix published_at times
-- 7:01 AM Eastern Time should be either:
-- - 12:01:00 UTC during Standard Time (EST)
-- - 11:01:00 UTC during Daylight Time (EDT)

-- Update published_at times to correct 7:01 AM Eastern equivalent
UPDATE daily_published 
SET 
  published_at = CASE 
    -- If during EDT period (March to November roughly), set to 11:01 UTC
    WHEN EXTRACT(MONTH FROM publish_date) BETWEEN 3 AND 11 THEN 
      (publish_date || ' 11:01:00')::timestamp with time zone
    -- If during EST period (December to February), set to 12:01 UTC  
    ELSE 
      (publish_date || ' 12:01:00')::timestamp with time zone
  END,
  expires_at = CASE 
    -- Expire at 7:01 AM Eastern the next day
    WHEN EXTRACT(MONTH FROM (publish_date + INTERVAL '1 day')) BETWEEN 3 AND 11 THEN 
      ((publish_date + INTERVAL '1 day') || ' 11:01:00')::timestamp with time zone
    ELSE 
      ((publish_date + INTERVAL '1 day') || ' 12:01:00')::timestamp with time zone
  END,
  updated_at = now()
WHERE 
  published_at IS NOT NULL 
  AND (
    -- Fix times that don't match 7:01 AM Eastern pattern
    (EXTRACT(HOUR FROM published_at AT TIME ZONE 'America/New_York') != 7) OR
    (EXTRACT(MINUTE FROM published_at AT TIME ZONE 'America/New_York') != 1)
  );

-- Also update any queued items that might have incorrect expires_at times
UPDATE daily_published 
SET 
  expires_at = CASE 
    WHEN EXTRACT(MONTH FROM (publish_date + INTERVAL '1 day')) BETWEEN 3 AND 11 THEN 
      ((publish_date + INTERVAL '1 day') || ' 11:01:00')::timestamp with time zone
    ELSE 
      ((publish_date + INTERVAL '1 day') || ' 12:01:00')::timestamp with time zone
  END,
  updated_at = now()
WHERE 
  status = 'queued' 
  AND expires_at IS NOT NULL
  AND (
    EXTRACT(HOUR FROM expires_at AT TIME ZONE 'America/New_York') != 7 OR
    EXTRACT(MINUTE FROM expires_at AT TIME ZONE 'America/New_York') != 1
  );