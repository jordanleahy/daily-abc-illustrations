-- Archive all non-Western books (preserve only 'weston' themed books)
UPDATE public.books
SET 
  status = 'archived',
  is_library_book = false,
  updated_at = now()
WHERE (metadata->>'characterTheme' IS DISTINCT FROM 'weston')
AND status != 'archived';

-- Remove non-Western books from daily_published
DELETE FROM public.daily_published
WHERE book_id IN (
  SELECT id FROM public.books 
  WHERE metadata->>'characterTheme' IS DISTINCT FROM 'weston'
);