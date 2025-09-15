-- Add status column to page_system_prompts table
ALTER TABLE public.page_system_prompts 
ADD COLUMN status text NOT NULL DEFAULT 'complete';