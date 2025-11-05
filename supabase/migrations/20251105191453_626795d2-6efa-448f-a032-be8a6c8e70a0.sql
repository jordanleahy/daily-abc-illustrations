-- Drop existing RLS policies that depend on generation_status
DROP POLICY IF EXISTS "Anyone can view latest page images for active daily published b" ON public.page_image_urls;
DROP POLICY IF EXISTS "Authenticated users with subscription can view library images" ON public.page_image_urls;
DROP POLICY IF EXISTS "Images of public pages are readable" ON public.page_image_urls;

-- Remove generation tracking columns (images are user-uploaded only)
ALTER TABLE public.page_image_urls
  DROP COLUMN IF EXISTS generation_started_at,
  DROP COLUMN IF EXISTS generation_completed_at,
  DROP COLUMN IF EXISTS generation_duration_ms,
  DROP COLUMN IF EXISTS generation_status;

-- Recreate RLS policies without generation_status checks
CREATE POLICY "Anyone can view latest page images for active daily published b"
ON public.page_image_urls
FOR SELECT
USING (
  is_latest = true 
  AND image_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM pages p
    JOIN daily_published dp ON dp.book_id = p.book_id
    WHERE p.id = page_image_urls.page_id
    AND dp.is_active = true
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);

CREATE POLICY "Authenticated users with subscription can view library images"
ON public.page_image_urls
FOR SELECT
USING (
  is_latest = true
  AND image_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM pages p
    JOIN daily_published dp ON dp.book_id = p.book_id
    WHERE p.id = page_image_urls.page_id
    AND dp.status IN ('active', 'expired', 'queued')
  )
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'teacher'::app_role) 
    OR has_active_subscription(auth.uid())
  )
);

CREATE POLICY "Images of public pages are readable"
ON public.page_image_urls
FOR SELECT
USING (
  is_latest = true
  AND image_url IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM pages
    JOIN daily_published ON daily_published.book_id = pages.book_id
    WHERE pages.id = page_image_urls.page_id
    AND daily_published.is_publicly_visible = true
    AND daily_published.status IN ('active', 'queued', 'expired')
  )
);