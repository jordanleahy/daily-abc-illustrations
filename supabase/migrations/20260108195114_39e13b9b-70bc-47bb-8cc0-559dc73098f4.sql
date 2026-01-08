-- Update existing library books with Killington in their names to have location metadata
UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'), '{location}', '"KILLINGTON"')
WHERE is_library_book = true 
  AND status = 'published'
  AND book_name ILIKE '%killington%'
  AND (metadata->>'location' IS NULL OR metadata->>'location' = '');

-- Update existing library books with Mountain Creek in their names
UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata::jsonb, '{}'), '{location}', '"MOUNTAIN_CREEK"')
WHERE is_library_book = true 
  AND status = 'published'
  AND book_name ILIKE '%mountain creek%'
  AND (metadata->>'location' IS NULL OR metadata->>'location' = '');