-- Migration: Add prefixed IDs to type_specific_discoveries options
-- This updates the option keys to use namespace prefixes for collision prevention

-- Update season options in type_specific_discoveries
UPDATE type_specific_discoveries
SET options = '[
  {"key": "SEASON_SPRING", "label": "🌸 Spring"},
  {"key": "SEASON_SUMMER", "label": "☀️ Summer"},
  {"key": "SEASON_FALL", "label": "🍂 Fall"},
  {"key": "SEASON_WINTER", "label": "❄️ Winter"},
  {"key": "skip-season", "label": "⏭️ Skip"}
]'::jsonb
WHERE question_key = 'season' AND agent_type = 'book-creation-manners';

-- Update location options in type_specific_discoveries  
UPDATE type_specific_discoveries
SET options = '[
  {"key": "LOCATION_VAIL_RESORT", "label": "🏔️ Vail Resort"},
  {"key": "LOCATION_SUGARBUSH_RESORT", "label": "🍁 Sugarbush Resort"},
  {"key": "LOCATION_STRATTON", "label": "⛷️ Stratton"},
  {"key": "LOCATION_KILLINGTON", "label": "🏂 Killington Mountain"},
  {"key": "LOCATION_MOUNTAIN_CREEK", "label": "🎿 Mountain Creek"},
  {"key": "LOCATION_COPPER_MOUNTAIN", "label": "🥉 Copper Mountain"},
  {"key": "LOCATION_BRECKENRIDGE", "label": "🏘️ Breckenridge"},
  {"key": "LOCATION_KEYSTONE", "label": "🌙 Keystone"},
  {"key": "LOCATION_WHISTLER_BLACKCOMB", "label": "🇨🇦 Whistler Blackcomb"},
  {"key": "LOCATION_PLATTEKILL", "label": "🗽 Plattekill Mountain"},
  {"key": "skip-location", "label": "⏭️ Skip (no specific resort)"}
]'::jsonb
WHERE question_key = 'location' AND agent_type = 'book-creation-manners';

-- Update city options in type_specific_discoveries
UPDATE type_specific_discoveries
SET options = '[
  {"key": "CITY_JERSEY_CITY", "label": "🌆 Jersey City"},
  {"key": "CITY_HOBOKEN", "label": "🏘️ Hoboken"},
  {"key": "CITY_NEW_YORK_CITY", "label": "🗽 New York City"},
  {"key": "skip-city", "label": "⏭️ Skip (no specific city)"}
]'::jsonb
WHERE question_key = 'city' AND agent_type = 'book-creation-manners';

-- Update manners_setting options in type_specific_discoveries
UPDATE type_specific_discoveries
SET options = '[
  {"key": "SETTING_home", "label": "🏠 Home"},
  {"key": "SETTING_school", "label": "🏫 School"},
  {"key": "SETTING_both", "label": "🏠🏫 Both Home & School"},
  {"key": "skip-setting", "label": "⏭️ Skip"}
]'::jsonb
WHERE question_key = 'manners_setting' AND agent_type = 'book-creation-manners';