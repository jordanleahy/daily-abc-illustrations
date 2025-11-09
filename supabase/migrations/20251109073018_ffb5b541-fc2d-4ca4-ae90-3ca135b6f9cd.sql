-- Add composite index for fast image lookups in get-daily-published-images edge function
-- This index dramatically improves query performance when filtering by is_latest and page_id
CREATE INDEX IF NOT EXISTS idx_page_image_urls_latest_lookup 
ON page_image_urls (is_latest, page_id) 
WHERE is_latest = true AND image_url IS NOT NULL;

-- Add partial index for book_id lookups (used for user book queries)
CREATE INDEX IF NOT EXISTS idx_page_image_urls_book_latest
ON page_image_urls (book_id, is_latest)
WHERE is_latest = true;

-- Analyze the table to update statistics after index creation
ANALYZE page_image_urls;