-- Add Step 4e (City Question) to all book-creation agents that have the skip-clothing-brand pattern
-- This covers: animals, bedtime, colors, cvc, digraphs, first-words, numbers, rhyming, shapes, sight-words

UPDATE agents 
SET instructions = REPLACE(
  instructions,
  'skip-clothing-brand: ⏭️ Skip
[/SUGGEST]

###',
  'skip-clothing-brand: ⏭️ Skip
[/SUGGEST]

**4e. City Question** (skip if already selected):
"Would you like to set this book in a specific city? This is optional."

[SUGGEST]
JERSEY_CITY: 🌆 Jersey City
HOBOKEN: 🏘️ Hoboken
NEW_YORK_CITY: 🗽 New York City
skip-city: ⏭️ Skip (no specific city)
[/SUGGEST]

###'
),
updated_at = now(),
last_modified = now()
WHERE type LIKE 'book-creation%' 
  AND is_latest = true 
  AND type != 'book-creation-opposites'
  AND instructions ILIKE '%skip-clothing-brand%';