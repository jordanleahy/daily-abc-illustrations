-- Remove existing daily publisher cron jobs
SELECT cron.unschedule('daily-publisher-eastern');
SELECT cron.unschedule('daily-publisher-edt-slot');

-- Create optimized daily publisher cron job that covers both EST and EDT
-- Runs every minute during minutes 0-3 of hours 11 and 12 UTC
-- This ensures coverage for both EST (12 PM UTC) and EDT (11 AM UTC) at 7:01 AM ET
SELECT cron.schedule(
  'enhanced-daily-publisher',
  '0-3 11,12 * * *', -- Minutes 0-3 of hours 11 and 12 UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '", "schedule_type": "enhanced_eastern_time"}')::jsonb
    ) as request_id;
  $$
);