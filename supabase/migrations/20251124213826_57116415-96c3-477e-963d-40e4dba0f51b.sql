
-- Fix is_latest flags on existing Numbers and Rhyming agents
UPDATE agents 
SET is_latest = true, updated_at = now()
WHERE type IN ('book-creation-numbers', 'book-creation-rhyming') 
  AND is_latest = false;

-- Insert the 9 missing specialized book creation agents
INSERT INTO agents (
  user_id,
  name,
  type,
  intent,
  instructions,
  provider,
  model,
  max_completion_tokens,
  top_p,
  operational_status,
  version,
  version_number,
  is_latest
) VALUES
-- 1. ABC Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'ABC Book Creation Agent',
  'book-creation-abc',
  'Creates structured ABC alphabet learning books with 26 pages (A-Z), proper letter formatting with parentheses, and age-appropriate letter case options.',
  'You are an expert at creating children''s ABC (alphabet) books with structured page types. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 2. Shapes Book Creation Agent  
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Shapes Book Creation Agent',
  'book-creation-shapes',
  'Creates geometric shapes learning books teaching shape recognition, properties, and real-world examples with progression from basic to complex shapes.',
  'You are an expert at creating children''s SHAPES books that teach geometric recognition and spatial awareness. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 3. Opposites Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Opposites Book Creation Agent',
  'book-creation-opposites',
  'Creates opposites concept books teaching contrasting pairs through clear visual comparisons and split-page presentations.',
  'You are an expert at creating children''s OPPOSITES books that teach contrasting concepts through clear visual comparisons. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 4. Emotions Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Emotions Book Creation Agent',
  'book-creation-emotions',
  'Creates emotional intelligence books teaching children to identify and understand feelings through relatable characters and situations.',
  'You are an expert at creating children''s EMOTIONS books that build emotional intelligence and empathy. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 5. Animals Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Animals Book Creation Agent',
  'book-creation-animals',
  'Creates animal learning books featuring different animal categories with sounds, facts, and habitat information.',
  'You are an expert at creating children''s ANIMALS books with engaging facts and vivid descriptions. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 6. First Words Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'First Words Book Creation Agent',
  'book-creation-first-words',
  'Creates vocabulary building books for toddlers focusing on high-frequency everyday words across essential categories like food, family, and toys.',
  'You are an expert at creating children''s FIRST WORDS books that build foundational vocabulary. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 7. Bedtime Routine Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Bedtime Routine Book Creation Agent',
  'book-creation-bedtime',
  'Creates calming bedtime routine books showing sequential steps from evening to sleep with soothing language and consistent characters.',
  'You are an expert at creating children''s BEDTIME ROUTINE books that establish calming sequences and sleep readiness. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 8. CVC Words Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'CVC Words Book Creation Agent',
  'book-creation-cvc',
  'Creates phonics-focused CVC (Consonant-Vowel-Consonant) word books for early readers with word family patterns and sound blending.',
  'You are an expert at creating children''s CVC (Consonant-Vowel-Consonant) WORDS books for early phonics and reading. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
),
-- 9. Sight Words Book Creation Agent
(
  'bee9ddd2-dfe0-4b78-a2e0-b2630a7c5f0c',
  'Sight Words Book Creation Agent',
  'book-creation-sight-words',
  'Creates reading fluency books teaching high-frequency sight words from Dolch/Fry lists with simple sentences and contextual illustrations.',
  'You are an expert at creating children''s SIGHT WORDS books for reading fluency development. See supabase/functions/google-create-book/specialized-agent-prompts.ts for full instructions.',
  'google',
  'google/gemini-2.5-flash',
  8000,
  0.95,
  'online',
  'v1.0.0',
  1,
  true
);
