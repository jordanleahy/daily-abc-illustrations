-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly cleanup of old page images
-- Runs every Sunday at 2:00 AM UTC
SELECT cron.schedule(
  'cleanup-old-page-images-weekly',
  '0 2 * * 0',
  $$
  SELECT public.cleanup_old_page_images(
    p_keep_versions := 5,
    p_older_than_days := 30,
    p_dry_run := false
  );
  $$
);

-- Schedule weekly cleanup of orphaned image records
-- Runs every Sunday at 2:30 AM UTC
SELECT cron.schedule(
  'cleanup-orphaned-images-weekly',
  '30 2 * * 0',
  $$
  SELECT public.cleanup_orphaned_image_records(
    p_older_than_days := 7,
    p_dry_run := false
  );
  $$
);