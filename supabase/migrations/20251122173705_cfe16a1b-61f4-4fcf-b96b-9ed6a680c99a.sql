-- Fix security: Set search_path for new functions
DROP FUNCTION IF EXISTS get_user_reading_activity(uuid);
DROP FUNCTION IF EXISTS get_all_users_with_activity();
DROP FUNCTION IF EXISTS update_reading_progress(uuid, uuid, uuid, integer, boolean);

-- Function to get all reading activity for a specific user
CREATE OR REPLACE FUNCTION get_user_reading_activity(p_user_id uuid)
RETURNS TABLE(
  activity_id uuid,
  book_id uuid,
  book_name text,
  book_category text,
  kid_id uuid,
  kid_name text,
  pages_read integer,
  total_pages integer,
  reading_completed boolean,
  view_count integer,
  last_viewed_at timestamp with time zone,
  last_reading_session_at timestamp with time zone,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uba.id as activity_id,
    b.id as book_id,
    b.book_name,
    b.category as book_category,
    kp.id as kid_id,
    COALESCE(kp.first_name || ' ' || kp.last_name, 'Unknown Kid') as kid_name,
    uba.pages_read,
    b.total_pages,
    uba.reading_completed,
    uba.view_count,
    uba.last_viewed_at,
    uba.last_reading_session_at,
    uba.created_at
  FROM user_book_activity uba
  LEFT JOIN books b ON b.id = uba.book_id
  LEFT JOIN kid_profiles kp ON kp.id = uba.kid_id
  WHERE uba.user_id = p_user_id
  ORDER BY uba.last_viewed_at DESC;
END;
$$;

-- Function to list all users with their basic info and activity stats
CREATE OR REPLACE FUNCTION get_all_users_with_activity()
RETURNS TABLE(
  user_id uuid,
  user_name text,
  total_books_accessed bigint,
  total_reading_sessions bigint,
  last_activity_at timestamp with time zone,
  kids_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'User ' || SUBSTRING(p.id::text, 1, 8)) as user_name,
    COUNT(DISTINCT uba.book_id) as total_books_accessed,
    COALESCE(SUM(uba.view_count), 0) as total_reading_sessions,
    MAX(uba.last_viewed_at) as last_activity_at,
    COUNT(DISTINCT kp.id) as kids_count
  FROM profiles p
  LEFT JOIN user_book_activity uba ON uba.user_id = p.id
  LEFT JOIN kid_profiles kp ON kp.parent_user_id = p.id AND kp.is_active = true
  GROUP BY p.id, p.first_name, p.last_name
  HAVING COUNT(DISTINCT uba.book_id) > 0
  ORDER BY MAX(uba.last_viewed_at) DESC NULLS LAST;
END;
$$;

-- Function to update reading progress
CREATE OR REPLACE FUNCTION update_reading_progress(
  p_user_id uuid,
  p_book_id uuid,
  p_kid_id uuid,
  p_pages_read integer,
  p_reading_completed boolean
) 
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO user_book_activity (
    user_id,
    book_id,
    kid_id,
    last_viewed_at,
    view_count,
    pages_read,
    reading_completed,
    last_reading_session_at
  ) VALUES (
    p_user_id,
    p_book_id,
    p_kid_id,
    NOW(),
    1,
    p_pages_read,
    p_reading_completed,
    NOW()
  )
  ON CONFLICT (user_id, book_id, COALESCE(kid_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET
    last_viewed_at = NOW(),
    view_count = user_book_activity.view_count + 1,
    pages_read = GREATEST(COALESCE(user_book_activity.pages_read, 0), p_pages_read),
    reading_completed = COALESCE(user_book_activity.reading_completed, false) OR p_reading_completed,
    last_reading_session_at = NOW(),
    updated_at = NOW();
END;
$$;

-- Grant execute permissions
REVOKE EXECUTE ON FUNCTION get_user_reading_activity FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_user_reading_activity TO authenticated;

REVOKE EXECUTE ON FUNCTION get_all_users_with_activity FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_all_users_with_activity TO authenticated;

GRANT EXECUTE ON FUNCTION update_reading_progress TO authenticated;