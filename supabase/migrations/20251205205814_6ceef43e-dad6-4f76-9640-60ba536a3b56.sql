-- Create type_specific_discoveries table for managing discovery questions and options
CREATE TABLE public.type_specific_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_type TEXT NOT NULL,
  question_key TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_type, question_key)
);

-- Enable RLS
ALTER TABLE public.type_specific_discoveries ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read type specific discoveries"
  ON public.type_specific_discoveries
  FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage type specific discoveries"
  ON public.type_specific_discoveries
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Seed initial data based on existing agent prompts
INSERT INTO public.type_specific_discoveries (agent_type, question_key, question_text, options, sort_order) VALUES
-- ABC Agent
('abc', 'subject_theme', 'What subject theme would you like for your ABC book?', '[
  {"key": "mountain-village", "label": "🏔️ Mountain Village A-Z"},
  {"key": "animals", "label": "🐾 Animals A-Z"},
  {"key": "food-fruits", "label": "🍎 Food & Fruits A-Z"},
  {"key": "vehicles", "label": "🚗 Things That Go A-Z"},
  {"key": "classic-mixed", "label": "🎨 Classic Mixed Objects"},
  {"key": "snowboarding", "label": "🏂 Snowboarding A-Z"},
  {"key": "custom", "label": "✏️ Custom Theme"}
]'::jsonb, 1),
('abc', 'letter_case', 'What letter case would you prefer?', '[
  {"key": "lowercase", "label": "lowercase (a, b, c)"},
  {"key": "uppercase", "label": "UPPERCASE (A, B, C)"},
  {"key": "mixed", "label": "Mixed Case (Aa, Bb, Cc)"}
]'::jsonb, 2),

-- Numbers Agent
('numbers', 'number_range', 'What number range would you like to cover?', '[
  {"key": "1-10", "label": "1-10 (Beginners)"},
  {"key": "1-20", "label": "1-20 (Intermediate)"},
  {"key": "1-100", "label": "1-100 (Advanced)"}
]'::jsonb, 1),
('numbers', 'counting_object', 'What should we count?', '[
  {"key": "animals", "label": "🐾 Animals"},
  {"key": "vehicles", "label": "🚗 Vehicles"},
  {"key": "food", "label": "🍎 Food"},
  {"key": "nature", "label": "🌸 Nature"},
  {"key": "custom", "label": "✏️ Custom Object"}
]'::jsonb, 2),

-- Colors Agent
('colors', 'color_set', 'Which color set would you like?', '[
  {"key": "primary", "label": "🎨 Primary Colors (Red, Blue, Yellow)"},
  {"key": "rainbow", "label": "🌈 Rainbow Colors"},
  {"key": "nature", "label": "🌿 Nature Colors"},
  {"key": "all", "label": "✨ All Colors"}
]'::jsonb, 1),

-- Shapes Agent
('shapes', 'shape_set', 'Which shapes would you like to explore?', '[
  {"key": "basic", "label": "⬛ Basic Shapes (Circle, Square, Triangle)"},
  {"key": "extended", "label": "🔷 Extended Shapes (+ Rectangle, Oval, Star)"},
  {"key": "advanced", "label": "📐 Advanced Shapes (+ Pentagon, Hexagon, etc.)"}
]'::jsonb, 1),

-- Rhyming Agent
('rhyming', 'rhyme_theme', 'What theme would you like for your rhyming book?', '[
  {"key": "daily-routines", "label": "🌅 Daily Routines"},
  {"key": "animals", "label": "🐾 Animal Adventures"},
  {"key": "nature", "label": "🌸 Nature & Seasons"},
  {"key": "bedtime", "label": "🌙 Bedtime Stories"},
  {"key": "custom", "label": "✏️ Custom Theme"}
]'::jsonb, 1),

-- CVC Agent
('cvc', 'vowel_focus', 'Which vowel sound would you like to focus on?', '[
  {"key": "short-a", "label": "Short A (cat, hat, bat)"},
  {"key": "short-e", "label": "Short E (bed, red, pet)"},
  {"key": "short-i", "label": "Short I (pig, big, sit)"},
  {"key": "short-o", "label": "Short O (dog, hop, pot)"},
  {"key": "short-u", "label": "Short U (cup, sun, bug)"},
  {"key": "mixed", "label": "🎲 Mixed Vowels"}
]'::jsonb, 1),

-- Opposites Agent
('opposites', 'opposite_category', 'What category of opposites interests you?', '[
  {"key": "size", "label": "📏 Size (Big/Small, Tall/Short)"},
  {"key": "feelings", "label": "😊 Feelings (Happy/Sad, Calm/Excited)"},
  {"key": "actions", "label": "🏃 Actions (Fast/Slow, Start/Stop)"},
  {"key": "mixed", "label": "🎯 Mixed Categories"}
]'::jsonb, 1),

-- Emotions Agent
('emotions', 'emotion_set', 'Which emotions would you like to explore?', '[
  {"key": "basic", "label": "😊 Basic (Happy, Sad, Angry, Scared)"},
  {"key": "expanded", "label": "🎭 Expanded (+ Surprised, Worried, Excited)"},
  {"key": "complex", "label": "💭 Complex (+ Frustrated, Proud, Confused)"}
]'::jsonb, 1),

-- Animals Agent
('animals', 'animal_category', 'What type of animals would you like?', '[
  {"key": "farm", "label": "🐄 Farm Animals"},
  {"key": "wild", "label": "🦁 Wild Animals"},
  {"key": "ocean", "label": "🐋 Ocean Animals"},
  {"key": "pets", "label": "🐕 Pets"},
  {"key": "mixed", "label": "🌍 Mixed Animals"}
]'::jsonb, 1),

-- Sight Words Agent
('sight-words', 'word_level', 'What sight word level?', '[
  {"key": "pre-k", "label": "👶 Pre-K (a, the, I, is)"},
  {"key": "kindergarten", "label": "🎒 Kindergarten"},
  {"key": "first-grade", "label": "📚 First Grade"},
  {"key": "mixed", "label": "📖 Mixed Levels"}
]'::jsonb, 1),

-- First Words Agent  
('first-words', 'word_category', 'What category of first words?', '[
  {"key": "family", "label": "👨‍👩‍👧 Family Words (Mama, Dada, Baby)"},
  {"key": "objects", "label": "🧸 Everyday Objects"},
  {"key": "food", "label": "🍼 Food Words"},
  {"key": "animals", "label": "🐶 Animal Words"},
  {"key": "mixed", "label": "🎯 Mixed Categories"}
]'::jsonb, 1),

-- Bedtime Agent
('bedtime', 'bedtime_theme', 'What bedtime theme would you like?', '[
  {"key": "calming", "label": "🌙 Calming Night Routine"},
  {"key": "dreams", "label": "✨ Dream Adventures"},
  {"key": "lullaby", "label": "🎵 Lullaby Stories"},
  {"key": "nature", "label": "🌿 Nature at Night"}
]'::jsonb, 1);