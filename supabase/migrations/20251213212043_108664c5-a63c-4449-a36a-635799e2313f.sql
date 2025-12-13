-- Update get_library_books_by_completion to use the new completion_count column
CREATE OR REPLACE FUNCTION public.get_library_books_by_completion(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  book_name TEXT,
  book_description TEXT,
  category TEXT,
  is_library_book BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_highlighted BOOLEAN,
  metadata JSONB,
  last_completed_at TIMESTAMPTZ,
  completion_count BIGINT,
  cover_image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_activity AS (
    -- Get activity stats per book for this user using the new completion_count column
    SELECT 
      uba.book_id,
      uba.last_reading_session_at as last_completed,
      uba.completion_count as completed_count
    FROM user_book_activity uba
    WHERE uba.user_id = p_user_id
  ),
  cover_images AS (
    -- Get cover page images for library books
    SELECT DISTINCT ON (p.book_id)
      p.book_id,
      piu.image_url
    FROM pages p
    JOIN page_image_urls piu ON piu.page_id = p.id
    WHERE p.page_type = 'cover'
      AND piu.is_latest = true
      AND piu.image_url IS NOT NULL
    ORDER BY p.book_id, piu.created_at DESC
  )
  SELECT 
    b.id,
    b.book_name,
    b.book_description,
    b.category,
    b.is_library_book,
    b.created_at,
    b.updated_at,
    b.is_highlighted,
    b.metadata,
    ua.last_completed as last_completed_at,
    COALESCE(ua.completed_count, 0)::BIGINT as completion_count,
    ci.image_url as cover_image_url
  FROM books b
  LEFT JOIN user_activity ua ON ua.book_id = b.id
  LEFT JOIN cover_images ci ON ci.book_id = b.id
  WHERE b.is_library_book = true
    AND b.status = 'published'
  ORDER BY 
    -- Books the user has completed recently come first
    ua.last_completed DESC NULLS LAST,
    -- Then by creation date
    b.created_at DESC;
END;
$$;