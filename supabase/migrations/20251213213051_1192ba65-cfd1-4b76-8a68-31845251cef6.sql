
-- Function to get all kids with their reading activity summary
CREATE OR REPLACE FUNCTION public.get_all_kids_with_activity()
RETURNS TABLE (
  kid_id UUID,
  kid_name TEXT,
  parent_user_id UUID,
  date_of_birth DATE,
  total_books_read BIGINT,
  total_completions BIGINT,
  total_reading_sessions BIGINT,
  last_activity_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kp.id as kid_id,
    (kp.first_name || ' ' || kp.last_name) as kid_name,
    kp.parent_user_id,
    kp.date_of_birth,
    COALESCE(COUNT(DISTINCT uba.book_id), 0)::BIGINT as total_books_read,
    COALESCE(SUM(uba.completion_count), 0)::BIGINT as total_completions,
    COALESCE(SUM(uba.view_count), 0)::BIGINT as total_reading_sessions,
    MAX(uba.last_reading_session_at) as last_activity_at
  FROM kid_profiles kp
  LEFT JOIN user_book_activity uba ON uba.kid_id = kp.id
  WHERE kp.is_active = true
  GROUP BY kp.id, kp.first_name, kp.last_name, kp.parent_user_id, kp.date_of_birth
  ORDER BY MAX(uba.last_reading_session_at) DESC NULLS LAST;
END;
$$;

-- Function to get detailed reading activity for a specific kid
CREATE OR REPLACE FUNCTION public.get_kid_reading_activity(p_kid_id UUID)
RETURNS TABLE (
  activity_id UUID,
  book_id UUID,
  book_name TEXT,
  book_category TEXT,
  pages_read INTEGER,
  total_pages INTEGER,
  reading_completed BOOLEAN,
  completion_count INTEGER,
  view_count INTEGER,
  last_viewed_at TIMESTAMPTZ,
  last_reading_session_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uba.id as activity_id,
    uba.book_id,
    b.book_name,
    b.category as book_category,
    uba.pages_read,
    b.total_pages,
    uba.reading_completed,
    uba.completion_count,
    uba.view_count,
    uba.last_viewed_at,
    uba.last_reading_session_at,
    uba.created_at
  FROM user_book_activity uba
  JOIN books b ON b.id = uba.book_id
  WHERE uba.kid_id = p_kid_id
  ORDER BY uba.last_reading_session_at DESC NULLS LAST;
END;
$$;
