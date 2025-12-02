-- Update ABC agent cover page template to include title display instruction
-- Removes "No text overlays" from cover page only, replaces with CRITICAL INSTRUCTION for title

UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    'Full frame. No text overlays. Clean illustration only.',
    'CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Full frame. Clean illustration only.'
  ),
  last_modified = now(),
  updated_at = now()
WHERE type = 'book-creation-abc' 
  AND is_latest = true;