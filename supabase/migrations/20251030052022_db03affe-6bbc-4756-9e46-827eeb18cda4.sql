-- Update Illustration Director Agent to use Gemini Pro for better consistency
UPDATE public.agents
SET 
  model = 'google/gemini-2.5-pro',
  provider = 'google',
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'illustration-director'
  AND is_latest = true;