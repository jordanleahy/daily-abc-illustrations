-- Deactivate the standalone 'manners' agent questions (consolidate to book-creation-manners)
UPDATE type_specific_discoveries 
SET is_active = false 
WHERE agent_type = 'manners';

-- Shift book-creation-manners step numbers to make room for manner_type at step 1
UPDATE type_specific_discoveries 
SET step_number = step_number + 1 
WHERE agent_type = 'book-creation-manners' AND is_active = true;

-- Insert a new manner_type question at step 1 for book-creation-manners
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
  'book-creation-manners',
  'manner_type',
  'What type of manners would you like to focus on?',
  '[
    {"key": "daily", "label": "Daily Routines (brushing teeth, bedtime, morning)"},
    {"key": "social", "label": "Social Interactions (sharing, saying please/thank you)"},
    {"key": "places", "label": "Out & About (restaurant, store, playground)"},
    {"key": "behavior", "label": "Behavior & Safety (listening, being gentle)"}
  ]'::jsonb,
  1,
  1,
  'selectedMannerType',
  'manner_type',
  false,
  true
);