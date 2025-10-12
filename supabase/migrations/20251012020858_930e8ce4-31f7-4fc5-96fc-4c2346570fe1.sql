-- Add RLS policy to allow users to view images for all library books
-- This fixes the issue where users couldn't download PDFs for expired/queued books in their library

CREATE POLICY "Users can view images for all accessible library books"
ON public.page_image_urls
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) 
  AND generation_status = 'complete'
  AND is_latest = true 
  AND EXISTS (
    SELECT 1
    FROM pages p
    JOIN daily_published dp ON dp.book_id = p.book_id
    WHERE p.id = page_image_urls.page_id
    -- Allow access to any status (active, expired, queued) that users can view
    AND dp.status IN ('active', 'expired', 'queued')
  )
);