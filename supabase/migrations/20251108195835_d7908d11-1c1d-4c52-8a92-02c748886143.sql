-- Update the create_scheduled_habit_completions function to support auto-daily habits
-- This function now processes BOTH manual schedules AND habits with frequency='daily'

CREATE OR REPLACE FUNCTION create_scheduled_habit_completions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_schedule record;
  v_habit record;
  v_assignment record;
  v_completion_id uuid;
  v_deadline_at timestamptz;
  v_created_count integer := 0;
  v_skipped_count integer := 0;
  v_result jsonb;
BEGIN
  -- Part 1: Process manual schedules from habit_schedule table (existing behavior)
  FOR v_schedule IN 
    SELECT 
      hs.id as schedule_id,
      hs.habit_id,
      hs.kid_profile_id,
      hs.parent_user_id,
      h.coin_amount,
      h.deadline_time,
      h.title as habit_title
    FROM habit_schedule hs
    JOIN habits h ON h.id = hs.habit_id
    WHERE hs.scheduled_date = v_today
      AND h.is_active = true
  LOOP
    -- Calculate deadline timestamp
    IF v_schedule.deadline_time IS NOT NULL THEN
      v_deadline_at := (v_today || ' ' || v_schedule.deadline_time::text)::timestamptz;
    ELSE
      v_deadline_at := NULL;
    END IF;

    -- Check if completion already exists
    IF NOT EXISTS (
      SELECT 1 FROM habit_completions hc
      JOIN habit_assignments ha ON ha.id = hc.habit_assignment_id
      WHERE ha.habit_id = v_schedule.habit_id
        AND hc.kid_profile_id = v_schedule.kid_profile_id
        AND hc.completion_date = v_today
        AND hc.instance_number = 1
    ) THEN
      -- Find the habit assignment
      SELECT id INTO v_completion_id
      FROM habit_assignments
      WHERE habit_id = v_schedule.habit_id
        AND kid_profile_id = v_schedule.kid_profile_id
        AND parent_user_id = v_schedule.parent_user_id
        AND is_active = true
      LIMIT 1;

      IF v_completion_id IS NOT NULL THEN
        -- Create the completion
        INSERT INTO habit_completions (
          habit_assignment_id,
          kid_profile_id,
          parent_user_id,
          completion_date,
          status,
          coins_deposited,
          coins_retained,
          deadline_at,
          instance_number
        ) VALUES (
          v_completion_id,
          v_schedule.kid_profile_id,
          v_schedule.parent_user_id,
          v_today,
          'pending',
          v_schedule.coin_amount,
          0,
          v_deadline_at,
          1
        );
        
        v_created_count := v_created_count + 1;
      END IF;
    ELSE
      v_skipped_count := v_skipped_count + 1;
    END IF;

    -- Clean up the schedule entry after processing
    DELETE FROM habit_schedule WHERE id = v_schedule.schedule_id;
  END LOOP;

  -- Part 2: Process auto-daily habits (NEW behavior)
  FOR v_habit IN 
    SELECT 
      h.id as habit_id,
      h.parent_user_id,
      h.coin_amount,
      h.deadline_time,
      h.title as habit_title
    FROM habits h
    WHERE h.frequency = 'daily'
      AND h.is_active = true
      AND h.book_id IS NULL
  LOOP
    -- Get all active assignments for this habit
    FOR v_assignment IN
      SELECT 
        ha.id as assignment_id,
        ha.kid_profile_id,
        ha.parent_user_id
      FROM habit_assignments ha
      WHERE ha.habit_id = v_habit.habit_id
        AND ha.is_active = true
    LOOP
      -- Calculate deadline timestamp
      IF v_habit.deadline_time IS NOT NULL THEN
        v_deadline_at := (v_today || ' ' || v_habit.deadline_time::text)::timestamptz;
      ELSE
        v_deadline_at := NULL;
      END IF;

      -- Check if completion already exists for this kid
      IF NOT EXISTS (
        SELECT 1 FROM habit_completions
        WHERE habit_assignment_id = v_assignment.assignment_id
          AND kid_profile_id = v_assignment.kid_profile_id
          AND completion_date = v_today
          AND instance_number = 1
      ) THEN
        -- Create the completion
        INSERT INTO habit_completions (
          habit_assignment_id,
          kid_profile_id,
          parent_user_id,
          completion_date,
          status,
          coins_deposited,
          coins_retained,
          deadline_at,
          instance_number
        ) VALUES (
          v_assignment.assignment_id,
          v_assignment.kid_profile_id,
          v_assignment.parent_user_id,
          v_today,
          'pending',
          v_habit.coin_amount,
          0,
          v_deadline_at,
          1
        );
        
        v_created_count := v_created_count + 1;
      ELSE
        v_skipped_count := v_skipped_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  -- Return summary
  v_result := jsonb_build_object(
    'success', true,
    'date', v_today,
    'completions_created', v_created_count,
    'completions_skipped', v_skipped_count,
    'message', format('Created %s completions, skipped %s duplicates for %s', 
                      v_created_count, v_skipped_count, v_today)
  );

  RETURN v_result;
END;
$$;