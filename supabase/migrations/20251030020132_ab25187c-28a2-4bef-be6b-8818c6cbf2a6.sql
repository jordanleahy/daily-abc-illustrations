-- Add 'google' as a valid provider for agents
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS valid_provider;
ALTER TABLE public.agents ADD CONSTRAINT valid_provider 
  CHECK (provider IN ('openai', 'deepseek', 'google'));