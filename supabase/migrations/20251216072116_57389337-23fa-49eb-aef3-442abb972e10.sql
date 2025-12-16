-- Add worksheet to page_type enum
ALTER TYPE page_type ADD VALUE IF NOT EXISTS 'worksheet';

-- Update digraph agent to make Page 12 a worksheet
UPDATE agents
SET instructions = REPLACE(
  instructions,
  'Page 12: "[digraph] - [sentence using the digraph]"',
  'Page 12: "[digraph] Worksheet - Circle the [digraph]"

**WORKSHEET PAGE FORMAT (Page 12 ONLY):**
- Title: "[digraph] Worksheet - Circle the [digraph]"
- Description: "Visual discrimination exercise for the [digraph] digraph"
- Image Prompt: "Clean worksheet layout on white background. At top: large bold letters ''[digraph]'' as the target. Below: 4x3 grid of letter pairs in circles - include the correct digraph 4 times mixed with 8 similar-looking distractors (e.g., for ''th'': use ''th'', ''th'', ''th'', ''th'', ''tn'', ''rh'', ''fh'', ''tl'', ''lh'', ''tf'', ''tb'', ''tk''). Simple instruction text at bottom: ''Circle all the [digraph] sounds''. Black outlines only, no fills, printable format. No character illustrations."'
),
last_modified = NOW(),
updated_at = NOW()
WHERE type = 'book-creation-digraphs' AND is_latest = true;