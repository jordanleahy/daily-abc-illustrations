-- Create tricks table for defining trick activities
CREATE TABLE IF NOT EXISTS public.tricks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  points_per_completion integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create trick_goals table to track each kid's progress
CREATE TABLE IF NOT EXISTS public.trick_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_id uuid NOT NULL REFERENCES public.tricks(id) ON DELETE CASCADE,
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_count integer NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  goal_started_at timestamp with time zone NOT NULL DEFAULT now(),
  goal_completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(trick_id, kid_profile_id)
);

-- Create trick_completions table for audit trail
CREATE TABLE IF NOT EXISTS public.trick_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trick_goal_id uuid NOT NULL REFERENCES public.trick_goals(id) ON DELETE CASCADE,
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  count_increment integer NOT NULL DEFAULT 1,
  points_awarded integer NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tricks_parent_user_id ON public.tricks(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_trick_goals_trick_id ON public.trick_goals(trick_id);
CREATE INDEX IF NOT EXISTS idx_trick_goals_kid_profile_id ON public.trick_goals(kid_profile_id);
CREATE INDEX IF NOT EXISTS idx_trick_completions_trick_goal_id ON public.trick_completions(trick_goal_id);

-- Enable RLS
ALTER TABLE public.tricks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trick_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trick_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tricks table
CREATE POLICY "Parents can view their own tricks"
  ON public.tricks FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create their own tricks"
  ON public.tricks FOR INSERT
  TO authenticated
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their own tricks"
  ON public.tricks FOR UPDATE
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their own tricks"
  ON public.tricks FOR DELETE
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- RLS Policies for trick_goals table
CREATE POLICY "Parents can view their kids' trick goals"
  ON public.trick_goals FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create trick goals for their kids"
  ON public.trick_goals FOR INSERT
  TO authenticated
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their kids' trick goals"
  ON public.trick_goals FOR UPDATE
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete their kids' trick goals"
  ON public.trick_goals FOR DELETE
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- RLS Policies for trick_completions table
CREATE POLICY "Parents can view their kids' trick completions"
  ON public.trick_completions FOR SELECT
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create trick completions for their kids"
  ON public.trick_completions FOR INSERT
  TO authenticated
  WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can delete trick completions"
  ON public.trick_completions FOR DELETE
  TO authenticated
  USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

-- Create function to handle trick completion logic
CREATE OR REPLACE FUNCTION public.create_trick_completion_unified(
  p_goal_id uuid,
  p_count_increment integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trick_goal RECORD;
  v_trick RECORD;
  v_points integer;
  v_new_count integer;
  v_goal_completed boolean := false;
BEGIN
  -- Get goal details with trick info
  SELECT tg.*, t.points_per_completion, t.name as trick_name
  INTO v_trick_goal
  FROM trick_goals tg
  JOIN tricks t ON t.id = tg.trick_id
  WHERE tg.id = p_goal_id
    AND tg.parent_user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Goal not found or access denied'
    );
  END IF;
  
  -- Calculate points
  v_points := v_trick_goal.points_per_completion * p_count_increment;
  
  -- Insert completion record
  INSERT INTO trick_completions (
    trick_goal_id,
    kid_profile_id,
    parent_user_id,
    count_increment,
    points_awarded,
    notes,
    completed_at
  ) VALUES (
    p_goal_id,
    v_trick_goal.kid_profile_id,
    v_trick_goal.parent_user_id,
    p_count_increment,
    v_points,
    p_notes,
    now()
  );
  
  -- Calculate new count
  v_new_count := v_trick_goal.current_count + p_count_increment;
  v_goal_completed := v_new_count >= v_trick_goal.target_count;
  
  -- Update goal progress
  UPDATE trick_goals 
  SET current_count = v_new_count,
      goal_completed_at = CASE 
        WHEN v_goal_completed AND goal_completed_at IS NULL THEN now()
        ELSE goal_completed_at 
      END,
      updated_at = now()
  WHERE id = p_goal_id;
  
  -- Award coins to kid
  UPDATE kid_profiles 
  SET earned_coins = earned_coins + v_points,
      updated_at = now()
  WHERE id = v_trick_goal.kid_profile_id;
  
  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'new_count', v_new_count,
    'target_count', v_trick_goal.target_count,
    'goal_completed', v_goal_completed,
    'trick_name', v_trick_goal.trick_name
  );
END;
$$;

-- Create trigger to update tricks updated_at
CREATE OR REPLACE FUNCTION public.update_tricks_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_tricks_updated_at
  BEFORE UPDATE ON public.tricks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tricks_updated_at();