-- Add city to metadata for the Jersey City Springtime Opposites book
UPDATE books 
SET metadata = jsonb_set(
  COALESCE(metadata::jsonb, '{}'::jsonb),
  '{city}',
  '"JERSEY_CITY"'
),
updated_at = now()
WHERE id = '03d8e6f9-426f-4f25-8f1a-d4d104a01c8c';