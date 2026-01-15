-- Add Season, Location, and City questions to type_specific_discoveries for Manners books
-- This eliminates conditional logic by making ALL questions database-driven

INSERT INTO type_specific_discoveries (id, agent_type, question_key, question_text, options, sort_order, is_active)
VALUES 
  (gen_random_uuid(), 'book-creation-manners', 'season', 'What season should this book be set in?', 
   '[{"key": "winter", "label": "❄️ Winter"}, {"key": "spring", "label": "🌸 Spring"}, {"key": "summer", "label": "☀️ Summer"}, {"key": "fall", "label": "🍂 Fall"}, {"key": "skip", "label": "⏭️ Skip (no preference)"}]'::jsonb, 
   5, true),
  (gen_random_uuid(), 'book-creation-manners', 'location', 'Would you like to set this book at a specific resort?', 
   '[{"key": "killington", "label": "⛷️ Killington"}, {"key": "vail", "label": "🏔️ Vail"}, {"key": "stratton", "label": "🎿 Stratton"}, {"key": "skip", "label": "⏭️ Skip (no resort)"}]'::jsonb, 
   6, true),
  (gen_random_uuid(), 'book-creation-manners', 'city', 'Would you like to set this book in a specific city?', 
   '[{"key": "new_york", "label": "🗽 New York"}, {"key": "hoboken", "label": "🏙️ Hoboken"}, {"key": "jersey_city", "label": "🌆 Jersey City"}, {"key": "skip", "label": "⏭️ Skip (no city)"}]'::jsonb, 
   7, true)
ON CONFLICT DO NOTHING;