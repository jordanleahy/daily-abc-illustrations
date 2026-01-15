-- Consolidate agent type naming: Delete short-name duplicates first, then migrate
-- Step 1: Delete short-named entries that conflict with existing prefixed entries
DELETE FROM public.type_specific_discoveries 
WHERE id IN (
  SELECT s.id
  FROM type_specific_discoveries s
  JOIN type_specific_discoveries p ON 
    (p.agent_type = 'book-creation-' || s.agent_type OR
     (s.agent_type = 'digraph' AND p.agent_type = 'book-creation-digraphs') OR
     (s.agent_type = 'song' AND p.agent_type = 'book-creation-dr-seuss'))
    AND p.question_key = s.question_key
  WHERE s.agent_type IN (
    'abc', 'numbers', 'colors', 'shapes', 'rhyming', 'opposites',
    'emotions', 'animals', 'first-words', 'cvc', 'sight-words', 
    'bedtime', 'digraph', 'song'
  )
);

-- Step 2: Update remaining short-named agent types to their prefixed versions
UPDATE public.type_specific_discoveries
SET agent_type = CASE agent_type
  WHEN 'abc' THEN 'book-creation-abc'
  WHEN 'numbers' THEN 'book-creation-numbers'
  WHEN 'colors' THEN 'book-creation-colors'
  WHEN 'shapes' THEN 'book-creation-shapes'
  WHEN 'rhyming' THEN 'book-creation-rhyming'
  WHEN 'opposites' THEN 'book-creation-opposites'
  WHEN 'emotions' THEN 'book-creation-emotions'
  WHEN 'animals' THEN 'book-creation-animals'
  WHEN 'first-words' THEN 'book-creation-first-words'
  WHEN 'cvc' THEN 'book-creation-cvc'
  WHEN 'sight-words' THEN 'book-creation-sight-words'
  WHEN 'bedtime' THEN 'book-creation-bedtime'
  WHEN 'digraph' THEN 'book-creation-digraphs'
  WHEN 'song' THEN 'book-creation-dr-seuss'
  ELSE agent_type
END
WHERE agent_type IN (
  'abc', 'numbers', 'colors', 'shapes', 'rhyming', 'opposites',
  'emotions', 'animals', 'first-words', 'cvc', 'sight-words', 
  'bedtime', 'digraph', 'song'
);