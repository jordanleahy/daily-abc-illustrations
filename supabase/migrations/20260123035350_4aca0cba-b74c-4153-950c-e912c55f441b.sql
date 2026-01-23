-- ===========================================
-- Fix duplicate sort_order issues across all book-creation agents
-- ===========================================

-- Phase 1: Fix book-creation-numbers
-- CUSTOM_NUMBER_RANGE and SEASON both at sort_order 3
UPDATE agent_questions SET sort_order = 4 
WHERE agent_type = 'book-creation-numbers' AND question_id = 'SEASON';

-- Phase 2: Fix book-creation-digraphs  
-- character_theme and THEME both at sort_order 0
-- DIGRAPH_SELECTION and SEASON both at sort_order 3
UPDATE agent_questions SET sort_order = 0 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'character_theme';
UPDATE agent_questions SET sort_order = 1 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'grade_level';
UPDATE agent_questions SET sort_order = 2 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'DIGRAPH_FOCUS';
UPDATE agent_questions SET sort_order = 3 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'DIGRAPH_SELECTION';
UPDATE agent_questions SET sort_order = 4 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'SEASON';
UPDATE agent_questions SET sort_order = 5 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'THEME';
UPDATE agent_questions SET sort_order = 6 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'city';
UPDATE agent_questions SET sort_order = 7 WHERE agent_type = 'book-creation-digraphs' AND question_id = 'RESORT';

-- Phase 3: Re-sequence book-creation-opposites (gaps in sort_order)
UPDATE agent_questions SET sort_order = 4 WHERE agent_type = 'book-creation-opposites' AND question_id = 'THEME';
UPDATE agent_questions SET sort_order = 5 WHERE agent_type = 'book-creation-opposites' AND question_id = 'grade_level';
UPDATE agent_questions SET sort_order = 6 WHERE agent_type = 'book-creation-opposites' AND question_id = 'SEASON';
UPDATE agent_questions SET sort_order = 7 WHERE agent_type = 'book-creation-opposites' AND question_id = 'city';
UPDATE agent_questions SET sort_order = 8 WHERE agent_type = 'book-creation-opposites' AND question_id = 'RESORT';
UPDATE agent_questions SET sort_order = 9 WHERE agent_type = 'book-creation-opposites' AND question_id = 'BRAND';

-- Phase 4: Add unique constraint to prevent future duplicates
-- Only applies to enabled questions (is_enabled = true)
CREATE UNIQUE INDEX idx_agent_questions_unique_enabled_sort_order 
ON agent_questions(agent_type, sort_order) 
WHERE is_enabled = true;