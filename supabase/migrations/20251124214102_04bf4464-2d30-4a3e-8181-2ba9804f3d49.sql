
-- Set all specialized book creation agents to is_latest = true
-- (These should all be the only version of each type, so they should be latest)
UPDATE agents 
SET is_latest = true, updated_at = now()
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers',
  'book-creation-shapes',
  'book-creation-colors',
  'book-creation-rhyming',
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
)
AND version_number = 1;
