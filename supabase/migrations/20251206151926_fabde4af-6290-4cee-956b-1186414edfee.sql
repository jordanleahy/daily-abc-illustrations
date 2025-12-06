-- Create character_themes table for centralized theme management
CREATE TABLE public.character_themes (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_special BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.character_themes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active themes
CREATE POLICY "Anyone can view active character themes"
ON public.character_themes
FOR SELECT
USING (is_active = true);

-- Admins can manage all themes
CREATE POLICY "Admins can manage character themes"
ON public.character_themes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_character_themes_updated_at
BEFORE UPDATE ON public.character_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_habits_updated_at();

-- Seed initial data from existing hardcoded themes
INSERT INTO public.character_themes (id, display_name, thumbnail_url, alt_text, sort_order, is_active, is_special) VALUES
  ('paw-patrol', 'PAW Patrol', '/themes/paw-patrol.png', 'Paw Patrol themed book', 1, true, false),
  ('frozen', 'Frozen', '/themes/frozen.png', 'Frozen themed book', 2, true, false),
  ('peppa-pig', 'Peppa Pig', '/themes/peppa-pig.png', 'Peppa Pig themed book', 3, true, false),
  ('bluey', 'Bluey', '/themes/bluey.png', 'Bluey themed book', 4, true, false),
  ('cocomelon', 'Cocomelon', '/themes/cocomelon.png', 'Cocomelon themed book', 5, true, false),
  ('moana', 'Moana', '/themes/moana.png', 'Moana themed book', 6, true, false),
  ('mickey-mouse', 'Mickey Mouse', '/themes/mickey-mouse.png', 'Mickey Mouse themed book', 7, true, false),
  ('mario', 'Mario', '/themes/mario.png', 'Mario themed book', 8, true, false),
  ('sesame-street', 'Sesame Street', '/themes/sesame-street.png', 'Sesame Street themed book', 9, true, false),
  ('benji-davies', 'Benji Davies Style', '/themes/benji-davies.png', 'Benji Davies style - Grandad''s Island inspired watercolor illustrations', 10, true, false),
  ('black-and-white', 'Black & White', '/themes/black-and-white.png', 'Black and white classic illustration style', 11, true, false),
  ('bear-stories', 'Bear Stories', '/themes/bear-stories.png', 'Bear Memories - A cinematic winter adventure at Snowtop Mountain', 12, true, false),
  ('custom', 'Custom Theme', '', 'Custom user-specified theme', 13, true, true),
  ('no-theme', 'No Theme', '', 'Classic educational illustrations without character theme', 14, true, true);