-- Create public RLS policy for page_image_urls to allow viewing images for active daily published books
CREATE POLICY "Anyone can view images for active daily published books" 
ON public.page_image_urls 
FOR SELECT 
USING (
  generation_status = 'complete' 
  AND is_latest = true 
  AND EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.daily_published dp ON dp.book_id = p.book_id
    WHERE p.id = page_image_urls.page_id
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);