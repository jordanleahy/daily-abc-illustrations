-- Add new RLS policy to allow users with 'user' role to view pages for all daily published books (not just active ones)
CREATE POLICY "Users with user role can view pages for all daily published books"
ON public.pages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'user'::app_role) 
  AND EXISTS (
    SELECT 1 
    FROM daily_published dp 
    WHERE dp.book_id = pages.book_id 
    AND dp.status != 'draft'
  )
);