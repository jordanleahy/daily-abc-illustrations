-- Drop the old check constraint
ALTER TABLE public.habits 
DROP CONSTRAINT IF EXISTS habits_frequency_check;

-- Add the updated check constraint with 'manual' included
ALTER TABLE public.habits 
ADD CONSTRAINT habits_frequency_check 
CHECK (frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'manual'::text]));