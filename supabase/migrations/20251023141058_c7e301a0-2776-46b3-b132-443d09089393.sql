-- Add DELETE policies for daily_published table to allow safe cleanup

-- Admins can delete any daily published entry
CREATE POLICY "Admins can delete all daily published"
ON public.daily_published
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can delete their own daily published entries
CREATE POLICY "Users can delete their own daily publications"
ON public.daily_published
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM books 
    WHERE books.id = daily_published.book_id 
    AND books.user_id = auth.uid()
  )
);