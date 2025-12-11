-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.get_all_users_with_activity();

-- Recreate with user_email column
CREATE OR REPLACE FUNCTION public.get_all_users_with_activity()
RETURNS TABLE(
  user_id uuid,
  user_email text,
  first_name text,
  last_name text,
  books_created bigint,
  last_activity timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    au.email::text as user_email,
    p.first_name,
    p.last_name,
    COUNT(DISTINCT b.id) as books_created,
    GREATEST(
      MAX(b.last_activity_at),
      MAX(b.updated_at),
      p.updated_at
    ) as last_activity
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN books b ON b.user_id = p.id
  GROUP BY p.id, p.first_name, p.last_name, p.updated_at, au.email
  ORDER BY last_activity DESC NULLS LAST;
END;
$$;