-- Drop the old unique constraint that doesn't include stance
ALTER TABLE trick_goals DROP CONSTRAINT IF EXISTS trick_goals_trick_id_kid_profile_id_key;

-- Update trigger function to use correct conflict target
CREATE OR REPLACE FUNCTION public.auto_create_switch_goal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger for regular stance goals
  IF NEW.stance = 'regular' OR NEW.stance IS NULL THEN
    -- Create matching switch goal if it doesn't exist
    INSERT INTO trick_goals (
      trick_id, kid_profile_id, parent_user_id, 
      target_count, stance, is_active, goal_started_at
    ) VALUES (
      NEW.trick_id, NEW.kid_profile_id, NEW.parent_user_id,
      NEW.target_count, 'switch', NEW.is_active, NEW.goal_started_at
    )
    ON CONFLICT (trick_id, kid_profile_id, stance) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Backfill: Create switch goals for all existing regular goals that don't have one
INSERT INTO trick_goals (trick_id, kid_profile_id, parent_user_id, target_count, stance, is_active, goal_started_at)
SELECT trick_id, kid_profile_id, parent_user_id, target_count, 'switch', is_active, goal_started_at
FROM trick_goals tg1
WHERE (tg1.stance = 'regular' OR tg1.stance IS NULL)
  AND NOT EXISTS (
    SELECT 1 FROM trick_goals tg2 
    WHERE tg2.trick_id = tg1.trick_id 
      AND tg2.kid_profile_id = tg1.kid_profile_id 
      AND tg2.stance = 'switch'
  );