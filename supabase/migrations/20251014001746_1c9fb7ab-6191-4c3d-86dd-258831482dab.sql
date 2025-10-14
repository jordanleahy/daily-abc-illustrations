-- Create habit_schedule table for manual scheduling
CREATE TABLE IF NOT EXISTS public.habit_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  kid_profile_id UUID NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Prevent duplicate schedules
  UNIQUE(habit_id, kid_profile_id, scheduled_date)
);

-- Add indexes for performance
CREATE INDEX idx_habit_schedule_date ON public.habit_schedule(scheduled_date);
CREATE INDEX idx_habit_schedule_parent ON public.habit_schedule(parent_user_id);

-- Enable RLS
ALTER TABLE public.habit_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view their own habit schedules"
  ON public.habit_schedule FOR SELECT
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can create their own habit schedules"
  ON public.habit_schedule FOR INSERT
  WITH CHECK (parent_user_id = auth.uid());

CREATE POLICY "Parents can update their own habit schedules"
  ON public.habit_schedule FOR UPDATE
  USING (parent_user_id = auth.uid());

CREATE POLICY "Parents can delete their own habit schedules"
  ON public.habit_schedule FOR DELETE
  USING (parent_user_id = auth.uid());

-- Create function for scheduled habit completion creation
CREATE OR REPLACE FUNCTION public.create_scheduled_habit_completions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_schedule RECORD;
  v_habit RECORD;
  v_completions_created INTEGER := 0;
  v_coins_deposited INTEGER := 0;
  v_deadline TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Loop through all schedules for today
  FOR v_schedule IN 
    SELECT hs.*, ha.id as assignment_id
    FROM public.habit_schedule hs
    JOIN public.habit_assignments ha ON (
      ha.habit_id = hs.habit_id 
      AND ha.kid_profile_id = hs.kid_profile_id
      AND ha.is_active = true
    )
    WHERE hs.scheduled_date = v_today
  LOOP
    -- Get habit details
    SELECT * INTO v_habit 
    FROM public.habits 
    WHERE id = v_schedule.habit_id 
      AND is_active = true;
    
    -- Skip if habit not found or not active
    CONTINUE WHEN NOT FOUND;
    
    -- Check if completion already exists for today
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM public.habit_completions 
      WHERE habit_assignment_id = v_schedule.assignment_id 
        AND completion_date = v_today
    );
    
    -- Calculate deadline
    IF v_habit.deadline_time IS NOT NULL THEN
      v_deadline := (v_today || ' ' || v_habit.deadline_time)::TIMESTAMP WITH TIME ZONE;
    ELSE
      v_deadline := (v_today || ' 23:59:59')::TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Create habit completion with optimistic coin deposit
    INSERT INTO public.habit_completions (
      habit_assignment_id,
      kid_profile_id,
      parent_user_id,
      completion_date,
      status,
      coins_deposited,
      coins_retained,
      deadline_at
    ) VALUES (
      v_schedule.assignment_id,
      v_schedule.kid_profile_id,
      v_schedule.parent_user_id,
      v_today,
      'pending',
      v_habit.coin_amount,
      0,
      v_deadline
    );
    
    -- Deposit coins optimistically
    UPDATE public.kid_profiles
    SET earned_coins = earned_coins + v_habit.coin_amount,
        updated_at = now()
    WHERE id = v_schedule.kid_profile_id;
    
    v_completions_created := v_completions_created + 1;
    v_coins_deposited := v_coins_deposited + v_habit.coin_amount;
  END LOOP;
  
  -- Clean up old schedules (older than 7 days)
  DELETE FROM public.habit_schedule 
  WHERE scheduled_date < (CURRENT_DATE - INTERVAL '7 days');
  
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
$$;

-- Set up cron job for 3:00 AM EST (7:00 AM UTC)
SELECT cron.schedule(
  'create-scheduled-habits',
  '0 7 * * *',
  $$SELECT public.create_scheduled_habit_completions();$$
);