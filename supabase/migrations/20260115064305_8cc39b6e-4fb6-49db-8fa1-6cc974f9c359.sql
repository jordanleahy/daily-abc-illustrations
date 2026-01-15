-- Add grade_level as step 2 for shapes agent
INSERT INTO type_specific_discoveries (
  agent_type, 
  question_key, 
  question_text, 
  options, 
  step_number, 
  sort_order,
  frontend_state_key,
  context_value_key,
  is_skippable,
  is_active
) VALUES (
  'shapes',
  'grade_level',
  'What grade level is this book for?',
  '[
    {"key": "PRE_K", "label": "Pre-K (Ages 3-4)"},
    {"key": "K", "label": "Kindergarten (Ages 5-6)"},
    {"key": "GRADE_1", "label": "1st Grade (Ages 6-7)"},
    {"key": "GRADE_2", "label": "2nd Grade (Ages 7-8)"}
  ]'::jsonb,
  2,
  2,
  'selectedGradeLevel',
  'grade_level',
  false,
  true
);

-- Update clothing_brand to step 3 (was step 5, but there's nothing at 3-4)
UPDATE type_specific_discoveries 
SET step_number = 3, sort_order = 3
WHERE agent_type = 'shapes' AND question_key = 'clothing_brand' AND is_active = true;