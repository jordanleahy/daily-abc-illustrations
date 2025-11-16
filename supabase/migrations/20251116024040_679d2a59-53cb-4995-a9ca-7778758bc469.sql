-- Migrate textOverlay.text to title field
-- Only update where textOverlay.text exists and differs from title

UPDATE pages
SET 
  title = content->'textOverlay'->>'text',
  updated_at = now()
WHERE 
  content->'textOverlay'->>'text' IS NOT NULL
  AND content->'textOverlay'->>'text' != ''
  AND content->'textOverlay'->>'text' != title;

-- Log how many rows were updated
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  GET DIAGNOSTICS row_count = ROW_COUNT;
  RAISE NOTICE 'Updated % pages with textOverlay.text to title', row_count;
END $$;