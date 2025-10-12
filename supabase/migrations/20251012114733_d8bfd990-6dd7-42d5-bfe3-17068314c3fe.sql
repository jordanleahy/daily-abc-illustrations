-- Create a function to seed initial habits for a user
CREATE OR REPLACE FUNCTION seed_user_habits(p_parent_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_habit_ids uuid[];
  v_habit_id uuid;
  v_kid_id uuid;
  v_assignment_id uuid;
  v_today date := CURRENT_DATE;
  v_habits_created integer := 0;
  v_assignments_created integer := 0;
  v_completions_created integer := 0;
BEGIN
  -- Check if user already has habits
  IF EXISTS (SELECT 1 FROM habits WHERE parent_user_id = p_parent_user_id AND is_active = true) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User already has habits configured'
    );
  END IF;

  -- Insert the 5 default habits
  WITH inserted_habits AS (
    INSERT INTO habits (parent_user_id, title, description, coin_amount, frequency, deadline_time, is_active, display_order)
    VALUES 
      (p_parent_user_id, 'Make Your Bed', 'Start your day by making your bed neat and tidy', 5, 'daily', '09:00:00', true, 1),
      (p_parent_user_id, 'Brush Your Teeth', 'Brush your teeth morning and night for a healthy smile', 3, 'daily', '21:00:00', true, 2),
      (p_parent_user_id, 'Clean Your Room', 'Keep your room organized and clean', 10, 'daily', '18:00:00', true, 3),
      (p_parent_user_id, 'Do Your Homework', 'Complete all homework assignments on time', 8, 'daily', '19:00:00', true, 4),
      (p_parent_user_id, 'Help with Chores', 'Help out with household chores', 7, 'daily', '17:00:00', true, 5)
    RETURNING id
  )
  SELECT array_agg(id) INTO v_habit_ids FROM inserted_habits;
  
  v_habits_created := array_length(v_habit_ids, 1);

  -- Create habit assignments for all active kid profiles
  FOR v_kid_id IN 
    SELECT id FROM kid_profiles 
    WHERE parent_user_id = p_parent_user_id AND is_active = true
  LOOP
    FOREACH v_habit_id IN ARRAY v_habit_ids
    LOOP
      INSERT INTO habit_assignments (habit_id, kid_profile_id, parent_user_id, is_active)
      VALUES (v_habit_id, v_kid_id, p_parent_user_id, true)
      RETURNING id INTO v_assignment_id;
      
      v_assignments_created := v_assignments_created + 1;

      -- Create today's completion record
      INSERT INTO habit_completions (
        habit_assignment_id, 
        kid_profile_id, 
        parent_user_id, 
        completion_date, 
        status,
        coins_deposited,
        coins_retained
      )
      VALUES (
        v_assignment_id,
        v_kid_id,
        p_parent_user_id,
        v_today,
        'pending',
        0,
        0
      );
      
      v_completions_created := v_completions_created + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Initial habits seeded successfully',
    'habits_created', v_habits_created,
    'assignments_created', v_assignments_created,
    'completions_created', v_completions_created
  );
END;
$$;