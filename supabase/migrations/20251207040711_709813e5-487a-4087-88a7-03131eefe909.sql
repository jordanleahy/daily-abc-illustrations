-- Fix Bluey's Rock Climbing ABC book to have correct bookType
UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{bookType}', '"abc"')
WHERE id = '8d6a1ea0-2cc5-4a5c-8f5e-01c9f4174e9a';

-- Also fix any other books that have "ABC" in their name but bookType is 'other' or null
UPDATE books 
SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{bookType}', '"abc"')
WHERE (book_name ILIKE '%abc%' OR book_name ILIKE '%alphabet%')
  AND (metadata->>'bookType' IS NULL OR metadata->>'bookType' = 'other');