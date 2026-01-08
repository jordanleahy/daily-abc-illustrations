-- Update existing library books with winter themes to have WINTER season metadata
-- These books have winter-related content based on their names

UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'), '{season}', '"WINTER"')
WHERE is_library_book = true 
  AND status = 'published'
  AND (
    book_name ILIKE '%winter%' 
    OR book_name ILIKE '%snow%' 
    OR book_name ILIKE '%killington%'
    OR book_name ILIKE '%chairlift%'
    OR book_name ILIKE '%ski%'
    OR book_name ILIKE '%wintry%'
  )
  AND (metadata->>'season' IS NULL OR metadata->>'season' = '');