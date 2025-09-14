-- Add the status column to book_system_prompts table
ALTER TABLE book_system_prompts 
ADD COLUMN status text NOT NULL DEFAULT 'complete';

-- Add a check constraint to ensure valid status values
ALTER TABLE book_system_prompts 
ADD CONSTRAINT valid_book_prompt_status 
CHECK (status IN ('not-started', 'in-progress', 'complete', 'error', 'warning', 'skipped'));