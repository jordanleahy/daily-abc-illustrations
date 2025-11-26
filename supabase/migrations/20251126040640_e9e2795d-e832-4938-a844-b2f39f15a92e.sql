-- Update ABC agent to show only top 7 theme options with Mountain Village first
UPDATE agents
SET 
  instructions = REGEXP_REPLACE(
    instructions,
    '\[SUGGEST\][^\[]*?\[/SUGGEST\]',
    E'[SUGGEST]\nmountain-village: 🏔️ Mountain Village A-Z\nanimals: 🐾 Animals A-Z\nfood: 🍎 Food & Fruits A-Z\nvehicles: 🚗 Things That Go A-Z\nmixed: 🎨 Classic Mixed Objects\nsnowboarding: 🏂 Snowboarding A-Z\ncustom: ✏️ Custom Theme\n[/SUGGEST]',
    'g'
  ),
  updated_at = now()
WHERE type = 'book-creation-abc'
  AND is_latest = true;