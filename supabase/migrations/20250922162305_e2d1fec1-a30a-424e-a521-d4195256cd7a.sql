-- Migrate existing thumbnail data from book_thumbnails to seo_metadata
-- Step 1: Update existing SEO metadata records with thumbnail URLs where available
UPDATE seo_metadata 
SET og_image_url = bt.thumbnail_url,
    updated_at = now()
FROM book_thumbnails bt
JOIN daily_published dp ON dp.book_id = bt.book_id
WHERE seo_metadata.daily_published_id = dp.id
  AND bt.is_latest = true 
  AND bt.generation_status = 'complete'
  AND bt.thumbnail_url IS NOT NULL
  AND seo_metadata.is_latest = true
  AND seo_metadata.is_active = true;

-- Step 2: Drop the book_thumbnails table and related functions
DROP TABLE IF EXISTS book_thumbnails CASCADE;

-- Step 3: Remove related functions
DROP FUNCTION IF EXISTS get_book_thumbnail(uuid);
DROP FUNCTION IF EXISTS get_next_book_thumbnail_version_number(uuid);
DROP FUNCTION IF EXISTS manage_book_thumbnail_latest();

-- Step 4: Clean up any orphaned triggers (if they exist)
-- Note: Triggers are automatically dropped when the table is dropped