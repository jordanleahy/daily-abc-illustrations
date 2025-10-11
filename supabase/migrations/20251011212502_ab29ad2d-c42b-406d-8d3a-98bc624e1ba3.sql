-- Update all books to published status
UPDATE public.books 
SET status = 'published'
WHERE status != 'published';