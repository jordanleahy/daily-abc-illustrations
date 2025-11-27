
-- Fix remaining 0-based references in Rhyming agent that were missed in previous migration

-- Fix the Page Numbering summary section (lines 184-186)
UPDATE agents
SET instructions = replace(
  replace(
    replace(
      instructions,
      E'**Page Numbering:**\n- Cover: Page 0\n- Educational Focus: Page 1\n- Content pages start at Page 2',
      E'**Page Numbering:**\n- Cover: Page 1\n- Educational Focus: Page 2\n- Content pages start at Page 3'
    ),
    'Content pages start at Page 2',
    'Content pages start at Page 3'
  ),
  'Cover: Page 0',
  'Cover: Page 1'
),
updated_at = now()
WHERE type = 'book-creation-rhyming'
  AND is_latest = true;

-- Fix the typo in the example format where Page 3 content shows "**Page Number:** 2"
-- This needs to find the "## Page 3" section and fix the page number that follows
UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '(## Page 3\s+\*\*Page Number:\*\*) 2',
  '\1 3',
  'g'
),
updated_at = now()
WHERE type = 'book-creation-rhyming'
  AND is_latest = true
  AND instructions ~ '## Page 3\s+\*\*Page Number:\*\* 2';
