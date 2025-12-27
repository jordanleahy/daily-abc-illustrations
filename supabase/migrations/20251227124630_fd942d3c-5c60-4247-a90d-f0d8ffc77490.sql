UPDATE public.agents
SET instructions = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        '### Step 2: Age Group Discovery',
        '### Step 2: Grade Level'
      ),
      'Ask: "What age is this book for?"',
      'Ask: "What grade level is this book for?"'
    ),
    E'[SUGGEST]\n0-2: 👶 0-2 years (Babies/Toddlers)\n2-4: 🧒 2-4 years (Toddlers/Preschool)\n4-6: 👦 4-6 years (Preschool/Kindergarten)\n[/SUGGEST]',
    E'[SUGGEST]\nPRE_K: Pre-K\nK: Kindergarten\nGRADE_1: 1st Grade\nGRADE_2: 2nd Grade\n[/SUGGEST]'
  ),
  'age-appropriate',
  'grade-appropriate'
),
updated_at = NOW()
WHERE id = '8d741c7e-53a7-4b77-b7f7-ebdc15fd115c';