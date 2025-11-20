-- Add screen time balance to kid_profiles
ALTER TABLE kid_profiles 
ADD COLUMN screen_time_balance_seconds INTEGER DEFAULT 0;

-- Add screen time fields to kid_rewards_products
ALTER TABLE kid_rewards_products 
ADD COLUMN screen_time_minutes INTEGER,
ADD COLUMN is_system_product BOOLEAN DEFAULT FALSE;

-- Create atomic RPC function for adding screen time (race-condition safe)
CREATE OR REPLACE FUNCTION increment_screen_time(p_kid_id UUID, p_seconds INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  UPDATE kid_profiles
  SET screen_time_balance_seconds = screen_time_balance_seconds + p_seconds,
      updated_at = NOW()
  WHERE id = p_kid_id
  RETURNING screen_time_balance_seconds INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

-- Create atomic RPC function for consuming screen time with validation (race-condition safe)
CREATE OR REPLACE FUNCTION decrement_screen_time(
  p_kid_id UUID, 
  p_seconds INTEGER,
  OUT success BOOLEAN,
  OUT new_balance INTEGER,
  OUT error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance INTEGER;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT screen_time_balance_seconds INTO v_current_balance
  FROM kid_profiles
  WHERE id = p_kid_id
  FOR UPDATE;
  
  -- Check if sufficient balance
  IF v_current_balance < p_seconds THEN
    success := FALSE;
    new_balance := v_current_balance;
    error_message := 'Insufficient screen time balance';
    RETURN;
  END IF;
  
  -- Deduct the time
  UPDATE kid_profiles
  SET screen_time_balance_seconds = screen_time_balance_seconds - p_seconds,
      updated_at = NOW()
  WHERE id = p_kid_id
  RETURNING screen_time_balance_seconds INTO new_balance;
  
  success := TRUE;
  error_message := NULL;
END;
$$;

-- Create screen_time_sessions tracking table
CREATE TABLE screen_time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id UUID NOT NULL REFERENCES kid_profiles(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  seconds_consumed INTEGER DEFAULT 0,
  video_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on screen_time_sessions
ALTER TABLE screen_time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for screen_time_sessions
CREATE POLICY "Parents can view their kids' screen time sessions"
ON screen_time_sessions FOR SELECT
USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can create screen time sessions for their kids"
ON screen_time_sessions FOR INSERT
WITH CHECK (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));

CREATE POLICY "Parents can update their kids' screen time sessions"
ON screen_time_sessions FOR UPDATE
USING (parent_user_id = auth.uid() AND has_feature_access(auth.uid(), 'habits_rewards'));