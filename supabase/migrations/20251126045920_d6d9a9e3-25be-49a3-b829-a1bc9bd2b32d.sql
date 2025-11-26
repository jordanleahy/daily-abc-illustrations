-- Fix generic Book Creation Agent to use Gemini Flash instead of GPT-5
-- GPT-5 consumes tokens on internal reasoning, Gemini Flash outputs content directly

UPDATE agents 
SET model = 'google/gemini-2.5-flash',
    max_completion_tokens = 8000,
    updated_at = now()
WHERE type = 'book-creation' 
  AND is_latest = true;