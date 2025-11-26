-- Fix agent instructions: remove all references to "OUTPUT THIS EXACTLY"
-- This includes both the markers themselves and the rule mentioning them

UPDATE agents
SET 
  instructions = REGEXP_REPLACE(
    REGEXP_REPLACE(
      instructions,
      '5\. Use "OUTPUT THIS EXACTLY:" markers for each step\s*\n',
      '',
      'g'
    ),
    'OUTPUT THIS EXACTLY:\s*\n?',
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