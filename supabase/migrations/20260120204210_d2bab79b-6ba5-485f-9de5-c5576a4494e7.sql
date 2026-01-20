-- Add Manner Type question to the questions registry
INSERT INTO questions (id, label, placeholder_key, description, icon_name, sort_order, is_active, static_options)
VALUES (
  'manner_type',
  'Manner Type',
  '{{MANNER_TYPE_OPTIONS}}',
  'Type of manners to focus on in the book',
  'Heart',
  70,
  true,
  '[
    {"id": "eating-habits", "label": "Table Manners & Eating Habits", "emoji": "🍽️", "description": "Using utensils, napkin use, saying please/thank you"},
    {"id": "social-skills", "label": "Social Skills & Politeness", "emoji": "🤝", "description": "Greetings, introductions, listening, saying excuse me"},
    {"id": "sharing", "label": "Sharing & Taking Turns", "emoji": "🎁", "description": "Sharing toys, being patient, including others"},
    {"id": "respect", "label": "Respect & Kindness", "emoji": "🙏", "description": "Respecting elders, kind words, helping others"},
    {"id": "hygiene", "label": "Hygiene & Self-Care", "emoji": "🧼", "description": "Hand washing, covering sneezes, brushing teeth"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  static_options = EXCLUDED.static_options,
  is_active = true;

-- Add Manners Setting question to the questions registry
INSERT INTO questions (id, label, placeholder_key, description, icon_name, sort_order, is_active, static_options)
VALUES (
  'manner_setting',
  'Manners Setting',
  '{{MANNER_SETTING_OPTIONS}}',
  'Where the manners scenarios take place',
  'Home',
  71,
  true,
  '[
    {"id": "home", "label": "Home", "emoji": "🏠", "description": "Manners at home with family"},
    {"id": "school", "label": "School", "emoji": "🏫", "description": "Manners at school with teachers and classmates"},
    {"id": "both", "label": "Both Home & School", "emoji": "🏠🏫", "description": "Manners in both settings"}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  static_options = EXCLUDED.static_options,
  is_active = true;

-- Link both questions to the book-creation-manners agent
INSERT INTO agent_questions (agent_type, question_id, is_enabled, sort_order)
VALUES 
  ('book-creation-manners', 'manner_type', true, 10),
  ('book-creation-manners', 'manner_setting', true, 11)
ON CONFLICT (agent_type, question_id) DO UPDATE SET is_enabled = true;