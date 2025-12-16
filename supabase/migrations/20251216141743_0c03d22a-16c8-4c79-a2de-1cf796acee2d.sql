-- Update digraph agent cover page instructions for teacher-friendly format
UPDATE agents
SET instructions = REPLACE(
  instructions,
  '**Page 1: Cover Page**
- Title: "[Character Theme]''s [Digraph] Adventures" or similar engaging title
- Image Prompt: "[Character style], [visual tone]. [Character] in [setting related to digraph theme]. CRITICAL INSTRUCTION: Display the book title in large, bold, CENTERED letters at the center of the cover image, taking up 50-60% of the visual space. Include these 5 example words around the letters: [word1], [word2], [word3], [word4], [word5]. Clean illustration only."',
  '**Page 1: Cover Page**
- Title: "Learning the [DIGRAPH] Sound" (always use this exact format with the digraph in uppercase)
- Subtitle: Based on age selection, add grade level:
  - Ages 3-4 → "Pre-K"
  - Ages 4-5 → "Pre-K to K"  
  - Ages 5-6 → "K-1"
  - Ages 6-7 → "1st-2nd Grade"
- Image Prompt: "[Character style], [visual tone]. [Character] in [setting related to digraph theme]. CRITICAL INSTRUCTION: Display ''Learning the [DIGRAPH] Sound'' as the main title in large, bold, CENTERED text at the top-center of the cover image, taking up 40% of the visual space. Below the title, display the grade level subtitle (e.g., ''Pre-K to K'') in smaller text. Scatter these 5 example words from your content pages around the cover in playful positions: [word1], [word2], [word3], [word4], [word5]. Clean illustration only."'
),
last_modified = NOW(),
updated_at = NOW()
WHERE type = 'book-creation-digraphs' AND is_latest = true;

-- Also update the existing memory pattern for cover prompts
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'CRITICAL INSTRUCTION: Display the letters ''[DIGRAPH]'' in large, bold, CENTERED text at the center of the cover image',
  'CRITICAL INSTRUCTION: Display ''Learning the [DIGRAPH] Sound'' as the main title in large, bold, CENTERED text at the top-center of the cover image'
),
last_modified = NOW(),
updated_at = NOW()
WHERE type = 'book-creation-digraphs' AND is_latest = true;