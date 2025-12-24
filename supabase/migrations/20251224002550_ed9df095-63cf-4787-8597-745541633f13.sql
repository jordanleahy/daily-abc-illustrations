-- Add Weston's character theme
INSERT INTO public.character_themes (id, display_name, thumbnail_url, alt_text, sort_order, is_active, is_special)
VALUES (
  'westons',
  'Weston''s',
  '/themes/westons.png',
  'Weston''s themed book',
  15,
  true,
  false
);