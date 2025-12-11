-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS public.get_all_users_with_activity();

CREATE OR REPLACE FUNCTION public.get_all_users_with_activity()
RETURNS TABLE (
  user_id uuid,
  user_email text,
  first_name text,
  last_name text,
  books_accessed bigint,
  reading_sessions bigint,
  kids_count bigint,
  last_activity timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    au.email::text as user_email,
    p.first_name,
    p.last_name,
    COUNT(DISTINCT uba.book_id)::bigint as books_accessed,
    COALESCE(SUM(uba.view_count), 0)::bigint as reading_sessions,
    (SELECT COUNT(*) FROM kid_profiles kp WHERE kp.parent_user_id = p.id AND kp.is_active = true)::bigint as kids_count,
    GREATEST(
      MAX(uba.last_viewed_at),
      MAX(uba.last_reading_session_at),
      p.updated_at
    ) as last_activity
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN user_book_activity uba ON uba.user_id = p.id
  GROUP BY p.id, p.first_name, p.last_name, p.updated_at, au.email
  ORDER BY last_activity DESC NULLS LAST;
END;
$$;