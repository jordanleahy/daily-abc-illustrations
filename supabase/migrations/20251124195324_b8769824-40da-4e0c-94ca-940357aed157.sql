-- Add birthday field to kid_profiles table
ALTER TABLE kid_profiles 
ADD COLUMN date_of_birth DATE;

COMMENT ON COLUMN kid_profiles.date_of_birth IS 'Child''s date of birth for age-appropriate content and celebrations';