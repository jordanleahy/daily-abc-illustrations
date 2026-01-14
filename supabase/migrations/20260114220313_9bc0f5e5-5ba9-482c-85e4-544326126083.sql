-- Add Manners discovery questions to type_specific_discoveries table
-- These will be dynamically fetched instead of hardcoded in agent instructions

-- 1. Setting Question (Manners-specific: home/school)
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-manners',
  'setting',
  'Where should this manners book take place?',
  '[{"key": "home", "label": "🏠 Home"}, {"key": "school", "label": "🏫 School"}, {"key": "both", "label": "🏠🏫 Both Home & School"}, {"key": "skip-setting", "label": "⏭️ Skip"}]'::jsonb,
  1,
  true
);

-- 2. Season Question
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-manners',
  'season',
  'Would you like the book to have a seasonal theme? This is optional.',
  '[{"key": "SPRING", "label": "🌸 Spring"}, {"key": "SUMMER", "label": "☀️ Summer"}, {"key": "FALL", "label": "🍂 Fall"}, {"key": "WINTER", "label": "❄️ Winter"}, {"key": "skip-season", "label": "⏭️ Skip"}]'::jsonb,
  2,
  true
);

-- 3. Environment Question (standard environments for optional flexibility)
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-manners',
  'environment',
  'Would you like the book set in a specific environment? This is optional.',
  '[{"key": "CITY", "label": "🏙️ City"}, {"key": "PARK", "label": "🌳 Park"}, {"key": "BEACH", "label": "🏖️ Beach"}, {"key": "skip-environment", "label": "⏭️ Skip"}]'::jsonb,
  3,
  true
);

-- 4. City Question  
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-manners',
  'city',
  'Would you like to set this book in a specific city? This is optional.',
  '[{"key": "JERSEY_CITY", "label": "🌆 Jersey City"}, {"key": "HOBOKEN", "label": "🏘️ Hoboken"}, {"key": "NEW_YORK_CITY", "label": "🗽 New York City"}, {"key": "skip-city", "label": "⏭️ Skip (no specific city)"}]'::jsonb,
  4,
  true
);

-- Also add discoveries for book-creation-opposites to use consistent pattern
-- 1. Category Focus (Opposites-specific)
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-opposites',
  'category_focus',
  'What category of opposites would you like to focus on?',
  '[{"key": "physical", "label": "📏 Physical (big/small, tall/short)"}, {"key": "emotions", "label": "😊 Emotions (happy/sad, calm/excited)"}, {"key": "actions", "label": "🏃 Actions (fast/slow, push/pull)"}, {"key": "nature", "label": "🌙 Nature (day/night, hot/cold)"}, {"key": "mixed", "label": "🎲 Mixed (variety of all)"}]'::jsonb,
  1,
  true
);

-- 2. Season Question for Opposites
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-opposites',
  'season',
  'Would you like the book to have a seasonal theme? This is optional.',
  '[{"key": "SPRING", "label": "🌸 Spring"}, {"key": "SUMMER", "label": "☀️ Summer"}, {"key": "FALL", "label": "🍂 Fall"}, {"key": "WINTER", "label": "❄️ Winter"}, {"key": "skip-season", "label": "⏭️ Skip"}]'::jsonb,
  2,
  true
);

-- 3. Environment Question for Opposites
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-opposites',
  'environment',
  'Would you like the book set in a specific environment? This is optional.',
  '[{"key": "CITY", "label": "🏙️ City"}, {"key": "SNOWBOARD_RESORT", "label": "🏂 Snowboard Resort"}, {"key": "SKI_RESORT", "label": "⛷️ Ski Resort"}, {"key": "ISLAND", "label": "🏝️ Island"}, {"key": "DESERT", "label": "🏜️ Desert"}, {"key": "MOUNTAIN", "label": "🏔️ Mountain"}, {"key": "PARK", "label": "🌳 Park"}, {"key": "skip-environment", "label": "⏭️ Skip"}]'::jsonb,
  3,
  true
);

-- 4. Clothing Brand Question for Opposites
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-opposites',
  'clothing_brand',
  'Would you like characters to wear branded clothing?',
  '[{"key": "BURTON", "label": "🏂 Burton"}, {"key": "NONE", "label": "👕 No brand"}, {"key": "skip-clothing-brand", "label": "⏭️ Skip"}]'::jsonb,
  4,
  true
);

-- 5. City Question for Opposites
INSERT INTO type_specific_discoveries (agent_type, question_key, question_text, options, sort_order, is_active)
VALUES (
  'book-creation-opposites',
  'city',
  'Would you like to set this book in a specific city? This is optional.',
  '[{"key": "JERSEY_CITY", "label": "🌆 Jersey City"}, {"key": "HOBOKEN", "label": "🏘️ Hoboken"}, {"key": "NEW_YORK_CITY", "label": "🗽 New York City"}, {"key": "skip-city", "label": "⏭️ Skip (no specific city)"}]'::jsonb,
  5,
  true
);