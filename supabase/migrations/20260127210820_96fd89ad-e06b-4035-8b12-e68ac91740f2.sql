-- Update Orchestration Chat Agent to Gemini 3 Pro
UPDATE public.agents 
SET model = 'google/gemini-3-pro-preview',
    updated_at = now(),
    last_modified = now()
WHERE id = 'e4b0329c-beec-4e00-aa10-a749c4ceebb7'
  AND type = 'chat'
  AND is_latest = true;