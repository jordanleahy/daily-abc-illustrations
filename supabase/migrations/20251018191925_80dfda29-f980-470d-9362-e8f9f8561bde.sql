-- Remove the overly permissive public policy on books table
DROP POLICY IF EXISTS "Public can view all books" ON public.books;

-- Create a restricted policy: Public can only view books that are in daily_published
-- This protects draft books and user privacy while allowing library access
CREATE POLICY "Public can view published library books only"
ON public.books
FOR SELECT
USING (
  -- Only allow viewing books that are published in the library
  EXISTS (
    SELECT 1 
    FROM public.daily_published dp
    WHERE dp.book_id = books.id
      AND dp.status IN ('active', 'expired', 'queued')
  )
);

-- Add comment for documentation
COMMENT ON POLICY "Public can view published library books only" ON public.books IS 
'Restricts public access to only books that are published in the library. Draft books remain private to their creators.';