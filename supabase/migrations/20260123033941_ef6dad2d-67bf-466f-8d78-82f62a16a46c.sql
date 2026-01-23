-- Clean up rhyming agent: disable irrelevant questions and fix sort order
-- Disable City and Resort (not relevant for rhyming books)
UPDATE agent_questions 
SET is_enabled = false 
WHERE agent_type = 'book-creation-rhyming' 
AND question_id IN ('city', 'RESORT');

-- Fix sort order for enabled questions: character_theme=0, THEME=1, grade_level=2, SEASON=3
UPDATE agent_questions SET sort_order = 0 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'character_theme';
UPDATE agent_questions SET sort_order = 1 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'THEME';
UPDATE agent_questions SET sort_order = 2 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'grade_level';
UPDATE agent_questions SET sort_order = 3 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'SEASON';

-- Move all disabled questions to higher sort orders
UPDATE agent_questions SET sort_order = 100 WHERE agent_type = 'book-creation-rhyming' AND is_enabled = false;