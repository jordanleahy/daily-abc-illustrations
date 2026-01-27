-- Update all book-creation agents to Gemini 3 Flash
UPDATE public.agents 
SET model = 'google/gemini-3-flash-preview',
    updated_at = now(),
    last_modified = now()
WHERE type LIKE 'book-creation%'
  AND is_latest = true;