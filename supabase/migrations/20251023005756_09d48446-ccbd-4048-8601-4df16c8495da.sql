-- Step 1: Clean up duplicate habit completions (keep the most recent one)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY habit_assignment_id, completion_date 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM habit_completions
)
DELETE FROM habit_completions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE habit_completions 
ADD CONSTRAINT habit_completions_assignment_date_unique 
UNIQUE (habit_assignment_id, completion_date);

-- Step 3: Create unified habit completion function
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
  
  -- Check for existing completion (prevent duplicates)
  IF EXISTS (
    SELECT 1 FROM habit_completions
    WHERE habit_assignment_id = v_assignment_id AND completion_date = p_completion_date
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Completion already exists for this date');
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
  
  -- Create completion record
  INSERT INTO habit_completions (
    habit_assignment_id, kid_profile_id, parent_user_id,
    completion_date, status, coins_deposited, coins_retained, deadline_at
  ) VALUES (
    v_assignment_id, p_kid_profile_id, p_parent_user_id,
    p_completion_date, 'pending', v_coins_amount, 0, v_deadline
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
    'is_book_habit', v_habit.book_id IS NOT NULL
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Step 4: Update scheduled habit completions function
CREATE OR REPLACE FUNCTION public.create_scheduled_habit_completions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_schedule RECORD;
  v_result jsonb;
  v_completions_created INTEGER := 0;
  v_coins_deposited INTEGER := 0;
BEGIN
  FOR v_schedule IN 
    SELECT * FROM public.habit_schedule WHERE scheduled_date = v_today
  LOOP
    SELECT public.create_habit_completion_unified(
      v_schedule.habit_id,
      v_schedule.kid_profile_id,
      v_schedule.parent_user_id,
      v_today,
      true
    ) INTO v_result;
    
    IF v_result->>'success' = 'true' THEN
      v_completions_created := v_completions_created + 1;
      v_coins_deposited := v_coins_deposited + COALESCE((v_result->>'coins_deposited')::INTEGER, 0);
    END IF;
  END LOOP;
  
  DELETE FROM public.habit_schedule WHERE scheduled_date < (CURRENT_DATE - INTERVAL '7 days');
  
  RETURN jsonb_build_object(
    'success', true,
    'date', v_today,
    'timestamp', now(),
    'completions_created', v_completions_created,
    'total_coins_deposited', v_coins_deposited
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'timestamp', now());
END;
$$;