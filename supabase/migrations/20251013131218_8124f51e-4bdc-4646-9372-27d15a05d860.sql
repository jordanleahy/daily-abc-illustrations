-- Update habit_completions status check to include 'skipped'
ALTER TABLE public.habit_completions
DROP CONSTRAINT IF EXISTS habit_completions_status_check;

ALTER TABLE public.habit_completions
ADD CONSTRAINT habit_completions_status_check
CHECK (status IN ('pending', 'completed', 'declined', 'skipped'));

-- Optional: validate existing rows against the new constraint (should pass)
-- If any legacy rows had unexpected values, this would fail and surface the issue
ALTER TABLE public.habit_completions VALIDATE CONSTRAINT habit_completions_status_check;