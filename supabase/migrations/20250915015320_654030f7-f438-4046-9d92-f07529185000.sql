-- Add individual metadata columns to page_system_prompts table
ALTER TABLE public.page_system_prompts 
ADD COLUMN prompt_type text,
ADD COLUMN model text,
ADD COLUMN agent_name text,
ADD COLUMN agent_version text,
ADD COLUMN request_id text,
ADD COLUMN tokens_used integer,
ADD COLUMN generation_duration_ms integer,
ADD COLUMN generated_at timestamp with time zone,
ADD COLUMN page_letter text,
ADD COLUMN page_title text,
ADD COLUMN safe_space_rules_applied boolean,
ADD COLUMN original_prompt_length integer,
ADD COLUMN enhanced_prompt_length integer;