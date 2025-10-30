-- Update Graphics Designer Agent to use Gemini Flash for better quality
UPDATE public.agents
SET 
  model = 'google/gemini-2.5-flash',
  provider = 'google',
  last_modified = NOW(),
  updated_at = NOW()
WHERE id = '07109824-6a29-406b-9bb5-8a3e4ec545b0'
  AND type = 'graphic-designer'
  AND is_latest = true;