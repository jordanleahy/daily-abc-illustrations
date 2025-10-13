-- Create function to skip habit completion and remove optimistically deposited coins
CREATE OR REPLACE FUNCTION public.skip_habit_completion(
  p_completion_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_completion RECORD;
BEGIN
  -- Get the completion details
  SELECT * INTO v_completion
  FROM habit_completions
  WHERE id = p_completion_id
    AND parent_user_id = auth.uid() -- Security: only parent can skip
    AND status = 'pending'; -- Only allow skipping pending habits
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Completion not found or already processed'
    );
  END IF;
  
  -- Mark as skipped
  UPDATE habit_completions
  SET 
    status = 'skipped',
    marked_at = now(),
    coins_retained = 0,
    updated_at = now()
  WHERE id = p_completion_id;
  
  -- Remove the optimistically deposited coins
  UPDATE kid_profiles
  SET earned_coins = GREATEST(0, earned_coins - v_completion.coins_deposited),
      updated_at = now()
  WHERE id = v_completion.kid_profile_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'coins_removed', v_completion.coins_deposited,
    'kid_id', v_completion.kid_profile_id
  );
END;
$$;