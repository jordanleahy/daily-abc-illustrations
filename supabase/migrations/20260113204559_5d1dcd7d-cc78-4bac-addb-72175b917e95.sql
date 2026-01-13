-- Delete manners book creation agent (all versions)
DELETE FROM agents WHERE type = 'book-creation-manners';

-- Delete manners book type
DELETE FROM book_types WHERE id = 'manners';

-- Update the agents_type_check constraint to remove 'book-creation-manners' but keep all other types
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_type_check;
ALTER TABLE agents ADD CONSTRAINT agents_type_check CHECK (type IN (
  'chat',
  'book-creation',
  'book-creation-abc',
  'book-creation-animals',
  'book-creation-bedtime',
  'book-creation-colors',
  'book-creation-cvc',
  'book-creation-digraphs',
  'book-creation-dr-seuss',
  'book-creation-emotions',
  'book-creation-first-words',
  'book-creation-general',
  'book-creation-numbers',
  'book-creation-opposites',
  'book-creation-parent-education',
  'book-creation-rhyming',
  'book-creation-shapes',
  'book-creation-sight-words',
  'book-creation-song'
));