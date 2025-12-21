-- Populate initial character data with constraint_text for high-performance enforcement
-- Bluey characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('bluey', 'bluey', 'Bluey', 'The energetic blue heeler puppy', 'Bluey is a 6-year-old Blue Heeler puppy with distinctive blue fur and a lighter blue patch on her face. She is curious, energetic, and loves imaginative play. Always show her as playful, creative, and learning through games. Her fur is blue with light blue markings.', true, 1),
('bingo', 'bluey', 'Bingo', 'Bluey''s younger sister', 'Bingo is Bluey''s 4-year-old sister, a Red Heeler with reddish-brown/orange fur. She is more sensitive and thoughtful than Bluey, often imagining fantasy scenarios. Show her as sweet, empathetic, and creative with her distinctive orange-red coloring.', true, 2),
('bandit', 'bluey', 'Bandit', 'The fun-loving dad', 'Bandit is Bluey and Bingo''s dad, a Blue Heeler with dark blue fur. He is playful, patient, and always willing to join in games. Show him as a loving, silly dad who teaches through play. Tall adult male dog with blue coloring.', false, 3),
('chilli', 'bluey', 'Chilli', 'The caring mum', 'Chilli is Bluey and Bingo''s mum, a Red Heeler with orange-red fur. She is warm, practical, and balances work with family time. Show her as nurturing but also fun and engaged with her children. Adult female dog with reddish-orange coloring.', false, 4);

-- PAW Patrol characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('chase', 'paw-patrol', 'Chase', 'Police and spy pup', 'Chase is a German Shepherd police pup who leads the PAW Patrol missions. He wears a blue police uniform with a police badge and uses spy gear. He is brave, responsible, and a natural leader. Show him as confident but caring, always ready to help.', true, 1),
('marshall', 'paw-patrol', 'Marshall', 'Fire pup and medic', 'Marshall is a Dalmatian (white with black spots) who serves as both fire pup and medic. He wears a red firefighter uniform with helmet. He is clumsy but brave, often making everyone laugh. Show him as enthusiastic and kind-hearted.', true, 2),
('skye', 'paw-patrol', 'Skye', 'Aviation pup', 'Skye is a Cockapoo and the first female member of PAW Patrol. She wears a pink aviator uniform and helmet, loves to fly. She is fearless, smart, and always ready for action. Show her as confident and graceful with her pink gear.', false, 3),
('rubble', 'paw-patrol', 'Rubble', 'Construction pup', 'Rubble is an English Bulldog who handles construction. He wears a yellow hard hat and construction vest. He is strong, loyal, and loves to dig. Despite his tough exterior, he is sweet. Show him with his yellow construction gear.', false, 4),
('rocky', 'paw-patrol', 'Rocky', 'Recycling pup', 'Rocky is a mixed-breed pup who focuses on recycling and repairs. He wears a green uniform and has a motto: "Don''t lose it, reuse it!" He is resourceful and eco-friendly. Show him as clever and inventive with green gear.', false, 5),
('zuma', 'paw-patrol', 'Zuma', 'Water rescue pup', 'Zuma is a Chocolate Labrador who handles water rescues. He wears an orange wetsuit and loves the water. He is laid-back, friendly, and an excellent swimmer. Show him as cool and easygoing with orange water gear.', false, 6);

-- Peppa Pig characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('peppa', 'peppa-pig', 'Peppa Pig', 'The lovable piglet', 'Peppa is a cheerful, slightly bossy little pink pig who loves jumping in muddy puddles. She wears a red dress and has a distinctive round snout. She lives with her family and loves playing with friends. Show her as curious, playful, and sometimes cheeky.', true, 1),
('george', 'peppa-pig', 'George', 'Peppa''s little brother', 'George is Peppa''s 2-year-old little brother pig. He loves his toy dinosaur (Mr. Dinosaur) and often says "Dine-saw!" He wears blue. Show him as adorable, sometimes tearful, and always following Peppa around.', true, 2),
('daddy-pig', 'peppa-pig', 'Daddy Pig', 'The jolly father', 'Daddy Pig is Peppa''s father with a big round tummy. He loves his family. He claims to be an expert at many things, especially reading maps. Show him as loving, slightly clumsy, and always optimistic. Wears glasses.', false, 3),
('mummy-pig', 'peppa-pig', 'Mummy Pig', 'The sensible mother', 'Mummy Pig is Peppa''s mother. She works from home on her computer and is the sensible one in the family. She is patient and caring, wears glasses and a black/orange dress. Show her as wise and loving.', false, 4);

