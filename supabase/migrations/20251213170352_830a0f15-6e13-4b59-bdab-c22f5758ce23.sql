-- Create RPC function to get library books sorted by user's completion time
CREATE OR REPLACE FUNCTION public.get_library_books_by_completion(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  book_name text,
  book_description text,
  category text,
  is_library_book boolean,
  created_at timestamptz,
  last_completed_at timestamptz,
  completion_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.book_name,
    b.book_description,
    b.category,
    b.is_library_book,
    b.created_at,
    MAX(uba.last_reading_session_at) as last_completed_at,
    COUNT(uba.id) FILTER (WHERE uba.reading_completed = true) as completion_count
  FROM books b
  LEFT JOIN user_book_activity uba 
    ON b.id = uba.book_id 
    AND uba.user_id = p_user_id
    AND uba.reading_completed = true
  WHERE b.is_library_book = true
  GROUP BY b.id, b.book_name, b.book_description, b.category, b.is_library_book, b.created_at
  ORDER BY 
    MAX(uba.last_reading_session_at) DESC NULLS LAST,
    b.created_at DESC;
END;
$$;