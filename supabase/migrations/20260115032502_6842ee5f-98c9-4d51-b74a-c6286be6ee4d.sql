-- Fix grade IDs in Manners agent - correct the prefix format
UPDATE agents
SET instructions = REPLACE(
  REPLACE(
    instructions,
    'GRADE_GRADE_1: 📚 1st Grade',
    'GRADE_1: 📚 1st Grade'
  ),
  'GRADE_GRADE_2: ✏️ 2nd Grade',
  'GRADE_2: ✏️ 2nd Grade'
),
updated_at = now()
WHERE type = 'book-creation-manners' AND is_latest = true;