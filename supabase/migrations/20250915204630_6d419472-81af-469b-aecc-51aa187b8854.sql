-- Fix the check constraint for book_system_prompts.prompt_status to match the code
-- The code uses 'in-progress' (with dash) but constraint expected 'in_progress' (with underscore)

ALTER TABLE book_system_prompts 
DROP CONSTRAINT book_system_prompts_prompt_status_check;

ALTER TABLE book_system_prompts 
ADD CONSTRAINT book_system_prompts_prompt_status_check 
CHECK (prompt_status = ANY (ARRAY['complete'::text, 'in-progress'::text, 'error'::text]));