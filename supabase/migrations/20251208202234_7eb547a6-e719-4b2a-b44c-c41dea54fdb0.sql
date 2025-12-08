-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the daily blog post generation at 11:30 PM UTC
SELECT cron.schedule(
  'generate-daily-blog-post',
  '30 23 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://foxdnspwzhjxjxuicute.supabase.co/functions/v1/generate-daily-blog-post',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveGRuc3B3emhqeGp4dWljdXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjcyNzQsImV4cCI6MjA3Mjc0MzI3NH0.3VchRK3xfYxZCWBjZpWUwkKTsIB4qAqvNbje_ByXnLI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);