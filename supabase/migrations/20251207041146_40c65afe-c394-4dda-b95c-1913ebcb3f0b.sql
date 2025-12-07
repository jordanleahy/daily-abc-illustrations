-- Fix books based on their names/categories
-- Sight Words books
UPDATE books SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{bookType}', '"sight-words"')
WHERE id IN (
  'dee04678-f0bd-4c3c-8783-b0ec086c040d',  -- Mickey's Magical Sight Word Adventures
  'cccacfbd-46e6-4957-bbe6-c17b261edf03'   -- My First Killington Adventure A Sight Word Tour
);

-- General children's/story books → categorize as 'other' is correct, but let's check if any should be different
-- Syllable book could be 'cvc' or 'first-words'
UPDATE books SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{bookType}', '"cvc"')
WHERE id = 'cd012cff-742a-4000-97ef-8d6779386147';  -- Clap with Dora! Syllable Adventure

-- The rest are general children's books that don't fit a specific educational category
-- These are appropriately "other":
-- - Bluey Bingo's Snow Day Pacing Play (pacing/activity book)
-- - Golden's Mountain Safety Adventure (safety education)
-- - Elsa and Anna's Arendelle Manners (manners book)
-- - Fiona and Mr. Black Bear's Forest Berry Hunt (story book)
-- - The Bear Family's Mountain Adventure Hunt An I Spy Book (I Spy)
-- - Burton Shop I Spy (I Spy)