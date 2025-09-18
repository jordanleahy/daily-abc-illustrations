-- Add public read access for pages that are part of active daily published books
CREATE POLICY "Anyone can view pages for active daily published books" 
ON public.pages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM daily_published dp 
    WHERE dp.book_id = pages.book_id 
      AND dp.is_active = true 
      AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);