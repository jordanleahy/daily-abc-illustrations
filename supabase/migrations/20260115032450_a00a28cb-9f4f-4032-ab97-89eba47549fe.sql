-- Update Manners agent to use prefixed grade IDs for consistency
UPDATE agents
SET instructions = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        'PRE_K: 👶 Pre-K',
        'GRADE_PRE_K: 👶 Pre-K'
      ),
      'K: 🎒 Kindergarten',
      'GRADE_K: 🎒 Kindergarten'
    ),
    'GRADE_1: 📚 1st Grade',
    'GRADE_GRADE_1: 📚 1st Grade'
  ),
  'GRADE_2: ✏️ 2nd Grade',
  'GRADE_GRADE_2: ✏️ 2nd Grade'
),
updated_at = now()
WHERE type = 'book-creation-manners' AND is_latest = true;