-- =====================================================
-- MIGRATION: Configure Agent Questions for All Book Types
-- Sets up proper discovery flow with correct sort_order
-- =====================================================

-- First, delete all existing agent_questions to start fresh
DELETE FROM agent_questions;

-- =====================================================
-- UNIVERSAL QUESTIONS (all book types need these)
-- character_theme (0), grade_level (1)
-- =====================================================

-- Insert base questions for ALL book-creation agent types
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
SELECT 
  a.type,
  'character_theme',
  0,
  true
FROM agents a 
WHERE a.is_latest = true 
  AND a.type LIKE 'book-creation%';

INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
SELECT 
  a.type,
  'grade_level',
  1,
  true
FROM agents a 
WHERE a.is_latest = true 
  AND a.type LIKE 'book-creation%';

-- =====================================================
-- TYPE-SPECIFIC QUESTIONS
-- =====================================================

-- ABC: letter_case (2)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES ('book-creation-abc', 'letter_case', 2, true);

-- Digraphs: DIGRAPH_FOCUS (2)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES ('book-creation-digraphs', 'DIGRAPH_FOCUS', 2, true);

-- Manners: manner_type (2), manner_setting (3)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES 
  ('book-creation-manners', 'manner_type', 2, true),
  ('book-creation-manners', 'manner_setting', 3, true);

-- =====================================================
-- OPTIONAL DISCOVERY QUESTIONS (environment/location)
-- These come after type-specific questions
-- =====================================================

-- SEASON for relevant types (winter/summer themes)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES 
  ('book-creation-abc', 'SEASON', 3, true),
  ('book-creation-animals', 'SEASON', 2, true),
  ('book-creation-bedtime', 'SEASON', 2, true),
  ('book-creation-colors', 'SEASON', 2, true),
  ('book-creation-cvc', 'SEASON', 2, true),
  ('book-creation-digraphs', 'SEASON', 3, true),
  ('book-creation-dr-seuss', 'SEASON', 2, true),
  ('book-creation-emotions', 'SEASON', 2, true),
  ('book-creation-first-words', 'SEASON', 2, true),
  ('book-creation-general', 'SEASON', 2, true),
  ('book-creation-manners', 'SEASON', 4, true),
  ('book-creation-numbers', 'SEASON', 2, true),
  ('book-creation-opposites', 'SEASON', 2, true),
  ('book-creation-parent-education', 'SEASON', 2, true),
  ('book-creation-rhyming', 'SEASON', 2, true),
  ('book-creation-shapes', 'SEASON', 2, true),
  ('book-creation-sight-words', 'SEASON', 2, true),
  ('book-creation', 'SEASON', 2, true);

-- THEME for types that benefit from thematic content
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES 
  ('book-creation-general', 'THEME', 3, true),
  ('book-creation-rhyming', 'THEME', 3, true),
  ('book-creation-dr-seuss', 'THEME', 3, true),
  ('book-creation-bedtime', 'THEME', 3, true),
  ('book-creation', 'THEME', 3, true);

-- City/Location for location-based personalization (lower priority)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
VALUES 
  ('book-creation-abc', 'city', 4, false),
  ('book-creation-animals', 'city', 3, false),
  ('book-creation-bedtime', 'city', 4, false),
  ('book-creation-colors', 'city', 3, false),
  ('book-creation-cvc', 'city', 3, false),
  ('book-creation-digraphs', 'city', 4, false),
  ('book-creation-dr-seuss', 'city', 4, false),
  ('book-creation-emotions', 'city', 3, false),
  ('book-creation-first-words', 'city', 3, false),
  ('book-creation-general', 'city', 4, false),
  ('book-creation-manners', 'city', 5, false),
  ('book-creation-numbers', 'city', 3, false),
  ('book-creation-opposites', 'city', 3, false),
  ('book-creation-parent-education', 'city', 3, false),
  ('book-creation-rhyming', 'city', 4, false),
  ('book-creation-shapes', 'city', 3, false),
  ('book-creation-sight-words', 'city', 3, false),
  ('book-creation', 'city', 4, false);

-- =====================================================
-- DISABLED BUT AVAILABLE QUESTIONS
-- These can be enabled per-agent if needed
-- =====================================================

-- Age group (legacy, replaced by grade_level)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
SELECT 
  a.type,
  'age_group',
  99,
  false
FROM agents a 
WHERE a.is_latest = true 
  AND a.type LIKE 'book-creation%';

-- BRAND (equipment brand, only relevant for specific themes)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
SELECT 
  a.type,
  'BRAND',
  98,
  false
FROM agents a 
WHERE a.is_latest = true 
  AND a.type LIKE 'book-creation%';

-- RESORT (ski resort, only relevant for winter/ski themes)
INSERT INTO agent_questions (agent_type, question_id, sort_order, is_enabled)
SELECT 
  a.type,
  'RESORT',
  97,
  false
FROM agents a 
WHERE a.is_latest = true 
  AND a.type LIKE 'book-creation%';