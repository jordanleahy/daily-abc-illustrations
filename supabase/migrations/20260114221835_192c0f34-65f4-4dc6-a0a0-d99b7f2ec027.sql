-- Fix Manners discovery questions to use correct question_key
-- The 'setting' question needs to map to 'environment' which is what the filter checks

-- First, update the setting question to use the environment key directly
-- This aligns with how the google-chat filter works
UPDATE type_specific_discoveries
SET 
  question_key = 'manners_setting',
  updated_at = now()
WHERE agent_type = 'book-creation-manners' AND question_key = 'setting';

-- Update the environment question to not conflict with setting
-- For manners, setting (home/school) is more relevant than environment (city/park/beach)
-- So we'll keep setting as primary and remove the general environment question
DELETE FROM type_specific_discoveries
WHERE agent_type = 'book-creation-manners' AND question_key = 'environment';