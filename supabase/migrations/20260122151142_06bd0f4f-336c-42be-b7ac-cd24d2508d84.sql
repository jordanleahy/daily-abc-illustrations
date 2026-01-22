
-- Create NUMBER_RANGE question with predefined options
INSERT INTO questions (id, label, placeholder_key, description, icon_name, static_options, is_active, sort_order)
VALUES (
  'NUMBER_RANGE',
  'Number Range',
  'number_range',
  'Choose the counting range for your numbers book',
  'Hash',
  '[
    {"id": "RANGE_1_10", "label": "1 to 10", "emoji": "🔢", "description": "Perfect for beginners"},
    {"id": "RANGE_1_20", "label": "1 to 20", "emoji": "📊", "description": "Extended counting practice"},
    {"id": "RANGE_1_100", "label": "1 to 100", "emoji": "💯", "description": "Advanced counting by tens"},
    {"id": "RANGE_CUSTOM", "label": "Custom Range", "emoji": "✏️", "description": "Specify your own range"}
  ]'::jsonb,
  true,
  10
)
ON CONFLICT (id) DO UPDATE SET
  static_options = EXCLUDED.static_options,
  description = EXCLUDED.description;

-- Create CUSTOM_NUMBER_RANGE question (text input for custom range)
INSERT INTO questions (id, label, placeholder_key, description, icon_name, static_options, is_active, sort_order)
VALUES (
  'CUSTOM_NUMBER_RANGE',
  'Custom Number Range',
  'custom_number_range',
  'Specify your custom number range (e.g., 5-15, 10-50)',
  'Pencil',
  NULL,
  true,
  11
)
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description;

-- Add NUMBER_RANGE to numbers agent (sort_order 2, before SEASON)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES ('book-creation-numbers', 'NUMBER_RANGE', 2, true)
ON CONFLICT (agent_type, question_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled;

-- Add CUSTOM_NUMBER_RANGE as conditional (only shows when Custom Range selected)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled, conditional_on_question_id, conditional_on_answer_id)
VALUES ('book-creation-numbers', 'CUSTOM_NUMBER_RANGE', 2.5, true, 'NUMBER_RANGE', 'RANGE_CUSTOM')
ON CONFLICT (agent_type, question_id) DO UPDATE SET
  sort_order = EXCLUDED.sort_order,
  is_enabled = EXCLUDED.is_enabled,
  conditional_on_question_id = EXCLUDED.conditional_on_question_id,
  conditional_on_answer_id = EXCLUDED.conditional_on_answer_id;

-- Update SEASON sort_order to come after number range questions
UPDATE agent_questions 
SET sort_order = 3 
WHERE agent_type = 'book-creation-numbers' AND question_id = 'SEASON';
