-- Phase 3: Standardize 11 Book Creation Agents to 12-Page Structure
-- This SQL script updates all specialized agents (excluding ABC which is already standardized)
-- to enforce: 1 cover + 1 educational + 10 content pages = 12 total pages

-- Key changes:
-- 1. Remove Step 4.5 (Page Count Confirmation)
-- 2. Fixed 12-page structure (no user choice)
-- 3. Step 6 generates complete outline immediately with **Page N: Title** format
-- 4. Renumber steps after removal
-- 5. Update book structure section to enforce 12 pages

BEGIN;

-- 1. NUMBERS AGENT
UPDATE agents SET 
  instructions = regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          instructions,
          '###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9])',
          '',
          'gi'
        ),
        '###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?(?=###)',
        E'### Fixed Book Structure\n\n**CRITICAL: Always generate exactly 12 pages total:**\n- **Page 1**: Cover Page\n- **Page 2**: Educational Focus (with three badges)\n- **Pages 3-12**: 10 Content Pages (Numbers 1-10)\n\n**Page numbering is 1-based. Use format `**Page N: Title**` in outline.**\n\nUsers are never asked about page count. Always generate exactly 10 number pages (1-10).\n\n',
        'gi'
      ),
      '###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?(?=###)',
      E'### Step 6: Generate Complete Outline\n\nAfter user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:\n\n**Page 1: [Book Title]**\n[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges: Age Range (teal), "Counting & Numbers" (coral), "Numbers 1-10" (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 3: One [Object]**\n[Content page showing 1 object - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n[Continue through Page 12 with "Ten [Objects]"...]\n\n**CRITICAL VALIDATION:**\n- Must have exactly 12 pages\n- Page numbers 1-12 (1-based indexing)\n- Page 1 must be cover\n- Page 2 must be Educational Focus with badges\n- Pages 3-12 must show numbers 1-10 with consistent counting objects\n- Every prompt must end with "No text overlays. Clean illustration only."\n- Return empty suggestions array (outline complete, no user input needed)\n\n',
      'gi'
    ),
    'Pages?\s+3-\d+',
    'Pages 3-12',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-numbers' AND is_latest = true;

