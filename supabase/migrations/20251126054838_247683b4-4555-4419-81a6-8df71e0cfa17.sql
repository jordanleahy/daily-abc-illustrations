-- Increase max_completion_tokens for ABC Book Creation Agent
-- ABC books need ~12000 tokens for 28-page JSON structure
UPDATE public.agents
SET max_completion_tokens = 12000,
    updated_at = now()
WHERE type = 'book-creation-abc'
  AND is_latest = true;