-- Fix Rhyming agent: CRITICAL INSTRUCTION should ONLY apply to Page 1 (Cover)
-- Other pages (Educational Focus and Content) should use "No text overlays"

UPDATE agents
SET 
  instructions = REPLACE(
    instructions,
    'CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Full frame. Clean illustration only.',
    'Full frame. No text overlays. Clean illustration only.'
  ),
  last_modified = now(),
  updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;

-- Now update to add specific cover page instruction
-- The agent instructions need to explicitly say cover pages get title, others don't
UPDATE agents
SET 
  instructions = instructions || E'\n\n**CRITICAL COVER PAGE RULE:**\nFor Page 1 (Cover) ONLY: End the image prompt with "CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Full frame. Clean illustration only."\n\nFor ALL OTHER pages (Educational Focus and Content pages 3-12): End with "Full frame. No text overlays. Clean illustration only."',
  last_modified = now(),
  updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;