
-- Update Rhyming agent Step 4.5 to use standardized page count button IDs
UPDATE agents
SET instructions = regexp_replace(
  instructions,
  '### Step 4\.5: Page Count Confirmation.*?(?=### Step 5:)',
  E'### Step 4.5: Page Count Confirmation\nAfter topic selection, present standardized page count options:\n\n"How many pages would you like in the book?"\n\n```json\npages-5: 5 pages (quick story)\npages-10: 10 pages (standard length)\npages-15: 15 pages (extended story)\npages-20: 20 pages (full experience)\n```\n\nNote: Total pages = content pages + 2 (cover + educational focus)\n\n',
  'gs'
),
  updated_at = now()
WHERE type = 'book-creation-rhyming' 
  AND is_latest = true;
