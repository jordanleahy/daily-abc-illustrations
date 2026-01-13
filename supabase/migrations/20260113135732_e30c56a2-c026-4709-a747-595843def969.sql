-- Add clothing brand discovery question for all book creation agent types
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES 
  ('abc', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('animals', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('bedtime', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('colors', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('cvc', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('emotions', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('first-words', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('numbers', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('opposites', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('rhyming', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('shapes', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('sight-words', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('song', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true),
  ('digraphs', 'clothing_brand', 'Would you like characters to wear branded clothing?', '[{"key": "BURTON", "label": "Burton snowboard gear"}, {"key": "NONE", "label": "No brand preference"}]'::jsonb, 99, true);