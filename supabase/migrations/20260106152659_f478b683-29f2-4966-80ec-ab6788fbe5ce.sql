-- Add "Bluey Style (No Characters)" theme option
INSERT INTO character_themes (id, display_name, alt_text, thumbnail_url, is_active, is_special, sort_order)
VALUES (
  'bluey-style',
  'Bluey Style (No Characters)',
  'Bluey art style without character appearances - Australian backyard watercolor aesthetic',
  'https://foxdnspwzhjxjxuicute.supabase.co/storage/v1/object/public/assets/themes/bluey-style.png',
  true,
  false,
  5
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  alt_text = EXCLUDED.alt_text,
  is_active = EXCLUDED.is_active;

-- Update sort orders to place it right after Bluey
UPDATE character_themes SET sort_order = sort_order + 1 WHERE sort_order >= 5 AND id != 'bluey-style';