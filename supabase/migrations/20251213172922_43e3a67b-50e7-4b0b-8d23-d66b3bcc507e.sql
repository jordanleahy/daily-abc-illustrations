-- Add stance column to trick_goals table
ALTER TABLE public.trick_goals 
ADD COLUMN stance TEXT NOT NULL DEFAULT 'regular';

-- Add check constraint for valid stance values
ALTER TABLE public.trick_goals 
ADD CONSTRAINT trick_goals_stance_check CHECK (stance IN ('regular', 'switch'));

-- Add unique constraint to prevent duplicate stance goals for same trick/kid
ALTER TABLE public.trick_goals 
ADD CONSTRAINT trick_goals_unique_stance UNIQUE (trick_id, kid_profile_id, stance);

-- Create function to create a switch goal from a regular goal
CREATE OR REPLACE FUNCTION public.create_switch_goal_from_regular(p_regular_goal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_goal_id uuid;
  v_trick_id uuid;
  v_kid_profile_id uuid;
  v_parent_user_id uuid;
  v_target_count integer;
BEGIN
  -- Get the regular goal details
  SELECT trick_id, kid_profile_id, parent_user_id, target_count
  INTO v_trick_id, v_kid_profile_id, v_parent_user_id, v_target_count
  FROM trick_goals
  WHERE id = p_regular_goal_id AND stance = 'regular';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Regular goal not found';
  END IF;
  
  -- Check if switch goal already exists
  SELECT id INTO v_new_goal_id
  FROM trick_goals
  WHERE trick_id = v_trick_id 
    AND kid_profile_id = v_kid_profile_id 
    AND stance = 'switch';
  
  IF FOUND THEN
    RETURN v_new_goal_id;
  END IF;
  
  -- Create the switch goal
  INSERT INTO trick_goals (
    trick_id,
    kid_profile_id,
    parent_user_id,
    target_count,
    stance,
    is_active
  ) VALUES (
    v_trick_id,
    v_kid_profile_id,
    v_parent_user_id,
    v_target_count,
    'switch',
    true
  )
  RETURNING id INTO v_new_goal_id;
  
  RETURN v_new_goal_id;
END;
$$;