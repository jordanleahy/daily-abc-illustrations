-- Phase 3: Remove old status column and finalize migration
-- Drop the old status column from book_system_prompts table
ALTER TABLE public.book_system_prompts DROP COLUMN status;

-- Update comment on prompt_status column to indicate it's the primary status field
COMMENT ON COLUMN public.book_system_prompts.prompt_status IS 'Primary status of the system prompt (complete, processing, error, etc.)';