-- Add "Full frame." to all agent image prompt endings
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'No text overlays. Clean illustration only.',
  'Full frame. No text overlays. Clean illustration only.'
)
WHERE instructions LIKE '%No text overlays. Clean illustration only.%';