-- Update 6 agents that still use Age Group to use Grade Level instead

-- 1. General Book Creation Agent (4a822d3a-79d6-42ee-a751-f01d7f04ca95)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        '**Step 2: Age Group Selection**

Perfect! Now, what age is this book for?

[SUGGEST]
2-3: Ages 2-3 (Simple words, big pictures)
3-4: Ages 3-4 (Short sentences)
4-5: Ages 4-5 (Longer sentences, more detail)
5-6: Ages 5-6 (Early readers)
[/SUGGEST]',
        '**Step 2: Grade Level**

What grade level is this book for?

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
      ),
      'age-appropriate',
      'grade-appropriate'
    ),
    'ageGroup',
    'gradeLevel'
  ),
  updated_at = NOW()
WHERE id = '4a822d3a-79d6-42ee-a751-f01d7f04ca95' AND is_latest = true;

-- 2. ABC Illustration Creation Agent (3a0e6c03-f1c9-4489-a624-12edd086d52d)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          instructions,
          '### Step 2: Age Group Selection (SKIP IF AGE ALREADY PROVIDED)


**IMPORTANT:** If the child''s age is already in the context (from kid profile), skip this step entirely and proceed directly to Step 3.


If age is NOT provided, ask: "What''s the age of the child this illustration is for?"


[SUGGEST]
0-2: 0-2 years (Babies/Toddlers)
2-4: 2-4 years (Toddlers/Preschool)
4-6: 4-6 years (Preschool/Kindergarten)
[/SUGGEST]',
          '### Step 2: Grade Level (SKIP IF GRADE ALREADY PROVIDED)


**IMPORTANT:** If the grade level is already in the context (from kid profile), skip this step entirely and proceed directly to Step 3.


If grade is NOT provided, ask: "What grade level is this illustration for?"


[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
        ),
        'Age Range badge',
        'Grade Level badge'
      ),
      'age-appropriate',
      'grade-appropriate'
    ),
    'ageGroup',
    'gradeLevel'
  ),
  updated_at = NOW()
WHERE id = '3a0e6c03-f1c9-4489-a624-12edd086d52d' AND is_latest = true;

-- 3. Bedtime Routine Book Creation Agent (d696066c-80c9-4c68-bc50-98cac7783456)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        '**Step 2: Age Group Discovery**

What age is this bedtime book for?

[SUGGEST]
0-2: 👶 0-2 years (very simple, repetitive)
2-4: 🧒 2-4 years (short sentences, familiar routines)
4-6: 👦 4-6 years (slightly longer, gentle adventures)
[/SUGGEST]',
        '**Step 2: Grade Level**

What grade level is this bedtime book for?

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
      ),
      'Age Range',
      'Grade Level'
    ),
    'age-appropriate',
    'grade-appropriate'
  ),
  updated_at = NOW()
WHERE id = 'd696066c-80c9-4c68-bc50-98cac7783456' AND is_latest = true;

-- 4. CVC Words Book Creation Agent (611a0e04-52b3-4fae-8276-848045a44d69)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      instructions,
      '### Step 2: Age Group Selection

[SUGGEST]
age-4-5: 4-5 years (Beginning readers)
age-5-6: 5-6 years (Emerging readers)
age-6-7: 6-7 years (Early readers)
[/SUGGEST]',
      '### Step 2: Grade Level

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
    ),
    'Age Range badge',
    'Grade Level badge'
  ),
  updated_at = NOW()
WHERE id = '611a0e04-52b3-4fae-8276-848045a44d69' AND is_latest = true;

-- 5. Shapes Book Creation Agent (1a88f3a0-ac6a-4bb3-be1b-c69613ec8ac3)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      REPLACE(
        instructions,
        '### Step 2: Age Group Discovery
Ask: "What age is this book for?"

[SUGGEST]
0-2: 👶 0-2 years (Babies/Toddlers)
2-4: 🧒 2-4 years (Toddlers/Preschool)
4-6: 👦 4-6 years (Preschool/Kindergarten)
[/SUGGEST]',
        '### Step 2: Grade Level
Ask: "What grade level is this book for?"

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
      ),
      'Age Range',
      'Grade Level'
    ),
    'age-appropriate',
    'grade-appropriate'
  ),
  updated_at = NOW()
WHERE id = '1a88f3a0-ac6a-4bb3-be1b-c69613ec8ac3' AND is_latest = true;

-- 6. Sight Words Book Creation Agent (4ed717bb-400e-48a3-b4a0-4fa588d0ca1c)
UPDATE public.agents SET
  instructions = REPLACE(
    REPLACE(
      instructions,
      '### Step 2: Age Group Selection

Present these options via [SUGGEST] block:

[SUGGEST]
age-4-5: 4-5 years (Pre-K, basic sight words)
age-5-6: 5-6 years (Kindergarten level)
age-6-7: 6-7 years (First grade level)
age-7-8: 7-8 years (Second grade level)
[/SUGGEST]',
      '### Step 2: Grade Level

Present these options via [SUGGEST] block:

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
    ),
    'Age Range',
    'Grade Level'
  ),
  updated_at = NOW()
WHERE id = '4ed717bb-400e-48a3-b4a0-4fa588d0ca1c' AND is_latest = true;