-- Update decrement_kid_coins to allow negative balances
CREATE OR REPLACE FUNCTION public.decrement_kid_coins(p_kid_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.kid_profiles
  SET earned_coins = earned_coins - p_amount,
      updated_at = now()
  WHERE id = p_kid_id;
END;
$$;