-- Set up cron job to run simple daily publisher at 12:01 AM UTC daily
-- First, ensure pg_cron extension is enabled (this may already be enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the simple daily publisher to run at 12:01 AM UTC every day
SELECT cron.schedule(
  'daily-publisher-12-01-utc',
  '1 0 * * *', -- At 00:01 (12:01 AM) UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Also remove any old cron jobs that might exist
SELECT cron.unschedule('invoke-function-every-minute') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoke-function-every-minute');
SELECT cron.unschedule('daily-publisher-11-12-utc') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-publisher-11-12-utc');