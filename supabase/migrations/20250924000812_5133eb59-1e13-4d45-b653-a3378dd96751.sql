-- Add new RLS policy to allow users with 'user' role to view page images for all daily published books (not just active ones)
CREATE POLICY "Users with user role can view images for all daily published books"
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
    AND dp.status != 'draft'
  )
);