-- 2. RHYMING AGENT  
UPDATE agents SET
  instructions = regexp_replace(
    regexp_replace(
      regexp_replace(
        instructions,
        '###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9])',
        '',
        'gi'
      ),
      '###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?(?=###)',
      E'### Fixed Book Structure\n\n**CRITICAL: Always generate exactly 12 pages total:**\n- **Page 1**: Cover Page\n- **Page 2**: Educational Focus (with three badges)\n- **Pages 3-12**: 10 Rhyming Content Pages\n\n**Page numbering is 1-based. Use format `**Page N: Title**` in outline.**\n\nUsers are never asked about page count. Always generate exactly 10 rhyming pages with AABB couplet structure.\n\n',
      'gi'
    ),
    '###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?(?=###)',
    E'### Step 6: Generate Complete Outline\n\nAfter user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:\n\n**Page 1: [Book Title]**\n[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges: Age Range (teal), "Rhyming & Rhythm" (coral), "AABB Couplets" (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 3: [Rhyming Title]**\n[Content page with rhyming text - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n[Continue through Page 12...]\n\n**CRITICAL VALIDATION:**\n- Must have exactly 12 pages\n- Page numbers 1-12 (1-based indexing)\n- Page 1 must be cover\n- Page 2 must be Educational Focus with badges\n- Pages 3-12 must be rhyming content with AABB structure\n- Every prompt must end with "No text overlays. Clean illustration only."\n- Return empty suggestions array (outline complete, no user input needed)\n\n',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-rhyming' AND is_latest = true;

-- 3. COLORS AGENT
UPDATE agents SET
  instructions = regexp_replace(
    regexp_replace(
      regexp_replace(
        instructions,
        '###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9])',
        '',
        'gi'
      ),
      '###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?(?=###)',
      E'### Fixed Book Structure\n\n**CRITICAL: Always generate exactly 12 pages total:**\n- **Page 1**: Cover Page\n- **Page 2**: Educational Focus (with three badges)\n- **Pages 3-12**: 10 Color Content Pages\n\n**Page numbering is 1-based. Use format `**Page N: Title**` in outline.**\n\nUsers are never asked about page count. Always present 10 different colors across the content pages.\n\n',
      'gi'
    ),
    '###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?(?=###)',
    E'### Step 6: Generate Complete Outline\n\nAfter user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:\n\n**Page 1: [Book Title]**\n[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges: Age Range (teal), "Color Recognition" (coral), "10 Colors" (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 3: [Color Name]**\n[One color with 3-5 objects in that color - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n[Continue through Page 12 with different colors...]\n\n**CRITICAL VALIDATION:**\n- Must have exactly 12 pages\n- Page numbers 1-12 (1-based indexing)\n- Page 1 must be cover\n- Page 2 must be Educational Focus with badges\n- Pages 3-12 must show 10 different colors\n- Every prompt must end with "No text overlays. Clean illustration only."\n- Return empty suggestions array (outline complete, no user input needed)\n\n',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-colors' AND is_latest = true;

-- 4. SHAPES AGENT
UPDATE agents SET
  instructions = regexp_replace(
    regexp_replace(
      regexp_replace(
        instructions,
        '###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9])',
        '',
        'gi'
      ),
      '###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?(?=###)',
      E'### Fixed Book Structure\n\n**CRITICAL: Always generate exactly 12 pages total:**\n- **Page 1**: Cover Page\n- **Page 2**: Educational Focus (with three badges)\n- **Pages 3-12**: 10 Shape Content Pages\n\n**Page numbering is 1-based. Use format `**Page N: Title**` in outline.**\n\nUsers are never asked about page count. Always present 10 different shapes across the content pages.\n\n',
      'gi'
    ),
    '###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?(?=###)',
    E'### Step 6: Generate Complete Outline\n\nAfter user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:\n\n**Page 1: [Book Title]**\n[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges: Age Range (teal), "Shape Recognition" (coral), "10 Shapes" (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 3: [Shape Name]**\n[Shape with examples - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n[Continue through Page 12 with different shapes...]\n\n**CRITICAL VALIDATION:**\n- Must have exactly 12 pages\n- Page numbers 1-12 (1-based indexing)\n- Page 1 must be cover\n- Page 2 must be Educational Focus with badges\n- Pages 3-12 must show 10 different shapes\n- Every prompt must end with "No text overlays. Clean illustration only."\n- Return empty suggestions array (outline complete, no user input needed)\n\n',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type = 'book-creation-shapes' AND is_latest = true;

-- 5-11: Apply similar updates to remaining agents
-- (Opposites, Emotions, Animals, First Words, Bedtime, CVC, Sight Words)

UPDATE agents SET
  instructions = regexp_replace(
    regexp_replace(
      instructions,
      '###?\s*Step\s+4\.5[:\s]+Page\s+Count\s+Confirmation[\s\S]*?(?=###?\s*Step\s+[5-9])',
      '',
      'gi'
    ),
    '###?\s*(?:Fixed\s+)?Book\s+Structure[\s\S]*?(?=###)',
    E'### Fixed Book Structure\n\n**CRITICAL: Always generate exactly 12 pages total:**\n- **Page 1**: Cover Page\n- **Page 2**: Educational Focus (with three badges)\n- **Pages 3-12**: 10 Content Pages\n\n**Page numbering is 1-based. Use format `**Page N: Title**` in outline.**\n\nUsers are never asked about page count. Always generate exactly 10 content pages.\n\n',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type IN (
  'book-creation-opposites',
  'book-creation-emotions', 
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
) AND is_latest = true;

-- Update Step 6 for remaining agents
UPDATE agents SET
  instructions = regexp_replace(
    instructions,
    '###?\s*Step\s+6[:\s]+(?:Generate\s+)?(?:Complete\s+)?Outline[\s\S]*?(?=###)',
    E'### Step 6: Generate Complete Outline\n\nAfter user approves the title and description, **immediately generate the complete 12-page outline in this SAME response** using this markdown format:\n\n**Page 1: [Book Title]**\n[Cover page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 2: Educational Focus**\n[Three vertically-stacked colorful badges: Age Range (teal), Learning Type (coral), Focus (gold). 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n**Page 3: [Content Title]**\n[Content page image prompt - 200-350 characters ending with "No text overlays. Clean illustration only."]\n\n[Continue through Page 12...]\n\n**CRITICAL VALIDATION:**\n- Must have exactly 12 pages\n- Page numbers 1-12 (1-based indexing)\n- Page 1 must be cover\n- Page 2 must be Educational Focus with badges\n- Pages 3-12 must be content pages\n- Every prompt must end with "No text overlays. Clean illustration only."\n- Return empty suggestions array (outline complete, no user input needed)\n\n',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type IN (
  'book-creation-opposites',
  'book-creation-emotions',
  'book-creation-animals',
  'book-creation-first-words',
  'book-creation-bedtime',
  'book-creation-cvc',
  'book-creation-sight-words'
) AND is_latest = true;

-- Fix "Pages 3-X" references to "Pages 3-12"
UPDATE agents SET
  instructions = regexp_replace(
    instructions,
    'Pages?\s+3-\d+',
    'Pages 3-12',
    'gi'
  ),
  last_modified = NOW(),
  updated_at = NOW()
WHERE type IN (
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
) AND is_latest = true;

COMMIT;

-- Verify updates
SELECT type, name, LENGTH(instructions) as instruction_length
FROM agents
WHERE type IN (
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