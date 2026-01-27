-- Update ABC agent - remove audience-specific language
UPDATE public.agents 
SET instructions = REPLACE(
  REPLACE(instructions, 
    'for young children', ''),
  'appropriate for early learners', ''),
  updated_at = now()
WHERE type = 'book-creation-abc' AND is_latest = true;

-- Update CVC agent - remove "early readers" mention
UPDATE public.agents
SET instructions = REPLACE(instructions,
  'that help early readers distinguish',
  'that help distinguish'),
  updated_at = now()
WHERE type = 'book-creation-cvc' AND is_latest = true;

-- Update Rhyming agent - remove grade-specific language
UPDATE public.agents
SET instructions = REPLACE(instructions,
  'for children in Pre-K through 2nd Grade',
  ''),
  updated_at = now()
WHERE type = 'book-creation-rhyming' AND is_latest = true;