-- Frozen characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('elsa', 'frozen', 'Elsa', 'The Snow Queen', 'Elsa is the Snow Queen of Arendelle with magical ice powers. She has platinum blonde hair usually in a braid and wears an ice-blue crystalline dress. She is powerful, protective of Anna, and has learned to embrace her magic. Show her as graceful, magical, and regal.', true, 1),
('anna', 'frozen', 'Anna', 'The brave princess', 'Anna is Elsa''s younger sister, the Princess of Arendelle. She has auburn/reddish-brown hair with a white streak and is incredibly optimistic and determined. She wears traditional Norwegian-inspired clothing. Show her as brave, clumsy, and full of love.', true, 2),
('olaf', 'frozen', 'Olaf', 'The friendly snowman', 'Olaf is a magical snowman created by Elsa. He has stick arms, a carrot nose, three coal buttons, and loves warm hugs. He is innocent, curious, and dreams of experiencing summer. Show him as cheerful, funny, and surprisingly philosophical.', false, 3),
('kristoff', 'frozen', 'Kristoff', 'The ice harvester', 'Kristoff is an ice harvester raised by trolls. He is Anna''s love interest, tall with blonde hair. He is always accompanied by his reindeer Sven. He is rugged but kind, initially gruff but very loyal. Show him as strong and dependable.', false, 4);

-- CoComelon characters  
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('jj', 'cocomelon', 'JJ', 'The curious toddler', 'JJ is a cheerful toddler with a round head and one distinctive strand of hair on top. He wears a yellow shirt and is always curious about the world. Show him as sweet, playful, and learning new things every day. Baby/toddler proportions.', true, 1),
('tomtom', 'cocomelon', 'TomTom', 'JJ''s older brother', 'TomTom is JJ''s older brother with brown hair and typically wears a green shirt. He is helpful and patient with his younger siblings. Show him as kind, responsible, and a good big brother.', false, 2),
('yoyo', 'cocomelon', 'YoYo', 'JJ''s older sister', 'YoYo is JJ''s older sister with dark hair and typically wears a purple shirt. She is creative and loves music and art. Show her as caring, artistic, and always ready to help her siblings.', false, 3);

-- Moana characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('moana', 'moana', 'Moana', 'The ocean-chosen voyager', 'Moana is a brave Polynesian teenage girl from the island of Motunui. She has long curly black hair, brown skin, and wears traditional Polynesian clothing (red top, leaf skirt). The ocean chose her to restore the heart of Te Fiti. Show her as courageous and connected to the sea.', true, 1),
('maui', 'moana', 'Maui', 'The demigod shapeshifter', 'Maui is a demigod with the power to shapeshift using his magical fish hook. He is large and muscular with tattoos covering his body that tell his story, including a mini-Maui that moves. He is boastful but heroic. Show him as powerful and comedic.', true, 2),
('pua', 'moana', 'Pua', 'The loyal pet pig', 'Pua is Moana''s pet pig with white and pink coloring. He is small, timid, and very loyal to Moana. Unlike Heihei the rooster, he is sensible but afraid of the ocean. Show him as adorable and loving.', false, 3);

