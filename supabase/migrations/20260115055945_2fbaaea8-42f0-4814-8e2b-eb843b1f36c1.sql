-- Add columns for deterministic frontend flow control
ALTER TABLE type_specific_discoveries 
  ADD COLUMN IF NOT EXISTS step_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS frontend_state_key text,
  ADD COLUMN IF NOT EXISTS context_value_key text,
  ADD COLUMN IF NOT EXISTS is_skippable boolean DEFAULT true;

-- Update existing manners questions with proper step numbers and state keys
UPDATE type_specific_discoveries SET 
  step_number = 1,
  frontend_state_key = 'selectedMannersSetting',
  context_value_key = 'mannersSetting',
  is_skippable = true
WHERE question_key = 'manners_setting';

UPDATE type_specific_discoveries SET 
  step_number = 2,
  frontend_state_key = 'selectedSeason',
  context_value_key = 'season',
  is_skippable = true
WHERE question_key = 'season';

UPDATE type_specific_discoveries SET 
  step_number = 3,
  frontend_state_key = 'selectedLocation',
  context_value_key = 'location',
  is_skippable = true
WHERE question_key = 'location';

UPDATE type_specific_discoveries SET 
  step_number = 4,
  frontend_state_key = 'selectedCity',
  context_value_key = 'city',
  is_skippable = true
WHERE question_key = 'city';

UPDATE type_specific_discoveries SET 
  step_number = 5,
  frontend_state_key = 'selectedClothingBrand',
  context_value_key = 'clothingBrand',
  is_skippable = true
WHERE question_key = 'clothing_brand';

-- Update ABC questions
UPDATE type_specific_discoveries SET 
  step_number = 1,
  frontend_state_key = 'selectedSubjectTheme',
  context_value_key = 'subjectTheme',
  is_skippable = false
WHERE question_key = 'subject_theme';

UPDATE type_specific_discoveries SET 
  step_number = 2,
  frontend_state_key = 'selectedLetterCase',
  context_value_key = 'letterCase',
  is_skippable = false
WHERE question_key = 'letter_case';

-- Update animals questions
UPDATE type_specific_discoveries SET 
  step_number = 1,
  frontend_state_key = 'selectedAnimalCategory',
  context_value_key = 'animalCategory',
  is_skippable = false
WHERE question_key = 'animal_category';

-- Update bedtime questions
UPDATE type_specific_discoveries SET 
  step_number = 1,
  frontend_state_key = 'selectedBedtimeTheme',
  context_value_key = 'bedtimeTheme',
  is_skippable = false
WHERE question_key = 'bedtime_theme';

-- Reorder by step_number for proper flow
CREATE INDEX IF NOT EXISTS idx_type_discoveries_flow 
  ON type_specific_discoveries(agent_type, step_number, sort_order);