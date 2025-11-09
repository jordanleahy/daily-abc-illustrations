-- Migration: Prevent duplicate queued publications
-- Ensures only ONE queued publication per book at a time

-- Step 1: Clean up existing duplicate queued entries
-- Keep only the most recent queued entry per book_id
WITH duplicates AS (
  SELECT 
    id,
    book_id,
    ROW_NUMBER() OVER (
      PARTITION BY book_id 
      ORDER BY publish_date DESC, created_at DESC
    ) as rn
  FROM daily_published
  WHERE status = 'queued'
)
DELETE FROM daily_published
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
-- This allows only ONE queued publication per book at a time
CREATE UNIQUE INDEX IF NOT EXISTS daily_published_unique_queued_book 
ON daily_published (book_id) 
WHERE status = 'queued';

-- Step 3: Add comment for documentation
COMMENT ON INDEX daily_published_unique_queued_book IS 
'Prevents a book from being scheduled multiple times simultaneously. Only one queued entry per book_id allowed.';