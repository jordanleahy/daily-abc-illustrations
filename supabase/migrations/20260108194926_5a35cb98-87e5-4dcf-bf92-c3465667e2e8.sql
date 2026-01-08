-- Update existing library books with Jersey City in their names to have city metadata
UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'), '{city}', '"JERSEY_CITY"')
WHERE is_library_book = true 
  AND status = 'published'
  AND book_name ILIKE '%jersey city%'
  AND (metadata->>'city' IS NULL OR metadata->>'city' = '');