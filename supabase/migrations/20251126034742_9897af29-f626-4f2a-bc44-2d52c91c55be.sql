-- Remove "OUTPUT THIS EXACTLY:" markers that are being literally output by agents
-- Keep the enforcement rules but remove instruction markers

UPDATE agents
SET 
  instructions = REGEXP_REPLACE(
    instructions,
    'OUTPUT THIS EXACTLY:\s*[-]+\s*',
    '',
    'g'
  ),
  updated_at = now()
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers', 
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-animals',
  'book-creation-emotions',
  'book-creation-opposites',
  'book-creation-first-words',
  'book-creation-cvc',
  'book-creation-sight-words',
  'book-creation-bedtime'
)
AND is_latest = true;