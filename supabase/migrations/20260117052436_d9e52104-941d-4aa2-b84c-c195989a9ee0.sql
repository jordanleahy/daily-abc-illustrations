-- Insert Theme question with static options
INSERT INTO public.questions (
  id,
  label,
  description,
  placeholder_key,
  icon_name,
  static_options,
  sort_order,
  is_active
) VALUES (
  'THEME',
  'What theme would you like for the rhymes?',
  'Choose a theme for the book content and illustrations',
  '{{THEME_OPTIONS}}',
  'Sparkles',
  '[
    {"id": "THEME_DAILY_ROUTINE", "label": "Daily Routine", "emoji": "🌅", "description": "Morning, meals, brushing teeth, getting dressed"},
    {"id": "THEME_ADVENTURE", "label": "Adventure", "emoji": "🗺️", "description": "Exciting journeys and explorations"},
    {"id": "THEME_ANIMALS", "label": "Animals", "emoji": "🦁", "description": "Wildlife, pets, and creatures"},
    {"id": "THEME_NATURE", "label": "Nature", "emoji": "🌿", "description": "Plants, weather, outdoors"},
    {"id": "THEME_FRIENDSHIP", "label": "Friendship", "emoji": "🤝", "description": "Making friends, sharing, kindness"},
    {"id": "THEME_BEDTIME", "label": "Bedtime", "emoji": "🌙", "description": "Sleep routines, dreams, nighttime"},
    {"id": "THEME_CUSTOM", "label": "Custom Theme", "emoji": "✏️", "description": "Create your own theme"}
  ]'::jsonb,
  25,
  true
)
ON CONFLICT (id) DO NOTHING;