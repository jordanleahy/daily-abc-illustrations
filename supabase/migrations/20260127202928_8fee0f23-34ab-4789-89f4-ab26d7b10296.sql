-- Update Orchestration Agent to use Gemini 2.5 Flash
UPDATE agents 
SET 
  model = 'google/gemini-2.5-flash', 
  provider = 'google', 
  updated_at = now(), 
  last_modified = now()
WHERE id = '8d650e85-5ec5-412c-b453-95fdff6b5a49';