-- Create book_types table
CREATE TABLE public.book_types (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Package',
  color TEXT DEFAULT 'text-gray-500',
  expected_page_count INTEGER,
  needs_clarification BOOLEAN DEFAULT false,
  clarification_context TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_types ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Anyone can read book types"
  ON public.book_types
  FOR SELECT
  USING (true);

-- Admin write policies
CREATE POLICY "Admins can insert book types"
  ON public.book_types
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update book types"
  ON public.book_types
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete book types"
  ON public.book_types
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Seed all 13 book types
INSERT INTO public.book_types (id, label, description, prompt, icon_name, color, expected_page_count, needs_clarification, clarification_context, sort_order, is_active) VALUES
('abc', 'ABC Book', 'Alphabet learning with letter recognition (26 pages A-Z)', 'I want to create an educational ABC book with 26 pages (A-Z). Each page should focus on one letter with engaging illustrations and simple activities for letter recognition. Page titles should use parentheses around the letter, like "(a) is for apple" to help readers say the letter name instead of the sound.', 'Sparkles', 'text-blue-500', 28, true, 'Ask about letter case preference: lowercase like (a), (b), (c) for toddlers, uppercase like (A), (B), (C) for preschoolers, or both cases like (Aa), (Bb), (Cc) for early readers. Explain that the book will have 26 pages (one for each letter) and parentheses help readers say the letter NAME instead of the sound. Provide these 3 specific options plus custom.', 0, true),
('rhyming', 'Rhyming Book', 'Phonemic awareness and sound patterns (10 content pages)', 'I want to create a rhyming book for toddlers that builds phonemic awareness through fun rhymes and sound patterns. Make it musical and memorable.', 'Music', 'text-orange-500', 12, false, NULL, 1, true),
('numbers', 'Numbers Book', 'Counting and number recognition (10 content pages)', 'I want to create a numbers book that teaches counting and number recognition. Include fun counting activities and clear number illustrations. IMPORTANT: Page titles must use numeric digits (1, 2, 3, 4...) NOT written words (one, two, three...). For example: "1 apple", "2 birds", "3 cars".', 'Hash', 'text-green-500', 12, true, 'Ask about number range preference. The book will have exactly 10 content pages covering any consecutive 10-number range. Popular options: 1-10 (for toddlers learning first numbers), 11-20 (for building on basics), 10-20 (for tens place practice), or any custom 10-number range like 30-40, 60-70. Also consider counting style: simple counting, skip counting (2s, 5s, 10s), or number families. Provide these specific examples and emphasize custom ranges are welcome.', 2, true),
('shapes', 'Shapes Book', 'Basic shapes (10 content pages)', 'I want to create a shapes book for toddlers that introduces basic shapes. Make it interactive and engaging.', 'Shapes', 'text-purple-500', 12, true, 'Ask about shape complexity: basic shapes only (circle, square, triangle), 2D and 3D shapes together, or advanced geometric shapes. Also consider themes like shapes in nature or shapes in everyday objects. Provide 3-4 specific suggestions with a custom option.', 3, true),
('colors', 'Colors Book', 'Primary and secondary colors (10 content pages)', 'I want to create a colors book for toddlers that teaches primary and secondary colors. Each page should focus on one color with vibrant illustrations and real-world examples.', 'Palette', 'text-pink-500', 12, false, NULL, 4, true),
('opposites', 'Opposites Book', 'Big/small, hot/cold, up/down concepts (10 content pages)', 'I want to create an opposites book for toddlers that teaches concepts like big/small, hot/cold, up/down, fast/slow. Use clear contrasting illustrations.', 'ArrowLeftRight', 'text-cyan-500', 12, false, NULL, 5, true),
('emotions', 'Emotions Book', 'Happy, sad, angry, scared feelings (10 content pages)', 'I want to create an emotions book for toddlers that helps them identify and understand feelings like happy, sad, angry, scared, excited. Make it relatable and supportive.', 'Heart', 'text-red-500', 12, false, NULL, 6, true),
('animals', 'Animals Book', 'Farm animals, zoo animals, pets (10 content pages)', 'I want to create an animals book for toddlers. Include fun facts and sounds each animal makes.', 'PawPrint', 'text-amber-500', 12, true, 'Ask about animal category: farm animals (cow, pig, chicken), zoo animals (lion, elephant, giraffe), ocean animals (fish, whale, dolphin), pets (dog, cat, rabbit), or mixed animals. Also consider educational focus like animal sounds, habitats, or characteristics. Provide 4-5 specific suggestions with a custom option.', 7, true),
('first-words', 'First Words Book', 'Common vocabulary building (10 content pages)', 'I want to create a first words book for toddlers that builds common vocabulary with everyday objects, actions, and concepts they encounter.', 'MessageCircle', 'text-indigo-500', 12, false, NULL, 8, true),
('bedtime', 'Bedtime Routine Book', 'Daily routines and sequences (10 content pages)', 'I want to create a bedtime routine book for toddlers that shows the daily sequence of bedtime activities. Make it calming and reassuring.', 'Moon', 'text-violet-500', 12, false, NULL, 9, true),
('cvc', 'CVC Words Book', 'CVC contrast sentence pairs for decoding practice (10 content pages)', 'I want to create a CVC contrast sentence book that teaches reading through sentence pairs where one CVC word is swapped. Example: "The cat sat." → "The bat sat." This helps children connect decoding to comprehension.', 'BookOpen', 'text-emerald-500', 12, true, 'Ask about vowel focus preference: short-a words (cat/bat, hat/rat), short-o words (mop/top, hop/pop), short-i words (pin/win, sit/hit), short-u words (sun/fun, bug/hug), short-e words (pet/wet, hen/pen), or mixed vowels. Each page will show two contrasting sentences where one CVC word changes meaning.', 10, true),
('sight-words', 'Sight Words Book', 'High-frequency words for reading fluency (10 content pages)', 'I want to create a Sight Words book for early readers that teaches high-frequency words essential for reading fluency. Each page should focus on one sight word shown in a simple, engaging sentence with contextual illustrations. Use established sight word lists (Dolch or Fry) and order words from most to least common.', 'Eye', 'text-teal-500', 12, true, 'Ask about reading level preference: Pre-K/Kindergarten (20-25 basic words like: the, and, a, to, you), Grade 1 (50 words - expanded list), Grade 2 (100 words - advanced list), or Custom word list. Provide these 4 specific options. Explain that each page will feature one sight word in a simple sentence with an illustration.', 11, true),
('other', 'Other', 'Miscellaneous books', '', 'Package', 'text-gray-500', NULL, false, NULL, 12, true);