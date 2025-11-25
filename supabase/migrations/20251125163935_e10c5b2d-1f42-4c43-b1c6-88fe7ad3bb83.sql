-- Add feature_angle and type columns to tricks table
ALTER TABLE tricks 
ADD COLUMN feature_angle TEXT,
ADD COLUMN type TEXT;

-- Migrate existing data from description field
UPDATE tricks 
SET 
  feature_angle = CASE 
    WHEN description LIKE 'Feature Angle:%' THEN 
      TRIM(SUBSTRING(description FROM 'Feature Angle: ([^\n]+)'))
    ELSE NULL 
  END,
  type = CASE 
    WHEN description LIKE '%Type:%' THEN 
      TRIM(SUBSTRING(description FROM 'Type: ([^\n]+)'))
    ELSE NULL 
  END,
  description = TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(description, 'Feature Angle:[^\n]*\n?', '', 'g'),
      'Type:[^\n]*\n?', '', 'g'
    )
  )
WHERE description IS NOT NULL;