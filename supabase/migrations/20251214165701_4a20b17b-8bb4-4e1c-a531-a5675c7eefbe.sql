-- Create unified resolver function for public books
-- Checks daily_published.slug first, then falls back to books.marketing_url for library books
CREATE OR REPLACE FUNCTION public.resolve_public_book_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  book_id uuid,
  title text,
  description text,
  source_type text,
  book_name text,
  book_description text,
  user_id uuid,
  total_pages integer,
  book_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First try: daily_published.slug (existing behavior)
  RETURN QUERY
  SELECT 
    dp.id,
    dp.book_id,
    dp.title,
    dp.description,
    'daily_published'::text as source_type,
    b.book_name,
    b.book_description,
    b.user_id,
    b.total_pages,
    b.created_at as book_created_at
  FROM daily_published dp
  JOIN books b ON b.id = dp.book_id
  WHERE dp.slug = p_slug
    AND dp.is_publicly_visible = true
    AND dp.status IN ('active', 'queued', 'expired')
  LIMIT 1;
  
  -- If found, return
  IF FOUND THEN
    RETURN;
  END IF;
  
  -- Second try: books.marketing_url for library books
  RETURN QUERY
  SELECT 
    b.id,
    b.id as book_id,
    b.book_name as title,
    b.book_description as description,
    'marketing'::text as source_type,
    b.book_name,
    b.book_description,
    b.user_id,
    b.total_pages,
    b.created_at as book_created_at
  FROM books b
  WHERE b.marketing_url = p_slug
    AND b.is_library_book = true
  LIMIT 1;
END;
$$;