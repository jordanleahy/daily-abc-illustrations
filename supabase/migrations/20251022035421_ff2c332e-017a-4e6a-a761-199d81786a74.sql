-- Ensure no views have SECURITY DEFINER by recreating active_daily_published view
-- This addresses the security linter warning about SECURITY DEFINER views

DROP VIEW IF EXISTS public.active_daily_published CASCADE;

-- Recreate view without SECURITY DEFINER
-- This view will use the permissions of the querying user (safer)
CREATE VIEW public.active_daily_published AS 
SELECT 
  id,
  book_id,
  title,
  description,
  published_at,
  expires_at,
  is_active,
  status,
  queue_position,
  created_at,
  updated_at,
  queue_order,
  publish_date,
  qr_code_image,
  qr_code_public_url,
  qr_code_config,
  qr_code_generated_at,
  slug,
  is_publicly_visible,
  pdf_url
FROM public.daily_published 
WHERE status = 'active' 
  AND is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
ORDER BY queue_order ASC NULLS LAST, created_at ASC;

-- Add comment documenting the view
COMMENT ON VIEW public.active_daily_published IS 'View of currently active daily published content without SECURITY DEFINER - uses querying user permissions';