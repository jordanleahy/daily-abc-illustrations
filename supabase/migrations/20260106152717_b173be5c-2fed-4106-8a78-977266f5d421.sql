-- Add bluey-style option to ABC agent character selection
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'bluey: Bluey
cocomelon: Cocomelon',
  'bluey: Bluey
bluey-style: Bluey Style (No Characters)
cocomelon: Cocomelon'
),
updated_at = now()
WHERE is_latest = true
AND type = 'book-creation-abc';