-- Remove unused assistant_id column from agents table
-- This field was for a planned OpenAI Assistants API integration that was never implemented
-- The system uses Chat Completions API via Lovable AI Gateway instead

ALTER TABLE public.agents DROP COLUMN IF EXISTS assistant_id;