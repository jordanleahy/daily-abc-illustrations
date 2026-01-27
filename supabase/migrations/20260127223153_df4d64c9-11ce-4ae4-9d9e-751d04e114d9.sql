-- Step 1: Move ALL current enabled questions to high temporary values first (to clear ALL positions)
-- Move from highest to avoid conflicts
UPDATE agent_questions 
SET sort_order = 105, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'SEASON';

UPDATE agent_questions 
SET sort_order = 104, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'RESORT';

UPDATE agent_questions 
SET sort_order = 103, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'opposites_category';

UPDATE agent_questions 
SET sort_order = 102, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'city';

-- Step 2: Now enable grade_level and put at position 1 (position 0 has character_theme)
UPDATE agent_questions 
SET is_enabled = true, sort_order = 1, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'grade_level';

-- Step 3: Now assign final positions 2-5
UPDATE agent_questions 
SET sort_order = 2, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'city';

UPDATE agent_questions 
SET sort_order = 3, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'opposites_category';

UPDATE agent_questions 
SET sort_order = 4, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'RESORT';

UPDATE agent_questions 
SET sort_order = 5, updated_at = now()
WHERE agent_type = 'book-creation-opposites' AND question_id = 'SEASON';