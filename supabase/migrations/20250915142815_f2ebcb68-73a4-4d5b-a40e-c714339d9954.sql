-- Phase 1: Add prompt_status column for page_system_prompts (simple approach)

-- Add the new prompt_status column, using COALESCE to set value based on existing status
ALTER TABLE public.page_system_prompts 
ADD COLUMN prompt_status text NOT NULL DEFAULT 'complete';

-- Update the new column to match existing status values using a more direct approach
UPDATE public.page_system_prompts 
SET prompt_status = COALESCE(status, 'complete');