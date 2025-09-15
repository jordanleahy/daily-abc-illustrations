-- Phase 1: Add prompt_status column and migrate data for page_system_prompts (avoiding trigger conflicts)

-- First, add the new prompt_status column with default value
ALTER TABLE public.page_system_prompts 
ADD COLUMN prompt_status text NOT NULL DEFAULT 'complete';

-- Temporarily disable triggers to avoid conflicts during data migration
ALTER TABLE public.page_system_prompts DISABLE TRIGGER ALL;

-- Copy data from status to prompt_status
UPDATE public.page_system_prompts 
SET prompt_status = status 
WHERE status IS NOT NULL;

-- Re-enable triggers
ALTER TABLE public.page_system_prompts ENABLE TRIGGER ALL;

-- Add comment to document the new column
COMMENT ON COLUMN public.page_system_prompts.prompt_status IS 'Status of the page system prompt (complete, processing, error, etc.) - migrated from status column';