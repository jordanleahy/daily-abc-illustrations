
-- Update has_feature_access to also check trial_ends_at as a fallback
CREATE OR REPLACE FUNCTION public.has_feature_access(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_subscription BOOLEAN;
  v_trial_ends_at TIMESTAMPTZ;
BEGIN
  -- Feature: 'chat_and_books' - always available to authenticated users (FREE tier)
  IF p_feature = 'chat_and_books' THEN
    RETURN (p_user_id IS NOT NULL);
  END IF;
  
  -- All other features require active subscription or trial
  -- Check cache first (valid for 5 minutes)
  SELECT has_active_subscription
  INTO v_has_subscription
  FROM public.user_subscription_cache
  WHERE user_id = p_user_id
    AND cached_at > NOW() - INTERVAL '5 minutes';
  
  -- If cache is valid and shows subscription, return true
  IF FOUND AND v_has_subscription THEN
    RETURN true;
  END IF;
  
  -- Fallback: Check if user has an active trial
  SELECT trial_ends_at
  INTO v_trial_ends_at
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW() THEN
    RETURN true;
  END IF;
  
  -- No subscription or trial
  RETURN false;
END;
$function$;
