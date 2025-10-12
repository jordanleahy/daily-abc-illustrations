-- Drop unique constraint to allow testing with duplicate habit completions
-- This enables clicking the test button multiple times to see coin balance increase
-- IMPORTANT: This is for testing purposes only

ALTER TABLE public.habit_completions 
DROP CONSTRAINT IF EXISTS habit_completions_habit_assignment_id_completion_date_key;

-- To restore this constraint after testing is complete, run:
-- 
-- First, clean up any duplicates:
-- DELETE FROM habit_completions a
-- USING habit_completions b
-- WHERE a.id > b.id 
--   AND a.habit_assignment_id = b.habit_assignment_id 
--   AND a.completion_date = b.completion_date;
--
-- Then re-add the constraint:
-- ALTER TABLE public.habit_completions 
-- ADD CONSTRAINT habit_completions_habit_assignment_id_completion_date_key 
-- UNIQUE(habit_assignment_id, completion_date);