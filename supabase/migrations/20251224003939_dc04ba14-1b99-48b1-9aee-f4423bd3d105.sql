-- Delete existing characters and theme, then recreate with 'weston' id
-- First delete the characters (due to FK constraint)
DELETE FROM public.characters WHERE theme_id = 'westons';

-- Then delete the theme
DELETE FROM public.character_themes WHERE id = 'westons';

-- Recreate theme with 'weston' id
INSERT INTO public.character_themes (id, display_name, thumbnail_url, alt_text, sort_order, is_active, is_special)
VALUES (
  'weston',
  'Weston''s',
  '/themes/weston.png',
  'Weston''s themed book',
  15,
  true,
  false
);

-- Recreate characters with 'weston' theme_id
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order, is_active)
VALUES 
  (
    'weston-shelly',
    'weston',
    'Shelly',
    'A playful young girl with bright energy and curiosity, the older sister of the family',
    'Shelly is a young human girl with light brown hair in pigtails, wearing casual play clothes. She has an adventurous spirit and leads activities with enthusiasm. Draw her as a lively, curious child around 6-7 years old.',
    true,
    1,
    true
  ),
  (
    'weston-thatch',
    'weston',
    'Thatch',
    'An energetic younger brother who loves to play and follow his big sister on adventures',
    'Thatch is a young human boy with messy brown hair, wearing comfortable play clothes. He is enthusiastic and sometimes mischievous, around 4-5 years old. Draw him as an eager, playful little brother.',
    true,
    2,
    true
  ),
  (
    'weston-whistler',
    'weston',
    'Whistler',
    'The fun-loving dad who enjoys playing games and going on adventures with his kids',
    'Whistler is an adult human father with short brown hair and a friendly smile. He wears casual dad clothes and loves joining in his kids'' imaginative play. Draw him as a warm, playful father figure.',
    true,
    3,
    true
  ),
  (
    'weston-chelsea',
    'weston',
    'Chelsea',
    'The caring mom who balances work and family while supporting her children''s creativity',
    'Chelsea is an adult human mother with shoulder-length brown hair and a kind expression. She wears practical, stylish clothes and is nurturing yet fun. Draw her as a loving, supportive mother figure.',
    true,
    4,
    true
  );