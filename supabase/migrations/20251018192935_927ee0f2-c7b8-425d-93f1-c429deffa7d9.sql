-- Fix infinite recursion in books RLS policy
-- Create a SECURITY DEFINER function to check if a book is published
-- This function executes with elevated privileges and bypasses RLS, breaking the circular dependency

CREATE OR REPLACE FUNCTION public.is_book_published(book_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.daily_published dp
    WHERE dp.book_id = $1
      AND dp.status IN ('active', 'expired', 'queued')
  );
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.is_book_published(uuid) IS 
'SECURITY DEFINER function to check if a book is published. Breaks RLS circular dependency by bypassing policies when called from books table policies.';

-- Drop the problematic policy
DROP POLICY IF EXISTS "Public can view published library books only" ON public.books;

-- Recreate the policy using the helper function (no more recursion!)
CREATE POLICY "Public can view published library books only"
ON public.books
FOR SELECT
USING (public.is_book_published(id));

-- Add comment for documentation
COMMENT ON POLICY "Public can view published library books only" ON public.books IS 
'Restricts public access to only books published in the library using is_book_published() function to avoid RLS recursion.';