-- Phase 1: Add prompt_status column and migrate data for page_system_prompts
-- Add the new prompt_status column with default value
ALTER TABLE public.page_system_prompts 
ADD COLUMN prompt_status text NOT NULL DEFAULT 'complete';

-- Copy data from status to prompt_status
UPDATE public.page_system_prompts 
SET prompt_status = status 
WHERE status IS NOT NULL;

-- Add comment to document the new column
COMMENT ON COLUMN public.page_system_prompts.prompt_status IS 'Status of the page system prompt (complete, processing, error, etc.) - migrated from status column';