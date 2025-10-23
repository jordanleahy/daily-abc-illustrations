-- Multi-instance habit support: Allow multiple completions of same habit per day
-- Example: "Drink Water" can be done 8 times in one day

-- 1. Drop the unique constraint that prevented multiple daily completions
ALTER TABLE habit_completions 
DROP CONSTRAINT IF EXISTS habit_completions_assignment_date_unique;

-- 2. Add instance_number column to track multiple instances (defaults to 1 for existing records)
ALTER TABLE habit_completions 
ADD COLUMN IF NOT EXISTS instance_number INTEGER DEFAULT 1;

-- 3. Add index for efficient querying of multiple instances per day
CREATE INDEX IF NOT EXISTS idx_habit_completions_assignment_date_instance 
ON habit_completions(habit_assignment_id, completion_date, instance_number);

-- 4. Update unified function to support multiple instances
CREATE OR REPLACE FUNCTION public.create_habit_completion_unified(
  p_habit_id UUID,
  p_kid_profile_id UUID,
  p_parent_user_id UUID,
  p_completion_date DATE DEFAULT CURRENT_DATE,
  p_deposit_coins BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_habit RECORD;
  v_assignment_id UUID;
  v_completion_id UUID;
  v_deadline TIMESTAMP WITH TIME ZONE;
  v_coins_amount INTEGER;
  v_next_instance_number INTEGER;
BEGIN
  -- Get habit details
  SELECT * INTO v_habit
  FROM habits
  WHERE id = p_habit_id AND is_active = true AND parent_user_id = p_parent_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Habit not found or inactive');
  END IF;
  
  -- Get or create assignment
  SELECT id INTO v_assignment_id
  FROM habit_assignments
  WHERE habit_id = p_habit_id 
    AND kid_profile_id = p_kid_profile_id
    AND parent_user_id = p_parent_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO habit_assignments (habit_id, kid_profile_id, parent_user_id, is_active)
    VALUES (p_habit_id, p_kid_profile_id, p_parent_user_id, true)
    RETURNING id INTO v_assignment_id;
  ELSE
    -- Reactivate if inactive
    UPDATE habit_assignments SET is_active = true WHERE id = v_assignment_id;
  END IF;
  
  -- Calculate next instance number for this habit on this date
  SELECT COALESCE(MAX(instance_number), 0) + 1 INTO v_next_instance_number
  FROM habit_completions
  WHERE habit_assignment_id = v_assignment_id 
    AND completion_date = p_completion_date;
  
  -- Optional: Add max instances per day check to prevent abuse
  IF v_next_instance_number > 20 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Maximum 20 instances per day reached'
    );
  END IF;
  
  -- Calculate deadline
  IF v_habit.deadline_time IS NOT NULL THEN
    v_deadline := (p_completion_date || ' ' || v_habit.deadline_time)::TIMESTAMP WITH TIME ZONE;
  ELSE
    v_deadline := (p_completion_date || ' 23:59:59')::TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Determine coins to deposit (0 for book habits, full amount for regular habits)
  v_coins_amount := CASE
    WHEN NOT p_deposit_coins THEN 0
    WHEN v_habit.book_id IS NOT NULL THEN 0  -- Book habits deposit on finish
    ELSE v_habit.coin_amount
  END;
  
  -- Create completion record with instance number
  INSERT INTO habit_completions (
    habit_assignment_id, kid_profile_id, parent_user_id,
    completion_date, status, coins_deposited, coins_retained, 
    deadline_at, instance_number
  ) VALUES (
    v_assignment_id, p_kid_profile_id, p_parent_user_id,
    p_completion_date, 'pending', v_coins_amount, 0, 
    v_deadline, v_next_instance_number
  ) RETURNING id INTO v_completion_id;
  
  -- Deposit coins atomically (only if not a book habit and deposit_coins is true)
  IF v_coins_amount > 0 THEN
    UPDATE kid_profiles
    SET earned_coins = earned_coins + v_coins_amount, updated_at = now()
    WHERE id = p_kid_profile_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'completion_id', v_completion_id,
    'assignment_id', v_assignment_id,
    'coins_deposited', v_coins_amount,
    'is_book_habit', v_habit.book_id IS NOT NULL,
    'instance_number', v_next_instance_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;