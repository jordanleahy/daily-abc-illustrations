-- Archive all Bluey-themed books
UPDATE public.books
SET 
  status = 'archived',
  is_library_book = false,
  updated_at = now()
WHERE metadata->>'characterTheme' = 'bluey'
AND status != 'archived';

-- Remove any Bluey books from daily_published
DELETE FROM public.daily_published
WHERE book_id IN (
  SELECT id FROM public.books 
  WHERE metadata->>'characterTheme' = 'bluey'
);