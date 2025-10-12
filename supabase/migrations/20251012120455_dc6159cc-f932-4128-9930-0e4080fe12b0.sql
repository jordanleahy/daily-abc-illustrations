-- Create function to automatically create daily habit completions
CREATE OR REPLACE FUNCTION public.create_daily_habit_completions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_assignment RECORD;
  v_habit RECORD;
  v_completions_created INTEGER := 0;
  v_coins_deposited INTEGER := 0;
  v_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Loop through all active habit assignments
  FOR v_assignment IN 
    SELECT ha.id, ha.habit_id, ha.kid_profile_id, ha.parent_user_id
    FROM habit_assignments ha
    WHERE ha.is_active = true
  LOOP
    -- Get habit details
    SELECT * INTO v_habit 
    FROM habits 
    WHERE id = v_assignment.habit_id 
      AND is_active = true;
    
    -- Skip if habit not found or not active
    CONTINUE WHEN NOT FOUND;
    
    -- Check frequency (only process 'daily' for now)
    CONTINUE WHEN v_habit.frequency != 'daily';
    
    -- Check if completion already exists for today
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM habit_completions 
      WHERE habit_assignment_id = v_assignment.id 
        AND completion_date = v_today
    );
    
    -- Calculate deadline (combine today's date with habit's deadline time)
    IF v_habit.deadline_time IS NOT NULL THEN
      v_deadline := (v_today || ' ' || v_habit.deadline_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
      v_deadline := (v_today || ' 23:59:59')::TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Create habit completion with optimistic coin deposit
    INSERT INTO habit_completions (
      habit_assignment_id,
      kid_profile_id,
      parent_user_id,
      completion_date,
      status,
      coins_deposited,
      coins_retained,
      deadline_at
    ) VALUES (
      v_assignment.id,
      v_assignment.kid_profile_id,
      v_assignment.parent_user_id,
      v_today,
      'pending',
      v_habit.coin_amount,
      0,
      v_deadline
    );
    
    -- Immediately deposit coins to kid's balance (optimistic deposit)
    UPDATE kid_profiles
    SET earned_coins = earned_coins + v_habit.coin_amount,
        updated_at = now()
    WHERE id = v_assignment.kid_profile_id;
    
    v_completions_created := v_completions_created + 1;
    v_coins_deposited := v_coins_deposited + v_habit.coin_amount;
  END LOOP;
  
  -- Return summary report
  RETURN jsonb_build_object(
    'success', true,
    'date', v_today,
    'timestamp', now(),
    'completions_created', v_completions_created,
    'total_coins_deposited', v_coins_deposited
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$function$;

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily habit creation at 3:00 AM ET (7:00 AM UTC during daylight saving time)
-- Note: This runs at 7:00 AM UTC which equals 3:00 AM EDT / 2:00 AM EST
SELECT cron.schedule(
  'create-daily-habit-completions',
  '0 7 * * *',
  $$SELECT public.create_daily_habit_completions()$$
);