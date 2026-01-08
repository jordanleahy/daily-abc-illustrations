-- Update Sight Words agent cover page format to explicitly require actual sight words
-- This ensures the cover displays words that match the content pages

UPDATE agents
SET instructions = REPLACE(
  instructions,
  'Image Prompt: {Art style} cover illustration. {Character} surrounded by floating sight words in colorful bubbles. Bright, engaging colors with educational book feel. CRITICAL INSTRUCTION: Display the book title "{BOOK_TITLE}" in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Full frame.',
  '⚠️ CRITICAL COVER REQUIREMENT: The cover image MUST display the ACTUAL sight words that will be taught in the book. Do NOT use generic words like "flower" or "bee" - use only words from the selected level list.

Image Prompt Format:
"{Art style} cover illustration. {Character} in a bright, engaging scene with colorful floating bubbles containing these sight words: [word1], [word2], [word3], [word4], [word5], [word6]. CRITICAL INSTRUCTION: Display the book title "{BOOK_TITLE}" in large, bold, CENTERED letters at the center of the cover image. Each bubble contains ONE actual sight word from the selected level. Full frame."

Example for Pre-Primer level:
"Bluey animation style cover illustration. Bluey standing excitedly in a sunny meadow with colorful floating bubbles containing these sight words: the, see, can, we, go, look. CRITICAL INSTRUCTION: Display the book title "Bluey''s Sight Word Adventures" in large, bold, CENTERED letters at the center. Each bubble contains ONE actual pre-primer sight word. Full frame."'
),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-sight-words' 
AND is_latest = true;

-- Verify the update
SELECT id, type, name, 
       CASE WHEN instructions LIKE '%CRITICAL COVER REQUIREMENT%' THEN 'Updated' ELSE 'Not Updated' END as status,
       LEFT(instructions, 500) as instructions_preview
FROM agents 
WHERE type = 'book-creation-sight-words' AND is_latest = true;