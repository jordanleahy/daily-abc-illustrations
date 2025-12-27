-- Update digraph agent instructions to conditionally skip grade level step
UPDATE agents 
SET instructions = REPLACE(
  instructions,
  '### Step 2: Grade Level
"What grade level is this book for?"

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]',
  '### Step 2: Grade Level
⚠️ CONDITIONAL: If grade level was already selected before this conversation (check system context for "Grade Level Already Selected"), SKIP this step entirely and proceed to Step 3.

Otherwise, ask:
"What grade level is this book for?"

[SUGGEST]
PRE_K: Pre-K
K: Kindergarten
GRADE_1: 1st Grade
GRADE_2: 2nd Grade
[/SUGGEST]'
),
updated_at = now(),
last_modified = now()
WHERE id = '1d61429e-d7d5-4797-b23c-985a3652909e';