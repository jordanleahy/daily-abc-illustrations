-- Add location discovery question to Manners agent
INSERT INTO type_specific_discoveries (
  agent_type, 
  question_key, 
  question_text, 
  options, 
  sort_order, 
  is_active
) VALUES (
  'book-creation-manners',
  'location',
  'Would you like to set this book at a specific ski resort? This is optional.',
  '[
    {"key": "VAIL_RESORT", "label": "🏔️ Vail Resort"},
    {"key": "SUGARBUSH_RESORT", "label": "🍁 Sugarbush Resort"},
    {"key": "STRATTON", "label": "⛷️ Stratton"},
    {"key": "KILLINGTON", "label": "🏂 Killington Mountain"},
    {"key": "MOUNTAIN_CREEK", "label": "🎿 Mountain Creek"},
    {"key": "COPPER_MOUNTAIN", "label": "🥉 Copper Mountain"},
    {"key": "BRECKENRIDGE", "label": "🏘️ Breckenridge"},
    {"key": "KEYSTONE", "label": "🌙 Keystone"},
    {"key": "WHISTLER_BLACKCOMB", "label": "🇨🇦 Whistler Blackcomb"},
    {"key": "PLATTEKILL", "label": "🗽 Plattekill Mountain"},
    {"key": "skip-location", "label": "⏭️ Skip (no specific resort)"}
  ]'::jsonb,
  3,
  true
);