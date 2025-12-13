-- Drop the existing function first (it returns void, we need JSONB)
DROP FUNCTION IF EXISTS public.update_reading_progress(UUID, UUID, UUID, INTEGER, BOOLEAN);

-- Create the updated update_reading_progress function
CREATE OR REPLACE FUNCTION public.update_reading_progress(
  p_user_id UUID,
  p_book_id UUID,
  p_kid_id UUID DEFAULT NULL,
  p_pages_read INTEGER DEFAULT 1,
  p_reading_completed BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_activity_id UUID;
  v_was_already_completed BOOLEAN;
  v_session_id UUID;
BEGIN
  -- Get current state before update
  SELECT id, reading_completed 
  INTO v_activity_id, v_was_already_completed
  FROM user_book_activity 
  WHERE user_id = p_user_id AND book_id = p_book_id;

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
    -- Only increment completion_count when transitioning from incomplete to complete
    completion_count = CASE 
      WHEN p_reading_completed AND NOT COALESCE(user_book_activity.reading_completed, false) 
      THEN user_book_activity.completion_count + 1
      ELSE user_book_activity.completion_count
    END,
    view_count = user_book_activity.view_count + 1,
    last_reading_session_at = now(),
    last_viewed_at = now(),
    updated_at = now()
  RETURNING id INTO v_activity_id;

  -- Create or update reading session
  -- Check if there's an active session (started within last 30 minutes without ended_at)
  SELECT id INTO v_session_id
  FROM reading_sessions
  WHERE user_id = p_user_id 
    AND book_id = p_book_id
    AND ended_at IS NULL
    AND started_at > now() - INTERVAL '30 minutes'
  ORDER BY started_at DESC
  LIMIT 1;

  IF v_session_id IS NOT NULL THEN
    -- Update existing session
    UPDATE reading_sessions
    SET 
      page_stopped_at = p_pages_read,
      was_completed = p_reading_completed,
      kid_id = COALESCE(p_kid_id, kid_id),
      updated_at = now(),
      ended_at = CASE WHEN p_reading_completed THEN now() ELSE NULL END
    WHERE id = v_session_id;
  ELSE
    -- Create new session
    INSERT INTO reading_sessions (
      user_id,
      book_id,
      kid_id,
      page_stopped_at,
      was_completed,
      started_at,
      ended_at
    ) VALUES (
      p_user_id,
      p_book_id,
      p_kid_id,
      p_pages_read,
      p_reading_completed,
      now(),
      CASE WHEN p_reading_completed THEN now() ELSE NULL END
    )
    RETURNING id INTO v_session_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'session_id', v_session_id,
    'completion_count', (SELECT completion_count FROM user_book_activity WHERE id = v_activity_id)
  );
END;
$$;