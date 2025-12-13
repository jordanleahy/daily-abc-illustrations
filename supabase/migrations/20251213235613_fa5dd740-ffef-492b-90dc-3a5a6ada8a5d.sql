
-- Fix update_reading_progress to increment completion_count on every completion
-- and remove broken reading_sessions reference
CREATE OR REPLACE FUNCTION public.update_reading_progress(
  p_user_id UUID,
  p_book_id UUID,
  p_pages_read INTEGER,
  p_reading_completed BOOLEAN,
  p_kid_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_activity_id UUID;
  v_new_completion_count INTEGER;
BEGIN
  -- Upsert user_book_activity
  INSERT INTO user_book_activity (
    user_id,
    book_id,
    kid_id,
    pages_read,
    reading_completed,
    completion_count,
    view_count,
    last_reading_session_at,
    last_viewed_at
  ) VALUES (
    p_user_id,
    p_book_id,
    p_kid_id,
    p_pages_read,
    p_reading_completed,
    CASE WHEN p_reading_completed THEN 1 ELSE 0 END,
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
  DO UPDATE SET
    kid_id = COALESCE(EXCLUDED.kid_id, user_book_activity.kid_id),
    pages_read = GREATEST(user_book_activity.pages_read, EXCLUDED.pages_read),
    reading_completed = user_book_activity.reading_completed OR EXCLUDED.reading_completed,
    -- Increment completion_count EVERY time user completes the book
    completion_count = CASE 
      WHEN p_reading_completed 
      THEN user_book_activity.completion_count + 1
      ELSE user_book_activity.completion_count
    END,
    view_count = user_book_activity.view_count + 1,
    last_reading_session_at = now(),
    last_viewed_at = now(),
    updated_at = now()
  RETURNING id, completion_count INTO v_activity_id, v_new_completion_count;

  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'completion_count', v_new_completion_count
  );
END;
$function$;
