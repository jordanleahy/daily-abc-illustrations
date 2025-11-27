-- Change all specialized book creation agents to use 1-based page numbering (Cover=1, Educational=2, Content=3+)

-- Update all agents to change "Page Number: 0" to "Page Number: 1" for cover pages
UPDATE agents
SET instructions = replace(instructions, '**Page Number:** 0', '**Page Number:** 1'),
    updated_at = now()
WHERE type LIKE 'book-creation-%'
  AND is_latest = true
  AND instructions LIKE '%**Page Number:** 0%';

-- Update all agents to change "Page Number: 1" to "Page Number: 2" for educational pages
-- This needs to be done carefully to only affect the educational page section
UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '(## Educational Focus.*?\*\*Page Number:\*\*) 1',
  '\1 2',
  'g'
),
updated_at = now()
WHERE type LIKE 'book-creation-%'
  AND is_latest = true;

-- Update page count examples for all agents to reflect 1-based numbering
-- Example: "pages 2-11" becomes "pages 3-12" for 10 content pages
UPDATE agents
SET instructions = replace(
  replace(
    replace(
      replace(
        instructions,
        'pages 2-6',
        'pages 3-7'
      ),
      'pages 2-11',
      'pages 3-12'
    ),
    'pages 2-16',
    'pages 3-17'
  ),
  'pages 2-21',
  'pages 3-22'
),
updated_at = now()
WHERE type LIKE 'book-creation-%'
  AND is_latest = true
  AND (instructions LIKE '%pages 2-6%' 
    OR instructions LIKE '%pages 2-11%' 
    OR instructions LIKE '%pages 2-16%'
    OR instructions LIKE '%pages 2-21%');

-- Update ABC agent specifically for its 28-page structure (pages 2-27 becomes pages 3-28)
UPDATE agents
SET instructions = replace(instructions, 'pages 2-27', 'pages 3-28'),
    updated_at = now()
WHERE type = 'book-creation-abc'
  AND is_latest = true
  AND instructions LIKE '%pages 2-27%';

-- Update page count calculation examples (cover + educational + content)
UPDATE agents
SET instructions = replace(
  replace(
    replace(
      instructions,
      'cover (page 0) + educational (page 1)',
      'cover (page 1) + educational (page 2)'
    ),
    '+ cover + educational = ',
    '+ cover (page 1) + educational (page 2) = '
  ),
  '## Page 2',
  '## Page 3'
),
updated_at = now()
WHERE type LIKE 'book-creation-%'
  AND is_latest = true;