-- Migrate page numbers from 0-indexed to 1-indexed
-- This shifts all page numbers up by 1 (cover: 0→1, A: 1→2, etc.)

-- Step 1: Add temporary column to track new page numbers
ALTER TABLE pages ADD COLUMN IF NOT EXISTS migration_temp_new_page_number INTEGER;

-- Step 2: Calculate new page numbers (shift everything +1)
UPDATE pages 
SET migration_temp_new_page_number = page_number + 1;

-- Step 3: Drop the unique constraint temporarily
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_book_id_page_number_key;

-- Step 4: Update page_number to new values
UPDATE pages 
SET page_number = migration_temp_new_page_number;

-- Step 5: Recreate unique constraint
ALTER TABLE pages 
ADD CONSTRAINT pages_book_id_page_number_key 
UNIQUE (book_id, page_number);

-- Step 6: Clean up temporary column
ALTER TABLE pages DROP COLUMN migration_temp_new_page_number;

-- Verification: Check that all books now have pages starting at 1
-- (This is just for logging/verification, not part of the migration)
COMMENT ON TABLE pages IS 'Page numbers are now 1-indexed: Cover=1, A=2, B=3, ..., Z=27';