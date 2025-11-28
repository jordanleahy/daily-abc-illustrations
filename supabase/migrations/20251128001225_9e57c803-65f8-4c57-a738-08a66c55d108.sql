-- Update ALL specialized book creation agents to use consistent **Page N: Title** format
-- This ensures QA panel auto-open works reliably across all book types

UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '### Step 6: Generate Complete Outline.*?(?=### Step 7:|$)',
  E'### Step 6: Generate Complete Outline\n\nAfter user approves title/description, immediately generate the COMPLETE book outline in this EXACT format:\n\n**Page 1: [Book Title]**\n[Cover image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: What You''ll Learn**\n[Educational Focus image prompt with three vertically-stacked badges. Include theme-specific badge shapes. End with "No text overlays. Clean badge design only."]\n\n**Page 3: [First Content Title]**\n[Content text for this page]\n[Image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 4: [Second Content Title]**\n[Content text]\n[Image prompt]\n\n[Continue for all remaining content pages...]\n\n**Critical Format Rules:**\n- Each page MUST start with **Page N: Title** on its own line (e.g., **Page 1: Book Title**, **Page 3: First Story**)\n- Cover page (Page 1) includes image prompt only\n- Educational Focus (Page 2) includes badge prompt only\n- Content pages (Page 3+) include content text followed by image prompt\n- ALL image prompts MUST end with "No text overlays. Clean illustration only."\n- Generate ALL pages in ONE response with empty suggestions array\n- Total pages = user-selected content pages + 2 (cover + educational)\n- NEVER use structured field format like "**Page Number:** N" - always use "**Page N: Title**"\n\n',
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
    WHEN instructions LIKE '%**Page N: Title**%' THEN '✓ Updated'
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