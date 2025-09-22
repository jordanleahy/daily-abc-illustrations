-- Remove the old cron job
SELECT cron.unschedule('daily-publisher-12-01-utc') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-publisher-12-01-utc');

-- Create new Eastern Time cron job that runs at 7:01 AM Eastern (handles DST automatically)
-- We'll use 12:01 PM UTC as the base time and let the edge function handle DST logic
SELECT cron.schedule(
  'daily-publisher-eastern',
  '1 12 * * *', -- 12:01 PM UTC (will be adjusted by edge function logic)
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '", "schedule_type": "eastern_time"}')::jsonb
    ) as request_id;
  $$
);

-- Also add an EDT time slot cron job for summer months
SELECT cron.schedule(
  'daily-publisher-edt-slot',
  '1 11 * * *', -- 11:01 AM UTC for EDT periods
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '", "schedule_type": "eastern_time"}')::jsonb
    ) as request_id;
  $$
);