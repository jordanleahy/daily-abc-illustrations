-- Fix update_reading_progress function to match actual constraint
-- The function was using an incorrect ON CONFLICT clause that didn't match
-- the actual unique constraint on the table, causing silent failures

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
  -- Fix: Match the actual constraint (user_id, book_id) WHERE book_id IS NOT NULL
  ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
  DO UPDATE SET
    last_viewed_at = NOW(),
    view_count = user_book_activity.view_count + 1,
    pages_read = GREATEST(COALESCE(user_book_activity.pages_read, 0), p_pages_read),
    reading_completed = COALESCE(user_book_activity.reading_completed, false) OR p_reading_completed,
    last_reading_session_at = NOW(),
    updated_at = NOW(),
    kid_id = p_kid_id;
END;
$$;