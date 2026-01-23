-- Re-enable City and Resort for rhyming agent and fix sort order
UPDATE agent_questions SET is_enabled = true, sort_order = 4 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'city';
UPDATE agent_questions SET is_enabled = true, sort_order = 5 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'RESORT';

-- Ensure proper flow: character_theme=0, THEME=1, grade_level=2, SEASON=3, city=4, RESORT=5
UPDATE agent_questions SET sort_order = 0 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'character_theme';
UPDATE agent_questions SET sort_order = 1 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'THEME';
UPDATE agent_questions SET sort_order = 2 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'grade_level';
UPDATE agent_questions SET sort_order = 3 WHERE agent_type = 'book-creation-rhyming' AND question_id = 'SEASON';