-- Sesame Street characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('elmo', 'sesame-street', 'Elmo', 'The lovable red monster', 'Elmo is a furry red monster who speaks in third person ("Elmo loves you!"). He is 3½ years old and loves his goldfish Dorothy. He is curious, cheerful, and loves to learn. Show him as excited, huggable, and always asking questions.', true, 1),
('big-bird', 'sesame-street', 'Big Bird', 'The tall yellow bird', 'Big Bird is an 8-foot-tall bright yellow bird who lives on Sesame Street. He is childlike (6 years old), friendly, and always learning. He has a teddy bear named Radar. Show him as sweet, innocent, and kind to everyone. Very tall with yellow feathers.', true, 2),
('cookie-monster', 'sesame-street', 'Cookie Monster', 'The cookie-loving monster', 'Cookie Monster is a blue furry monster who loves cookies above all else. He speaks in a distinctive voice ("Me want cookie!"). He has googly eyes and blue fur. Show him as enthusiastic, funny, and surprisingly smart despite his cookie obsession.', false, 3),
('oscar', 'sesame-street', 'Oscar the Grouch', 'The grumpy green monster', 'Oscar is a green Grouch who lives in a trash can. He loves trash and claims to hate everything, but secretly cares about his friends. He has messy green fur and bushy eyebrows. Show him as grumpy outside but with a hidden soft heart.', false, 4);

-- Little Mermaid characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('ariel', 'little-mermaid', 'Ariel', 'The curious mermaid princess', 'Ariel is a mermaid princess with bright red hair and a green tail. She is fascinated by the human world and collects human artifacts in her grotto. She is curious, adventurous, and dreams of exploring beyond the sea. Show her as free-spirited and brave.', true, 1),
('flounder', 'little-mermaid', 'Flounder', 'Ariel''s best friend', 'Flounder is a blue and yellow tropical fish who is Ariel''s best friend. He has blue scales with yellow stripes. He is loyal but easily scared, yet always supports Ariel in her adventures. Show him as cute, nervous but brave when it counts.', true, 2),
('sebastian', 'little-mermaid', 'Sebastian', 'The court composer crab', 'Sebastian is a red Jamaican crab who serves as court composer for King Triton. He is tasked with watching Ariel but grows to care for her deeply. He has a Caribbean accent. Show him as dramatic, musical, and secretly caring.', false, 3);

-- Mickey Mouse characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('mickey', 'mickey-mouse', 'Mickey Mouse', 'The cheerful mouse', 'Mickey Mouse is a cheerful, optimistic mouse with large round black ears, red shorts with white buttons, large yellow shoes, and white gloves. He is kind, adventurous, and always helps his friends. Show him as the friendly leader who never gives up.', true, 1),
('minnie', 'mickey-mouse', 'Minnie Mouse', 'The stylish mouse', 'Minnie Mouse is Mickey''s girlfriend with a red polka-dot dress, matching bow with white polka dots, and yellow shoes. She is sweet, fashionable, and loves dancing and singing. Show her as graceful, kind, and always supportive of Mickey.', true, 2),
('donald', 'mickey-mouse', 'Donald Duck', 'The temperamental duck', 'Donald Duck is a white duck with a blue sailor suit and matching cap. He has an orange bill and orange webbed feet. He has a temper but a good heart. He is loyal to his friends despite his frustrations. Show him as expressive and lovably grumpy.', false, 3),
('goofy', 'mickey-mouse', 'Goofy', 'The clumsy friend', 'Goofy is a tall, anthropomorphic black dog who is clumsy but well-meaning. He wears an orange turtleneck, brown vest, and a tall green hat. He is optimistic, kind, and accidentally causes chaos. Show him as lovable, silly, and surprisingly wise.', false, 4);

-- Dora the Explorer characters
INSERT INTO public.characters (id, theme_id, name, description, constraint_text, default_selected, sort_order) VALUES
('dora', 'dora', 'Dora', 'The adventurous explorer', 'Dora is a 7-year-old Latina explorer with brown hair in a bob cut, an orange t-shirt, pink shorts, and a purple backpack (Backpack!). She speaks Spanish and English, loves exploring, and asks viewers for help. Show her as confident, helpful, and always teaching.', true, 1),
('boots', 'dora', 'Boots', 'The monkey friend', 'Boots is a 5-year-old monkey who is Dora''s best friend. He is blue/gray and wears red boots (hence his name). He is energetic and fun-loving. He sometimes gets scared but is always brave for Dora. Show him as playful, loyal, and adorable.', true, 2),
('map', 'dora', 'Map', 'The helpful guide', 'Map is Dora''s talking map who helps find the way. He lives in Backpack''s side pocket and sings "I''m the Map!" He is a rolled-up paper map that unfolds to show paths. Show him as cheerful, helpful, and enthusiastic about giving directions.', false, 3);