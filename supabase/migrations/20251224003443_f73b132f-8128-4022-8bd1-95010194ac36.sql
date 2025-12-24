-- Add Weston's characters to the characters table
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order, is_active)
VALUES 
  (
    'westons-shelly',
    'westons',
    'Shelly',
    'A playful young girl with bright energy and curiosity, the older sister of the family',
    'Shelly is a young human girl with light brown hair in pigtails, wearing casual play clothes. She has an adventurous spirit and leads activities with enthusiasm. Draw her as a lively, curious child around 6-7 years old.',
    true,
    1,
    true
  ),
  (
    'westons-thatch',
    'westons',
    'Thatch',
    'An energetic younger brother who loves to play and follow his big sister on adventures',
    'Thatch is a young human boy with messy brown hair, wearing comfortable play clothes. He is enthusiastic and sometimes mischievous, around 4-5 years old. Draw him as an eager, playful little brother.',
    true,
    2,
    true
  ),
  (
    'westons-whistler',
    'westons',
    'Whistler',
    'The fun-loving dad who enjoys playing games and going on adventures with his kids',
    'Whistler is an adult human father with short brown hair and a friendly smile. He wears casual dad clothes and loves joining in his kids'' imaginative play. Draw him as a warm, playful father figure.',
    true,
    3,
    true
  ),
  (
    'westons-chelsea',
    'westons',
    'Chelsea',
    'The caring mom who balances work and family while supporting her children''s creativity',
    'Chelsea is an adult human mother with shoulder-length brown hair and a kind expression. She wears practical, stylish clothes and is nurturing yet fun. Draw her as a loving, supportive mother figure.',
    true,
    4,
    true
  );