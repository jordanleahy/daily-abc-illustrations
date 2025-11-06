-- Fix PAW Patrol Opposites book - shift pages down by 1
-- Book ID: 53c934d9-4962-4861-a01f-ec72dca76a4a
-- This corrects the double-shift that occurred from the previous migration

-- Step 1: Add temporary column
ALTER TABLE pages ADD COLUMN IF NOT EXISTS fix_temp_page_number INTEGER;

-- Step 2: Calculate corrected page numbers (subtract 1)
UPDATE pages 
SET fix_temp_page_number = page_number - 1
WHERE book_id = '53c934d9-4962-4861-a01f-ec72dca76a4a';

-- Step 3: Drop unique constraint temporarily
ALTER TABLE pages DROP CONSTRAINT IF EXISTS pages_book_id_page_number_key;

-- Step 4: Update to corrected page numbers
UPDATE pages 
SET page_number = fix_temp_page_number
WHERE book_id = '53c934d9-4962-4861-a01f-ec72dca76a4a'
  AND fix_temp_page_number IS NOT NULL;

-- Step 5: Recreate unique constraint
ALTER TABLE pages 
ADD CONSTRAINT pages_book_id_page_number_key 
UNIQUE (book_id, page_number);

-- Step 6: Clean up temporary column
ALTER TABLE pages DROP COLUMN fix_temp_page_number;