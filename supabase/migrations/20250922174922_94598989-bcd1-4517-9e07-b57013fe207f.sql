-- Remove the previous restrictive policy
DROP POLICY IF EXISTS "Public can view books for active daily published content" ON public.books;

-- Add a broader policy allowing non-auth users to read all books
CREATE POLICY "Public can view all books" 
ON public.books 
FOR SELECT 
USING (true);