-- Create 3 new questions for Opposites book type

-- 1. Opposites Category question
INSERT INTO questions (id, label, description, placeholder_key, is_active, sort_order, static_options)
VALUES (
  'opposites_category',
  'Opposites Category',
  'What types of opposites would you like to explore?',
  '{{OPPOSITES_CATEGORY_OPTIONS}}',
  true,
  20,
  '[
    {"id": "OPP_PHYSICAL", "label": "Physical Opposites", "description": "Size, shape, texture (big/small, hard/soft)", "emoji": "📏"},
    {"id": "OPP_EMOTIONAL", "label": "Emotional Opposites", "description": "Feelings and moods (happy/sad, calm/excited)", "emoji": "😊"},
    {"id": "OPP_ACTION", "label": "Action Opposites", "description": "Movement and activities (run/walk, push/pull)", "emoji": "🏃"},
    {"id": "OPP_POSITION", "label": "Position Opposites", "description": "Location and direction (up/down, in/out)", "emoji": "⬆️"},
    {"id": "OPP_MIXED", "label": "Mixed Categories", "description": "A variety of opposite types", "emoji": "🎲"}
  ]'::jsonb
);

-- 2. Complexity Level question
INSERT INTO questions (id, label, description, placeholder_key, is_active, sort_order, static_options)
VALUES (
  'opposites_complexity',
  'Complexity Level',
  'How nuanced should the opposite pairs be?',
  '{{OPPOSITES_COMPLEXITY_OPTIONS}}',
  true,
  21,
  '[
    {"id": "OPP_SIMPLE", "label": "Simple Pairs", "description": "Clear contrasts like hot/cold, day/night", "emoji": "🔤"},
    {"id": "OPP_INTERMEDIATE", "label": "Intermediate Pairs", "description": "Moderate complexity like whisper/shout, crawl/sprint", "emoji": "📚"},
    {"id": "OPP_ADVANCED", "label": "Advanced Pairs", "description": "Nuanced contrasts like ancient/modern, fragile/sturdy", "emoji": "🎓"}
  ]'::jsonb
);

-- 3. Illustration Style question
INSERT INTO questions (id, label, description, placeholder_key, is_active, sort_order, static_options)
VALUES (
  'opposites_illustration_style',
  'Illustration Style',
  'How should the opposite pairs be illustrated?',
  '{{OPPOSITES_ILLUSTRATION_OPTIONS}}',
  true,
  22,
  '[
    {"id": "OPP_STYLE_SIDEBYSIDE", "label": "Side-by-Side", "description": "Both opposites shown next to each other", "emoji": "↔️"},
    {"id": "OPP_STYLE_SPLITSCREEN", "label": "Split Screen", "description": "Page divided to show contrast dramatically", "emoji": "📱"},
    {"id": "OPP_STYLE_BEFOREAFTER", "label": "Before & After", "description": "Sequential scenes showing transformation", "emoji": "🔄"},
    {"id": "OPP_STYLE_SCENE", "label": "Single Scene", "description": "Both opposites in one unified illustration", "emoji": "🖼️"}
  ]'::jsonb
);

-- Link questions to book-creation-opposites agent
INSERT INTO agent_questions (agent_type, question_id, is_enabled, sort_order)
VALUES 
  ('book-creation-opposites', 'opposites_category', true, 1),
  ('book-creation-opposites', 'opposites_complexity', true, 2),
  ('book-creation-opposites', 'opposites_illustration_style', true, 3);