-- Add provider field to agents table to support multiple AI providers
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'openai';

-- Add check constraint to ensure valid provider values
ALTER TABLE public.agents
ADD CONSTRAINT valid_provider CHECK (provider IN ('openai', 'deepseek'));

-- Add comment explaining the provider field
COMMENT ON COLUMN public.agents.provider IS 'AI provider for the agent: openai or deepseek';