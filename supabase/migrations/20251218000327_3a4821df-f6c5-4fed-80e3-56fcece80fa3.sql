-- Add Dora the Explorer character theme
INSERT INTO public.character_themes (id, display_name, thumbnail_url, alt_text, sort_order, is_active, is_special)
VALUES ('dora', 'Dora the Explorer', '/themes/dora.png', 'Dora the Explorer themed book', 13, true, false)
ON CONFLICT (id) DO NOTHING;