-- Insert Season question with static options
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
  'SEASON',
  'What season should the book be set in?',
  'Choose a seasonal theme for the illustrations and activities',
  '{{SEASON_OPTIONS}}',
  'Sun',
  '[
    {"id": "SEASON_SPRING", "label": "Spring", "emoji": "🌸", "description": "Flowers, rain, new growth"},
    {"id": "SEASON_SUMMER", "label": "Summer", "emoji": "☀️", "description": "Sun, beaches, outdoor fun"},
    {"id": "SEASON_FALL", "label": "Fall", "emoji": "🍂", "description": "Leaves, harvest, cozy vibes"},
    {"id": "SEASON_WINTER", "label": "Winter", "emoji": "❄️", "description": "Snow, holidays, warm indoors"}
  ]'::jsonb,
  50,
  true
)
ON CONFLICT (id) DO NOTHING;