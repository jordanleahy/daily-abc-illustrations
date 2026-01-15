-- Update city discovery options for manners to use correct city IDs matching the cities table
UPDATE type_specific_discoveries
SET options = '[
  {"key": "JERSEY_CITY", "label": "🌅 Jersey City"},
  {"key": "HOBOKEN", "label": "🚂 Hoboken"},
  {"key": "NEW_YORK_CITY", "label": "🗽 New York City"},
  {"key": "skip-city", "label": "⏭️ Skip (no specific city)"}
]'::jsonb,
updated_at = now()
WHERE question_key = 'city' AND agent_type = 'book-creation-manners';