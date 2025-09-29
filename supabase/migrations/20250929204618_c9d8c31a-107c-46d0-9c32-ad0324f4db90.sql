-- Add earned_coins column to kid_profiles table
ALTER TABLE public.kid_profiles 
ADD COLUMN IF NOT EXISTS earned_coins integer NOT NULL DEFAULT 0;

-- Add check constraint to ensure non-negative values
ALTER TABLE public.kid_profiles 
ADD CONSTRAINT earned_coins_non_negative CHECK (earned_coins >= 0);

-- Add comment for documentation
COMMENT ON COLUMN public.kid_profiles.earned_coins IS 'Total coins earned by the kid (1 coin = 1 cent)';