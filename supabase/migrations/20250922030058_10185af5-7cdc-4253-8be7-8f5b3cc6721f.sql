-- Remove the old cron job
SELECT cron.unschedule('daily-publisher-12-01-utc') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-publisher-12-01-utc');

-- Create DST-aware cron jobs for Eastern Time publishing at 7:01 AM
-- EST period (Standard Time): 12:01 PM UTC (November - March)
SELECT cron.schedule(
  'daily-publisher-est',
  '1 12 * * *', -- 12:01 PM UTC = 7:01 AM EST
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '", "timezone": "EST"}')::jsonb
    ) as request_id;
  $$
);

-- EDT period (Daylight Time): 11:01 AM UTC (March - November) 
SELECT cron.schedule(
  'daily-publisher-edt',
  '1 11 * * *', -- 11:01 AM UTC = 7:01 AM EDT
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/simple-daily-publisher',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '", "timezone": "EDT"}')::jsonb
    ) as request_id;
  $$
);

-- Create a function to manage DST transitions
-- This function will enable/disable the appropriate cron job based on the current date
CREATE OR REPLACE FUNCTION public.manage_dst_cron_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_date_est timestamp with time zone;
  is_dst_period boolean;
BEGIN
  -- Get current date in Eastern timezone
  current_date_est := now() AT TIME ZONE 'America/New_York';
  
  -- Determine if we're in DST period (roughly March-November)
  -- DST typically starts 2nd Sunday in March and ends 1st Sunday in November
  is_dst_period := EXTRACT(month FROM current_date_est) BETWEEN 3 AND 11;
  
  -- Enable/disable cron jobs based on DST period
  IF is_dst_period THEN
    -- Enable EDT job (11:01 AM UTC)
    UPDATE cron.job SET active = true WHERE jobname = 'daily-publisher-edt';
    UPDATE cron.job SET active = false WHERE jobname = 'daily-publisher-est';
  ELSE
    -- Enable EST job (12:01 PM UTC)  
    UPDATE cron.job SET active = true WHERE jobname = 'daily-publisher-est';
    UPDATE cron.job SET active = false WHERE jobname = 'daily-publisher-edt';
  END IF;
END;
$$;

-- Run the DST management function initially
SELECT public.manage_dst_cron_jobs();

-- Schedule the DST management function to run daily at 2 AM UTC to handle transitions
SELECT cron.schedule(
  'dst-transition-manager',
  '0 2 * * *', -- 2:00 AM UTC daily
  'SELECT public.manage_dst_cron_jobs();'
);