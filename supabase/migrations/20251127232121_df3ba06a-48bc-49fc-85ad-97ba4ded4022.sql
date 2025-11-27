-- Clean up Rhyming agent: Remove conflicting page count references and fix Step 5 header

-- Fix Step 2: Remove old page count references from age selection labels
UPDATE agents
SET instructions = replace(
  instructions,
  '```json
0-2: Ages 0-2 years (Simple rhymes, 8 pages)
2-4: Ages 2-4 years (Developing rhymes, 10 pages)
4-6: Ages 4-6 years (Complex rhymes, 12 pages)
```',
  '```json
0-2: Ages 0-2 years (Simple, playful rhymes)
2-4: Ages 2-4 years (Developing rhyme skills)
4-6: Ages 4-6 years (Complex patterns)
```'
),
updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;

-- Fix Step 5: Add missing markdown prefix
UPDATE agents
SET instructions = replace(
  instructions,
  'Step 5: Title & Description Approval',
  '### Step 5: Title & Description Approval'
),
updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;