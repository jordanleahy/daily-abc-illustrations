-- Phase 1: Add prompt_status column to book_system_prompts table
-- This creates the new column and migrates existing data for safe rollback capability

-- Add the new prompt_status column with same constraints as status
ALTER TABLE public.book_system_prompts 
ADD COLUMN prompt_status text NOT NULL DEFAULT 'complete';

-- Copy all existing status values to prompt_status
UPDATE public.book_system_prompts 
SET prompt_status = status;

-- Add a check constraint to ensure only valid values (same as original status)
ALTER TABLE public.book_system_prompts 
ADD CONSTRAINT book_system_prompts_prompt_status_check 
CHECK (prompt_status IN ('complete', 'in_progress', 'error'));

-- Add comment to document the new column
COMMENT ON COLUMN public.book_system_prompts.prompt_status IS 'System prompt generation/processing status (complete, in_progress, error)';