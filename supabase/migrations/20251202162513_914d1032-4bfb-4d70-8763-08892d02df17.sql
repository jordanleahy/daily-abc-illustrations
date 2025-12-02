-- Update Rhyming agent to use correct age ranges matching AGE_RANGE_IDS
UPDATE agents
SET instructions = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        'Ages 1-2 (Simple words)',
        '0-2: Ages 0-2 (Simple words)'
      ),
      'Ages 2-3 (Short phrases)',
      '2-4: Ages 2-4 (Short phrases)'
    ),
    'Ages 3-4 (Full sentences)',
    '4-6: Ages 4-6 (Full sentences)'
  ),
  'Ages 4-5 (Complex rhymes)',
  '6-8: Ages 6-8 (Complex rhymes)'
),
updated_at = now()
WHERE type = 'book-creation-rhyming' AND is_latest = true;