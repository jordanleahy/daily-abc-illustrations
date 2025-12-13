-- Drop existing function first since return type is changing
DROP FUNCTION IF EXISTS public.get_library_books_by_completion(uuid);

-- Recreate with enhanced data including cover images
CREATE OR REPLACE FUNCTION public.get_library_books_by_completion(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  book_name text,
  book_description text,
  category text,
  is_library_book boolean,
  created_at timestamptz,
  updated_at timestamptz,
  is_highlighted boolean,
  metadata jsonb,
  last_completed_at timestamptz,
  completion_count bigint,
  cover_image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH user_completions AS (
    -- Get completion stats per book for this user
    SELECT 
      uba.book_id,
      MAX(uba.last_reading_session_at) as last_completed,
      COUNT(*) FILTER (WHERE uba.reading_completed = true) as completed_count
    FROM user_book_activity uba
    WHERE uba.user_id = p_user_id
    GROUP BY uba.book_id
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
    uc.last_completed as last_completed_at,
    COALESCE(uc.completed_count, 0) as completion_count,
    ci.image_url as cover_image_url
  FROM books b
  LEFT JOIN user_completions uc ON uc.book_id = b.id
  LEFT JOIN cover_images ci ON ci.book_id = b.id
  WHERE b.is_library_book = true
    AND b.status = 'published'
  ORDER BY 
    -- Books the user has completed recently come first
    uc.last_completed DESC NULLS LAST,
    -- Then by creation date
    b.created_at DESC;
END;
$$;