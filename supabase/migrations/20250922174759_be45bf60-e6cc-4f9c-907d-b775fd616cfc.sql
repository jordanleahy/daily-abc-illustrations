-- Add RLS policy to allow public access to book data for active daily published content
CREATE POLICY "Public can view books for active daily published content" 
ON public.books 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM daily_published dp 
    WHERE dp.book_id = books.id 
    AND dp.status = 'active' 
    AND dp.is_active = true 
    AND (dp.expires_at IS NULL OR dp.expires_at > now())
  )
);