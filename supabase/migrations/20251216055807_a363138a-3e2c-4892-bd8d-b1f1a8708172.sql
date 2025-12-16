-- Add trial_ends_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Create function to set trial end date on signup
CREATE OR REPLACE FUNCTION public.set_trial_end_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set 30-day trial for new users
  NEW.trial_ends_at := NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$;

-- Create trigger to auto-set trial for new users
DROP TRIGGER IF EXISTS set_trial_on_signup ON public.profiles;
CREATE TRIGGER set_trial_on_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_end_date();

-- Backfill existing users without subscriptions - give them 30-day trial
UPDATE public.profiles 
SET trial_ends_at = NOW() + INTERVAL '30 days'
WHERE trial_ends_at IS NULL
AND id NOT IN (
  SELECT user_id FROM public.user_subscription_cache 
  WHERE has_active_subscription = true
);