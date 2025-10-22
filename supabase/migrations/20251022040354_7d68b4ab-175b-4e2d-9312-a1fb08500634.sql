-- Fix the active_daily_published view to use security_invoker
-- This ensures the view uses the permissions of the querying user, not the view creator
-- Drop existing view
DROP VIEW IF EXISTS public.active_daily_published CASCADE;

-- Recreate view with security_invoker option
-- This is the PostgreSQL 15+ way to avoid SECURITY DEFINER issues
CREATE VIEW public.active_daily_published 
WITH (security_invoker = true)
AS 
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

COMMENT ON VIEW public.active_daily_published IS 'View with security_invoker - uses querying user permissions, not view creator';