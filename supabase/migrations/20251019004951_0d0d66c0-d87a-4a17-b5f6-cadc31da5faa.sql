-- Create atomic function to safely delete habit completion and adjust coins
-- This prevents race conditions by performing all operations in a single transaction
CREATE OR REPLACE FUNCTION public.delete_habit_completion_safe(p_completion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completion RECORD;
  v_coins_to_deduct INTEGER;
BEGIN
  -- Lock and fetch the completion record
  SELECT * INTO v_completion
  FROM habit_completions
  WHERE id = p_completion_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Completion not found'
    );
  END IF;
  
  -- Calculate coins to deduct based on status
  v_coins_to_deduct := CASE
    WHEN v_completion.status = 'pending' THEN v_completion.coins_deposited
    WHEN v_completion.status = 'completed' THEN v_completion.coins_retained
    ELSE 0
  END;
  
  -- Delete the completion
  DELETE FROM habit_completions WHERE id = p_completion_id;
  
  -- Deduct coins if necessary
  IF v_coins_to_deduct > 0 THEN
    UPDATE kid_profiles
    SET earned_coins = GREATEST(0, earned_coins - v_coins_to_deduct),
        updated_at = now()
    WHERE id = v_completion.kid_profile_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'coins_deducted', v_coins_to_deduct,
    'kid_id', v_completion.kid_profile_id
  );
END;
$$;