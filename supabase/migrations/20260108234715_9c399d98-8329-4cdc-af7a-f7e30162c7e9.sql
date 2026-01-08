-- Backfill city metadata for all Jersey City books missing the metadata
UPDATE books 
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb), 
  '{city}', 
  '"JERSEY_CITY"'
)
WHERE book_name ILIKE '%jersey city%' 
  AND (metadata->>'city' IS NULL OR metadata->>'city' = '');

-- Also publish the specific sight word book the user just created
UPDATE books 
SET status = 'published'
WHERE id = '445816a2-e405-4eb4-a5a5-f7e2c986f4ae';