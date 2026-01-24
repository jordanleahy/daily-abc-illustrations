-- Enable custom_details question for all book creation agents
-- Using sort_order 99 to ensure it appears last in discovery flow

INSERT INTO agent_questions (agent_type, question_id, is_enabled, sort_order)
VALUES
  ('book-creation-abc', 'custom_details', true, 99),
  ('book-creation-numbers', 'custom_details', true, 99),
  ('book-creation-rhyming', 'custom_details', true, 99),
  ('book-creation-colors', 'custom_details', true, 99),
  ('book-creation-shapes', 'custom_details', true, 99),
  ('book-creation-animals', 'custom_details', true, 99),
  ('book-creation-sight-words', 'custom_details', true, 99),
  ('book-creation-emotions', 'custom_details', true, 99),
  ('book-creation-cvc', 'custom_details', true, 99),
  ('book-creation-opposites', 'custom_details', true, 99),
  ('book-creation-first-words', 'custom_details', true, 99),
  ('book-creation-bedtime', 'custom_details', true, 99),
  ('book-creation-general', 'custom_details', true, 99),
  ('book-creation-digraphs', 'custom_details', true, 99),
  ('book-creation-dr-seuss', 'custom_details', true, 99),
  ('book-creation-manners', 'custom_details', true, 99),
  ('book-creation-parent-education', 'custom_details', true, 99)
ON CONFLICT (agent_type, question_id) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  sort_order = EXCLUDED.sort_order;