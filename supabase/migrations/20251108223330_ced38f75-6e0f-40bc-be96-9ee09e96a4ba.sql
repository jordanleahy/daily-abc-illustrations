-- Add unique constraints to user_book_activity table to support upserts
-- We need two constraints:
-- 1. For kid views: unique on (user_id, daily_published_id, kid_id) when kid_id is not null
-- 2. For parent views: unique on (user_id, daily_published_id) when kid_id is null

-- First, clean up kid view duplicates (kid_id is not null)
WITH duplicates AS (
  SELECT 
    user_id, 
    daily_published_id,
    kid_id,
    array_agg(id ORDER BY created_at DESC) as ids
  FROM user_book_activity
  WHERE kid_id IS NOT NULL
  GROUP BY user_id, daily_published_id, kid_id
  HAVING COUNT(*) > 1
)
DELETE FROM user_book_activity
WHERE id IN (
  SELECT unnest(ids[2:]) 
  FROM duplicates
);

-- Clean up parent view duplicates (kid_id is null)
WITH parent_duplicates AS (
  SELECT 
    user_id, 
    daily_published_id,
    array_agg(id ORDER BY created_at DESC) as ids
  FROM user_book_activity
  WHERE kid_id IS NULL
  GROUP BY user_id, daily_published_id
  HAVING COUNT(*) > 1
)
DELETE FROM user_book_activity
WHERE id IN (
  SELECT unnest(ids[2:]) 
  FROM parent_duplicates
);

-- Add unique constraint for kid views (when kid_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS user_book_activity_kid_unique 
ON user_book_activity (user_id, daily_published_id, kid_id) 
WHERE kid_id IS NOT NULL;

-- Add unique constraint for parent views (when kid_id is null)
CREATE UNIQUE INDEX IF NOT EXISTS user_book_activity_parent_unique 
ON user_book_activity (user_id, daily_published_id) 
WHERE kid_id IS NULL;

-- Add comment explaining the constraints
COMMENT ON INDEX user_book_activity_kid_unique IS 'Ensures one record per (user, book, kid) combination for kid views';
COMMENT ON INDEX user_book_activity_parent_unique IS 'Ensures one record per (user, book) combination for parent views without a kid';