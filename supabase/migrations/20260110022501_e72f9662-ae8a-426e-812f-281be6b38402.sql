-- Update the set_trial_end_date function to use 7 days instead of 30 days
-- Existing trials will be honored (no changes to existing users)

CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set 7-day trial for new users (changed from 30 days)
  NEW.trial_ends_at := NOW() + INTERVAL '7 days';
  RETURN NEW;
END;
$$;