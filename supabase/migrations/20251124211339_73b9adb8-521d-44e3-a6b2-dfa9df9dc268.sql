-- Migration: Update existing agents to use Lovable AI Gateway model format
-- This migration updates model names to the Lovable AI Gateway format (provider/model)

-- Update OpenAI models to openai/ prefix
UPDATE agents 
SET 
  model = CASE
    -- GPT-5 models
    WHEN model LIKE 'gpt-5%' AND model LIKE '%2025-08-07%' THEN 'openai/gpt-5'
    WHEN model = 'gpt-5-mini-2025-08-07' THEN 'openai/gpt-5-mini'
    WHEN model = 'gpt-5-nano-2025-08-07' THEN 'openai/gpt-5-nano'
    -- GPT-4.1 models
    WHEN model LIKE 'gpt-4.1%' AND model LIKE '%2025-04-14%' THEN 'openai/gpt-4.1'
    WHEN model = 'gpt-4.1-mini-2025-04-14' THEN 'openai/gpt-4.1-mini'
    -- O-series reasoning models
    WHEN model LIKE 'o3%' AND model LIKE '%2025-04-16%' THEN 'openai/o3'
    WHEN model = 'o4-mini-2025-04-16' THEN 'openai/o4-mini'
    -- Legacy GPT-4 models
    WHEN model = 'gpt-4o' THEN 'openai/gpt-4o'
    WHEN model = 'gpt-4o-mini' THEN 'openai/gpt-4o-mini'
    WHEN model = 'gpt-4-turbo' THEN 'openai/gpt-4-turbo'
    WHEN model = 'gpt-3.5-turbo' THEN 'openai/gpt-3.5-turbo'
    ELSE model
  END,
  provider = 'openai',
  updated_at = NOW()
WHERE provider = 'openai' 
  AND model NOT LIKE 'openai/%';

-- Update Google models to google/ prefix
UPDATE agents 
SET 
  model = CASE
    WHEN model = 'gemini-2.5-pro' THEN 'google/gemini-2.5-pro'
    WHEN model = 'gemini-2.5-flash' THEN 'google/gemini-2.5-flash'
    WHEN model = 'gemini-2.5-flash-lite' THEN 'google/gemini-2.5-flash-lite'
    WHEN model = 'gemini-1.5-pro' THEN 'google/gemini-1.5-pro'
    WHEN model = 'gemini-1.5-flash' THEN 'google/gemini-1.5-flash'
    ELSE model
  END,
  provider = 'google',
  updated_at = NOW()
WHERE provider = 'google' 
  AND model NOT LIKE 'google/%';

-- Update DeepSeek models to deepseek/ prefix
UPDATE agents 
SET 
  model = CASE
    WHEN model = 'deepseek-chat' THEN 'deepseek/deepseek-chat'
    WHEN model = 'deepseek-coder' THEN 'deepseek/deepseek-coder'
    ELSE model
  END,
  provider = 'deepseek',
  updated_at = NOW()
WHERE provider = 'deepseek' 
  AND model NOT LIKE 'deepseek/%';

-- Set default model for any agents without a proper model format
UPDATE agents 
SET 
  model = 'google/gemini-2.5-flash',
  provider = 'google',
  updated_at = NOW()
WHERE model IS NULL 
  OR model = '' 
  OR (model NOT LIKE 'google/%' AND model NOT LIKE 'openai/%' AND model NOT LIKE 'deepseek/%');