
-- Drop the existing function first
DROP FUNCTION IF EXISTS public.update_reading_progress(uuid, uuid, uuid, integer, boolean);

-- Create simplified update_reading_progress that ONLY tracks page progress (no completion count)
CREATE OR REPLACE FUNCTION public.update_reading_progress(
  p_user_id UUID,
  p_book_id UUID,
  p_kid_id UUID DEFAULT NULL,
  p_pages_read INTEGER DEFAULT 0,
  p_reading_completed BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  -- Upsert user_book_activity - ONLY update progress, never touch completion_count here
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
    0,  -- Never set completion_count here, that's done by increment_book_completion
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
  DO UPDATE SET
    kid_id = COALESCE(EXCLUDED.kid_id, user_book_activity.kid_id),
    pages_read = GREATEST(user_book_activity.pages_read, EXCLUDED.pages_read),
    reading_completed = user_book_activity.reading_completed OR EXCLUDED.reading_completed,
    -- DO NOT touch completion_count - that's handled by increment_book_completion
    view_count = user_book_activity.view_count + 1,
    last_reading_session_at = now(),
    last_viewed_at = now(),
    updated_at = now()
  RETURNING id INTO v_activity_id;

  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id
  );
END;
$$;

-- Create a NEW, simple function that ONLY increments completion_count
-- This is called ONCE when user finishes reading a book
CREATE OR REPLACE FUNCTION public.increment_book_completion(
  p_user_id UUID,
  p_book_id UUID,
  p_kid_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  -- First ensure the activity record exists
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
    0,
    TRUE,
    1,  -- First completion
    1,
    now(),
    now()
  )
  ON CONFLICT (user_id, book_id) WHERE book_id IS NOT NULL
  DO UPDATE SET
    kid_id = COALESCE(EXCLUDED.kid_id, user_book_activity.kid_id),
    reading_completed = TRUE,
    completion_count = user_book_activity.completion_count + 1,  -- ALWAYS increment
    last_reading_session_at = now(),
    updated_at = now()
  RETURNING completion_count INTO v_new_count;

  RETURN jsonb_build_object(
    'success', true,
    'completion_count', v_new_count
  );
END;
$$;
