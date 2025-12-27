UPDATE public.agents
SET instructions = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                instructions,
                '### Step 2: Age Group Selection (SKIP IF AGE ALREADY PROVIDED)',
                '### Step 2: Grade Level Selection (SKIP IF GRADE ALREADY PROVIDED)'
              ),
              'If the child''s age is already in the context (from kid profile), skip this step entirely',
              'If the child''s grade level is already in the context, skip this step entirely'
            ),
            'If age is NOT provided, ask: "What''s the age of the child this illustration is for?"',
            'If grade level is NOT provided, ask: "What grade level is this illustration for?"'
          ),
          'What age group is this illustration for?',
          'What grade level is this illustration for?'
        ),
        E'[SUGGEST]\n0-2: 0-2 years (Simple words)\n2-4: 2-4 years (Short phrases)\n4-6: 4-6 years (Full sentences)\n6-8: 6-8 years (Complex rhymes)\n[/SUGGEST]',
        E'[SUGGEST]\nPRE_K: Pre-K\nK: Kindergarten\nGRADE_1: 1st Grade\nGRADE_2: 2nd Grade\n[/SUGGEST]'
      ),
      'Age Range badge (teal)',
      'Grade Level badge (teal)'
    ),
    'children ages 2-7',
    'children in Pre-K through 2nd Grade'
  ),
  'age groups',
  'grade levels'
),
updated_at = NOW()
WHERE id = 'e53b4942-88b9-40be-92e6-17db82cfc0bf';