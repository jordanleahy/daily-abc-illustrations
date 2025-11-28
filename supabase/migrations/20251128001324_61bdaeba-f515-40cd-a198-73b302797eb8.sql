-- Replace the "Detailed Page Generation Format" section in all specialized agents
-- This section defines the exact output format the agents should use

UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '## Detailed Page Generation Format.*?(?=## Character Theme to Shape Mapping|## Rhyme Validation Rules|## Image Prompt Requirements|## Colors-Specific Rules|## Numbers-Specific Rules|## ABC-Specific Rules|## Shapes-Specific Rules|## Opposites-Specific Rules|## Emotions-Specific Rules|## Animals-Specific Rules|## First Words-Specific Rules|## Bedtime-Specific Rules|## CVC-Specific Rules|## Sight Words-Specific Rules|$)',
  E'## Detailed Page Generation Format\n\nOutput the complete book structure using this exact markdown format:\n\n```markdown\n**Page 1: [Book Title with Character Theme]**\n[Cover image prompt - 200-350 characters. Art style opening, character details with colors/features, action + emotion, setting. No text overlays. Clean illustration only.]\n\n**Page 2: What You''ll Learn**\n[Educational Focus image prompt - Three vertically-stacked colorful badges on theme-appropriate background. Top badge (teal gradient): age range. Middle badge (coral/orange gradient): learning type. Bottom badge (gold/yellow gradient): skill focus. Include theme-specific badge shapes. No text overlays. Clean badge design only.]\n\n**Page 3: [First Content Title]**\n[Content text/verses for this page]\n[Image prompt - 200-350 characters. Art style opening, character with colors/clothing, action matching content, objects with specific colors, simple background. No text overlays. Clean illustration only.]\n\n**Page 4: [Second Content Title]**\n[Content text/verses]\n[Image prompt]\n\n[Continue for all remaining content pages...]\n```\n\n**CRITICAL FORMAT RULES:**\n- Each page MUST start with **Page N: Title** (e.g., **Page 1: Chase''s Busy Day**, **Page 3: Wake Up Time**)\n- Cover (Page 1): Title + image prompt only\n- Educational Focus (Page 2): Image prompt with three badges only\n- Content pages (Page 3+): Content text + image prompt\n- ALL image prompts end with "No text overlays. Clean illustration only."\n- Generate ALL pages in ONE response with empty suggestions array\n- NEVER use structured fields like "**Page Number:** N" or "**Page Type:** cover"\n\n---\n\n',
  'ns'
)
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers', 
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
)
AND is_latest = true;

-- Verify the update
SELECT 
  type,
  name,
  version,
  LENGTH(instructions) as instruction_length,
  CASE 
    WHEN instructions LIKE '%**Page N: Title**%' THEN '✓ Format Updated'
    ELSE '✗ Not Updated'
  END as format_status
FROM agents
WHERE type IN (
  'book-creation-abc',
  'book-creation-numbers', 
  'book-creation-rhyming',
  'book-creation-colors',
  'book-creation-shapes',
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
)
AND is_latest = true
ORDER BY type;