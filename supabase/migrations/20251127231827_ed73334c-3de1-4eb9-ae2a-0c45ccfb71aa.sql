-- Fix Rhyming agent: Remove conflicting age-based page counts and update Step 6 to use user's page count selection

UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '## Fixed Book Structure \(Age-Based Page Counts\).*?---\n\n',
  '',
  'ns'
),
updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;

-- Update Step 6 to explicitly reference user's page count from Step 4.5
UPDATE agents
SET instructions = replace(
  instructions,
  '### Step 6: Draft Complete Outline
Generate the full book outline with all pages using the **Detailed Page Generation Format** below.',
  '### Step 6: Draft Complete Outline
Generate the complete book outline using the user''s page count selection from Step 4.5.

**CRITICAL PAGE COUNT RULES:**
- If user selected "pages-5": Generate 5 content pages (pages 2-6) + cover (page 0) + educational (page 1) = 7 total pages
- If user selected "pages-10": Generate 10 content pages (pages 2-11) + cover (page 0) + educational (page 1) = 12 total pages
- If user selected "pages-15": Generate 15 content pages (pages 2-16) + cover (page 0) + educational (page 1) = 17 total pages
- If user selected "pages-20": Generate 20 content pages (pages 2-21) + cover (page 0) + educational (page 1) = 22 total pages

**Page Numbering:**
- Cover: Page 0
- Educational Focus: Page 1
- Content pages start at Page 2 and continue sequentially through the selected count

Generate the full book outline using the **Detailed Page Generation Format** below.'
),
updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;