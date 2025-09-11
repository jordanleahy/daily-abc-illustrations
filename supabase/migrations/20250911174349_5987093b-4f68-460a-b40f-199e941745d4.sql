-- Remove the max completion tokens check constraint
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_max_completion_tokens_check;